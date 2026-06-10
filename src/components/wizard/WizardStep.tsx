import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Target, Palette, Search, Briefcase, Smile, Zap, Sparkles, PenTool, TrendingUp, Loader2, Globe } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Tooltip } from '../ui/Tooltip';
import { getSupabaseClient } from '../../services/supabaseClient';
import { FormState, User, Model } from '../../types';
import { toast } from 'react-hot-toast';
import { useSession } from '../../context/SessionContext';
import { useMode } from '../../context/ModeContext';
import { isFieldVisible } from '../../utils/fieldVisibility';
import SuggestionButton from '../ui/SuggestionButton';
import { analyzeUrl } from '../../services/api/urlAnalysis';
import { analyzeUrlWithFirecrawl } from '../../services/api/urlAnalysisFirecrawl';
import StructureConfirmationModal from './StructureConfirmationModal';
import { htmlToText, containsHtml } from '../../utils/htmlToText';

interface Suggestion {
  id: string;
  category: string;
  instruction_text: string;
  tone_match: string[];
  language_match: string[];
  output_type_match: string[];
}

interface GroupedSuggestions {
  [category: string]: string[];
}

interface WizardStepProps {
  step: number;
  answers: {
    mode: 'create' | 'improve' | 'polish';
    projectDescription: string;
    whatAreYouCreating: string;
    targetAudience: string;
    painPoints: string;
    wordCount: 'Short: 50-100' | 'Medium: 100-200' | 'Long: 200-400' | 'Custom';
    customWordCount: number;
    tone: 'Professional' | 'Friendly' | 'Bold' | 'Minimalist' | 'Creative' | 'Persuasive';
    specialInstructions: string;
    enableSEO: boolean;
    enableGEO: boolean;
    outputStructure?: any;
    customerId?: string;
    brandVoiceId?: string;
    industryNiche?: string;
    readerFunnelStage?: string;
    competitorCopyText?: string;
    readerSophistication?: string;
  };
  updateAnswer: (key: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isGenerating: boolean;
  onApplyFromStep2?: () => void;
  onApplyAndGenerateFromStep2?: () => void;
  currentUser?: User;
  selectedModel?: Model;
}

const WizardStep: React.FC<WizardStepProps> = ({
  step,
  answers,
  updateAnswer,
  onNext,
  onPrev,
  isGenerating,
  selectedModel,
  onApplyFromStep2,
  onApplyAndGenerateFromStep2,
  currentUser
}) => {
  const { currentSessionId, ensureActiveSession } = useSession();
  const { mode } = useMode();
  // Suggestions modal state
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestions, setSuggestions] = useState<GroupedSuggestions>({});
  const [filteredSuggestions, setFilteredSuggestions] = useState<GroupedSuggestions>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // URL analysis state
  const [urlToAnalyze, setUrlToAnalyze] = useState('');
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  const [urlAnalysisType, setUrlAnalysisType] = useState<'context' | 'fullCopy' | 'deepCrawl' | null>(null);
  const [showUrlSection, setShowUrlSection] = useState(false);

  // Structure confirmation modal state
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [extractedStructure, setExtractedStructure] = useState<Array<string | { name: string; wordCount: number }>>([]);
  const [pendingCopyData, setPendingCopyData] = useState<any>(null);

  // Default structure for comparison
  const defaultStructure = [
    'Introduction',
    'Key Features',
    'Benefits',
    'How It Works',
    'Call to Action'
  ];

  // Auto-detect smart defaults based on Step 1 content
  useEffect(() => {
    if (step === 2 && answers.whatAreYouCreating) {
      detectSmartDefaults();
    }
  }, [step, answers.whatAreYouCreating]);

  // State for suggestion buttons
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const detectSmartDefaults = () => {
    const content = answers.whatAreYouCreating.toLowerCase();

    // Auto-adjust tone based on content
    if (content.includes('professional') || content.includes('corporate') || content.includes('b2b')) {
      if (answers.tone === 'Friendly') {
        updateAnswer('tone', 'Professional');
      }
    } else if (content.includes('fun') || content.includes('casual') || content.includes('friendly')) {
      if (answers.tone === 'Professional') {
        updateAnswer('tone', 'Friendly');
      }
    }
  };

  const wordCountOptions = [
    { value: 'Short: 50-100', label: 'Short & Punchy', description: '50-100 words' },
    { value: 'Medium: 100-200', label: 'Medium', description: '100-200 words' },
    { value: 'Long: 200-400', label: 'Detailed', description: '200-400 words' },
    { value: 'Custom', label: 'Custom', description: 'Set your own length' }
  ];

