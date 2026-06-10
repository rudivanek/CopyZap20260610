import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Wand2, Sparkles, BookCheck, Globe, Code, MapPin, CreditCard as Edit, Lightbulb, Search, Trash2, BookOpen, Loader2, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { GeneratedContentItem, GeneratedContentItemType, FormState, StructuredCopyOutput, MAX_BOOST_ITERATIONS, MAX_BOOST_SCORE_THRESHOLD } from '../types';
import { stripMarkdown } from '../utils/markdownUtils';
import { computeWordCountAndReadingLevel } from '../utils/multiScoreDisplay';
import { formatSingleGeneratedItemContentAsHTML, formatSingleGeneratedItemAsMarkdown, markdownToHtml } from '../utils/copyFormatter';
import { CATEGORIZED_VOICE_STYLES } from '../constants';
import { User } from '../types';
import { Button } from './ui/button';
import { Tooltip } from './ui/Tooltip';
import { useIsAdmin } from '../hooks/useIsAdmin';
import LoadingSpinner from './ui/LoadingSpinner';
import CharacterCounter from './ui/CharacterCounter';
import { getSupabaseClient } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';
import { generateModificationSuggestions } from '../services/api/modificationSuggestions';
import { generateSeoMetadata, generateSeoElement } from '../services/api/seoGeneration';
import { calculateGeoScore } from '../services/api/geoScoring';
import { generateContentScores } from '../services/api/contentScoring';
import ComparisonTable from './results/ComparisonTable';
import SeoGenerationOptionsModal, { SeoGenerationOptions } from './SeoGenerationOptionsModal';
import OnDemandSeoButtons, { SeoElementType } from './ui/OnDemandSeoButtons';
import ProcessingModal from './ProcessingModal';
import { getScoreLabel } from '../utils/scoreColors';
import { DualScoreRow } from './results/AbsoluteScoreBadge';
import { playSuccessSound } from '../utils/soundEffects';
import FormattedContent from './ui/FormattedContent';

interface GeneratedCopyCardProps {
  card: GeneratedContentItem;
  indentationLevel?: number;
  isLastInThread?: boolean;
  formState: FormState;
  currentUser?: User;
  onCreateAlternative: () => void;
  onApplyVoiceStyle: (persona: string, instructions?: string) => void;
  onGenerateScore: () => void;
  onGenerateFaqSchema: (content: string) => void;
  onModifyContent: (instruction: string) => void;
  onDelete?: () => void;
  targetWordCount?: number;
  onSaveAsBrandVoice?: (content: string) => void;
  onBlendVersions?: (grokAnalysisContent: string) => void;
  isBlending?: boolean;
  onUpdateCard?: (cardId: string, updates: Partial<GeneratedContentItem>) => void;
  allCards?: GeneratedContentItem[];
  comparisonResult?: any;
  onAddToComparison?: (card: GeneratedContentItem) => void;
  versionScores?: any;
  onPerformanceBoost?: () => void;
  geoPackage?: GeneratedContentItem;
  isPrimary?: boolean;
}

