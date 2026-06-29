import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Save, FileText, Code, FileCode, Sparkles, FlaskConical, CheckCircle2, BookmarkPlus, ChevronDown, ChevronRight, Wand2, CreditCard as Edit, Zap, Globe, BookCheck, MapPin, Copy, Check, BookOpen, PanelRight, X, Trash2, RefreshCw, GitMerge, File as FileEdit, Rocket, PenLine, Camera, LayoutDashboard, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserSavedOutputsMeta, getUserCopySessions } from '../../services/supabaseClient';
import { toast } from 'react-hot-toast';

import {
  FormState,
  GeneratedContentItem,
  GeneratedContentItemType,
  GeoGenerateElement,
  User,
  VersionDeepAnalysis,
  ComparisonDeepAnalysisMeta,
  MAX_BOOST_ITERATIONS,
  MAX_BOOST_SCORE_THRESHOLD,
} from '../../types';
import { CATEGORIZED_VOICE_STYLES } from '../../constants';
import { ComparisonResult } from '../../services/api/comprehensiveScoring';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useActiveCard } from '../../hooks/useActiveCard';
import {
  formatAsEnhancedMarkdown,
  exportAsFormattedHtml,
  exportLLMEvaluationMarkdown,
  exportLLMEvaluationAudit,
} from '../../utils/enhancedExports';
import {
  formatSingleGeneratedItemContentAsHTML,
  formatSingleGeneratedItemAsMarkdown,
  markdownToHtml,
} from '../../utils/copyFormatter';
import { stripMarkdown } from '../../utils/markdownUtils';
import { getScoreLabel } from '../../utils/scoreColors';
import ReactDOM from 'react-dom';
import ProcessingModal from '../ProcessingModal';
import SeoGenerationOptionsModal, { SeoGenerationOptions } from '../SeoGenerationOptionsModal';
import { generateSeoMetadata } from '../../services/api/seoGeneration';
import { calculateGeoScore } from '../../services/api/geoScoring';
import { generateContentScores } from '../../services/api/contentScoring';
import { generateGeoContent } from '../../services/api/geoGeneration';
import { calculateTargetWordCount } from '../../services/api/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CopyMakerSidebarProps {
  // Session section
  formState: FormState;
  hasPopulatedFields: boolean;
  onSaveSession?: () => void;
  onSaveTemplate?: () => void;
  onEvaluateInputs?: () => void;
  isEvaluating?: boolean;

  // Output section
  currentUser?: User;
  generatedOutputCards: GeneratedContentItem[];
  originalInputScore?: any;
  onSaveOutput: () => void;
  onViewPrompts: () => void;
  onGenerateFaqSchema: () => void;
  comparisonResult?: ComparisonResult | null;
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>;
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta;
  loadingVersionIds?: Set<string>;

  // Per-card actions
  sortedGeneratedVersions: GeneratedContentItem[];
  onAlternative: (item: GeneratedContentItem) => void;
  onRestyle: (item: GeneratedContentItem, persona: string, instructions?: string) => void;
  onScore: (item: GeneratedContentItem) => void;
  onModify: (item: GeneratedContentItem, instruction: string) => void;
  onDelete: (item: GeneratedContentItem) => void;
  onSaveAsBrandVoice?: (content: string) => void;
  onBoost?: (item: GeneratedContentItem) => void;
  onAddToComparison?: (card: GeneratedContentItem) => void;
  onUpdateCard?: (cardId: string, updates: Partial<GeneratedContentItem>) => void;
  onAddCards?: (items: GeneratedContentItem[], afterCardId?: string) => void;
  onCompareWithGrok?: (isIncremental?: boolean, scoringContext?: import('../../types').ScoringContext) => void;
  onBlendVersions?: () => void;
  isBlending?: boolean;
  onGenerateBestElements?: () => void;
  isGeneratingBestElements?: boolean;
  targetWordCount: number;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2.5 py-1 text-[9px] font-normal uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      <span>{label}</span>
      {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
    </button>
  );
}

function SubSectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-0.5 text-[8px] font-normal uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      <span>{label}</span>
      {open ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
    </button>
  );
}