  const toneOptions = [
    { value: 'Professional', label: 'Professional', icon: Briefcase, description: 'Formal and authoritative' },
    { value: 'Friendly', label: 'Friendly', icon: Smile, description: 'Warm and approachable' },
    { value: 'Bold', label: 'Bold', icon: Zap, description: 'Confident and assertive' },
    { value: 'Minimalist', label: 'Minimalist', icon: Sparkles, description: 'Clean and concise' },
    { value: 'Creative', label: 'Creative', icon: PenTool, description: 'Imaginative and unique' },
    { value: 'Persuasive', label: 'Persuasive', icon: TrendingUp, description: 'Compelling and benefit-focused' }
  ];

  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const handleGetFieldSuggestion = async (fieldType: string) => {
    const copyText = answers.whatAreYouCreating;
    if (!currentUser || !copyText.trim()) {
      toast.error('Please fill in the "What are you creating?" field first');
      return;
    }

    if (copyText.trim().length < 20) {
      toast.error('Please provide more content (at least 20 characters)');
      return;
    }

    // Mark field as loading
    setLoadingFields(prev => new Set(prev).add(fieldType));

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Get user's JWT token for authentication
      const supabase = await getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session. Please log in.');
      }

      // Use existing session ID if available, otherwise track as null (no session creation for suggestions)
      const sessionId = currentSessionId || null;

      // Build the prompt based on field type
      let systemPrompt = '';
      let userPrompt = '';