const GeneratedCopyCard: React.FC<GeneratedCopyCardProps> = ({
  card,
  indentationLevel = 0,
  isLastInThread = false,
  formState,
  currentUser,
  onCreateAlternative,
  onApplyVoiceStyle,
  onGenerateScore,
  onGenerateFaqSchema,
  onModifyContent,
  onDelete,
  targetWordCount,
  onSaveAsBrandVoice,
  onBlendVersions,
  isBlending,
  onUpdateCard,
  allCards = [],
  comparisonResult,
  onAddToComparison,
  versionScores,
  onPerformanceBoost,
  geoPackage,
  isPrimary = false
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [modificationInstruction, setModificationInstruction] = useState('');
  const [isModifySuggestionsModalOpen, setIsModifySuggestionsModalOpen] = useState(false);
  const [modifySuggestions, setModifySuggestions] = useState<{ [category: string]: string[] }>({});
  const [filteredModifySuggestions, setFilteredModifySuggestions] = useState<{ [category: string]: string[] }>({});
  const [modifySearchQuery, setModifySearchQuery] = useState('');
  const [isLoadingModifySuggestions, setIsLoadingModifySuggestions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isVoiceStyleModalOpen, setIsVoiceStyleModalOpen] = useState(false);
  const [voiceStyleInstructions, setVoiceStyleInstructions] = useState('');
  const [isGeneratingSeoMetadata, setIsGeneratingSeoMetadata] = useState(false);
  const [cardSeoMetadata, setCardSeoMetadata] = useState(card.seoMetadata);
  const [isSeoOptionsModalOpen, setIsSeoOptionsModalOpen] = useState(false);
  const [showSeoProcessingModal, setShowSeoProcessingModal] = useState(false);
  const seoAbortControllerRef = useRef<AbortController | null>(null);
  const [isGeneratingIndividualSeoElement, setIsGeneratingIndividualSeoElement] = useState(false);
  const [generatingElementType, setGeneratingElementType] = useState<SeoElementType | undefined>();
  const [isGeneratingGeoScore, setIsGeneratingGeoScore] = useState(false);
  const [cardGeoScore, setCardGeoScore] = useState(card.geoScore);
  const [showGeoProcessingModal, setShowGeoProcessingModal] = useState(false);
  const geoAbortControllerRef = useRef<AbortController | null>(null);
  const [isGeneratingContentScore, setIsGeneratingContentScore] = useState(false);
  const [cardScore, setCardScore] = useState(card.score);
  const [showContentScoreProcessingModal, setShowContentScoreProcessingModal] = useState(false);
  const contentScoreAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => { if (card.score) setCardScore(card.score); }, [card.score]);
  useEffect(() => { if (card.seoMetadata) setCardSeoMetadata(card.seoMetadata); }, [card.seoMetadata]);
  useEffect(() => { if (card.geoScore) setCardGeoScore(card.geoScore); }, [card.geoScore]);

  const [isGenerateAllMode, setIsGenerateAllMode] = useState(false);
  const [openPanel, setOpenPanel] = useState<null | 'rewrite' | 'tone'>(null);

  const { isAdmin } = useIsAdmin(currentUser);

  // Track previous values to detect updates
  const prevContentRef = useRef<any>(null);
  const prevGeoScoreRef = useRef<any>(null);
  const prevScoreRef = useRef<any>(null);
  const prevSeoMetadataRef = useRef<any>(null);
  const isFirstRender = useRef(true);

  // Play sound on card creation or update
  useEffect(() => {
    // Skip sound on first render (initial mount)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevContentRef.current = card.content;
      prevGeoScoreRef.current = cardGeoScore;
      prevScoreRef.current = cardScore;
      prevSeoMetadataRef.current = cardSeoMetadata;
      // Play sound on creation (initial mount)
      playSuccessSound();
      return;
    }

    // Play sound when content changes (update)
    if (prevContentRef.current !== card.content) {
      playSuccessSound();
      prevContentRef.current = card.content;
    }
  }, [card.content]);

  // Play sound when GEO score is generated
  useEffect(() => {
    if (!isFirstRender.current && cardGeoScore && prevGeoScoreRef.current !== cardGeoScore) {
      playSuccessSound();
      prevGeoScoreRef.current = cardGeoScore;
    }
  }, [cardGeoScore]);

  // Play sound when content score is generated
  useEffect(() => {
    if (!isFirstRender.current && cardScore && prevScoreRef.current !== cardScore) {
      playSuccessSound();
      prevScoreRef.current = cardScore;
    }
  }, [cardScore]);

  // Play sound when SEO metadata is generated
  useEffect(() => {
    if (!isFirstRender.current && cardSeoMetadata && prevSeoMetadataRef.current !== cardSeoMetadata) {
      playSuccessSound();
      prevSeoMetadataRef.current = cardSeoMetadata;
    }
  }, [cardSeoMetadata]);

  // Do NOT initialize modificationInstruction from card data
  // The card.modificationInstruction is only for DISPLAY (showing what was used to create this card)
  // The input field should always start empty for new modifications

  // Fetch modify suggestions when modal opens
  useEffect(() => {
    if (isModifySuggestionsModalOpen) {
      fetchModifySuggestions();
    }
  }, [isModifySuggestionsModalOpen]);

  // Filter suggestions based on search query
  useEffect(() => {
    if (!modifySearchQuery.trim()) {
      setFilteredModifySuggestions(modifySuggestions);
    } else {
      const query = modifySearchQuery.toLowerCase();
      const filtered: { [category: string]: string[] } = {};

      Object.entries(modifySuggestions).forEach(([category, items]) => {
        const categoryMatch = typeof category === 'string' && category.toLowerCase().includes(query);
        const matchingItems = items.filter(item => typeof item === 'string' && item.toLowerCase().includes(query));

        if (categoryMatch || matchingItems.length > 0) {
          filtered[category] = categoryMatch ? items : matchingItems;
        }
      });

      setFilteredModifySuggestions(filtered);
    }
  }, [modifySearchQuery, modifySuggestions]);

  const fetchModifySuggestions = async () => {
    if (!currentUser) {
      toast.error('Please log in to generate suggestions');
      return;
    }

    setIsLoadingModifySuggestions(true);
    try {
      // Extract content as text for analysis
      const contentText = typeof card.content === 'string'
        ? card.content
        : card.content.headline
          ? `${card.content.headline}\n\n${card.content.sections.map((s: any) =>
              `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
            ).join('\n\n')}`
          : JSON.stringify(card.content);

      // Generate AI-powered suggestions
      const suggestions = await generateModificationSuggestions(
        contentText,
        {
          tone: formState.tone,
          targetAudience: formState.targetAudience,
          keyMessage: formState.keyMessage,
          language: formState.language,
          outputType: formState.outputType
        },
        formState.model,
        currentUser,
        formState.sessionId,
        (message) => console.log('Suggestion generation:', message)
      );

      // Convert to grouped format
      const grouped: { [category: string]: string[] } = {};
      suggestions.forEach((item) => {
        grouped[item.category] = item.suggestions;
      });

      setModifySuggestions(grouped);
      setFilteredModifySuggestions(grouped);

      toast.success('AI suggestions generated successfully');
    } catch (error) {
      console.error('Error generating modify suggestions:', error);
      toast.error('Failed to generate suggestions: ' + error.message);
    } finally {
      setIsLoadingModifySuggestions(false);
    }
  };

  const handleModifySuggestionClick = (suggestionText: string) => {
    const currentValue = modificationInstruction.trim();
    const newValue = currentValue
      ? `${currentValue} ${suggestionText}`
      : suggestionText;
    setModificationInstruction(newValue);
    setIsModifySuggestionsModalOpen(false);
    toast.success('Suggestion added');
  };

  // Process content based on type
  const contentDetails = React.useMemo(() => {
    // Handle empty content
    if (card.content === null || card.content === undefined) {
      return { text: '', wordCount: 0, isStructured: false, isHeadlines: false };
    }

    // CRITICAL: Unwrap nested content structure first
    // This handles cases where restyleCopyWithPersona returns { content: actualContent, faqSchema: {...} }
    let actualContent = card.content;
    if (typeof card.content === 'object' && card.content !== null && 'content' in card.content) {
      actualContent = (card.content as any).content;
      console.log('Unwrapped nested content structure:', actualContent);
    }

    // Check if this is SEO metadata
    if (card.type === GeneratedContentItemType.SeoMetadata && card.seoMetadata) {
      // This card type should no longer exist as SEO metadata is now embedded in content cards
      return { text: '', wordCount: 0, isStructured: false, isHeadlines: false };
    }

    // Check if content is structured
    if (typeof actualContent === 'object') {
      // Check if content is structured copy
      if (actualContent && typeof actualContent === 'object' && 'headline' in actualContent && 'sections' in actualContent) {
        const structuredContent = actualContent as StructuredCopyOutput;
        // Calculate word count from structured content
        let text = stripMarkdown(structuredContent.headline) + '\n\n';
        structuredContent.sections.forEach(section => {
          if (section && section.title) {
            text += stripMarkdown(section.title) + '\n';
            if (section.content) {
              text += stripMarkdown(section.content) + '\n\n';
            } else if (section.listItems && section.listItems.length > 0) {
              section.listItems.forEach(item => {
                text += '• ' + stripMarkdown(item) + '\n';
              });
              text += '\n';
            }
          }
        });
        
        const wordCount = text ? text.trim().split(/\s+/).length : 0;
        
        return { 
          text, 
          wordCount, 
          isStructured: true, 
          isHeadlines: false,
          structuredContent: structuredContent,
          wordCountAccuracy: structuredContent.wordCountAccuracy
        };
      } else {
        // Handle other object formats by checking common text-containing properties
        if (actualContent.text && typeof actualContent.text === 'string') {
          const text = stripMarkdown(actualContent.text);
          const wordCount = text ? text.trim().split(/\s+/).length : 0;
          return { text, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
        } else if (actualContent.content && typeof actualContent.content === 'string') {
          const text = stripMarkdown(actualContent.content);
          const wordCount = text ? text.trim().split(/\s+/).length : 0;
          return { text, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
        } else if (actualContent.output && typeof actualContent.output === 'string') {
          const text = stripMarkdown(actualContent.output);
          const wordCount = text ? text.trim().split(/\s+/).length : 0;
          return { text, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
        } else if (actualContent.message && typeof actualContent.message === 'string') {
          const text = stripMarkdown(actualContent.message);
          const wordCount = text ? text.trim().split(/\s+/).length : 0;
          return { text, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
        } else {
          // Fallback: Handle objects that don't match any known format
          try {
            const formattedText = JSON.stringify(actualContent, null, 2);
            const wordCount = formattedText ? formattedText.trim().split(/\s+/).length : 0;
            return { 
              text: formattedText, 
              wordCount, 
              isStructured: false,
              isHeadlines: false,
              isFaqJson: false
            };
          } catch (e) {
            return { 
              text: 'Invalid content format', 
              wordCount: 0, 
              isStructured: false,
              isHeadlines: false,
              isFaqJson: false
            };
          }
        }
      }
    }
    
    // Handle string content
    const stringContent = String(actualContent);
    const strippedContent = stripMarkdown(stringContent);
    const wordCount = strippedContent ? strippedContent.trim().split(/\s+/).length : 0;

    return { text: strippedContent, originalText: stringContent, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
  }, [card.content]);

  // Get word count accuracy text and color
  const getWordCountInfo = React.useMemo(() => {
    if (!targetWordCount || contentDetails.isHeadlines) return null;
    
    const difference = contentDetails.wordCount - targetWordCount;
    const percentDifference = Math.abs(difference) / targetWordCount * 100;
    
    let textColor = '';
    let message = '';
    
    if (Math.abs(difference) <= 10) {
      textColor = 'text-gray-600 dark:text-gray-400';
      message = 'Perfect';
    } else if (Math.abs(difference) <= 50) {
      textColor = 'text-gray-700 dark:text-gray-300';
      message = `${Math.abs(difference)} words ${difference > 0 ? 'over' : 'under'}`;
    } else if (percentDifference <= 20) {
      textColor = 'text-gray-500 dark:text-gray-400';
      message = `${Math.abs(difference)} words ${difference > 0 ? 'over' : 'under'}`;
    } else {
      textColor = 'text-gray-600 dark:text-gray-500';
      message = `${Math.abs(difference)} words ${difference > 0 ? 'over' : 'under'} (${percentDifference.toFixed(0)}%)`;
    }
    
    return { textColor, message };
  }, [contentDetails.wordCount, targetWordCount, contentDetails.isHeadlines]);

  const handleCopy = () => {
    // Copy ONLY the text content (no scores, no metadata)
    let textToCopy = contentDetails.text;

    // Special handling for content with comparison data
    if (card.comparedContent) {
      const modelLabel = isAdmin && card.analysisModel ? ` (${card.analysisModel === 'gpt-4o' ? 'GPT-4o' : 'DeepSeek'})` : '';
      let analysisText = `AI Analysis Summary${modelLabel}:\n\n`;
      analysisText += contentDetails.originalText || contentDetails.text;

      textToCopy = analysisText;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHtml = () => {
    // Copy ONLY the content as HTML (no scores, no metadata)
    let htmlContent = formatSingleGeneratedItemContentAsHTML(card);

    // Special handling for content with comparison data
    if (card.comparedContent) {
      const modelLabelHtml = isAdmin && card.analysisModel ? ` (${card.analysisModel === 'gpt-4o' ? 'GPT-4o' : 'DeepSeek'})` : '';

      // Use markdownToHtml to properly convert tables and formatting
      const comparisonText = contentDetails.originalText || contentDetails.text;
      const formattedHtml = markdownToHtml(comparisonText);

      let analysisHtml = '<div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;">\n';
      analysisHtml += `<h3 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 20px 0;">AI Analysis Summary${modelLabelHtml}</h3>\n`;
      analysisHtml += '<div>' + formattedHtml + '</div>\n';
      analysisHtml += '</div>';

      htmlContent = analysisHtml;
    }

    navigator.clipboard.writeText(htmlContent);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleCopyMarkdown = () => {
    // Copy FULL markdown with all sections (content, scores, metadata)
    // formatSingleGeneratedItemAsMarkdown handles both regular content and analysis content
    const markdownContent = formatSingleGeneratedItemAsMarkdown(card, targetWordCount);

    navigator.clipboard.writeText(markdownContent);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleApplyVoice = () => {
    if (selectedPersona && selectedPersona.trim()) {
      setIsVoiceStyleModalOpen(true);
    } else {
      toast.error('Please select a voice style first');
    }
  };

  const handleConfirmVoiceStyle = () => {
    if (selectedPersona && selectedPersona.trim()) {
      onApplyVoiceStyle(selectedPersona, voiceStyleInstructions);
      setIsVoiceStyleModalOpen(false);
      setVoiceStyleInstructions('');
    }
  };

  const handleModifyContent = () => {
    if (modificationInstruction.trim()) {
      onModifyContent(modificationInstruction.trim());
    }
  };

  const handleOpenSeoOptionsModal = () => {
    if (!currentUser) {
      toast.error('Please log in to generate SEO metadata');
      return;
    }
    setIsSeoOptionsModalOpen(true);
  };

  const handleGenerateSeoMetadata = async (options: SeoGenerationOptions) => {
    setIsSeoOptionsModalOpen(false);
    setIsGeneratingSeoMetadata(true);
    setShowSeoProcessingModal(true);

    // Create abort controller for cancellation
    seoAbortControllerRef.current = new AbortController();

    try {
      const customFormState = {
        ...formState,
        numUrlSlugs: options.numUrlSlugs,
        numMetaDescriptions: options.numMetaDescriptions,
        numH1Variants: options.numH1Variants,
        numH2Variants: options.numH2Headings,
        numH3Variants: options.numH3Headings,
        numOgTitles: options.numOgTitles,
        numOgDescriptions: options.numOgDescriptions,
      };

      const metadata = await generateSeoMetadata(
        card.content,
        customFormState,
        currentUser,
        undefined,
        formState.sessionId,
        options
      );

      // Only update if not aborted
      if (!seoAbortControllerRef.current?.signal.aborted) {
        setCardSeoMetadata(metadata);

        // Store the options to track which elements were enabled/disabled
        const seoGenerationOptions = {
          urlSlugsEnabled: options.urlSlugsEnabled,
          metaDescriptionsEnabled: options.metaDescriptionsEnabled,
          h1VariantsEnabled: options.h1VariantsEnabled,
          h2HeadingsEnabled: options.h2HeadingsEnabled,
          h3HeadingsEnabled: options.h3HeadingsEnabled,
          ogTitlesEnabled: options.ogTitlesEnabled,
          ogDescriptionsEnabled: options.ogDescriptionsEnabled
        };

        // Update the card in the parent state
        if (onUpdateCard) {
          onUpdateCard(card.id, {
            seoMetadata: metadata,
            seoGenerationOptions
          });
        }

        toast.success('SEO metadata generated successfully');
      }
    } catch (error) {
      // Only show error if not cancelled
      if (!seoAbortControllerRef.current?.signal.aborted) {
        console.error('Error generating SEO metadata:', error);
        toast.error('Failed to generate SEO metadata: ' + error.message);
      }
    } finally {
      setIsGeneratingSeoMetadata(false);
      setShowSeoProcessingModal(false);
      seoAbortControllerRef.current = null;
    }

    // If in "Generate All" mode, continue with Content Score and GEO Score
    if (isGenerateAllMode) {
      setIsGenerateAllMode(false); // Reset the flag

      const needsContentScore = !cardScore;
      const needsGeoScore = !cardGeoScore;

      try {
        // Generate Content Score if needed
        if (needsContentScore) {
          setIsGeneratingContentScore(true);
          setShowContentScoreProcessingModal(true);
          contentScoreAbortControllerRef.current = new AbortController();

          const contentScore = await generateContentScores(
            card.content,
            card.type,
            formState.model,
            currentUser,
            undefined,
            targetWordCount,
            formState.sessionId,
            undefined
          );

          if (!contentScoreAbortControllerRef.current?.signal.aborted) {
            setCardScore(contentScore);
            if (onUpdateCard) {
              onUpdateCard(card.id, { score: contentScore });
            }
            toast.success('Content score generated');
          }

          setIsGeneratingContentScore(false);
          setShowContentScoreProcessingModal(false);
          contentScoreAbortControllerRef.current = null;
        }

        // Generate GEO Score if needed
        if (needsGeoScore) {
          setIsGeneratingGeoScore(true);
          setShowGeoProcessingModal(true);
          geoAbortControllerRef.current = new AbortController();

          const geoScore = await calculateGeoScore(
            card.content,
            formState,
            currentUser,
            undefined,
            formState.sessionId
          );

          if (!geoAbortControllerRef.current?.signal.aborted) {
            setCardGeoScore(geoScore);
            if (onUpdateCard) {
              onUpdateCard(card.id, { geoScore: geoScore });
            }
            toast.success('GEO score generated');
          }

          setIsGeneratingGeoScore(false);
          setShowGeoProcessingModal(false);
          geoAbortControllerRef.current = null;
        }

        if ((needsContentScore || needsGeoScore)) {
          toast.success('All analyses completed');
        }
      } catch (error) {
        console.error('Error in Generate All mode:', error);
        toast.error('Error generating additional analyses');
      }
    }
  };

  const handleGenerateIndividualSeoElement = async (elementType: SeoElementType, count: number) => {
    setIsGeneratingIndividualSeoElement(true);
    setGeneratingElementType(elementType);

    try {
      const result = await generateSeoElement(
        card.content,
        elementType,
        count,
        formState,
        currentUser,
        undefined,
        formState.sessionId
      );

      // Merge the new element with existing SEO metadata
      const updatedSeoMetadata = {
        ...cardSeoMetadata,
        ...result
      };

      setCardSeoMetadata(updatedSeoMetadata);

      // Update the card in the parent state
      if (onUpdateCard) {
        onUpdateCard(card.id, { seoMetadata: updatedSeoMetadata });
      }

      const elementLabels = {
        urlSlugs: 'URL Slugs',
        metaDescriptions: 'Meta Descriptions',
        h1Variants: 'H1 Variants',
        h2Headings: 'H2 Headings',
        h3Headings: 'H3 Headings',
        ogTitles: 'OG Titles',
        ogDescriptions: 'OG Descriptions'
      };

      toast.success(`${elementLabels[elementType]} generated successfully`);
    } catch (error) {
      console.error(`Error generating ${elementType}:`, error);
      toast.error(`Failed to generate ${elementType}: ${error.message}`);
    } finally {
      setIsGeneratingIndividualSeoElement(false);
      setGeneratingElementType(undefined);
    }
  };

  const handleCancelSeoGeneration = () => {
    if (seoAbortControllerRef.current) {
      seoAbortControllerRef.current.abort();
      setIsGeneratingSeoMetadata(false);
      setShowSeoProcessingModal(false);
      toast.info('SEO generation cancelled');
    }
  };

  const handleGenerateGeoScore = async () => {
    if (!currentUser) {
      toast.error('Please log in to generate GEO score');
      return;
    }

    setIsGeneratingGeoScore(true);
    setShowGeoProcessingModal(true);

    // Create abort controller for cancellation
    geoAbortControllerRef.current = new AbortController();

    try {
      const geoScore = await calculateGeoScore(
        card.content,
        formState,
        currentUser,
        undefined,
        formState.sessionId
      );

      // Only update if not aborted
      if (!geoAbortControllerRef.current?.signal.aborted) {
        setCardGeoScore(geoScore);

        // Update the card in the parent state
        if (onUpdateCard) {
          onUpdateCard(card.id, { geoScore: geoScore });
        }

        toast.success('GEO score generated successfully');
      }
    } catch (error) {
      // Only show error if not cancelled
      if (!geoAbortControllerRef.current?.signal.aborted) {
        console.error('Error generating GEO score:', error);
        toast.error('Failed to generate GEO score: ' + error.message);
      }
    } finally {
      setIsGeneratingGeoScore(false);
      setShowGeoProcessingModal(false);
      geoAbortControllerRef.current = null;
    }
  };

  const handleCancelGeoGeneration = () => {
    if (geoAbortControllerRef.current) {
      geoAbortControllerRef.current.abort();
      setIsGeneratingGeoScore(false);
      setShowGeoProcessingModal(false);
      toast.info('GEO score generation cancelled');
    }
  };

  const handleGenerateContentScore = async () => {
    if (!currentUser) {
      toast.error('Please log in to generate content score');
      return;
    }

    setIsGeneratingContentScore(true);
    setShowContentScoreProcessingModal(true);

    // Create abort controller for cancellation
    contentScoreAbortControllerRef.current = new AbortController();

    try {
      const contentScore = await generateContentScores(
        card.content,
        card.type,
        formState.model,
        currentUser,
        undefined,
        targetWordCount,
        formState.sessionId,
        undefined
      );

      // Only update if not aborted
      if (!contentScoreAbortControllerRef.current?.signal.aborted) {
        setCardScore(contentScore);

        // Update the card in the parent state
        if (onUpdateCard) {
          onUpdateCard(card.id, { score: contentScore });
        }

        toast.success('Content score generated successfully');
      }
    } catch (error) {
      // Only show error if not cancelled
      if (!contentScoreAbortControllerRef.current?.signal.aborted) {
        console.error('Error generating content score:', error);
        toast.error('Failed to generate content score: ' + error.message);
      }
    } finally {
      setIsGeneratingContentScore(false);
      setShowContentScoreProcessingModal(false);
      contentScoreAbortControllerRef.current = null;
    }
  };

  const handleCancelContentScoreGeneration = () => {
    if (contentScoreAbortControllerRef.current) {
      contentScoreAbortControllerRef.current.abort();
      setIsGeneratingContentScore(false);
      setShowContentScoreProcessingModal(false);
      toast.info('Content score generation cancelled');
    }
  };

  const handleGenerateAll = async () => {
    if (!currentUser) {
      toast.error('Please log in to generate analyses');
      return;
    }

    const needsSeo = !cardSeoMetadata;
    const needsContentScore = !cardScore;
    const needsGeoScore = !cardGeoScore;

    // If SEO needs to be generated, show the modal first
    if (needsSeo) {
      setIsGenerateAllMode(true);
      setIsSeoOptionsModalOpen(true);
      return;
    }

    try {

      // Generate Content Score if needed
      if (needsContentScore) {
        setIsGeneratingContentScore(true);
        setShowContentScoreProcessingModal(true);
        contentScoreAbortControllerRef.current = new AbortController();

        const contentScore = await generateContentScores(
          card.content,
          card.type,
          formState.model,
          currentUser,
          undefined,
          targetWordCount,
          formState.sessionId,
          undefined
        );

        if (!contentScoreAbortControllerRef.current?.signal.aborted) {
          setCardScore(contentScore);
          if (onUpdateCard) {
            onUpdateCard(card.id, { score: contentScore });
          }
          toast.success('Content score generated');
        }

        setIsGeneratingContentScore(false);
        setShowContentScoreProcessingModal(false);
        contentScoreAbortControllerRef.current = null;
      }

      // Generate GEO Score if needed
      if (needsGeoScore) {
        setIsGeneratingGeoScore(true);
        setShowGeoProcessingModal(true);
        geoAbortControllerRef.current = new AbortController();

        const geoScore = await calculateGeoScore(
          card.content,
          formState,
          currentUser,
          undefined,
          formState.sessionId
        );

        if (!geoAbortControllerRef.current?.signal.aborted) {
          setCardGeoScore(geoScore);
          if (onUpdateCard) {
            onUpdateCard(card.id, { geoScore: geoScore });
          }
          toast.success('GEO score generated');
        }

        setIsGeneratingGeoScore(false);
        setShowGeoProcessingModal(false);
        geoAbortControllerRef.current = null;
      }

      toast.success('All analyses completed successfully!');
    } catch (error) {
      console.error('Error generating analyses:', error);
      toast.error('Failed to generate some analyses: ' + error.message);

      // Clean up any ongoing operations
      setIsGeneratingSeoMetadata(false);
      setShowSeoProcessingModal(false);
      setIsGeneratingContentScore(false);
      setShowContentScoreProcessingModal(false);
      setIsGeneratingGeoScore(false);
      setShowGeoProcessingModal(false);
    }
  };

  // Determine if we should show action buttons
  const showAlternativeButton = card.type !== GeneratedContentItemType.SeoMetadata &&
                                 card.type !== GeneratedContentItemType.Original;
  const showVoiceButton = selectedPersona && !contentDetails.isHeadlines &&
                          card.type !== GeneratedContentItemType.Original;
  const showFaqSchemaButton = isAdmin &&
                              card.type !== GeneratedContentItemType.SeoMetadata &&
                              card.type !== GeneratedContentItemType.Original &&
                              (card.type === GeneratedContentItemType.Improved ||
                               card.type === GeneratedContentItemType.Alternative ||
                               card.type === GeneratedContentItemType.RestyledImproved ||
                               card.type === GeneratedContentItemType.RestyledAlternative);

  // Performance Boost safeguards
  const showBoostButton = card.type !== GeneratedContentItemType.SeoMetadata &&
                          card.type !== GeneratedContentItemType.Original &&
                          card.type !== GeneratedContentItemType.FaqSchema &&
                          !card.comparedContent &&
                          !!onPerformanceBoost;

  const boostBaseName = card.baseName || card.sourceDisplayName || card.type;
  const existingBoostCount = allCards.filter(
    v => v.type === GeneratedContentItemType.Boosted &&
      (v.parentOutputId === card.id || v.baseName === boostBaseName)
  ).length;
  const boostLimitReached = existingBoostCount >= MAX_BOOST_ITERATIONS;

  const cardFinalScore = versionScores?.[card.id]?.finalScore;
  const scoreAtMax = typeof cardFinalScore === 'number' && cardFinalScore >= MAX_BOOST_SCORE_THRESHOLD * 10;
  const boostDisabled = formState.isLoading || boostLimitReached || scoreAtMax;

  const isBestVersion = !!comparisonResult && comparisonResult.winnerVersionId === card.id;
  const primaryScore = typeof cardFinalScore === 'number' ? cardFinalScore
    : typeof cardScore?.overall === 'number' ? cardScore.overall
    : null;
  const comparisonRow = comparisonResult?.rows?.find((r: any) => r.versionId === card.id);
  const recommendation = React.useMemo(() => {
    if (comparisonRow?.action) return comparisonRow.action;
    if (primaryScore === null) return null;
    if (allCards.length >= 2 && typeof cardFinalScore === 'number') {
      const scores = allCards
        .map(c => versionScores?.[c.id]?.finalScore)
        .filter((s): s is number => typeof s === 'number')
        .sort((a, b) => b - a);
      if (scores.length >= 2 && Math.abs(scores[0] - scores[1]) <= 5 && cardFinalScore >= scores[1]) {
        return 'Compare or blend with other versions';
      }
    }
    if (primaryScore < 70) return 'Recommended: Improve this version';
    if (primaryScore <= 85) return 'Recommended: Enhance for better performance';
    return 'Ready to use';
  }, [comparisonRow, primaryScore, cardFinalScore, allCards, versionScores]);

  const boostTooltip = boostLimitReached
    ? `Further boosting may reduce authenticity. Maximum ${MAX_BOOST_ITERATIONS} boosts reached.`
    : scoreAtMax
      ? 'This output already scores at or above 9.0 — boosting is disabled.'
      : 'Generate a performance-optimized version targeting the weakest scoring dimensions';

  return (
    <div id={`output-${card.id}`} data-card-id={card.id} className={`relative mb-8 ${indentationLevel > 0 ? `ml-8` : ''}`}>
      {/* Thread connector lines */}
      {indentationLevel > 0 && (
        <>
          <div className="absolute left-0 top-0 w-0.5 bg-orange-500 opacity-60 h-6 -ml-4"></div>
          <div className="absolute left-0 top-6 w-4 h-0.5 bg-orange-500 opacity-60 -ml-4"></div>
          {!isLastInThread && (
            <div className="absolute left-0 top-6 w-0.5 bg-orange-500 opacity-60 h-full -ml-4"></div>
          )}
        </>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md">

        {/* ── Header bar ────────────────────────────────────────── */}
        {indentationLevel === 1 ? (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 py-1 px-2">{card.sourceDisplayName}</p>
        ) : (
        <div className={`flex items-start justify-between gap-4 px-5 py-4 rounded-t-xl ${
          card.type === GeneratedContentItemType.GeoOptimized
            ? 'bg-gray-100 dark:bg-gray-800'
            : isPrimary
              ? 'bg-orange-500 dark:bg-orange-600'
              : 'bg-[#6B7280] dark:bg-[#6B7280]'
        }`}>
          {/* Left: title + meta */}
          <div className="min-w-0">
            <h2 className={`text-base font-semibold flex items-center flex-wrap gap-2 leading-snug ${
              card.type === GeneratedContentItemType.GeoOptimized
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-white'
            }`}>
              <span>{card.sourceDisplayName || card.type}</span>
              {card.type === GeneratedContentItemType.Boosted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  <Zap size={11} />
                  Boosted
                </span>
              )}
              {isBestVersion && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white/20 text-white border border-white/30">
                  ⭐ Best Version
                </span>
              )}
              {card.persona && (
                <span className={`text-sm font-normal ${card.type === GeneratedContentItemType.GeoOptimized ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`}>
                  ({card.persona}'s Voice)
                </span>
              )}
              {card.brandVoiceName && (
                <span className={`text-sm font-normal ${card.type === GeneratedContentItemType.GeoOptimized ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`}>
                  [Brand Voice: {card.brandVoiceName}]
                </span>
              )}
              {indentationLevel > 0 && (
                <span className={`text-xs ${card.type === GeneratedContentItemType.GeoOptimized ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`}>↳ derived from above</span>
              )}
            </h2>
            {card.blendInstructions && (
              <div className={`text-xs mt-0.5 italic ${card.type === GeneratedContentItemType.GeoOptimized ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`}>
                Special Instructions: {card.blendInstructions}
              </div>
            )}
            {card.modificationInstruction && (
              <div className={`text-xs mt-0.5 italic ${card.type === GeneratedContentItemType.GeoOptimized ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`}>
                Modification: {card.modificationInstruction}
              </div>
            )}
            <div className={`text-xs flex items-center gap-1.5 mt-1 flex-wrap ${card.type === GeneratedContentItemType.GeoOptimized ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`}>
              {!contentDetails.isHeadlines && card.type !== GeneratedContentItemType.GeoOptimized && (
                <>
                  <span>{contentDetails.wordCount} words</span>
                  {targetWordCount && (
                    <>
                      <span className="opacity-50">|</span>
                      <span>Target: {targetWordCount}</span>
                    </>
                  )}
                  {getWordCountInfo && (
                    <>
                      <span className="opacity-50">|</span>
                      <span>{getWordCountInfo.message}</span>
                    </>
                  )}
                  {contentDetails.wordCountAccuracy !== undefined && (
                    <>
                      <span className="opacity-50">|</span>
                      <span>Accuracy: {contentDetails.wordCountAccuracy}/100</span>
                    </>
                  )}
                  {contentDetails.text && (() => {
                    const { readingLevel } = computeWordCountAndReadingLevel(contentDetails.text);
                    return (
                      <>
                        <span className="opacity-50">|</span>
                        <span>{readingLevel}</span>
                      </>
                    );
                  })()}
                </>
              )}
              {contentDetails.isSeoMetadata && <span>SEO Elements Generated</span>}
            </div>
          </div>

          {/* Right: dual score badges */}
          <div className="flex-shrink-0 self-start mt-0.5">
            <DualScoreRow
              sessionScore={cardFinalScore}
              absoluteScore={card.absoluteScore}
            />
          </div>

        </div>
        )}

        {/* ── Card body ─────────────────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-b-xl">

      {/* ── Primary content ───────────────────────────────────── */}
      <div className="mb-6">
        <div className="space-y-5">
          {/* Render structured content if available */}
          {contentDetails.isStructured && contentDetails.structuredContent && (
            <div className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-100 dark:border-gray-700 leading-relaxed text-sm">
              <FormattedContent content={card.content} className="text-gray-700 dark:text-gray-300" />
            </div>
          )}
          
          {/* Render plain text content if not structured and not SEO metadata */}
          {!contentDetails.isStructured && card.type !== GeneratedContentItemType.SeoMetadata && (
            <div className={`bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-100 dark:border-gray-700 ${
              contentDetails.isFaqJson
                ? 'text-gray-700 dark:text-gray-300 font-mono text-sm overflow-x-auto'
                : 'text-gray-700 dark:text-gray-300 text-sm leading-relaxed'
            }`}>
              {contentDetails.isFaqJson ? (
                <pre className="whitespace-pre overflow-x-auto">
                  <code>{contentDetails.text}</code>
                </pre>
              ) : (card.sourceDisplayName?.includes('Analysis') || card.sourceDisplayName?.includes('Comparison')) ? (
                <>
                  {/* Display comparison analysis */}
                  {(() => {
                    // Check if this is the first comparison/analysis card
                    const allComparisonCards = allCards.filter(c =>
                      c.sourceDisplayName?.includes('Analysis') || c.sourceDisplayName?.includes('Comparison')
                    );
                    const isFirstComparisonCard = allComparisonCards.length > 0 && allComparisonCards[0].id === card.id;

                    console.log('ComparisonCard Debug:', {
                      cardId: card.id,
                      sourceDisplayName: card.sourceDisplayName,
                      totalComparisonCards: allComparisonCards.length,
                      isFirstComparisonCard,
                      allComparisonCardIds: allComparisonCards.map(c => ({ id: c.id, name: c.sourceDisplayName }))
                    });

                    // If this is NOT the first comparison card, skip rendering (table will be shown in first card)
                    if (!isFirstComparisonCard) {
                      console.log('Hiding non-first comparison card:', card.id);
                      return null;
                    }

                    // Collect all OTHER comparison contents for merging
                    const otherComparisonContents = allCards
                      .filter(c =>
                        (c.sourceDisplayName?.includes('Analysis') || c.sourceDisplayName?.includes('Comparison')) &&
                        c.id !== card.id && // Exclude current card
                        typeof c.content === 'string' // Ensure it's a string content
                      )
                      .map(c => typeof c.content === 'string' ? c.content : '')
                      .filter(content => content.trim() !== '');

                    console.log('ComparisonTable will merge:', {
                      currentCardId: card.id,
                      otherContentsCount: otherComparisonContents.length
                    });

                    return (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            AI Analysis Summary{isAdmin && card.analysisModel ? ` (${card.analysisModel === 'gpt-4o' ? 'GPT-4o' : 'DeepSeek'})` : ''}:
                          </h4>
                          {onBlendVersions && (
                            <Button
                              onClick={() => onBlendVersions(contentDetails.originalText || contentDetails.text)}
                              disabled={isBlending}
                              className="flex items-center gap-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 border-2 border-gray-900 dark:border-gray-50 hover:bg-gray-800 dark:hover:bg-gray-200"
                              size="sm"
                            >
                              {isBlending ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                      <linearGradient id="spinnerGradientGCC" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ff6b35" />
                                        <stop offset="100%" stopColor="#ffa07a" />
                                      </linearGradient>
                                    </defs>
                                    <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientGCC)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90, 150" />
                                  </svg>
                                  Blending...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-4 h-4" />
                                  Blend Versions
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <ComparisonTable
                          content={contentDetails.originalText || contentDetails.text}
                          cards={allCards}
                          allComparisonContents={otherComparisonContents}
                        />
                      </div>
                    );
                  })()}
                </>
              ) : (
                <FormattedContent content={card.content} className="text-gray-700 dark:text-gray-300" />
              )}
            </div>
          )}
          
          {/* FAQ Schema */}
          {card.faqSchema && Object.keys(card.faqSchema).length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                <Code size={14} className="text-gray-400 dark:text-gray-500" strokeWidth={2} />
                FAQ Schema
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre overflow-x-auto">
                  <code>{JSON.stringify(card.faqSchema, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content Quality Score ─────────────────────────────── */}
      {cardScore && (
        <div className="mt-4 ml-6 pl-3 border-l-2 border-orange-400 space-y-4">
          <div className="flex items-center justify-between pt-3 pb-1">
            <h3 className="text-xs font-semibold text-orange-500 dark:text-orange-400 flex items-center gap-1.5">
              <BookCheck size={12} className="text-orange-500 dark:text-orange-400" strokeWidth={2} />
              Content Quality Score
            </h3>
            <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
              {cardScore.overall}<span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 ml-0.5">/100</span>
            </span>
          </div>

          {/* Why it's improved */}
          {cardScore.improvementExplanation && (
            <div className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Why it's improved</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                {cardScore.improvementExplanation}
              </p>
            </div>
          )}

          {/* Score Breakdown */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Score Breakdown</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
                  <span className="font-medium text-gray-700 dark:text-white">Clarity</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm pl-6 leading-relaxed">{cardScore.clarity}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
                  <span className="font-medium text-gray-700 dark:text-white">Persuasiveness</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm pl-6 leading-relaxed">{cardScore.persuasiveness}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
                  <span className="font-medium text-gray-700 dark:text-white">Tone Match</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm pl-6 leading-relaxed">{cardScore.toneMatch}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
                  <span className="font-medium text-gray-700 dark:text-white">Engagement</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm pl-6 leading-relaxed">{cardScore.engagement}</p>
              </div>

              {/* Add Word Count Accuracy if provided */}
              {cardScore.wordCountAccuracy !== undefined && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
                    <span className="font-medium text-gray-700 dark:text-white">Word Count Accuracy</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm pl-6">
                    {cardScore.wordCountAccuracy}/100 - {
                      cardScore.wordCountAccuracy >= 90
                        ? 'Excellent match with target word count'
                        : cardScore.wordCountAccuracy >= 75
                          ? 'Good match with target word count'
                          : cardScore.wordCountAccuracy >= 60
                            ? 'Acceptable match with target word count'
                            : 'Significant deviation from target word count'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Optimization Suggestions */}
          {cardScore.overall < 95 && cardScore.suggestions && cardScore.suggestions.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded border border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Optimization Suggestions</p>
              <ul className="space-y-1">
                {cardScore.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex">
                    <span className="text-gray-500 mr-1.5">•</span>
                    <span className="text-sm text-gray-800 dark:text-gray-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}


      {/* ── GEO Score ─────────────────────────────────────────── */}
      {cardGeoScore && (
        <div className="mt-4 ml-6 pl-3 border-l-2 border-orange-400 space-y-4">
          <div className="flex items-center justify-between pt-3 pb-1">
            <h3 className="text-xs font-semibold text-orange-500 dark:text-orange-400 flex items-center gap-1.5">
              <MapPin size={12} className="text-orange-500 dark:text-orange-400" strokeWidth={2} />
              GEO Score
            </h3>
            <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
              {cardGeoScore.overall}<span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 ml-0.5">/100</span>
              {cardGeoScore.overall > 0 && (
                <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 ml-1">
                  — {getScoreLabel(cardGeoScore.overall)}
                </span>
              )}
            </span>
          </div>

          {/* GEO Score Breakdown */}
          {cardGeoScore.breakdown && cardGeoScore.breakdown.length > 0 && (
            <div className="mb-3 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Score Breakdown</p>
              {cardGeoScore.breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        item.detected ? 'bg-gray-600' : 'bg-gray-400'
                      }`}></span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.criterion}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-4">{item.explanation}</p>
                  </div>
                  <div className="ml-2">
                    <span className={`text-sm font-bold ${
                      item.score >= 15 ? 'text-gray-600 dark:text-gray-400' :
                      item.score >= 10 ? 'text-gray-500 dark:text-gray-400' :
                      'text-gray-600 dark:text-gray-500'
                    }`}>
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GEO Optimization Suggestions */}
          {cardGeoScore.overall < 80 && cardGeoScore.suggestions && cardGeoScore.suggestions.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded border border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">GEO Optimization Suggestions</p>
              <ul className="space-y-1">
                {cardGeoScore.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex">
                    <span className="text-gray-500 mr-1.5">•</span>
                    <span className="text-sm text-gray-800 dark:text-gray-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}


      {/* ── SEO Metadata ──────────────────────────────────────── */}
      {cardSeoMetadata && (
        <div className="mt-4 ml-6 pl-3 border-l-2 border-orange-400 space-y-4">
          <h3 className="text-xs font-semibold text-orange-500 dark:text-orange-400 flex items-center gap-1.5 pt-3 pb-1">
            <Globe size={12} className="text-orange-500 dark:text-orange-400" strokeWidth={2} />
            SEO Metadata
          </h3>

          {/* URL Slugs */}
          {cardSeoMetadata.urlSlugs && cardSeoMetadata.urlSlugs.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">URL Slugs</h4>
              <div className="space-y-2">
                {cardSeoMetadata.urlSlugs.map((slug, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <code className="text-sm text-gray-700 dark:text-gray-300">{slug}</code>
                    <CharacterCounter text={slug} maxLength={60} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta Descriptions */}
          {cardSeoMetadata.metaDescriptions && cardSeoMetadata.metaDescriptions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Meta Descriptions</h4>
              <div className="space-y-2">
                {cardSeoMetadata.metaDescriptions.map((desc, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{desc}</p>
                    <CharacterCounter text={desc} maxLength={160} targetMinLength={155} targetMaxLength={160} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* H1 Variants */}
          {cardSeoMetadata.h1Variants && cardSeoMetadata.h1Variants.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">H1 (Page Titles)</h4>
              <div className="space-y-2">
                {cardSeoMetadata.h1Variants.map((h1, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{h1}</span>
                    <CharacterCounter text={h1} maxLength={60} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* H2 Headings */}
          {cardSeoMetadata.h2Headings && cardSeoMetadata.h2Headings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">H2 Headings</h4>
              <div className="space-y-2">
                {cardSeoMetadata.h2Headings.map((h2, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{h2}</span>
                    <CharacterCounter text={h2} maxLength={70} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* H3 Headings */}
          {cardSeoMetadata.h3Headings && cardSeoMetadata.h3Headings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">H3 Headings</h4>
              <div className="space-y-2">
                {cardSeoMetadata.h3Headings.map((h3, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{h3}</span>
                    <CharacterCounter text={h3} maxLength={70} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OG Titles */}
          {cardSeoMetadata.ogTitles && cardSeoMetadata.ogTitles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Open Graph Titles</h4>
              <div className="space-y-2">
                {cardSeoMetadata.ogTitles.map((ogTitle, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ogTitle}</span>
                    <CharacterCounter text={ogTitle} maxLength={60} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OG Descriptions */}
          {cardSeoMetadata.ogDescriptions && cardSeoMetadata.ogDescriptions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Open Graph Descriptions</h4>
              <div className="space-y-2">
                {cardSeoMetadata.ogDescriptions.map((ogDesc, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{ogDesc}</p>
                    <CharacterCounter text={ogDesc} maxLength={110} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* On-Demand SEO Element Generation Buttons */}
          {card.seoGenerationOptions && (
            <OnDemandSeoButtons
              seoOptions={{
                urlSlugsEnabled: card.seoGenerationOptions.urlSlugsEnabled,
                numUrlSlugs: 3,
                metaDescriptionsEnabled: card.seoGenerationOptions.metaDescriptionsEnabled,
                numMetaDescriptions: 3,
                h1VariantsEnabled: card.seoGenerationOptions.h1VariantsEnabled,
                numH1Variants: 3,
                h2HeadingsEnabled: card.seoGenerationOptions.h2HeadingsEnabled,
                numH2Headings: 5,
                h3HeadingsEnabled: card.seoGenerationOptions.h3HeadingsEnabled,
                numH3Headings: 5,
                ogTitlesEnabled: card.seoGenerationOptions.ogTitlesEnabled,
                numOgTitles: 3,
                ogDescriptionsEnabled: card.seoGenerationOptions.ogDescriptionsEnabled,
                numOgDescriptions: 3
              }}
              currentSeoMetadata={cardSeoMetadata}
              onGenerateSeoElement={handleGenerateIndividualSeoElement}
              isGenerating={isGeneratingIndividualSeoElement}
              generatingElementType={generatingElementType}
            />
          )}
        </div>
      )}

      {/* ── GEO Package ───────────────────────────────────────── */}
      {geoPackage && (
        <div className="mt-4 ml-6 pl-3 border-l-2 border-orange-400 space-y-4">
          <h3 className="text-xs font-semibold text-orange-500 dark:text-orange-400 flex items-center gap-1.5 pt-3 pb-1">
            <Globe size={12} className="text-orange-500 dark:text-orange-400" strokeWidth={2} />
            GEO Package
          </h3>
          <FormattedContent content={typeof geoPackage.content === 'string' ? geoPackage.content : ''} className="text-gray-700 dark:text-gray-300" />
        </div>
      )}

      {false && recommendation && card.type !== GeneratedContentItemType.Original &&
       !(card.sourceDisplayName?.includes('Analysis') || card.sourceDisplayName?.includes('Comparison')) && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          💡 {recommendation}
        </p>
      )}

      {/* Action Buttons — removed; actions are handled exclusively through the sidebar */}
      {false && card.type !== GeneratedContentItemType.Original &&
       !(card.sourceDisplayName?.includes('Analysis') || card.sourceDisplayName?.includes('Comparison')) &&
       (showAlternativeButton || showVoiceButton || showFaqSchemaButton || true) && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-5 mt-2">
          <div className="space-y-4">
            {/* Unified Action Bar */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-3">
                Refine or explore this version
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {/* New Version — primary emphasis */}
                {showAlternativeButton && (
                  <button
                    type="button"
                    onClick={onCreateAlternative}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <Wand2 size={12} strokeWidth={2} />
                    New Version
                  </button>
                )}

                {/* Separator between primary and refinement group */}
                {showAlternativeButton && (
                  <span className="w-px h-4 bg-gray-200 dark:border-gray-700 flex-shrink-0" />
                )}

                {/* Improve */}
                <button
                  type="button"
                  onClick={() => setOpenPanel(openPanel === 'rewrite' ? null : 'rewrite')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    openPanel === 'rewrite'
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Edit size={12} strokeWidth={2} />
                  Improve
                </button>

                {/* Change Voice */}
                {!contentDetails.isHeadlines && (
                  <button
                    type="button"
                    onClick={() => setOpenPanel(openPanel === 'tone' ? null : 'tone')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      openPanel === 'tone'
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Sparkles size={12} strokeWidth={2} />
                    Change Voice
                  </button>
                )}

                {/* Enhance */}
                {showBoostButton && (
                  <Tooltip content={boostTooltip}>
                    <button
                      type="button"
                      onClick={onPerformanceBoost}
                      disabled={boostDisabled}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        boostDisabled
                          ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Zap size={12} strokeWidth={2} />
                      Enhance
                    </button>
                  </Tooltip>
                )}

                {/* Separator - hidden with Merge button */}
                {false && onBlendVersions && (
                  <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />
                )}

                {false && onBlendVersions && (
                  <button
                    type="button"
                    onClick={() => onBlendVersions(contentDetails.originalText || contentDetails.text)}
                    disabled={isBlending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40"
                  >
                    {isBlending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    {isBlending ? 'Merging...' : 'Merge'}
                  </button>
                )}
              </div>

            </div>

            {/* Add to Comparison Button */}
            {comparisonResult && onAddToComparison && versionScores && !versionScores[card.id] && (
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddToComparison(card)}
                  className="h-auto w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  disabled={formState.isLoading}
                >
                  <Sparkles size={16} className="mr-2" />
                  {formState.isLoading ? 'Adding...' : 'Add to comparison'}
                </Button>
              </div>
            )}

            {/* FAQ Schema Button - hidden */}
            {false && showFaqSchemaButton && (
              <div>
                <Tooltip content="Generate FAQPage Schema (JSON-LD) from this content">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateFaqSchema(contentDetails.text)}
                    className="w-full"
                  >
                    <Code size={16} className="mr-2" />
                    Generate FAQPage Schema (JSON-LD)
                  </Button>
                </Tooltip>
              </div>
            )}

            {/* Generate Buttons Row - SEO, Content Score, GEO Score, and Generate All */}
            {/* Show on-demand buttons for features that were NOT auto-generated in batch mode */}
            {(() => {
              // Determine which features should show on-demand buttons
              // Show button if: (not auto-generated OR not in batch mode) AND data doesn't exist
              // Special case: Blended outputs always show all buttons since they're fresh content
              const isBlendedOutput = !!card.blendInstructions;

              const showSeoButton = !cardSeoMetadata && (isBlendedOutput || !formState.generateSeoMetadata || card.analysisMode !== 'batch');
              const showContentScoreButton = !cardScore && (isBlendedOutput || !formState.generateScores || card.analysisMode !== 'batch');
              const showGeoScoreButton = !cardGeoScore && (isBlendedOutput || !formState.generateGeoScore || card.analysisMode !== 'batch');

              const hasAnyButton = showSeoButton || showContentScoreButton || showGeoScoreButton;

              if (!hasAnyButton) return null;

              const missingCount = [showSeoButton, showContentScoreButton, showGeoScoreButton].filter(Boolean).length;
              const isGeneratingAny = isGeneratingSeoMetadata || isGeneratingContentScore || isGeneratingGeoScore;

              return (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">
                    Analyze this version
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {missingCount >= 2 && (
                      <>
                        <Tooltip content="Generate SEO Metadata, Content Score, and GEO Score all at once">
                          <button
                            type="button"
                            onClick={handleGenerateAll}
                            disabled={isGeneratingAny}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isGeneratingAny ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Generating All...
                              </>
                            ) : (
                              <>
                                <Sparkles size={12} strokeWidth={2} />
                                All Analyses
                              </>
                            )}
                          </button>
                        </Tooltip>
                        <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                      </>
                    )}

                    {showSeoButton && (
                      <Tooltip content="Generate SEO metadata for this content (URL slugs, meta descriptions, headings, OG tags)">
                        <button
                          type="button"
                          onClick={handleOpenSeoOptionsModal}
                          disabled={isGeneratingSeoMetadata}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isGeneratingSeoMetadata ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} strokeWidth={2} />}
                          {isGeneratingSeoMetadata ? 'Generating...' : 'SEO'}
                        </button>
                      </Tooltip>
                    )}

                    {showContentScoreButton && (
                      <Tooltip content="Evaluates content quality including clarity, persuasiveness, tone match, and engagement">
                        <button
                          type="button"
                          onClick={handleGenerateContentScore}
                          disabled={isGeneratingContentScore}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isGeneratingContentScore ? <Loader2 size={12} className="animate-spin" /> : <BookCheck size={12} strokeWidth={2} />}
                          {isGeneratingContentScore ? 'Generating...' : 'Content'}
                        </button>
                      </Tooltip>
                    )}

                    {showGeoScoreButton && (
                      <Tooltip content="Evaluates how well content is optimized for AI assistants and geographical visibility (Generative Engine Optimization)">
                        <button
                          type="button"
                          onClick={handleGenerateGeoScore}
                          disabled={isGeneratingGeoScore}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isGeneratingGeoScore ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} strokeWidth={2} />}
                          {isGeneratingGeoScore ? 'Generating...' : 'GEO'}
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modify Suggestions Modal */}
      {isModifySuggestionsModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setIsModifySuggestionsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden animate-slideUp flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Modify Content Suggestions</h2>
              <button
                onClick={() => setIsModifySuggestionsModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Search - only show when not loading and has suggestions */}
            {!isLoadingModifySuggestions && Object.keys(modifySuggestions).length > 0 && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search suggestions..."
                    value={modifySearchQuery}
                    onChange={(e) => setModifySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingModifySuggestions ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={48} className="text-primary-600 dark:text-primary-500 animate-spin mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Generating suggestions...</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">AI is analyzing your content</p>
                </div>
              ) : Object.keys(filteredModifySuggestions).length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {modifySearchQuery ? `No suggestions found matching "${modifySearchQuery}"` : 'No suggestions available'}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(filteredModifySuggestions).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3">{category}</h3>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <button
                            key={`${category}-${index}`}
                            onClick={() => handleModifySuggestionClick(item)}
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => setIsModifySuggestionsModalOpen(false)}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                {isLoadingModifySuggestions ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-md w-full overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Output</h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete this output? This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                No, Keep It
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete?.();
                }}
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-colors duration-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Style Modal */}
      {isVoiceStyleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Apply Voice Style: {selectedPersona}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Instructions (Optional)
              </label>
              <textarea
                value={voiceStyleInstructions}
                onChange={(e) => setVoiceStyleInstructions(e.target.value)}
                placeholder="e.g., Make it more casual, add humor, focus on benefits..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px] resize-y"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                These instructions will be applied along with the voice style
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsVoiceStyleModalOpen(false);
                  setVoiceStyleInstructions('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVoiceStyle}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center"
              >
                <Sparkles size={16} className="mr-2" />
                Apply Voice Style
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEO Generation Options Modal */}
      <SeoGenerationOptionsModal
        isOpen={isSeoOptionsModalOpen}
        onClose={() => setIsSeoOptionsModalOpen(false)}
        onConfirm={handleGenerateSeoMetadata}
        defaultValues={{
          numUrlSlugs: formState.numUrlSlugs || 3,
          numMetaDescriptions: formState.numMetaDescriptions || 3,
          numH1Variants: formState.numH1Variants || 3,
          numH2Headings: formState.numH2Variants || 5,
          numH3Headings: formState.numH3Variants || 5,
          numOgTitles: formState.numOgTitles || 3,
          numOgDescriptions: formState.numOgDescriptions || 3,
        }}
      />

      {/* SEO Processing Modal */}
      <ProcessingModal
        isOpen={showSeoProcessingModal}
        message="Generating SEO Metadata"
        onCancel={handleCancelSeoGeneration}
      />

      {/* GEO Processing Modal */}
      <ProcessingModal
        isOpen={showGeoProcessingModal}
        message="Generating GEO Score"
        onCancel={handleCancelGeoGeneration}
      />

      {/* Content Score Processing Modal */}
      <ProcessingModal
        isOpen={showContentScoreProcessingModal}
        message="Generating Content Score"
        onCancel={handleCancelContentScoreGeneration}
      />

        </div>
      </div>

      {/* ── Improve panel ── */}
      {openPanel === 'rewrite' && (
        <>
          {/* Backdrop: z-50 */}
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setOpenPanel(null)}
          />
          {/* Panel: z-60 so it paints above the backdrop */}
          <div className="fixed bottom-4 left-0 right-0 z-60 px-4 sm:px-6 flex justify-center">
            <div
              className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Rewrite instructions</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsModifySuggestionsModalOpen(true)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="Get suggestions"
                    >
                      <Lightbulb size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenPanel(null)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <textarea
                    autoFocus
                    value={modificationInstruction}
                    onChange={(e) => setModificationInstruction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey && modificationInstruction.trim()) {
                        handleModifyContent();
                        setOpenPanel(null);
                      }
                    }}
                    placeholder="e.g., make shorter and more friendly, add more benefits, change tone to casual..."
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-3 resize-none"
                    rows={4}
                  />
                  <Button
                    onClick={() => { handleModifyContent(); setOpenPanel(null); }}
                    disabled={!modificationInstruction.trim()}
                    className="h-auto self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <Edit size={12} />
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Change Voice panel ── */}
      {openPanel === 'tone' && !contentDetails.isHeadlines && (
        <>
          {/* Backdrop: z-50 */}
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setOpenPanel(null)}
          />
          {/* Panel: z-60 so it paints above the backdrop */}
          <div className="fixed bottom-4 left-0 right-0 z-60 px-4 sm:px-6 flex justify-center">
            <div
              className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Voice style</span>
                  <button
                    type="button"
                    onClick={() => setOpenPanel(null)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
                  >
                    <option value="">Select a voice style...</option>
                    {CATEGORIZED_VOICE_STYLES.map(category => (
                      <optgroup key={category.category} label={category.category}>
                        {category.options.map((voiceOption) => (
                          <option key={voiceOption.value} value={voiceOption.value}>
                            {voiceOption.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <Tooltip content={`Apply ${selectedPersona || 'selected'} voice style`}>
                    <Button
                      onClick={() => { handleApplyVoice(); }}
                      disabled={!selectedPersona}
                      className="h-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <Sparkles size={12} />
                      Apply
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default GeneratedCopyCard;