function SidebarBtn({
  onClick,
  disabled,
  title,
  children,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-full flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-normal transition-colors text-left
        ${active
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
          : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
        }
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

// ─── Improve Modal ────────────────────────────────────────────────────────────

interface ImproveModalProps {
  copyName: string;
  onApply: (instruction: string) => void;
  onClose: () => void;
}

const ImproveModal: React.FC<ImproveModalProps> = ({ copyName, onApply, onClose }) => {
  const [instruction, setInstruction] = useState('');

  const handleApply = () => {
    if (!instruction.trim()) return;
    onApply(instruction.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={e => { e.preventDefault(); onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md mx-4 p-6"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Improve this copy</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">{copyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <textarea
          rows={5}
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder="Describe how to improve this copy…"
          autoFocus
          className="w-full text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500"
        />
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleApply}
            disabled={!instruction.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Change Voice Modal ───────────────────────────────────────────────────────

interface VoiceModalProps {
  copyName: string;
  onApply: (persona: string, instructions?: string) => void;
  onClose: () => void;
}

const VoiceModal: React.FC<VoiceModalProps> = ({ copyName, onApply, onClose }) => {
  const [selectedPersona, setSelectedPersona] = useState('');
  const [voiceInstructions, setVoiceInstructions] = useState('');

  const handleApply = () => {
    if (!selectedPersona) return;
    onApply(selectedPersona, voiceInstructions || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={e => { e.preventDefault(); onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md mx-4 p-6"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Change Voice</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">{copyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <select
          value={selectedPersona}
          onChange={e => setSelectedPersona(e.target.value)}
          className="w-full text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 mb-3"
        >
          <option value="">Select a voice…</option>
          {CATEGORIZED_VOICE_STYLES.map(group => (
            <optgroup key={group.category} label={group.category}>
              {group.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <textarea
          rows={3}
          value={voiceInstructions}
          onChange={e => setVoiceInstructions(e.target.value)}
          placeholder="Optional: additional instructions…"
          className="w-full text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500"
        />
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedPersona}
            className="flex-1 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Per-card sub-sections ────────────────────────────────────────────────────

interface CardActionsProps {
  card: GeneratedContentItem;
  formState: FormState;
  allCards: GeneratedContentItem[];
  comparisonResult?: ComparisonResult | null;
  versionScores?: any;
  onAlternative: () => void;
  onScore: () => void;
  onModify: (item: GeneratedContentItem, instruction: string) => void;
  onRestyle: (item: GeneratedContentItem, persona: string, instructions?: string) => void;
  onSaveAsBrandVoice?: (content: string) => void;
  onBoost?: () => void;
  targetWordCount: number;
  currentUser?: User;
  isBlending?: boolean;
  onUpdateCard?: (cardId: string, updates: Partial<GeneratedContentItem>) => void;
  onAddCards?: (items: GeneratedContentItem[], afterCardId?: string) => void;
}

const CardActions: React.FC<CardActionsProps> = ({
  card,
  formState,
  allCards,
  comparisonResult,
  versionScores,
  onAlternative,
  onScore,
  onModify,
  onRestyle,
  onSaveAsBrandVoice,
  onBoost,
  targetWordCount,
  currentUser,
  isBlending,
  onUpdateCard,
  onAddCards,
}) => {
  // All sub-sections collapsed by default
  const [openCreate, setOpenCreate] = useState(false);
  const [openGenerate, setOpenGenerate] = useState(false);
  const [openAnalyze, setOpenAnalyze] = useState(false);
  const [openCopy, setOpenCopy] = useState(false);

  // SEO analysis state — mirrors GeneratedCopyCard exactly
  const [isGeneratingSeoMetadata, setIsGeneratingSeoMetadata] = useState(false);
  const [showSeoProcessingModal, setShowSeoProcessingModal] = useState(false);
  const [showSeoOptionsModal, setShowSeoOptionsModal] = useState(false);
  const seoAbortControllerRef = useRef<AbortController | null>(null);

  // Content score state
  const [isGeneratingContentScore, setIsGeneratingContentScore] = useState(false);
  const [showContentScoreProcessingModal, setShowContentScoreProcessingModal] = useState(false);
  const contentScoreAbortControllerRef = useRef<AbortController | null>(null);

  // GEO score state
  const [isGeneratingGeoScore, setIsGeneratingGeoScore] = useState(false);
  const [showGeoProcessingModal, setShowGeoProcessingModal] = useState(false);
  const geoAbortControllerRef = useRef<AbortController | null>(null);

  // GEO Generate modal state
  const [showGeoGenerateModal, setShowGeoGenerateModal] = useState(false);
  const [isGeneratingGeo, setIsGeneratingGeo] = useState(false);
  const ALL_GEO_ELEMENTS: GeoGenerateElement[] = [
    'tldr', 'faq', 'questionHeadings', 'bulletSummary',
    'authoritySnippets', 'quoteReady', 'localVariations',
  ];
  const GEO_ELEMENT_LABELS: Record<GeoGenerateElement, string> = {
    tldr: 'TL;DR / Answer Box',
    faq: 'FAQ Block',
    questionHeadings: 'Question-Based Headings',
    bulletSummary: 'Bullet Point Summary',
    authoritySnippets: 'Authority Snippets',
    quoteReady: 'Quote-Ready Sentences',
    localVariations: 'Local Signal Variations',
  };
  const [geoSelectedElements, setGeoSelectedElements] = useState<GeoGenerateElement[]>(ALL_GEO_ELEMENTS);
  const [geoTargetRegions, setGeoTargetRegions] = useState('');

  const handleGeoGenerateRun = async () => {
    if (!currentUser) { toast.error('Please log in to use GEO Generate'); return; }
    if (geoSelectedElements.length === 0) { toast.error('Select at least one element'); return; }
    setShowGeoGenerateModal(false);
    setIsGeneratingGeo(true);
    try {
      const items = await generateGeoContent({
        sourceCard: card,
        selectedElements: geoSelectedElements,
        targetRegions: geoTargetRegions.trim() || undefined,
        formState,
        currentUser,
        sessionId: formState.sessionId,
      });
      if (onAddCards) onAddCards(items, card.id);
      toast.success(`${items.length} GEO element${items.length !== 1 ? 's' : ''} generated`);
    } catch (err: any) {
      toast.error('GEO Generate failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setIsGeneratingGeo(false);
    }
  };

  const handleGenerateSeoMetadata = async (options: SeoGenerationOptions) => {
    if (!currentUser) { toast.error('Please log in to generate SEO metadata'); return; }
    setIsGeneratingSeoMetadata(true);
    setShowSeoProcessingModal(true);
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
      const metadata = await generateSeoMetadata(card.content, customFormState, currentUser, undefined, formState.sessionId, options);
      if (!seoAbortControllerRef.current?.signal.aborted) {
        if (onUpdateCard) {
          onUpdateCard(card.id, {
            seoMetadata: metadata,
            seoGenerationOptions: {
              urlSlugsEnabled: options.urlSlugsEnabled,
              metaDescriptionsEnabled: options.metaDescriptionsEnabled,
              h1VariantsEnabled: options.h1VariantsEnabled,
              h2HeadingsEnabled: options.h2HeadingsEnabled,
              h3HeadingsEnabled: options.h3HeadingsEnabled,
              ogTitlesEnabled: options.ogTitlesEnabled,
              ogDescriptionsEnabled: options.ogDescriptionsEnabled,
            },
          });
        }
        toast.success('SEO metadata generated successfully');
      }
    } catch (error: any) {
      if (!seoAbortControllerRef.current?.signal.aborted) {
        toast.error('Failed to generate SEO metadata: ' + (error?.message ?? 'Unknown error'));
      }
    } finally {
      setIsGeneratingSeoMetadata(false);
      setShowSeoProcessingModal(false);
      seoAbortControllerRef.current = null;
    }
  };

  const handleSeoOptionsConfirm = (options: SeoGenerationOptions) => {
    setShowSeoOptionsModal(false);
    handleGenerateSeoMetadata(options);
  };

  const handleGenerateContentScore = async () => {
    if (!currentUser) { toast.error('Please log in to generate content score'); return; }
    setIsGeneratingContentScore(true);
    setShowContentScoreProcessingModal(true);
    contentScoreAbortControllerRef.current = new AbortController();
    try {
      const contentScore = await generateContentScores(
        card.content, card.type, formState.model, currentUser,
        undefined, calculateTargetWordCount(formState).target, formState.sessionId, undefined,
      );
      if (!contentScoreAbortControllerRef.current?.signal.aborted) {
        if (onUpdateCard) onUpdateCard(card.id, { score: contentScore });
        toast.success('Content score generated successfully');
      }
    } catch (error: any) {
      if (!contentScoreAbortControllerRef.current?.signal.aborted) {
        toast.error('Failed to generate content score: ' + (error?.message ?? 'Unknown error'));
      }
    } finally {
      setIsGeneratingContentScore(false);
      setShowContentScoreProcessingModal(false);
      contentScoreAbortControllerRef.current = null;
    }
  };

  const handleGenerateGeoScore = async () => {
    if (!currentUser) { toast.error('Please log in to generate GEO score'); return; }
    setIsGeneratingGeoScore(true);
    setShowGeoProcessingModal(true);
    geoAbortControllerRef.current = new AbortController();
    try {
      const geoScore = await calculateGeoScore(card.content, formState, currentUser, undefined, formState.sessionId);
      if (!geoAbortControllerRef.current?.signal.aborted) {
        if (onUpdateCard) onUpdateCard(card.id, { geoScore });
        toast.success('GEO score generated successfully');
      }
    } catch (error: any) {
      if (!geoAbortControllerRef.current?.signal.aborted) {
        toast.error('Failed to generate GEO score: ' + (error?.message ?? 'Unknown error'));
      }
    } finally {
      setIsGeneratingGeoScore(false);
      setShowGeoProcessingModal(false);
      geoAbortControllerRef.current = null;
    }
  };

  const anyAnalysisRunning = isGeneratingSeoMetadata || isGeneratingContentScore || isGeneratingGeoScore;

  // Modals
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const { isAdmin } = useIsAdmin(currentUser);

  // ── contentDetails (same logic as GeneratedCopyCard) ─────────────────────
  const contentDetails = React.useMemo(() => {
    if (card.content === null || card.content === undefined) {
      return { text: '', isHeadlines: false };
    }
    let actual: any = card.content;
    if (typeof card.content === 'object' && card.content !== null && 'content' in card.content) {
      actual = (card.content as any).content;
    }
    if (typeof actual === 'string') {
      return { text: stripMarkdown(actual), isHeadlines: false };
    }
    if (Array.isArray(actual)) {
      return { text: actual.join('\n'), isHeadlines: true };
    }
    if (actual && typeof actual === 'object' && 'headline' in actual && 'sections' in actual) {
      let t = stripMarkdown(actual.headline) + '\n\n';
      (actual.sections || []).forEach((s: any) => {
        if (s?.title) t += stripMarkdown(s.title) + '\n';
        if (s?.content) t += stripMarkdown(s.content) + '\n\n';
      });
      return { text: t, isHeadlines: false };
    }
    return { text: JSON.stringify(actual), isHeadlines: false };
  }, [card.content, card.type]);

  // ── Visibility flags (same as GeneratedCopyCard) ──────────────────────────
  const cardSeoMetadata = card.seoMetadata;
  const cardScore = card.score;
  const cardGeoScore = card.geoScore;

  const showAlternativeButton =
    card.type !== GeneratedContentItemType.SeoMetadata &&
    card.type !== GeneratedContentItemType.Original;

  const showBoostButton =
    card.type !== GeneratedContentItemType.SeoMetadata &&
    card.type !== GeneratedContentItemType.Original &&
    card.type !== GeneratedContentItemType.FaqSchema &&
    !card.comparedContent &&
    !!onBoost;

  const boostBaseName = card.baseName || card.sourceDisplayName || card.type;
  const existingBoostCount = allCards.filter(
    (v) =>
      v.type === GeneratedContentItemType.Boosted &&
      (v.parentOutputId === card.id || (v as any).baseName === boostBaseName),
  ).length;
  const boostLimitReached = existingBoostCount >= MAX_BOOST_ITERATIONS;
  const cardFinalScore = versionScores?.[card.id]?.finalScore;
  const scoreAtMax =
    typeof cardFinalScore === 'number' && cardFinalScore >= MAX_BOOST_SCORE_THRESHOLD * 10;
  const boostDisabled = formState.isLoading || boostLimitReached || scoreAtMax;

  const hasGeoPackage = allCards.some(
    (v) =>
      v.type === GeneratedContentItemType.GeoOptimized &&
      v.sourceDisplayName?.includes(card.sourceDisplayName || ''),
  );

  const isBlendedOutput = !!card.blendInstructions;
  const showSeoButton =
    !cardSeoMetadata &&
    (isBlendedOutput || !formState.generateSeoMetadata || card.analysisMode !== 'batch');
  const showContentScoreButton =
    !cardScore &&
    (isBlendedOutput || !formState.generateScores || card.analysisMode !== 'batch');
  const showGeoScoreButton =
    !cardGeoScore &&
    (isBlendedOutput || !formState.generateGeoScore || card.analysisMode !== 'batch');
  const missingCount = [showContentScoreButton, showGeoScoreButton].filter(Boolean).length;

  // ── Copy handlers (same as GeneratedCopyCard) ─────────────────────────────
  const handleCopy = () => {
    let text = contentDetails.text;
    if (card.comparedContent) {
      const label =
        isAdmin && (card as any).analysisModel
          ? ` (${(card as any).analysisModel === 'gpt-4o' ? 'GPT-4o' : 'DeepSeek'})`
          : '';
      text = `AI Analysis Summary${label}:\n\n${text}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHtml = () => {
    let html = formatSingleGeneratedItemContentAsHTML(card);
    if (card.comparedContent) {
      const modelLabel =
        isAdmin && (card as any).analysisModel
          ? ` (${(card as any).analysisModel === 'gpt-4o' ? 'GPT-4o' : 'DeepSeek'})`
          : '';
      const formatted = markdownToHtml(contentDetails.text);
      html = `<div style="font-family:system-ui,sans-serif;padding:20px"><h3 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 20px 0">AI Analysis Summary${modelLabel}</h3><div>${formatted}</div></div>`;
    }
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleCopyMd = () => {
    const md = formatSingleGeneratedItemAsMarkdown(card, targetWordCount);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const isAnalysisCard =
    card.sourceDisplayName?.includes('Analysis') ||
    card.sourceDisplayName?.includes('Comparison');

  const isGeoCard = [
    GeneratedContentItemType.GeoOptimized,
    GeneratedContentItemType.GeoTldr,
    GeneratedContentItemType.GeoFaqBlock,
    GeneratedContentItemType.GeoQuestionHeadings,
    GeneratedContentItemType.GeoBulletSummary,
    GeneratedContentItemType.GeoAuthoritySnippets,
    GeneratedContentItemType.GeoQuoteReady,
    GeneratedContentItemType.GeoLocalVariations,
  ].includes(card.type);

  return (
    <div className="space-y-0.5 pb-1">
      {/* a) Create */}
      {!isAnalysisCard && !isGeoCard && card.type !== GeneratedContentItemType.Original && (
        <div>
          <SubSectionHeader label="Create" open={openCreate} onToggle={() => setOpenCreate(p => !p)} />
          {openCreate && (
            <div className="space-y-px pl-1">
              {showAlternativeButton && (
                <SidebarBtn onClick={onAlternative} title="Create a new version">
                  <Wand2 size={10} />
                  New Version
                </SidebarBtn>
              )}
              <SidebarBtn
                onClick={() => setShowImproveModal(true)}
                title="Improve this copy"
              >
                <Edit size={10} />
                Improve
              </SidebarBtn>
              {!contentDetails.isHeadlines && (
                <SidebarBtn
                  onClick={() => setShowVoiceModal(true)}
                  title="Apply a different voice style"
                >
                  <Sparkles size={10} />
                  Change Voice
                </SidebarBtn>
              )}
              {showBoostButton && (
                <SidebarBtn
                  onClick={onBoost!}
                  disabled={boostDisabled}
                  title={
                    boostLimitReached
                      ? `Max ${MAX_BOOST_ITERATIONS} boosts reached`
                      : scoreAtMax
                      ? 'Score already at max'
                      : 'Generate a performance-optimized version'
                  }
                >
                  <Zap size={10} />
                  Enhance
                </SidebarBtn>
              )}
            </div>
          )}
        </div>
      )}

      {/* b) Generate */}
      {!isGeoCard && (
        <div>
          <SubSectionHeader label="Generate" open={openGenerate} onToggle={() => setOpenGenerate(p => !p)} />
          {openGenerate && (
            <div className="space-y-px pl-1">
              {showSeoButton && (
                <SidebarBtn onClick={() => setShowSeoOptionsModal(true)} disabled={anyAnalysisRunning} title="Generate SEO metadata">
                  <Globe size={10} />
                  {isGeneratingSeoMetadata ? 'Generating…' : 'SEO Metadata'}
                </SidebarBtn>
              )}
              {!hasGeoPackage && (
                <SidebarBtn onClick={() => setShowGeoGenerateModal(true)} disabled={anyAnalysisRunning || isGeneratingGeo} title="Generate GEO content elements">
                  <Globe size={10} />
                  {isGeneratingGeo ? 'Generating…' : 'GEO Generate'}
                </SidebarBtn>
              )}
            </div>
          )}
        </div>
      )}
      {showSeoOptionsModal && ReactDOM.createPortal(
        <SeoGenerationOptionsModal
          isOpen={showSeoOptionsModal}
          onClose={() => setShowSeoOptionsModal(false)}
          onConfirm={handleSeoOptionsConfirm}
        />,
        document.body
      )}
      {showSeoProcessingModal && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={showSeoProcessingModal}
          message="Generating SEO Metadata"
          onCancel={() => { seoAbortControllerRef.current?.abort(); }}
        />,
        document.body
      )}

      {/* GEO Generate modal */}
      {showGeoGenerateModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">GEO Generate</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                {card.sourceDisplayName || card.type}
              </p>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select the GEO elements to generate from this card's content.
              </p>
              <div className="space-y-2">
                {ALL_GEO_ELEMENTS.map(el => (
                  <label key={el} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={geoSelectedElements.includes(el)}
                      onChange={e => {
                        setGeoSelectedElements(prev =>
                          e.target.checked ? [...prev, el] : prev.filter(x => x !== el)
                        );
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {GEO_ELEMENT_LABELS[el]}
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Countries or Regions
                </label>
                <input
                  type="text"
                  value={geoTargetRegions}
                  onChange={e => setGeoTargetRegions(e.target.value)}
                  placeholder="e.g. México, LATAM, Barcelona"
                  className="w-full text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <button
                type="button"
                onClick={handleGeoGenerateRun}
                disabled={geoSelectedElements.length === 0}
                className="flex-1 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => setShowGeoGenerateModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isGeneratingGeo && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={isGeneratingGeo}
          message="Generating GEO content…"
          onCancel={() => {}}
        />,
        document.body
      )}

      {/* c) Analyze */}
      {(showContentScoreButton || showGeoScoreButton) && (
        <div>
          <SubSectionHeader label="Analyze" open={openAnalyze} onToggle={() => setOpenAnalyze(p => !p)} />
          {openAnalyze && (
            <div className="space-y-px pl-1">
              {missingCount >= 2 && (
                <SidebarBtn
                  onClick={async () => {
                    if (showContentScoreButton) await handleGenerateContentScore();
                    if (showGeoScoreButton) await handleGenerateGeoScore();
                  }}
                  disabled={anyAnalysisRunning}
                  title="Generate Content and GEO scores"
                >
                  <Sparkles size={10} />
                  All Analyses
                </SidebarBtn>
              )}
              {showContentScoreButton && (
                <SidebarBtn onClick={handleGenerateContentScore} disabled={anyAnalysisRunning} title="Generate content score">
                  <BookCheck size={10} />
                  {isGeneratingContentScore ? 'Scoring…' : 'Score'}
                </SidebarBtn>
              )}
              {showGeoScoreButton && (
                <SidebarBtn onClick={handleGenerateGeoScore} disabled={anyAnalysisRunning} title="Generate GEO score">
                  <MapPin size={10} />
                  {isGeneratingGeoScore ? 'Scoring…' : 'GEO'}
                </SidebarBtn>
              )}
            </div>
          )}
        </div>
      )}
      {showContentScoreProcessingModal && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={showContentScoreProcessingModal}
          message="Generating Content Score"
          onCancel={() => { contentScoreAbortControllerRef.current?.abort(); }}
        />,
        document.body
      )}
      {showGeoProcessingModal && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={showGeoProcessingModal}
          message="Generating GEO Score"
          onCancel={() => { geoAbortControllerRef.current?.abort(); }}
        />,
        document.body
      )}
      {showImproveModal && ReactDOM.createPortal(
        <ImproveModal
          copyName={card.sourceDisplayName || card.type}
          onApply={(instruction) => onModify(card, instruction)}
          onClose={() => setShowImproveModal(false)}
        />,
        document.body
      )}
      {showVoiceModal && ReactDOM.createPortal(
        <VoiceModal
          copyName={card.sourceDisplayName || card.type}
          onApply={(persona, instructions) => onRestyle(card, persona, instructions)}
          onClose={() => setShowVoiceModal(false)}
        />,
        document.body
      )}

      {/* d) Copy / Export */}
      <div>
        <SubSectionHeader label="Copy / Export" open={openCopy} onToggle={() => setOpenCopy(p => !p)} />
        {openCopy && (
          <div className="space-y-px pl-1">
            <SidebarBtn onClick={handleCopy} title="Copy plain text">
              {copied ? <Check size={10} className="text-gray-500 dark:text-gray-400" /> : <Copy size={10} />}
              {copied ? 'Copied!' : 'Copy'}
            </SidebarBtn>
            <SidebarBtn onClick={handleCopyHtml} title="Copy as HTML">
              {copiedHtml ? <Check size={10} className="text-gray-500 dark:text-gray-400" /> : <Code size={10} />}
              {copiedHtml ? 'HTML Copied!' : 'Copy HTML'}
            </SidebarBtn>
            <SidebarBtn onClick={handleCopyMd} title="Copy as Markdown">
              {copiedMd ? <Check size={10} className="text-gray-500 dark:text-gray-400" /> : <FileText size={10} />}
              {copiedMd ? 'MD Copied!' : 'Copy MD'}
            </SidebarBtn>
            {onSaveAsBrandVoice && (
              <SidebarBtn
                onClick={() => onSaveAsBrandVoice(contentDetails.text)}
                title="Save as Brand Voice profile"
              >
                <BookOpen size={10} />
                Save as Brand Voice
              </SidebarBtn>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Shared nav helpers ───────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface RecentNavItem { id: string; label: string; date: string; }

const LazyNavDropdown: React.FC<{
  label: string;
  loadItems: () => Promise<RecentNavItem[]>;
  onSelect: (item: RecentNavItem) => void;
}> = ({ label, loadItems, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RecentNavItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (next && items === null) {
      setLoading(true);
      try { setItems(await loadItems()); } finally { setLoading(false); }
    }
  }, [open, items, loadItems]);

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-1.5 py-1 rounded text-left transition-colors"
        style={{ paddingLeft: '22px', color: '#9ca3af' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f97316'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
      >
        <ChevronRight size={9} style={{ flexShrink: 0, transition: 'transform 150ms', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }} />
        <span style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
      </button>
      {open && (
        <div style={{ paddingLeft: '34px' }} className="pb-0.5">
          {loading ? (
            <div className="flex items-center gap-1.5 py-1">
              <Loader2 size={9} className="animate-spin text-gray-400" />
              <span style={{ fontSize: '9px', color: '#9ca3af' }}>Loading…</span>
            </div>
          ) : items && items.length > 0 ? (
            items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setOpen(false); onSelect(item); }}
                className="w-full text-left py-0.5 rounded transition-colors"
                style={{ color: '#9ca3af' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f97316'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
              >
                <div style={{ fontSize: '9px', fontWeight: 500 }} className="truncate leading-tight">{item.label}</div>
                <div style={{ fontSize: '8px', color: '#6b7280' }}>{item.date}</div>
              </button>
            ))
          ) : (
            <p style={{ fontSize: '9px', color: '#6b7280' }} className="py-0.5 italic">
              {label === 'Recent Projects' ? 'No saved projects yet' : 'No sessions yet'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main sidebar ──────────────────────────────────────────────────────────────

const CopyMakerSidebar: React.FC<CopyMakerSidebarProps> = ({
  formState,
  hasPopulatedFields,
  onSaveSession,
  onSaveTemplate,
  onEvaluateInputs,
  isEvaluating = false,
  currentUser,
  generatedOutputCards,
  originalInputScore,
  onSaveOutput,
  onViewPrompts,
  onGenerateFaqSchema,
  comparisonResult,
  versionDeepAnalysis,
  comparisonDeepAnalysisMeta,
  loadingVersionIds,
  sortedGeneratedVersions,
  onAlternative,
  onRestyle,
  onScore,
  onModify,
  onDelete,
  onSaveAsBrandVoice,
  onBoost,
  onAddToComparison,
  onUpdateCard,
  onAddCards,
  onCompareWithGrok,
  onBlendVersions,
  isBlending,
  onGenerateBestElements,
  isGeneratingBestElements,
  targetWordCount,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);
  const [scoringOpen, setScoringOpen] = useState(true);
  const [blendOpen, setBlendOpen] = useState(true);
  const [copiesOpen, setCopiesOpen] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rescoringCardIds, setRescoringCardIds] = useState<Set<string>>(new Set());

  const SIDEBAR_WIDTH_KEY = 'copyzap_sidebar_width';
  const MIN_WIDTH = 160;
  const MAX_WIDTH = 400;
  const DEFAULT_WIDTH = 224;

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      if (saved) {
        const n = parseInt(saved, 10);
        if (!isNaN(n) && n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
      }
    } catch { /* ignore */ }
    return DEFAULT_WIDTH;
  });

  const isDragging = useRef(false);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = (ev: MouseEvent) => {
      isDragging.current = false;
      const finalWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX));
      setSidebarWidth(finalWidth);
      try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(finalWidth)); } catch { /* ignore */ }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);


  // Each card group starts collapsed
  const [cardGroupOpen, setCardGroupOpen] = useState<Record<string, boolean>>({});

  const cardIds = sortedGeneratedVersions
    .filter(card => card.type !== GeneratedContentItemType.GeoOptimized)
    .map(card => card.id);

  const activeCardId = useActiveCard(cardIds);

  useEffect(() => {
    if (activeCardId) {
      setCardGroupOpen(() => {
        const next: Record<string, boolean> = {};
        cardIds.forEach(id => {
          next[id] = id === activeCardId;
        });
        return next;
      });
    }
  }, [activeCardId]);

  const { isAdmin } = useIsAdmin(currentUser);

  const loadRecentProjects = useCallback(async (): Promise<RecentNavItem[]> => {
    if (!currentUser?.id) return [];
    const { data } = await getUserSavedOutputsMeta(currentUser.id, 5);
    if (!data) return [];
    return (data as any[]).map((o: any) => ({
      id: o.id,
      label: o.title || 'Untitled',
      date: relativeTime(o.created_at),
    }));
  }, [currentUser?.id]);

  const loadRecentSessions = useCallback(async (): Promise<RecentNavItem[]> => {
    if (!currentUser?.id) return [];
    const { data } = await getUserCopySessions(currentUser.id, 5);
    if (!data) return [];
    return (data as any[])
      .filter((s: any) => s.scope_key === 'copy-maker' || !s.scope_key)
      .slice(0, 5)
      .map((s: any) => ({
        id: s.id,
        label: s.session_name || s.name || 'Untitled session',
        date: relativeTime(s.created_at),
      }));
  }, [currentUser?.id]);

  const hasContent =
    (generatedOutputCards && generatedOutputCards.length > 0) || !!originalInputScore;

  // ── Export handlers ───────────────────────────────────────────────────────
  const handleCopyAllMarkdown = () => {
    try {
      const md = formatAsEnhancedMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
      );
      navigator.clipboard.writeText(md);
      toast.success('Content copied as Markdown!');
    } catch {
      toast.error('Failed to copy content as Markdown');
    }
  };

  const handleExportToHtml = () => {
    try {
      exportAsFormattedHtml(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
        loadingVersionIds,
      );
      toast.success('Content exported as formatted HTML!');
    } catch {
      toast.error('Failed to export content as HTML');
    }
  };

  const handleExportLLMEval = () => {
    try {
      exportLLMEvaluationMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
      );
      toast.success('LLM Evaluation file exported!');
    } catch {
      toast.error('Failed to export LLM evaluation file');
    }
  };

  const handleExportLLMAudit = () => {
    try {
      exportLLMEvaluationAudit(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
      );
      toast.success('LLM Evaluation Audit file exported!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to export audit file';
      toast.error(msg, { duration: msg.includes('complete evaluation data') ? 6000 : 4000 });
    }
  };

  const toggleCardGroup = (id: string) =>
    setCardGroupOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  // Default is collapsed: only open when explicitly set to true
  const isCardGroupOpen = (id: string) => cardGroupOpen[id] === true;

  // ── Sidebar Scoring Helpers ────────────────────────────────────────────────

  // Create a wrapper for per-card rescoring that updates the rescoringCardIds state
  const createRescoringHandler = (cardId: string) => {
    return async () => {
      if (!currentUser) { toast.error('Please log in to rescore'); return; }
      setRescoringCardIds(prev => new Set([...prev, cardId]));
      try {
        const card = sortedGeneratedVersions.find(c => c.id === cardId);
        if (!card) return;
        const contentScore = await generateContentScores(
          card.content, card.type, formState.model, currentUser,
          undefined, calculateTargetWordCount(formState).target, formState.sessionId, undefined,
        );
        if (onUpdateCard) {
          onUpdateCard(card.id, { score: contentScore });
          toast.success('Score updated');
        }
      } catch (error: any) {
        toast.error('Failed to rescore: ' + (error?.message ?? 'Unknown error'));
      } finally {
        setRescoringCardIds(prev => {
          const next = new Set(prev);
          next.delete(cardId);
          return next;
        });
      }
    };
  };

  // Count unscored cards
  const unscorledCount = sortedGeneratedVersions.filter(
    c => c.type !== GeneratedContentItemType.GeoOptimized && !c.score
  ).length;

  const scorableVersions = sortedGeneratedVersions.filter(
    c => c.type !== GeneratedContentItemType.GeoOptimized
  );
  const allVersionsScored = !!comparisonResult;

  // Score all unscored cards
  const handleScoreAllMissing = () => {
    if (!onCompareWithGrok) {
      toast.error('Scoring not available');
      return;
    }
    onCompareWithGrok(false);
  };

  // ── Collapsed state ───────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="sticky top-0 h-screen flex-shrink-0 flex flex-col items-center pt-3 w-8 border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-black">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Open sidebar"
          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <PanelRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="sticky top-0 h-screen flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-black relative"
      style={{ width: sidebarWidth, userSelect: isDragging.current ? 'none' : undefined }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-20 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      />
      {/* Header — fixed, does not scroll */}
      <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-black z-10">
        <span className="text-[9px] font-normal uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Actions
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Collapse sidebar"
          className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <PanelRight size={11} />
        </button>
      </div>

      {/* Scrollable content — takes remaining height */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin' }}>

        {/* ── Navigate section ────────────────────────────────────── */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="px-2.5 pt-2 pb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>
              Navigate
            </span>
          </div>
          <div className="space-y-0 px-1.5">
            {([
              { label: 'Copy Maker', path: '/copy-maker', Icon: FileEdit, adminOnly: false },
              { label: 'Start Hub', path: null, Icon: Rocket, adminOnly: false },
              { label: 'Purpose Rewrite', path: '/quick-polish', Icon: PenLine, adminOnly: true },
              { label: 'Copy Snap', path: '/copy-snap', Icon: Camera, adminOnly: true },
              { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard, adminOnly: false },
            ] as { label: string; path: string | null; Icon: React.ElementType; adminOnly: boolean }[])
              .filter(item => !item.adminOnly || isAdmin)
              .map(({ label, path, Icon }) => {
              const isActive = path ? location.pathname === path : false;
              const isDashboard = label === 'Dashboard';
              return (
                <div key={label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!path) {
                        window.dispatchEvent(new CustomEvent('forceOpenStartHub'));
                      } else {
                        navigate(path);
                      }
                    }}
                    className="w-full flex items-center gap-2 py-1.5 px-2 rounded text-[10px] font-medium transition-colors text-left"
                    style={isActive ? {
                      borderLeft: '2px solid #f97316',
                      paddingLeft: '6px',
                      color: '#f97316',
                      background: 'rgba(249,115,22,0.07)',
                    } : {
                      borderLeft: '2px solid transparent',
                      paddingLeft: '6px',
                      color: '#6b7280',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.06)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <Icon size={11} style={{ flexShrink: 0 }} />
                    {label}
                  </button>
                  {isDashboard && (
                    <div className="space-y-0 mt-0.5">
                      <LazyNavDropdown
                        label="Recent Projects"
                        loadItems={loadRecentProjects}
                        onSelect={item => navigate(`/copy-maker?savedOutputId=${item.id}`)}
                      />
                      <LazyNavDropdown
                        label="Recent Sessions"
                        loadItems={loadRecentSessions}
                        onSelect={item => navigate(`/copy-maker?sessionId=${item.id}`)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 1: Session ──────────────────────────────────── */}
        {hasPopulatedFields && (
          <div className="border-b border-gray-100 dark:border-gray-800">
            <SectionHeader label="Session" open={sessionOpen} onToggle={() => setSessionOpen(p => !p)} />
            {sessionOpen && (
              <div className="space-y-px px-1.5 pb-1.5">
                {onEvaluateInputs && (
                  <SidebarBtn onClick={onEvaluateInputs} disabled={isEvaluating} title="Evaluate Inputs">
                    <CheckCircle2 size={10} className={isEvaluating ? 'animate-pulse' : ''} />
                    Evaluate Inputs
                  </SidebarBtn>
                )}
                {onSaveSession && (
                  <SidebarBtn onClick={onSaveSession} title="Save Session">
                    <BookmarkPlus size={10} />
                    Save Session
                  </SidebarBtn>
                )}
                {onSaveTemplate && (
                  <SidebarBtn onClick={onSaveTemplate} title="Save as Template">
                    <Save size={10} />
                    Save as Template
                  </SidebarBtn>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Section 2: Output ───────────────────────────────────── */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <SectionHeader label="Output" open={outputOpen} onToggle={() => setOutputOpen(p => !p)} />
          {outputOpen && (
            <div className="space-y-px px-1.5 pb-1.5">
              {hasContent && (
                <SidebarBtn
                  onClick={onSaveOutput}
                  disabled={!generatedOutputCards || generatedOutputCards.length === 0}
                  title="Save Output"
                >
                  <Save size={10} />
                  Save Output
                </SidebarBtn>
              )}
              {hasContent && (
                <SidebarBtn onClick={handleCopyAllMarkdown} title="Copy all content as Markdown">
                  <FileText size={10} />
                  Copy as Markdown
                </SidebarBtn>
              )}
              {hasContent && (
                <SidebarBtn onClick={handleExportToHtml} title="Export as formatted HTML file">
                  <FileCode size={10} />
                  Export HTML
                </SidebarBtn>
              )}
              {hasContent && isAdmin && (
                <SidebarBtn onClick={handleExportLLMEval} title="Export for LLM Evaluation (.md)">
                  <Sparkles size={10} />
                  LLM Eval Export
                </SidebarBtn>
              )}
              {hasContent && !!comparisonResult && isAdmin && (
                <SidebarBtn onClick={handleExportLLMAudit} title="Export for LLM Evaluation Audit (.md)">
                  <FlaskConical size={10} />
                  LLM Audit Export
                </SidebarBtn>
              )}
              {isAdmin && (
                <SidebarBtn onClick={onViewPrompts} title="View Prompts">
                  <Code size={10} />
                  View Prompts
                </SidebarBtn>
              )}
            </div>
          )}
        </div>

        {/* ── Section 2B: Scoring ────────────────────────────────────── */}
        {unscorledCount >= 2 && (
          <div className="border-b border-gray-100 dark:border-gray-800">
            <SectionHeader label="Scoring" open={scoringOpen} onToggle={() => setScoringOpen(p => !p)} />
            {scoringOpen && (
              <div className="space-y-1 px-1.5 pb-1.5">
                <SidebarBtn
                  onClick={handleScoreAllMissing}
                  disabled={rescoringCardIds.size > 0}
                  title={allVersionsScored ? `Re-score all ${scorableVersions.length} outputs` : `Score all ${unscorledCount} unscored outputs`}
                >
                  <BookCheck size={10} />
                  {rescoringCardIds.size > 0 ? 'Scoring…' : allVersionsScored ? `Re-score all (${scorableVersions.length})` : `Score all (${scorableVersions.length})`}
                </SidebarBtn>
                {!formState.section && (
                  <p className="text-[8px] text-gray-400 dark:text-gray-600 px-1 leading-snug">
                    No section set — scoring as general copy
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Section 2C: Blend Best Version ────────────────────────── */}
        {onBlendVersions && (
          <div className="border-b border-gray-100 dark:border-gray-800">
            <SectionHeader label="Blend Best Version" open={blendOpen} onToggle={() => setBlendOpen(p => !p)} />
            {blendOpen && (
              <div className="space-y-1 px-1.5 pb-1.5">
                <SidebarBtn
                  onClick={() => onBlendVersions()}
                  disabled={!comparisonResult || isBlending}
                  title={!comparisonResult ? 'Score your copies first' : 'Blend the best-performing versions into one'}
                >
                  <GitMerge size={10} className={isBlending ? 'animate-pulse' : ''} />
                  {isBlending ? 'Blending…' : 'Blend Best Versions'}
                </SidebarBtn>
              </div>
            )}
          </div>
        )}

        {/* ── Section 2D: Best Elements Summary ───────────────────── */}
        {onGenerateBestElements && comparisonResult && sortedGeneratedVersions.length >= 2 && (
          <div className="border-b border-gray-100 dark:border-gray-800">
            <SectionHeader label="Best Elements" open={blendOpen} onToggle={() => {}} />
            <div className="space-y-1 px-1.5 pb-1.5">
              <SidebarBtn
                onClick={() => onGenerateBestElements()}
                disabled={isGeneratingBestElements}
                title="Identify the strongest section from each version across key dimensions"
              >
                <Sparkles size={10} className={isGeneratingBestElements ? 'animate-pulse' : ''} />
                {isGeneratingBestElements ? 'Analyzing…' : 'Best Elements Summary'}
              </SidebarBtn>
              {isGeneratingBestElements && ReactDOM.createPortal(
                <ProcessingModal
                  isOpen={isGeneratingBestElements}
                  message="Analyzing Best Elements…"
                  onCancel={() => {}}
                />,
                document.body
              )}
            </div>
          </div>
        )}

        {/* ── Section 3: Generated Copies ─────────────────────────── */}
        {sortedGeneratedVersions.length > 0 && (
          <div>
            <SectionHeader
              label={`Copies (${sortedGeneratedVersions.length})`}
              open={copiesOpen}
              onToggle={() => setCopiesOpen(p => !p)}
            />
            {copiesOpen && (
              <div className="px-1.5 pb-2 space-y-0.5">
                {sortedGeneratedVersions
                  .filter(card => card.type !== GeneratedContentItemType.GeoOptimized)
                  .map((card) => {
                  const groupOpen = isCardGroupOpen(card.id);
                  return (
                    <div
                      key={card.id}
                      className="border border-gray-100 dark:border-gray-800 rounded overflow-hidden"
                    >
                      {/* Group header — collapsed by default */}
                      {confirmDeleteId === card.id ? (
                        <div className="flex items-center justify-between w-full px-2 py-1">
                          <span className="text-[9px] text-red-500">Delete this output?</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(card);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleCardGroup(card.id)}
                          className={`w-full flex items-center justify-between px-2 py-1 text-[9px] font-medium transition-colors text-left
                            ${card.id === activeCardId
                              ? 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border-l-2 border-orange-500'
                              : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                          <span className="truncate pr-1">
                            {card.sourceDisplayName || card.type}
                            {card.score && (
                              <span className="ml-1 text-[8px] font-normal text-gray-400 dark:text-gray-500">
                                {card.score.overall}/100
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {card.score && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  createRescoringHandler(card.id)();
                                }}
                                disabled={rescoringCardIds.has(card.id)}
                                title="Rescore this output"
                                className="p-0.5 rounded text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 disabled:opacity-40 transition-colors"
                              >
                                <RefreshCw size={9} className={rescoringCardIds.has(card.id) ? 'animate-spin' : ''} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(card.id);
                              }}
                              title="Delete this output"
                              className="p-0.5 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={9} />
                            </button>
                            {groupOpen ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                          </div>
                        </button>
                      )}

                      {groupOpen && (
                        <div className="px-1.5 pt-0.5">
                          <CardActions
                            card={card}
                            formState={formState}
                            allCards={sortedGeneratedVersions}
                            comparisonResult={comparisonResult}
                            versionScores={formState.copyResult?.versionScores}
                            onAlternative={() => onAlternative(card)}
                            onScore={() => onScore(card)}
                            onModify={onModify}
                            onRestyle={onRestyle}
                            onSaveAsBrandVoice={onSaveAsBrandVoice}
                            onBoost={onBoost ? () => onBoost(card) : undefined}
                            targetWordCount={targetWordCount}
                            currentUser={currentUser}
                            isBlending={isBlending}
                            onUpdateCard={onUpdateCard}
                            onAddCards={onAddCards}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default CopyMakerSidebar;