      if (fieldType === 'targetAudience') {
        systemPrompt = 'You are a marketing analyst. Analyze the provided copy and identify the target audience. Be specific about demographics, psychographics, and professional characteristics.';
        userPrompt = `Based on this copy, who is the target audience?\n\n${copyText}\n\nProvide a concise description of the target audience (2-3 sentences).`;
      } else if (fieldType === 'painPoints') {
        systemPrompt = 'You are a marketing analyst. Analyze the provided copy and identify the problems it solves or pain points it addresses.';
        userPrompt = `Based on this copy, what problems does it solve? What pain points does it address?\n\n${copyText}\n\nProvide a concise description of the problems/pain points (2-3 sentences).`;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: selectedModel,
          temperature: 0.7,
          maxTokens: 300
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to get suggestion for ${fieldType}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      if (content.trim()) {
        // Update the specific field
        updateAnswer(fieldType, content.trim());
        toast.success(`Suggestion generated for ${fieldType === 'targetAudience' ? 'target audience' : 'pain points'}!`);
      } else {
        toast.error('Could not generate suggestion. Please try again.');
      }
    } catch (error) {
      console.error(`Error getting suggestion for ${fieldType}:`, error);
      toast.error(`Failed to get suggestion. Please try again.`);
    } finally {
      // Remove field from loading
      setLoadingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldType);
        return newSet;
      });
    }
  };


  // Fetch suggestions when modal opens
  useEffect(() => {
    if (showSuggestionsModal) {
      fetchSuggestions();
    }
  }, [showSuggestionsModal]);

  // Filter suggestions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuggestions(suggestions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered: GroupedSuggestions = {};

      Object.entries(suggestions).forEach(([category, items]) => {
        const categoryMatch = typeof category === 'string' && category.toLowerCase().includes(query);
        const matchingItems = items.filter(item => typeof item === 'string' && item.toLowerCase().includes(query));

        if (categoryMatch || matchingItems.length > 0) {
          filtered[category] = categoryMatch ? items : matchingItems;
        }
      });

      setFilteredSuggestions(filtered);
    }
  }, [searchQuery, suggestions]);

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('pmc_extra_suggestions')
        .select('*')
        .eq('active', true)
        .order('category')
        .order('instruction_text');

      if (error) throw error;

      if (data && data.length > 0) {
        const grouped: GroupedSuggestions = {};
        data.forEach((suggestion: Suggestion) => {
          if (!grouped[suggestion.category]) {
            grouped[suggestion.category] = [];
          }
          grouped[suggestion.category].push(suggestion.instruction_text);
        });
        setSuggestions(grouped);
        setFilteredSuggestions(grouped);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    const currentValue = answers.specialInstructions.trim();
    const newValue = currentValue
      ? `${currentValue}\n${suggestionText}`
      : suggestionText;
    updateAnswer('specialInstructions', newValue);
    setShowSuggestionsModal(false);
  };

  // URL Analysis Handlers
  const handleAnalyzeUrl = async (analysisType: 'context' | 'fullCopy' | 'deepCrawl') => {
    if (!urlToAnalyze.trim()) {
      toast.error('Please enter a URL to analyze');
      return;
    }

    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    // Auto-add https:// if protocol is missing
    let finalUrl = urlToAnalyze.trim();
    if (finalUrl && !finalUrl.match(/^https?:\/\//i)) {
      finalUrl = 'https://' + finalUrl;
      setUrlToAnalyze(finalUrl); // Update the input field to show the corrected URL
    }

    // Validate URL format
    try {
      new URL(finalUrl);
    } catch {
      toast.error('Invalid URL format');
      return;
    }

    setIsAnalyzingUrl(true);
    setUrlAnalysisType(analysisType);

    try {
      const supabase = await getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session. Please log in.');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Use existing session ID if available, otherwise track as null (no session creation for URL analysis)
      const sessionId = currentSessionId || null;

      let result;

      if (analysisType === 'deepCrawl') {
        // Use Firecrawl for deep crawl
        toast.loading('Deep crawling URL... This may take longer', { duration: 2000 });
        result = await analyzeUrlWithFirecrawl(
          finalUrl,
          currentUser.id,
          supabaseUrl,
          session.access_token,
          'fullCopy',
          currentUser.email,
          selectedModel,
          sessionId
        );
      } else {
        // Use regular analysis
        const mode = analysisType === 'context' ? 'context' : 'fullCopy';
        result = await analyzeUrl(
          finalUrl,
          currentUser.id,
          supabaseUrl,
          session.access_token,
          mode,
          currentUser.email,
          selectedModel,
          sessionId
        );
      }

      // Apply the results to the wizard form
      if (analysisType === 'context') {
        // Pre-fill wizard fields with context
        if (result.data.whatCreating) {
          updateAnswer('whatAreYouCreating', result.data.whatCreating);
        }
        if (result.data.targetAudience) {
          updateAnswer('targetAudience', result.data.targetAudience);
        }
        if (result.data.painPoints) {
          updateAnswer('painPoints', result.data.painPoints);
        }
        if (result.data.tone) {
          const toneMap: Record<string, any> = {
            'Professional': 'Professional',
            'Friendly': 'Friendly',
            'Bold': 'Bold',
            'Minimalist': 'Minimalist',
            'Creative': 'Creative',
            'Persuasive': 'Persuasive'
          };
          const matchedTone = toneMap[result.data.tone] || 'Friendly';
          updateAnswer('tone', matchedTone);
        }
        toast.success('Context analyzed! Fields pre-filled');
      } else {
        // Extract copy mode - put the copy in the whatAreYouCreating field
        if (result.data.structuredCopy) {
          // Convert HTML to plain text for better readability
          const plainText = htmlToText(result.data.structuredCopy);
          updateAnswer('whatAreYouCreating', plainText);
        }
        if (result.data.targetAudience) {
          updateAnswer('targetAudience', result.data.targetAudience);
        }
        if (result.data.painPoints) {
          updateAnswer('painPoints', result.data.painPoints);
        }

        // If outputStructure was extracted, show the modal for user to choose
        if (result.data.outputStructure && Array.isArray(result.data.outputStructure) && result.data.outputStructure.length > 0) {
          setExtractedStructure(result.data.outputStructure);
          setPendingCopyData(result.data);
          setShowStructureModal(true);
        } else {
          toast.success('Copy extracted from page!');
        }
      }
    } catch (error: any) {
      console.error('URL analysis error:', error);
      toast.error(error.message || 'Failed to analyze URL');
    } finally {
      setIsAnalyzingUrl(false);
      setUrlAnalysisType(null);
    }
  };

  const handleCancelUrlAnalysis = () => {
    setUrlToAnalyze('');
    setUrlAnalysisType(null);
    setShowUrlSection(false);
  };

  // Structure modal handlers
  const handleUseExtractedStructure = () => {
    const hasWordCounts = extractedStructure.length > 0 &&
                         typeof extractedStructure[0] === 'object' &&
                         'wordCount' in extractedStructure[0];

    const actualCopyWords = countWords(answers.whatAreYouCreating || '');

    if (hasWordCounts) {
      let structuredElements = extractedStructure.map((item: any, index: number) => ({
        id: `extracted-${index}-${Date.now()}`,
        value: item.name,
        label: item.name,
        wordCount: item.wordCount
      }));

      const aiTotalWords = structuredElements.reduce((sum: number, el: any) => sum + el.wordCount, 0);

      // If the AI-assigned word counts are significantly below the actual copy word count,
      // scale them proportionally so the output target matches the original copy length.
      if (actualCopyWords > 0 && aiTotalWords > 0 && aiTotalWords < actualCopyWords * 0.8) {
        const scaleFactor = actualCopyWords / aiTotalWords;
        structuredElements = structuredElements.map((el: any) => ({
          ...el,
          wordCount: Math.round(el.wordCount * scaleFactor)
        }));
        const scaledTotal = structuredElements.reduce((sum: number, el: any) => sum + el.wordCount, 0);
        updateAnswer('outputStructure', structuredElements);
        setShowStructureModal(false);
        toast.success(`Structure applied! Scaled to match original (${scaledTotal} words across ${structuredElements.length} sections)`);
      } else {
        updateAnswer('outputStructure', structuredElements);
        setShowStructureModal(false);
        toast.success(`Structure applied with actual word counts! Total: ${aiTotalWords} words across ${extractedStructure.length} sections`);
      }
    } else {
      const totalWords = actualCopyWords > 0 ? actualCopyWords : countWords(answers.whatAreYouCreating);
      const perSection = Math.max(50, Math.floor(totalWords / extractedStructure.length));

      const structuredElements = extractedStructure.map((item: any, index: number) => ({
        id: `extracted-${index}-${Date.now()}`,
        value: typeof item === 'string' ? item : item.name,
        label: typeof item === 'string' ? item : item.name,
        wordCount: perSection
      }));
      updateAnswer('outputStructure', structuredElements);
      setShowStructureModal(false);
      toast.success(`Structure applied! Auto-distributed ${totalWords} words across ${extractedStructure.length} sections (${perSection} words each)`);
    }
  };

  const handleUseDefaultStructure = () => {
    // Calculate word count from the extracted copy
    const copyText = answers.whatAreYouCreating;
    const totalWords = countWords(copyText);

    // Auto-distribute word count across sections
    const perSection = Math.floor(totalWords / defaultStructure.length);

    // Convert string array to StructuredOutputElement array
    const structuredElements = defaultStructure.map((item, index) => ({
      id: `default-${index}-${Date.now()}`,
      value: item,
      label: item,
      wordCount: perSection
    }));
    updateAnswer('outputStructure', structuredElements);
    setShowStructureModal(false);
    toast.success(`Default structure applied! Auto-distributed ${totalWords} words across ${defaultStructure.length} sections (${perSection} words each)`);
  };

  const handleCloseStructureModal = () => {
    setShowStructureModal(false);
    toast.success('Copy extracted from page!');
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >

      {/* Project Description - Required First */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={answers.projectDescription}
          onChange={(e) => updateAnswer('projectDescription', e.target.value)}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
          placeholder="e.g., AI-powered project management tool for remote teams"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          This will be used as your session name for tracking credit usage
        </p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Mode
        </label>
        <div className="flex items-center gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="wizardCopyMode"
              value="create"
              checked={answers.mode === 'create'}
              onChange={() => updateAnswer('mode', 'create')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
              Make new copy
            </span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="wizardCopyMode"
              value="improve"
              checked={answers.mode === 'improve'}
              onChange={() => updateAnswer('mode', 'improve')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
              Improve existing copy
            </span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="wizardCopyMode"
              value="polish"
              checked={answers.mode === 'polish'}
              onChange={() => updateAnswer('mode', 'polish')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
              Quick Polish
            </span>
          </label>
        </div>
      </div>

      {/* URL Analysis Section - Only show for improve mode */}
      {answers.mode === 'improve' && (
        <div>
          {!showUrlSection ? (
            <button
              type="button"
              onClick={() => setShowUrlSection(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#DD6B20] hover:bg-[#C05621] text-white rounded-lg transition-colors shadow-sm"
            >
              <Globe className="w-4 h-4" />
              Analyze URL
            </button>
          ) : (
            <div className="border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 bg-primary-50/30 dark:bg-primary-900/10 space-y-3">
              <input
                type="url"
                value={urlToAnalyze}
                onChange={(e) => setUrlToAnalyze(e.target.value)}
                placeholder="https://example.com/page"
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5"
                disabled={isAnalyzingUrl}
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAnalyzeUrl('context')}
                  disabled={isAnalyzingUrl || !urlToAnalyze.trim()}
                  className="px-3 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzingUrl && urlAnalysisType === 'context' ? (
                    <span className="flex items-center justify-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze Context'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleAnalyzeUrl('fullCopy')}
                  disabled={isAnalyzingUrl || !urlToAnalyze.trim()}
                  className="px-3 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzingUrl && urlAnalysisType === 'fullCopy' ? (
                    <span className="flex items-center justify-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Extracting...
                    </span>
                  ) : (
                    'Extract Copy'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleAnalyzeUrl('deepCrawl')}
                  disabled={isAnalyzingUrl || !urlToAnalyze.trim()}
                  className="px-3 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzingUrl && urlAnalysisType === 'deepCrawl' ? (
                    <span className="flex items-center justify-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Crawling...
                    </span>
                  ) : (
                    'Analyze Deep Crawl'
                  )}
                </button>
              </div>

              {urlToAnalyze && (
                <button
                  type="button"
                  onClick={handleCancelUrlAnalysis}
                  disabled={isAnalyzingUrl}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              )}

              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Analyze Context:</strong> Pre-fill wizard fields</p>
                <p><strong>Extract Copy:</strong> Get all copy from the page</p>
              </div>
            </div>
          )}
        </div>
      )}


      {/* What Are You Creating - Only show for create and improve */}
      {answers.mode !== 'polish' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {answers.mode === 'create' ? 'What are you creating?' : 'Paste your existing copy'} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={answers.whatAreYouCreating}
          onChange={(e) => updateAnswer('whatAreYouCreating', e.target.value)}
          rows={answers.mode === 'improve' ? 4 : 3}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
          placeholder={
            answers.mode === 'create'
              ? "e.g., A landing page for my project management SaaS targeting small businesses..."
              : "Paste the copy you want to improve here..."
          }
        />
        {answers.whatAreYouCreating.length > 0 && answers.whatAreYouCreating.length < 20 && (
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
            {answers.mode === 'create'
              ? 'Try to be more specific. Add details about your topic or product.'
              : 'Please paste more content to improve.'}
          </p>
        )}
      </div>

      )}

      {/* Target Audience - Only show for create and improve */}
      {answers.mode !== 'polish' && (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Who is it for? <span className="text-red-500">*</span>
          </label>
          <SuggestionButton
            fieldType="targetAudience"
            businessDescription={answers.whatAreYouCreating}
            onGetSuggestion={async (fieldType) => {
              await handleGetFieldSuggestion(fieldType);
            }}
            isLoading={loadingFields.has('targetAudience')}
            currentUser={currentUser}
            isDisabled={!answers.whatAreYouCreating.trim() || answers.whatAreYouCreating.trim().length < 20}
          />
        </div>
        <textarea
          value={answers.targetAudience}
          onChange={(e) => updateAnswer('targetAudience', e.target.value)}
          rows={2}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
          placeholder="e.g., Small business owners who need better project management tools..."
        />
      </div>

      )}

      {/* Pain Points (Optional) - Only show for create and improve */}
      {answers.mode !== 'polish' && (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            What problems does it solve? <span className="text-gray-400">(Optional)</span>
          </label>
          <SuggestionButton
            fieldType="painPoints"
            businessDescription={answers.whatAreYouCreating}
            onGetSuggestion={async (fieldType) => {
              await handleGetFieldSuggestion(fieldType);
            }}
            isLoading={loadingFields.has('painPoints')}
            currentUser={currentUser}
            isDisabled={!answers.whatAreYouCreating.trim() || answers.whatAreYouCreating.trim().length < 20}
          />
        </div>
        <textarea
          value={answers.painPoints}
          onChange={(e) => updateAnswer('painPoints', e.target.value)}
          rows={2}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
          placeholder="e.g., They struggle with scattered tools, missed deadlines, and poor team communication..."
        />
      </div>
      )}

      {/* Special Requirements (Optional) - Moved to Step 1 for streamlined flow */}
      {answers.mode !== 'polish' && (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Special Requirements <span className="text-gray-400">(Optional)</span>
          </label>
          <Tooltip content="Get suggestions for special requirements">
            <button
              type="button"
              onClick={() => setShowSuggestionsModal(true)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
              aria-label="Get suggestions"
            >
              <Lightbulb size={18} />
            </button>
          </Tooltip>
        </div>
        <textarea
          value={answers.specialInstructions}
          onChange={(e) => updateAnswer('specialInstructions', e.target.value)}
          rows={2}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-3"
          placeholder='e.g., "Use British English", "Focus on environmental benefits", "Keep it concise and direct"'
        />
      </div>
      )}

      {/* Footer for both improve and create modes */}
      {(answers.mode === 'improve' || answers.mode === 'create') && (
        <div className="pt-6 mt-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            You can edit everything later in Advanced Mode.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onApplyFromStep2}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >

      {/* Tone */}
      <div>
        <label htmlFor="tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tone
        </label>
        <select
          id="tone"
          value={answers.tone}
          onChange={(e) => updateAnswer('tone', e.target.value)}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5"
        >
          {toneOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.description}
            </option>
          ))}
        </select>
      </div>

      {/* Word Count */}
      <div>
        <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Length
        </label>
        <select
          id="wordCount"
          value={answers.wordCount}
          onChange={(e) => updateAnswer('wordCount', e.target.value)}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5"
        >
          {wordCountOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.description})
            </option>
          ))}
        </select>
        {answers.wordCount === 'Custom' && (
          <div className="mt-3">
            <label htmlFor="customWordCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Word Count
            </label>
            <input
              id="customWordCount"
              type="number"
              value={answers.customWordCount}
              onChange={(e) => updateAnswer('customWordCount', parseInt(e.target.value) || 300)}
              min={50}
              max={4000}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5"
              placeholder="Enter word count..."
            />
          </div>
        )}
      </div>

      {/* Feature Toggles - Hidden for 'improve' mode (always enabled implicitly) */}
      {answers.mode === 'create' && (
      <div className="space-y-3 pt-2">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="enableSEO"
            checked={answers.enableSEO}
            onCheckedChange={(checked) => updateAnswer('enableSEO', checked)}
          />
          <div className="flex-1">
            <Label
              htmlFor="enableSEO"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Enable SEO Optimization
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Generate meta descriptions, URL slugs, and structured headings
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="enableGEO"
            checked={answers.enableGEO}
            onCheckedChange={(checked) => updateAnswer('enableGEO', checked)}
          />
          <div className="flex-1">
            <Label
              htmlFor="enableGEO"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Enable GEO Optimization
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Optimize for AI search engines like ChatGPT and Perplexity
            </p>
          </div>
        </div>
      </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-500 dark:text-gray-200">
          <strong>Smart defaults:</strong> We've automatically configured settings based on your project.
          {answers.mode === 'improve' && (
            <span className="block mt-1.5 text-xs text-primary-600 dark:text-primary-400">
              SEO and GEO optimizations are always enabled for improved copy.
            </span>
          )}
        </p>
      </div>

      {/* Action Buttons for Step 2 */}
      {onApplyFromStep2 && onApplyAndGenerateFromStep2 && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onPrev}
            disabled={isGenerating}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onApplyFromStep2}
            disabled={isGenerating}
            className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-primary-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Apply
          </button>
          <button
            onClick={onApplyAndGenerateFromStep2}
            disabled={isGenerating}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition-colors text-sm font-medium shadow-md disabled:opacity-50"
          >
            Apply & Generate
          </button>
        </div>
      )}
    </motion.div>
  );

  return (
    <>
      <div>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>

      {/* Suggestions Modal */}
      {showSuggestionsModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn"
          onClick={() => setShowSuggestionsModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden animate-slideUp flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Suggestions</h2>
              <button
                onClick={() => setShowSuggestionsModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search suggestions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingSuggestions ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading suggestions...</div>
              ) : Object.keys(filteredSuggestions).length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery ? `No suggestions found matching "${searchQuery}"` : 'No suggestions available'}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(filteredSuggestions).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3">{category}</h3>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <button
                            key={`${category}-${index}`}
                            onClick={() => handleSuggestionClick(item)}
                            className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-sm text-gray-900 dark:text-white"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
              <button
                onClick={() => setShowSuggestionsModal(false)}
                className="w-full bg-gray-900 dark:bg-gray-800 text-white rounded-lg px-4 py-2 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structure Confirmation Modal */}
      <StructureConfirmationModal
        isOpen={showStructureModal}
        extractedStructure={extractedStructure}
        defaultStructure={defaultStructure}
        onUseExtracted={handleUseExtractedStructure}
        onUseDefault={handleUseDefaultStructure}
        onClose={handleCloseStructureModal}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default WizardStep;
