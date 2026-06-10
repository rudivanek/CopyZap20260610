import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import NavSidebar from '../../components/NavSidebar';
import { Copy, Check, Loader2, Save, X, Star, Sparkles, ArrowRight, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { polishContent } from './quickPolishService';
import { INTENT_PRESETS, TONE_OPTIONS } from './intents';
import { QuickPolishInput, ContentType, PolishResultItem, PrefillToCopyMaker } from './types';
import { User, SavedOutput } from '../../types';
import { saveSavedOutput, getSavedOutput, getCopySession } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { trackTokenUsage } from '../../services/api/tokenTracking';
import { sessionManager } from '../../services/sessionService';
import { BookmarkPlus } from 'lucide-react';
import { playSuccessSound } from '../../utils/soundEffects';
import { buildWhyThisVersion, getWhyThisVersionLabel } from './microConfirmation';
import { detectLanguage } from '../../utils/languageDetection';
import { useMode } from '../../context/ModeContext';
import { selectRecommendedVariant } from './variantRecommendation';

export function QuickPolishPage() {
  const { currentUser } = useAuth();
  const { mode } = useMode(); // Get current mode for saving outputs
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputText, setInputText] = useState('');
  const [contentType, setContentType] = useState<ContentType>('plain');
  const [intentId, setIntentId] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [tone, setTone] = useState('neutral');
  const [toneManuallySet, setToneManuallySet] = useState(false);
  const [cta, setCta] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [variantsCount, setVariantsCount] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PolishResultItem[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number | null>(null);

  // Save output modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refine modal state
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refineTargetIndex, setRefineTargetIndex] = useState<number | null>(null);
  const [refineNotes, setRefineNotes] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const selectedPreset = INTENT_PRESETS.find(p => p.id === intentId);
  const showAudience = selectedPreset?.fields.includes('audience');
  const showGoal = selectedPreset?.fields.includes('goal');
  const showTone = selectedPreset?.fields.includes('tone');
  const showCta = selectedPreset?.fields.includes('cta');

  // Auto-fill tone when intent changes (if user hasn't manually set it)
  useEffect(() => {
    if (intentId && !toneManuallySet) {
      const preset = INTENT_PRESETS.find(p => p.id === intentId);
      if (preset && preset.defaultTone) {
        setTone(preset.defaultTone);
      }
    }
  }, [intentId, toneManuallySet]);

  // Compute recommended variant (memoized for performance)
  const recommendedVariantIndex = useMemo(() => {
    if (results.length > 1) {
      return selectRecommendedVariant(results, goal);
    }
    return 0;
  }, [results, goal]);

  const handlePolish = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to polish');
      return;
    }

    if (!intentId) {
      toast.error('Please select an intent');
      return;
    }

    setIsLoading(true);
    setResults([]);
    setSelectedOutputIndex(null);

    const polishInput: QuickPolishInput = {
      inputText,
      contentType,
      intentId,
      variantsCount
    };

    if (showAudience && audience) polishInput.audience = audience;
    if (showGoal && goal) polishInput.goal = goal;
    if (showTone && tone) polishInput.tone = tone;
    if (showCta && cta) polishInput.cta = cta;
    if (specialInstructions) polishInput.specialInstructions = specialInstructions;

    try {
      // Note: No automatic session creation - session will only be created when user clicks "Save Session"
      const result = await polishContent(polishInput);

      // Convert variants to PolishResultItem with metadata
      const resultItems: PolishResultItem[] = result.variants.map(text => ({
        text,
        sourceText: inputText, // Store source text for evidence analysis
        intentId,
        tone: tone || 'neutral',
        contentType,
        isRefined: false
      }));

      setResults(resultItems);

      // Play success sound
      playSuccessSound();

      // Track token usage (without session since no session exists yet)
      if (currentUser?.id && result.usage) {
        try {
          const totalTokens = (result.usage.prompt_tokens || 0) + (result.usage.completion_tokens || 0);

          await trackTokenUsage(
            currentUser,
            totalTokens,
            result.modelUsed,
            'quick-polish',
            null, // No session ID until user explicitly saves session
            0,
            undefined,
            {
              inputTokens: result.usage.prompt_tokens || 0,
              outputTokens: result.usage.completion_tokens || 0,
              reasoningTokens: result.usage.reasoning_tokens || 0
            }
          );
        } catch (error) {
          console.error('Token tracking failed:', error);
        }
      }

      toast.success('Content polished successfully!');
    } catch (error) {
      console.error('Polish error:', error);
      toast.error('Polish failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleSaveClick = () => {
    if (!currentUser) {
      toast.error('Please log in to save outputs');
      return;
    }

    // Allow saving even without results - user can save input configuration
    // if (results.length === 0) {
    //   toast.error('No results to save');
    //   return;
    // }

    // Pre-fill the title with a descriptive name
    const presetName = selectedPreset?.label || 'Purpose Rewrite';
    const dateSuffix = new Date().toLocaleDateString();
    const inputPreview = inputText.substring(0, 30);
    setSaveTitle(`${presetName}${inputPreview ? ` - ${inputPreview}...` : ''} - ${dateSuffix}`);

    // Pre-fill description with settings
    const descParts: string[] = [];
    if (audience) descParts.push(`Audience: ${audience}`);
    if (goal) descParts.push(`Goal: ${goal}`);
    if (tone && tone !== 'neutral') descParts.push(`Tone: ${tone}`);
    if (cta) descParts.push(`CTA: ${cta}`);
    if (specialInstructions) descParts.push(`Special: ${specialInstructions.substring(0, 30)}${specialInstructions.length > 30 ? '...' : ''}`);
    if (results.length > 0) descParts.push(`${results.length} variant(s) generated`);
    setSaveDescription(descParts.join(' • '));

    setShowSaveModal(true);
  };

  const handleSaveOutput = async () => {
    if (!currentUser) {
      toast.error('Please log in to save outputs');
      return;
    }

    if (!saveTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    // Allow saving even without results - user can save input configuration
    // if (results.length === 0) {
    //   toast.error('No results to save');
    //   return;
    // }

    setIsSaving(true);
    try {
      const savedOutput: Partial<SavedOutput> = {
        user_id: currentUser.id,
        title: saveTitle.trim(),
        description: saveDescription.trim() || undefined,
        is_favorite: saveAsFavorite,
        input_data: {
          input_text: inputText,
          content_type: contentType,
          intent_id: intentId,
          intent_label: selectedPreset?.label,
          audience,
          goal,
          tone,
          cta,
          special_instructions: specialInstructions,
          variants_count: variantsCount
        },
        output_data: results.length > 0 ? {
          variants: results  // Save ALL variants together if they exist
        } : {}, // Empty object when no results yet (output_data is NOT NULL)
        tags: ['quick-polish', intentId, contentType].filter(Boolean),
        saved_mode: mode // Save the current form mode (Quick/Standard/Advanced)
        // Note: created_at is automatically set by database DEFAULT now()
      };

      const result = await saveSavedOutput(savedOutput as SavedOutput);

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success('Output saved successfully!');
      setShowSaveModal(false);
      setSaveTitle('');
      setSaveDescription('');
      setSaveAsFavorite(false);
    } catch (error: any) {
      console.error('Error saving output:', error);
      toast.error(error.message || 'Failed to save output');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setContentType('plain');
    const currentIntent = intentId;
    setIntentId('');
    setAudience('');
    setGoal('');
    setToneManuallySet(false);
    // If there's a selected intent, set to its default tone, otherwise neutral
    const preset = INTENT_PRESETS.find(p => p.id === currentIntent);
    setTone(preset?.defaultTone || 'neutral');
    setCta('');
    setSpecialInstructions('');
    setVariantsCount(1);
    setResults([]);
    setSelectedOutputIndex(null);
    // Clear refine modal state
    setShowRefineModal(false);
    setRefineTargetIndex(null);
    setRefineNotes('');
    sessionManager.clearCurrentSession(`quick-polish-${currentUser!.id}`);
    toast.success('Form cleared');
  };

  const handleRefineClick = (index: number) => {
    setRefineTargetIndex(index);
    setRefineNotes('');
    setShowRefineModal(true);
  };

  const handleRefineCancel = () => {
    setShowRefineModal(false);
    setRefineTargetIndex(null);
    setRefineNotes('');
  };

  const handleRefineApply = async () => {
    if (refineTargetIndex === null || !results[refineTargetIndex]) {
      toast.error('Invalid refinement target');
      return;
    }

    if (!intentId) {
      toast.error('Intent is required for refinement');
      return;
    }

    const targetResult = results[refineTargetIndex];
    const targetText = targetResult.text;
    setIsRefining(true);
    setShowRefineModal(false);

    try {
      // Build refinement input using selected output as new input text
      const refineInput: QuickPolishInput = {
        inputText: targetText,
        contentType,
        intentId,
        variantsCount: 1 // Always generate 1 refined variant
      };

      // Preserve all field values
      if (showAudience && audience) refineInput.audience = audience;
      if (showGoal && goal) refineInput.goal = goal;
      if (showTone && tone) refineInput.tone = tone;
      if (showCta && cta) refineInput.cta = cta;

      // Combine existing Special Instructions with refinement notes
      const combinedInstructions: string[] = [];
      if (specialInstructions) {
        combinedInstructions.push(`Special Instructions (original): ${specialInstructions}`);
      }
      if (refineNotes.trim()) {
        combinedInstructions.push(`Refinement Notes: ${refineNotes.trim()}`);
      }
      if (combinedInstructions.length > 0) {
        refineInput.specialInstructions = combinedInstructions.join('\n');
      }

      // Note: No automatic session creation - session will only be created when user clicks "Save Session"
      const result = await polishContent(refineInput);

      // Play success sound
      playSuccessSound();

      // Track token usage (without session since no session exists yet)
      if (currentUser?.id && result.usage) {
        try {
          const totalTokens = (result.usage.prompt_tokens || 0) + (result.usage.completion_tokens || 0);

          await trackTokenUsage(
            currentUser,
            totalTokens,
            result.modelUsed,
            'quick-polish',
            null, // No session ID until user explicitly saves session
            0,
            undefined,
            {
              inputTokens: result.usage.prompt_tokens || 0,
              outputTokens: result.usage.completion_tokens || 0,
              reasoningTokens: result.usage.reasoning_tokens || 0
            }
          );
        } catch (error) {
          console.error('Token tracking failed:', error);
        }
      }

      // Append refined result to results array
      const refinedItems: PolishResultItem[] = result.variants.map(text => ({
        text,
        sourceText: targetText, // Store source text (the variant being refined) for evidence analysis
        intentId,
        tone: tone || 'neutral',
        contentType,
        isRefined: true
      }));

      setResults(prev => [...prev, ...refinedItems]);
      toast.success('Refinement complete!');
    } catch (error) {
      console.error('Refinement error:', error);
      toast.error('Refinement failed. Please try again.');
    } finally {
      setIsRefining(false);
      setRefineTargetIndex(null);
      setRefineNotes('');
    }
  };

  const handleContinueInCopyMaker = () => {
    if (selectedOutputIndex === null || !results[selectedOutputIndex]) {
      toast.error('Please select an output first');
      return;
    }

    if (!currentUser) {
      toast.error('Please log in to continue');
      return;
    }

    const selectedResult = results[selectedOutputIndex];

    // Build prefill payload
    const detectedLang = detectLanguage(inputText);
    console.log('🌍 Language detection:', {
      inputText: inputText.substring(0, 100),
      detectedLanguage: detectedLang
    });

    // Calculate word count of the ORIGINAL INPUT (not the polished output)
    // This ensures Copy Maker uses the user's original length as the target
    const originalInputWordCount = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
    console.log('📊 Word count calculation:', {
      originalText: inputText.substring(0, 100) + '...',
      originalWordCount: originalInputWordCount,
      selectedText: selectedResult.text.substring(0, 100) + '...',
      selectedWordCount: selectedResult.text.trim().split(/\s+/).filter(word => word.length > 0).length
    });

    const prefillPayload: PrefillToCopyMaker = {
      source: 'intent_polish',
      original_input: inputText,
      selected_output: selectedResult.text,
      selected_output_word_count: originalInputWordCount,
      language: detectedLang,
      intent: {
        id: intentId,
        label: selectedPreset?.label,
        audience: audience || undefined,
        goal: goal || undefined,
        tone: tone || undefined,
        cta: cta || undefined,
      },
      content_type: contentType,
      special_instructions: specialInstructions || undefined,
      created_at: new Date().toISOString()
    };

    // Save to sessionStorage as reliable fallback (primary method)
    const PREFILL_KEY = 'CZ_PREFILL_TO_COPY_MAKER_V1';
    const payloadJson = JSON.stringify(prefillPayload);
    sessionStorage.setItem(PREFILL_KEY, payloadJson);
    console.log('✅ Prefill saved to sessionStorage', {
      key: PREFILL_KEY,
      payloadSize: payloadJson.length,
      originalInputLength: prefillPayload.original_input.length,
      selectedOutputLength: prefillPayload.selected_output.length
    });

    // Navigate to Copy Maker with prefill payload in state (secondary method)
    navigate('/copy-maker', {
      state: { prefill: prefillPayload }
    });

    toast.success('Opening Copy Maker with selected output');
  };

  // Load saved output from URL param
  useEffect(() => {
    const savedOutputId = searchParams.get('savedOutputId');

    const loadSavedOutput = async () => {
      if (!savedOutputId || !currentUser) return;

      console.log('QuickPolish: Loading saved output:', savedOutputId);

      try {
        const { data, error } = await getSavedOutput(savedOutputId);

        if (error) {
          console.error('QuickPolish: Error loading saved output:', error);
          toast.error('Failed to load saved output');
          setSearchParams({});
          return;
        }

        if (data && data.input_data && data.output_data) {
          console.log('QuickPolish: Loaded data:', data);

          // Load input settings
          const inputData = data.input_data;
          if (inputData.input_text) setInputText(inputData.input_text);
          if (inputData.content_type) setContentType(inputData.content_type);
          if (inputData.intent_id) setIntentId(inputData.intent_id);
          if (inputData.audience) setAudience(inputData.audience);
          if (inputData.goal) setGoal(inputData.goal);
          if (inputData.tone) {
            setTone(inputData.tone);
            setToneManuallySet(true); // Treat loaded tone as manually set
          }
          if (inputData.cta) setCta(inputData.cta);
          if (inputData.special_instructions) setSpecialInstructions(inputData.special_instructions);
          if (inputData.variants_count) setVariantsCount(inputData.variants_count);

          // Load output variants (handle both old string[] and new PolishResultItem[] formats)
          const outputData = data.output_data;
          if (outputData.variants && Array.isArray(outputData.variants)) {
            const loadedVariants = outputData.variants.map((variant: any) => {
              // If it's already a PolishResultItem, use it
              if (typeof variant === 'object' && variant.text) {
                return variant as PolishResultItem;
              }
              // If it's a string (old format), convert to PolishResultItem
              return {
                text: variant as string,
                intentId: inputData.intent_id || intentId,
                tone: inputData.tone || tone || 'neutral',
                contentType: inputData.content_type || contentType,
                isRefined: false
              } as PolishResultItem;
            });
            setResults(loadedVariants);
            toast.success('Saved session loaded successfully');
          }

          setSearchParams({}); // Clear URL params after loading
        } else {
          console.warn('QuickPolish: No data or required fields found');
          toast.error('Invalid saved output format');
          setSearchParams({}); // Clear invalid state
        }
      } catch (error: any) {
        console.error('QuickPolish: Exception loading saved output:', error);
        toast.error('Failed to load saved output');
        setSearchParams({}); // Clear on error
      }
    };

    if (savedOutputId) {
      loadSavedOutput();
    }
  }, [searchParams, currentUser, setSearchParams]);

  // Load copy session from URL param
  useEffect(() => {
    const sessionId = searchParams.get('sessionId');

    const loadSession = async () => {
      if (!sessionId || !currentUser) return;

      console.log('QuickPolish: Loading session:', sessionId);

      try {
        const { data, error } = await getCopySession(sessionId);

        if (error) {
          console.error('QuickPolish: Error loading session:', error);
          toast.error('Failed to load session');
          setSearchParams({});
          return;
        }

        if (data && data.input_data && data.output_data) {
          console.log('QuickPolish: Loaded session data:', data);

          // Load input settings
          const inputData = data.input_data;
          if (inputData.input_text) setInputText(inputData.input_text);
          if (inputData.content_type) setContentType(inputData.content_type);
          if (inputData.intent_id) setIntentId(inputData.intent_id);
          if (inputData.audience) setAudience(inputData.audience);
          if (inputData.goal) setGoal(inputData.goal);
          if (inputData.tone) {
            setTone(inputData.tone);
            setToneManuallySet(true); // Treat loaded tone as manually set
          }
          if (inputData.cta) setCta(inputData.cta);
          if (inputData.special_instructions) setSpecialInstructions(inputData.special_instructions);
          if (inputData.variants_count) setVariantsCount(inputData.variants_count);

          // Load output variants
          const outputData = data.output_data;
          if (outputData.variants && Array.isArray(outputData.variants)) {
            setResults(outputData.variants);
            toast.success('Session loaded successfully');
          }

          setSearchParams({}); // Clear URL params after loading
        } else {
          console.warn('QuickPolish: No data or required fields found in session');
          toast.error('Invalid session format');
          setSearchParams({}); // Clear invalid state
        }
      } catch (error: any) {
        console.error('QuickPolish: Exception loading session:', error);
        toast.error('Failed to load session');
        setSearchParams({}); // Clear on error
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [searchParams, currentUser, setSearchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <NavSidebar />
      <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="px-4 py-3 max-w-4xl mx-auto text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Purpose Rewrite
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Polish and improve your text with AI-powered purpose-based rewriting
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-32">
        {/* Input Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Text
            </label>
            {inputText && (
              <button
                onClick={handleClear}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your text here..."
            className="w-full min-h-[160px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            style={{ lineHeight: '1.5' }}
            disabled={isLoading}
          />
        </div>

        {/* Intent Selector */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Intent <span className="text-red-500">*</span>
          </label>
          <select
            value={intentId}
            onChange={(e) => {
              setIntentId(e.target.value);
              // Reset the manual tone flag when changing intents so the new intent's default tone applies
              setToneManuallySet(false);
            }}
            disabled={isLoading}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an intent...</option>
            {INTENT_PRESETS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          {selectedPreset && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {selectedPreset.description}
            </p>
          )}
        </div>

        {/* Special Instructions Field */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Special Instructions <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Keep it under 80 words&#10;Avoid buzzwords&#10;Keep the first sentence unchanged&#10;Do not add new claims&#10;Use simple, clear language"
            disabled={isLoading}
            className="w-full min-h-[96px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            style={{ lineHeight: '1.5' }}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Optional constraints for polishing (length, wording, style). These will NOT change the selected intent.
          </p>
        </div>

        {/* Dynamic Fields */}
        {(showAudience || showGoal || showTone || showCta) && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm space-y-4">
            {showAudience && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Who is this for?
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., Small business owners, Tech professionals..."
                  disabled={isLoading}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {showGoal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What is it for / desired outcome?
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Drive conversions, Increase engagement..."
                  disabled={isLoading}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {showTone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => {
                    setTone(e.target.value);
                    setToneManuallySet(true);
                  }}
                  disabled={isLoading}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TONE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showCta && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Call to Action
                </label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="e.g., Sign up now, Learn more..."
                  disabled={isLoading}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Variants Selector */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Variants
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(num => (
              <button
                key={num}
                onClick={() => setVariantsCount(num as 1 | 2 | 3)}
                disabled={isLoading}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  variantsCount === num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Output Cards */}
        {results.length > 0 && results.map((result, index) => {
          // Generate version role explanation based on output characteristics
          const whyThisVersion = buildWhyThisVersion({
            outputText: result.text,
            intentId: result.intentId,
            isRefined: result.isRefined,
            contentType: result.contentType,
            languageCode: 'en' // TODO: Detect language from input text
          });

          const whyLabel = getWhyThisVersionLabel('en'); // TODO: Use detected language

          // Check if this is the recommended variant
          const isRecommended = index === recommendedVariantIndex && results.length > 1;

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="selectedOutput"
                      checked={selectedOutputIndex === index}
                      onChange={() => setSelectedOutputIndex(index)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </label>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      {result.isRefined ? (
                        <>
                          <Sparkles size={14} className="text-blue-500" />
                          <span>Refined</span>
                        </>
                      ) : (
                        `Variant ${index + 1}`
                      )}
                    </h3>
                    {isRecommended && (
                      <div className="flex items-center gap-1.5">
                        <Award size={12} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Recommended starting point
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRefineClick(index)}
                    disabled={isRefining || isLoading}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refine this result"
                  >
                    <Sparkles size={16} />
                    Refine
                  </button>
                  <button
                    onClick={() => handleCopy(result.text, index)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check size={16} className="text-green-500" />
                        <span className="text-green-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Recommendation Reason (for recommended variant) */}
              {isRecommended && (
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-md px-3 py-2">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    Most complete foundation for continuing in Copy Form (based on structure + specificity).
                  </p>
                </div>
              )}

              {/* Why This Version Explanation */}
              {whyThisVersion && (
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-md px-3 py-2">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    {whyLabel}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {whyThisVersion}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-gray-900 dark:text-gray-100 text-base leading-relaxed whitespace-pre-wrap">
                  {result.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Polish Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto">
          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePolish}
                disabled={isLoading || !inputText.trim() || !intentId}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-gray-900 dark:text-white font-semibold text-base py-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                style={{ minHeight: '44px' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Polishing...
                  </>
                ) : (
                  'Polish Again'
                )}
              </button>
              <button
                onClick={handleContinueInCopyMaker}
                disabled={selectedOutputIndex === null}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-base py-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                style={{ minHeight: '44px' }}
                title={selectedOutputIndex === null ? 'Select an output first' : 'Continue editing in Copy Maker'}
              >
                Continue in Copy Maker
                <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={handlePolish}
              disabled={isLoading || !inputText.trim() || !intentId}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-base py-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              style={{ minHeight: '44px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Polishing...
                </>
              ) : (
                'Polish'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Bar - Left Side - Save Session */}
      {(inputText.trim() || results.length > 0) && (
        <div className="fixed left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-40">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-1.5 sm:p-2">
            <button
              onClick={handleSaveClick}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Save Session"
            >
              <BookmarkPlus size={14} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Bar - Right Side - Save Output */}
      {results.length > 0 && (
        <div className="fixed right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-40">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-1.5 sm:p-2">
            <button
              onClick={handleSaveClick}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Save Output"
            >
              <Save size={14} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      )}

      {/* Save Output Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !isSaving && setShowSaveModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save Output</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="e.g., Twitter post improvement"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSaving}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {saveTitle.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Add notes about this output..."
                  className="w-full min-h-[100px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  disabled={isSaving}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {saveDescription.length}/500 characters
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsFavorite}
                  onChange={(e) => setSaveAsFavorite(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  disabled={isSaving}
                />
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as favorite</span>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSaving}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOutput}
                  disabled={isSaving || !saveTitle.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refine Modal */}
      {showRefineModal && refineTargetIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !isRefining && handleRefineCancel()}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles size={20} className="text-blue-500" />
                Refine this result
              </h3>
              <button
                onClick={handleRefineCancel}
                disabled={isRefining}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refinement notes <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={refineNotes}
                  onChange={(e) => setRefineNotes(e.target.value)}
                  placeholder="e.g., Make it more concise, emphasize the main benefit, use simpler words..."
                  className="w-full min-h-[96px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  disabled={isRefining}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {refineNotes.length}/500 characters
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Keeps the same intent and guardrails. No new claims or CTAs unless allowed by intent.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRefineCancel}
                  disabled={isRefining}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefineApply}
                  disabled={isRefining}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRefining ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Apply Refinement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
