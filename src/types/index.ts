export type TabType = 'create' | 'improve' | 'copyMaker';

export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese';

export type Tone = 'Professional' | 'Friendly' | 'Bold' | 'Minimalist' | 'Creative' | 'Persuasive';

export type PageType = 'Homepage' | 'About' | 'Services' | 'Contact' | 'Other';

export type SectionType = string;

export type WordCount = 'Short: 50-100' | 'Medium: 100-200' | 'Long: 200-400' | 'Custom';

// Legacy Model type - deprecated, use AiEngine instead
export type Model = 'claude-sonnet-4-5' | 'claude-haiku-4-5' | 'claude-opus-4-5' | 'deepseek-chat' | 'gpt-4o' | 'chatgpt-4o-latest' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'grok-4-latest' | 'gemini-2.0-flash';

// New AI Engine type for simplified model selection
export type AiEngine = 'claude' | 'openai';

export type IndustryNiche = 'SaaS' | 'Health' | 'Real Estate' | 'E-commerce' | 'Education' | 'Hospitality' | 'Finance' | 'Nonprofit' | 'Other';

export type ReaderStage = 'Awareness' | 'Consideration' | 'Decision' | 'Retention' | 'Re-activation';

export type ReaderSophistication = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type WritingStyle = 'Persuasive' | 'Conversational' | 'Informative' | 'Storytelling';

export type LanguageConstraint = 'Avoid passive voice' | 'No idioms' | 'Avoid jargon' | 'Short sentences';

export type CopyType = 'improved' | 'alternative' | 'humanized' | 'alternativeHumanized' | 'headlines';

export type UseCaseKey =
  | 'hero_section' | 'landing_page' | 'seo_page' | 'newsletter'
  | 'linkedin_ad' | 'twitter_ad' | 'google_ad' | 'general_improve' | 'custom';

export interface ScoringContext {
  useCaseKey: UseCaseKey;
  useCaseLabel: string;
}

// New enum for different types of generated content items
export enum GeneratedContentItemType {
  Original = 'original',
  Improved = 'improved',
  Alternative = 'alternative',
  RestyledImproved = 'restyled_improved',
  RestyledAlternative = 'restyled_alternative',
  SeoMetadata = 'seo_metadata', // Existing SEO metadata type
  FaqSchema = 'faq_schema', // New FAQPage Schema type
  Boosted = 'boosted', // Performance Boost output
  // GEO Generate outputs
  GeoTldr = 'GeoTldr',
  GeoFaqBlock = 'GeoFaqBlock',
  GeoQuestionHeadings = 'GeoQuestionHeadings',
  GeoBulletSummary = 'GeoBulletSummary',
  GeoAuthoritySnippets = 'GeoAuthoritySnippets',
  GeoQuoteReady = 'GeoQuoteReady',
  GeoLocalVariations = 'GeoLocalVariations',
  GeoOptimized = 'GeoOptimized',
}

export type GeoGenerateElement =
  | 'tldr'
  | 'faq'
  | 'questionHeadings'
  | 'bulletSummary'
  | 'authoritySnippets'
  | 'quoteReady'
  | 'localVariations';

export const MAX_BOOST_ITERATIONS = 2;
export const MAX_BOOST_SCORE_THRESHOLD = 9.0;

// New interface for structured output elements with word counts
export interface StructuredOutputElement {
  id: string; // Unique identifier for stable drag and drop
  value: string; // e.g., 'problem', 'solution', 'header1'
  label?: string; // For display purposes
  wordCount?: number | null; // e.g., 200, 500, or null if no specific count
}

export interface ContentQualityScore {
  score: number;
  tips: string[];
}

export interface FormData {
  tab: TabType;
  language: Language;
  tone: Tone;
  wordCount: WordCount;
  customWordCount?: number;
  competitorUrls: string[];
  businessDescription?: string;
  originalCopy?: string;
  originalCopyEnteredAt?: string; // Timestamp when original copy was first entered
  pageType?: PageType;
  section?: SectionType; // Added section field
  targetAudience?: string;
  keyMessage?: string;
  desiredEmotion?: string;
  callToAction?: string;
  brandValues?: string;
  keywords?: string;
  keywordsExplicit?: boolean;
  context?: string;
  model: Model; // Legacy - deprecated, use aiEngine instead
  aiEngine?: AiEngine; // New simplified AI engine selection
  customerId?: string; // Added customerId field
  customerName?: string; // For display purposes
  brandVoiceId?: string; // Selected brand voice for the customer
  briefDescription?: string; // Added brief description field
  projectDescription?: string; // New required field for project organization (not used in prompts)
  controlExecuted?: string; // Added to track which UI control triggered the OpenAI token usage
  outputStructure?: StructuredOutputElement[]; // Changed from string[] to StructuredOutputElement[]
  businessDescriptionScore?: ContentQualityScore; // New field for business description score
  originalCopyScore?: ContentQualityScore; // New field for original copy score
  excludedTerms?: string; // New field for terms to exclude from output
  // New fields
  productServiceName?: string;
  industryNiche?: string;
  toneLevel?: number;
  readerFunnelStage?: string;
  competitorCopyText?: string;
  readerSophistication?: string;
  targetAudiencePainPoints?: string;
  preferredWritingStyle?: string;
  languageStyleConstraints?: string[];
  selectedPersona?: string; // Add selected persona to FormData
  sessionId?: string; // Session ID for tracking
  loadedSessionName?: string; // Original session name when loaded (used to detect rename/fork)
  // Generation options
  generateScores?: boolean; // New field for generating scores
  generateSeoMetadata?: boolean; // New field for generating SEO metadata
  generateGeoScore?: boolean; // New field for generating GEO scores
  // Multiple version controls
  // SEO metadata variant counts
  numUrlSlugs?: number; // Number of URL slug variants (1-5, default: 1)
  numMetaDescriptions?: number; // Number of meta description variants (1-5, default: 1)
  numH1Variants?: number; // Number of H1 variants (1-5, default: 1)
  numH2Variants?: number; // Number of H2 variants (1-10, default: 2)
  numH3Variants?: number; // Number of H3 variants (1-10, default: 2)
  numOgTitles?: number; // Number of OG title variants (1-5, default: 1)
  numOgDescriptions?: number; // Number of OG description variants (1-5, default: 1)
  // New fields for word count control
  sectionBreakdown?: string; // New field for section-by-section word count allocation
  forceElaborationsExamples?: boolean; // New field to force detailed explanations and examples
  // Strict word count control
  aiDecideWordCount?: boolean; // New field to let AI decide word count without restrictions
  prioritizeWordCount?: boolean; // New field to prioritize exact word count adherence
  wordCountTolerancePercentage?: number; // Percentage below target that triggers revision (default: 2%)
  // Little word count control
  faqSchemaEnabled?: boolean; // New field for FAQPage Schema generation
  adhereToLittleWordCount?: boolean; // New field for little word count adherence
  littleWordCountTolerancePercentage?: number; // Percentage tolerance for little word count (default: 20%)
  enhanceForGEO?: boolean; // New field for enhancing content for Generative Engine Optimization
  addTldrSummary?: boolean; // New field for adding TL;DR summary at the top (only when GEO is enabled)
  // Location field for GEO targeting
  location?: string; // New field for location targeting when GEO is enabled
  geoRegions?: string; // New field for targeting specific countries or regions when GEO is enabled
  // Public template fields
  is_public?: boolean;
  // Original copy guidance field for prefills
  originalCopyGuidance?: string; // Specific instructions for the "Original Copy" field based on prefill context
  // Special instructions field
  specialInstructions?: string; // Free-form instructions that will be appended to the prompt
  // Section titles for structured output
  includeSectionTitles?: boolean; // Generate AI titles for each section in structured output (default: true)
  // AI Engine Mode for A/B testing
  aiEngineMode?: 'legacy' | 'enhanced' | 'both'; // AI pipeline mode: 'legacy' (default), 'enhanced' (CopyZap+), or 'both' (compare)
  // Create Variants
  createVariants?: boolean; // New field to enable creating multiple variants at once
  numberOfVariants?: number; // Number of variants to create (1-10, default: 3)
  // Workflow automation
  useWorkflow?: boolean; // Enable workflow automation
  workflowId?: string; // Selected workflow ID to execute
}

export interface PromptEvaluation {
  score: number;
  tips: string[];
}

export interface ScoreData {
  overall: number;
  clarity: string;
  persuasiveness: string;
  toneMatch: string;
  engagement: string;
  wordCountAccuracy?: number; // Added word count accuracy property
  improvementExplanation?: string; // Added prop for the improvement explanation
  suggestions?: string[]; // Optimization suggestions for improvement
}

/** Absolute score — evaluated in isolation, never changes across sessions. */
export interface AbsoluteScoreBreakdown {
  clarity: number;           // 0–25
  persuasion: number;        // 0–25
  audience_fit: number;      // 0–25
  structure: number;         // 0–25
  total: number;             // 0–100
  clarity_note: string;
  persuasion_note: string;
  audience_fit_note: string;
  structure_note: string;
}

// New interface for GEO score data
export interface GeoScoreData {
  overall: number;
  breakdown: {
    criterion: string;
    score: number;
    detected: boolean;
    explanation: string;
  }[];
  suggestions: string[];
}

// Deep analysis types (narrative guidance, separate from scoring)
export interface SuggestedImprovement {
  text: string;
  points_delta?: number; // 1-5 points this improvement would add
  dimension?: string; // Which scoring dimension it addresses
  projected_score?: number; // Will be computed at card render level
}

export interface VersionDeepAnalysis {
  versionId: string;
  summary: string; // 2-4 sentences
  keyStrengths: string[]; // 4-8 bullets
  suggestedImprovements: (string | SuggestedImprovement)[]; // 4-8 bullets (new: may include points_delta)
  strategicRecommendation: string; // 2-4 sentences
  pros?: string[]; // Optional 3-6 bullets
  cons?: string[]; // Optional 3-6 bullets
  analysisVersion: string; // e.g., "deep-v1"
  evaluatedAt?: string; // ISO timestamp
  contentHash: string; // For caching
  contextKey: string; // For cache invalidation
  errorMessage?: string; // If analysis failed
}

export interface ComparisonDeepAnalysisMeta {
  winnerVersionId: string; // MUST match scoring winner
  overallVerdict: string; // Short paragraph referencing winner
  bestVersionName: string; // Display label
  analysisVersion: string; // e.g., "deep-v1"
  evaluatedAt: string; // ISO timestamp
}

// New interfaces for structured copy output
export interface StructuredCopySection {
  title: string;
  content?: string;
  listItems?: string[];
}

export interface StructuredCopyOutput {
  headline: string;
  sections: StructuredCopySection[];
  wordCountAccuracy?: number; // Added to track word count accuracy
}

// New interface for a single generated content item
export interface GeneratedContentItem {
  id: string; // Unique ID for this specific generated item
  type: GeneratedContentItemType; // Type of content (e.g., 'improved', 'alternative', 'humanized', 'restyled_improved')
  content: string | StructuredCopyOutput | string[]; // The actual generated content (string, structured object, or string[] for headlines)
  sourceText?: string | StructuredCopyOutput | string[]; // Source text used to generate this item (for evidence analysis)
  persona?: string; // The persona applied, if any
  score?: ScoreData; // The score data for this content, if generated
  absoluteScore?: AbsoluteScoreBreakdown; // Absolute score — evaluated in isolation
  faqSchema?: any; // FAQ JSON-LD schema if generated from content

  // Fields to link to the source content item (for alternative, humanized, restyled versions)
  sourceId?: string; // ID of the content item this was generated from
  sourceType?: GeneratedContentItemType; // Type of the source content item
  sourceIndex?: number; // Index of the source content item if it was part of a collection (e.g., alternativeVersions[index])
  sourceDisplayName?: string; // A user-friendly name for the source (e.g., "Standard Version", "Alternative Version 2")

  generatedAt: string; // Timestamp of when this item was generated

  // SEO metadata for this content item
  seoMetadata?: SeoMetadata;

  // SEO generation options (tracks which elements were enabled/disabled)
  seoGenerationOptions?: {
    urlSlugsEnabled: boolean;
    metaDescriptionsEnabled: boolean;
    h1VariantsEnabled: boolean;
    h2HeadingsEnabled: boolean;
    h3HeadingsEnabled: boolean;
    ogTitlesEnabled: boolean;
    ogDescriptionsEnabled: boolean;
  };

  // GEO score for this content item
  geoScore?: GeoScoreData;

  // Special instructions for modification or blending
  modificationInstruction?: string; // Instructions used to modify or blend this content
  blendInstructions?: string; // Special instructions used when blending versions

  // Brand voice applied during generation
  brandVoiceName?: string; // Name of the brand voice used in generation

  // Compared content for Grok comparison summaries
  comparedContent?: {
    originalCopy?: string;
    items: { label: string; content: string }[];
  };

  // Analysis mode tracking (batch vs on-demand)
  analysisMode?: 'batch' | 'on_demand'; // Whether analyses were generated in batch or should be generated on-demand

  // Workflow tracking
  workflowGenerated?: boolean; // Whether this content was generated by a workflow

  // Performance Boost metadata
  baseName?: string; // Clean root display name without any transformation prefixes (e.g. "Generated Copy 1")
  parentOutputId?: string; // ID of the output that was boosted
  boostIteration?: number; // 1-based counter per base version (1, 2, ...)
  boostLevel?: 'lite'; // Boost intensity (reserved for future tiers)

  // Incremental analysis tracking
  analyzedOutputIds?: string[]; // IDs of outputs that were included in this analysis
  lastAnalyzedAt?: string; // Timestamp of when this analysis was last updated
  analysisModel?: string; // Model used for the analysis
}

// New interface for SEO metadata
export interface SeoMetadata {
  urlSlugs?: string[];
  metaDescriptions?: string[];
  h1Variants?: string[];
  h2Headings?: string[];
  h3Headings?: string[];
  ogTitles?: string[];
  ogDescriptions?: string[];
}

export interface CopyResult {
  // Retained for initial generation and backward compatibility
  improvedCopy: string | StructuredCopyOutput;
  alternativeCopy?: string | StructuredCopyOutput;
  headlines?: string[];

  // New unified array for all generated content items
  generatedVersions: GeneratedContentItem[];

  // Old properties (to be phased out or used for specific initial states)
  restyledImprovedCopy?: string | StructuredCopyOutput;
  restyledImprovedCopyPersona?: string;
  restyledImprovedVersions?: { content: string | StructuredCopyOutput; persona: string }[];
  
  restyledAlternativeCopy?: string | StructuredCopyOutput;
  restyledAlternativeCopyPersona?: string;
  restyledAlternativeVersionCollection?: { content: string | StructuredCopyOutput; persona: string }[];
  
  restyledHeadlines?: string[]; // Added property for restyled headlines
  restyledHeadlinesPersona?: string;
  restyledHeadlinesVersions?: { headlines: string[]; persona: string }[];
  
  improvedCopyScore?: ScoreData;
  alternativeCopyScore?: ScoreData; // Added score for alternative version
  restyledImprovedCopyScore?: ScoreData; // Added score for restyled content
  restyledAlternativeCopyScore?: ScoreData;
  promptUsed?: string; // Added to store the prompt used for token calculation
  wordCountAccuracy?: number; // Added for overall word count accuracy tracking
  
  // SEO metadata
  seoMetadata?: SeoMetadata;
  // Support for multiple alternative versions
  alternativeVersions?: (string | StructuredCopyOutput)[]; // Array of alternative versions
  alternativeVersionsPersonas?: string[]; // Array of personas used for each alternative version
  // Collection of restyled alternative versions, organized by alternative index
  restyledAlternativeVersionCollections?: { 
    alternativeIndex: number; 
    versions: { content: string | StructuredCopyOutput; persona: string }[] 
  }[];
  alternativeVersionScores?: ScoreData[]; // Array of scores for alternative versions
  restyledAlternativeVersions?: (string | StructuredCopyOutput)[]; // Array of restyled alternative versions
  restyledAlternativeVersionsPersonas?: string[]; // Array of personas used for each restyled alternative version
  restyledAlternativeVersionScores?: ScoreData[]; // Array of scores for restyled alternative versions
  
  // Track the session ID if created
  sessionId?: string;

  // GEO score for the main content
  geoScore?: GeoScoreData;

  // Validation failure fields (LIGHT validation layer)
  validationFailed?: boolean;
  validationErrors?: Array<{ code: string; message: string; path?: string }>;
  rawFailedOutput?: string;

  // Comparison result when comparing all outputs
  comparisonResult?: import('../services/api/comprehensiveScoring').ComparisonResult;

  // Per-version score cache for efficient re-scoring
  versionScores?: Record<string, import('../utils/versionScoreCache').CachedVersionScore>;

  // Deep analysis (narrative guidance, separate from scoring)
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>; // Per-version deep analysis cache
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta; // Overall verdict and metadata
  bestElementsResult?: import('../services/api/bestElements').BestElementsResult;
}

// Prefill interface for form prefills
export interface Prefill {
  id: string;
  user_id: string;
  label: string;
  category: string;
  is_public: boolean;
  data: Partial<FormState>;
  created_at?: string;
  updated_at?: string;
}

export interface FormState extends FormData {
  isLoading: boolean;
  isEvaluating?: boolean; // Make this optional to avoid type errors
  isGeneratingScores?: boolean; // New state for generating scores
  isGeneratingAlternative?: boolean; // New state for generating alternative copy
  isGeneratingHeadlines?: boolean; // New state for generating headlines

  // New granular loading states for on-demand generation
  isGeneratingRestyledImproved?: boolean; // New state for generating restyled improved copy
  isGeneratingRestyledAlternative?: boolean; // New state for generating restyled alternative copy

  // States for generating individual alternatives in sequence
  alternativeGenerationIndex?: number; // Track which alternative is being generated (0-based index)

  generationProgress: string[]; // Array to track generation progress messages
  promptEvaluation?: PromptEvaluation;
  copyResult?: CopyResult;
  templatePrefilledFields?: string[]; // Track which fields were prefilled from a template
  fieldsWithPlaceholders?: string[]; // Track which fields contain [] placeholders for visual highlighting

  // Validation failure fields (LIGHT validation layer)
  validationFailed?: boolean;
  validationErrors?: Array<{ code: string; message: string; path?: string }>;
  rawFailedOutput?: string;
}

// Define Supabase-related types
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  description?: string;
  user_id?: string;
  created_at?: string;
}

export interface CopySession {
  id: string;
  user_id: string;
  customer_id?: string;
  customer?: Customer;
  input_data: FormData;
  improved_copy: string | StructuredCopyOutput;
  alternative_copy?: string | StructuredCopyOutput;
  created_at: string;
  output_type?: string; // Added output_type field
  brief_description?: string; // Added brief description field
  session_name?: string; // Auto-generated human-readable session name
  scope_key?: string; // Session scope: 'copy-maker', 'copy-snap', 'quick-polish'
}

// Template interface
export interface Template {
  id?: string;
  user_id: string;
  template_name: string;
  description?: string;
  language: string;
  tone: string;
  word_count: string;
  custom_word_count?: number | null;
  target_audience?: string;
  key_message?: string;
  desired_emotion?: string;
  call_to_action?: string;
  brand_values?: string;
  keywords?: string;
  context?: string;
  brief_description?: string;
  page_type?: string | null;
  section?: string | null;
  business_description?: string | null;
  original_copy?: string | null;
  template_type: 'create' | 'improve';
  created_at?: string;
  competitor_urls?: string[];
  output_structure?: string[];
  product_service_name?: string;
  industry_niche?: string;
  tone_level?: number;
  reader_funnel_stage?: string;
  competitor_copy_text?: string;
  target_audience_pain_points?: string;
  preferred_writing_style?: string;
  language_style_constraints?: string[];
  excluded_terms?: string;
  generateHeadlines?: boolean;
  generateScores?: boolean;
  generateSeoMetadata?: boolean;
  generateGeoScore?: boolean;
  selectedPersona?: string;
  aiDecideWordCount?: boolean;
  prioritizeWordCount?: boolean;
  adhereToLittleWordCount?: boolean;
  littleWordCountTolerancePercentage?: number;
  wordCountTolerancePercentage?: number;
  forceElaborationsExamples?: boolean;
  enhanceForGEO?: boolean;
  addTldrSummary?: boolean;
  location?: string;
  geoRegions?: string;
  sectionBreakdown?: string;
  numberOfHeadlines?: number;
  numUrlSlugs?: number;
  numMetaDescriptions?: number;
  numH1Variants?: number;
  numH2Variants?: number;
  numH3Variants?: number;
  numOgTitles?: number;
  numOgDescriptions?: number;
  // Snake_case versions (returned from database)
  generate_seo_metadata?: boolean;
  generate_scores?: boolean;
  generate_geo_score?: boolean;
  force_keyword_integration?: boolean;
  force_elaborations_examples?: boolean;
  enhance_for_geo?: boolean;
  add_tldr_summary?: boolean;
  geo_regions?: string;
  num_url_slugs?: number;
  num_meta_descriptions?: number;
  num_h1_variants?: number;
  num_h2_variants?: number;
  num_h3_variants?: number;
  num_og_titles?: number;
  num_og_descriptions?: number;
  word_count_tolerance_percentage?: number;
  is_public?: boolean;
  form_state_snapshot?: any;
  category?: string;
  special_instructions?: string;
  includeSectionTitles?: boolean;
  include_section_titles?: boolean;
  // Customer and Brand Voice associations
  customer_id?: string | null;
  customerId?: string | null;
  brand_voice_id?: string | null;
  brandVoiceId?: string | null;
  // Create Variants
  createVariants?: boolean;
  create_variants?: boolean;
  numberOfVariants?: number;
  number_of_variants?: number;
}

// New SavedOutput interface for saved outputs
// ===== SAVED OUTPUTS: STRICT DATA CONTRACT =====
// Two distinct types to enforce meta vs detail loading pattern

/**
 * SavedOutputMeta: Lightweight metadata for list views
 * - Used by getUserSavedOutputs() for Dashboard listings
 * - EXCLUDES heavy fields: input_data, output_data
 * - Typical size: 1-3KB per record
 * - Safe to load 50-100 records at once
 */
export interface SavedOutputMeta {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  tags?: string[];
  session_id?: string | null;
  saved_mode: 'quick' | 'standard' | 'advanced';
  created_at: string;
  updated_at?: string;
  is_favorite: boolean;
}

/**
 * SavedOutputDetail: Full record including heavy data fields
 * - Used by getSavedOutputDetail() when opening a saved output
 * - INCLUDES heavy fields: input_data, output_data
 * - Typical size: 500KB-2MB per record
 * - Should only load ONE record at a time, on-demand
 */
export interface SavedOutputDetail extends SavedOutputMeta {
  input_data: any;  // Heavy: 50-100KB
  output_data: any; // Heavy: 500KB-2MB
}

/**
 * @deprecated Use SavedOutputMeta for lists, SavedOutputDetail for full records
 * This type is kept for backward compatibility but should not be used in new code
 */
export interface SavedOutput {
  id?: string;
  user_id: string;
  title: string;
  description?: string | null;
  input_data: any;
  output_data: any;
  tags?: string[];
  session_id?: string | null;
  saved_mode?: 'quick' | 'standard' | 'advanced';
  created_at?: string;
  updated_at?: string;
  is_favorite?: boolean;
}

// Interface for admin user creation (Phase 4B-2: tokens_allowed removed)
export interface AdminUserData {
  email: string;
  password: string;
  name: string;
  startDate: string | null;
  untilDate: string | null;
  creditsAllowed: number; // Changed from tokensAllowed (Phase 4B-2)
}

// Interface for Advanced Brand Voice Style Controls
export interface AdvancedBrandVoiceStyle {
  sentence_length?: 'short' | 'medium' | 'long' | 'varied';
  rhythm?: 'staccato' | 'smooth' | 'energetic' | 'calm';
  formality?: number; // 1-5 scale (1 = extremely casual, 5 = ultra formal)
  emotional_tone?: string[]; // e.g., ['warm', 'friendly', 'inspirational']
  persona?: 'mentor' | 'friend' | 'expert' | 'leader' | 'storyteller' | 'coach' | 'analyst' | 'luxury_concierge' | string;
  pov?: 'first_person' | 'second_person' | 'third_person' | 'brand_voice';
  figurative_level?: 'literal' | 'balanced' | 'metaphorical';
  detail_depth?: 'minimal' | 'balanced' | 'detailed' | 'highly_explanatory';
  vocabulary_complexity?: 'simple' | 'basic_professional' | 'sophisticated' | 'highly_intellectual';
  content_structure_rules?: {
    short_paragraphs?: boolean;
    use_bullets?: boolean;
    questions_allowed?: boolean;
    [key: string]: any;
  };
  allowed_elements?: string[]; // e.g., ['questions', 'bullets', 'analogies']
  forbidden_elements?: string[]; // e.g., ['emojis', 'slang', 'ALL CAPS']
}

// Interface for Brand Voice
export interface BrandVoice {
  id: string;
  customer_id: string;
  owner_user_id?: string;
  name: string;
  description?: string;
  personality_traits: string[];
  tone_style?: string;
  sentence_style?: string;
  preferred_vocabulary: string[];
  forbidden_terms: string[];
  cta_style?: string;
  punctuation_rules: {
    use_oxford_comma?: boolean;
    prefer_short_sentences?: boolean;
    max_sentence_length?: number;
    use_contractions?: boolean;
    exclamation_frequency?: 'rare' | 'moderate' | 'frequent';
  };
  advanced_style?: AdvancedBrandVoiceStyle; // New optional advanced style controls
  created_at: string;
  updated_at: string;
}

// Workflow System Types
export type WorkflowStepType = 'create_alternative_copy' | 'apply_voice_style' | 'analyze_compare_copy';

export interface WorkflowStepBase {
  id: string; // Unique identifier for each step
  type: WorkflowStepType;
  target: string; // e.g., 'original', 'alt_1', etc.
}

export interface CreateAlternativeCopyStep extends WorkflowStepBase {
  type: 'create_alternative_copy';
}

export interface ApplyVoiceStyleStep extends WorkflowStepBase {
  type: 'apply_voice_style';
  preset_voice_style?: string; // Preset voice style key (e.g., 'steve-jobs', 'seth-godin')
  brand_voice_id?: string; // Customer-specific brand voice ID
  brand_voice_name?: string; // Display name of the brand voice (for UI)
}

export interface AnalyzeCompareCopyStep extends WorkflowStepBase {
  type: 'analyze_compare_copy';
  analysisType?: string; // Type of analysis (e.g., 'comprehensive', 'marketing-effectiveness')
  customInstructions?: string; // Custom instructions for the analysis
  scoringContext?: ScoringContext; // Use-case context for scoring dimension weights
}

export type WorkflowStep = CreateAlternativeCopyStep | ApplyVoiceStyleStep | AnalyzeCompareCopyStep;

export type WorkflowPermissionLevel = 'view' | 'edit';

export interface WorkflowPermission {
  id: string;
  workflow_id: string;
  user_id: string;
  granted_by: string;
  permission_level: WorkflowPermissionLevel;
  created_at: string;
  updated_at: string;
  user_email?: string; // Populated when fetching permissions with user info
  granted_by_email?: string; // Populated when fetching permissions with user info
}

export interface Workflow {
  id: string;
  user_id: string;
  customer_id?: string | null;
  name: string;
  description?: string | null;
  steps: WorkflowStep[];
  enable_analyze_compare?: boolean;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
  permissions?: WorkflowPermission[]; // Populated when fetching workflow with permissions
  can_edit?: boolean; // Indicates if current user can edit this workflow
}

export interface WorkflowExecutionContext {
  [key: string]: string; // Maps output IDs to content (e.g., 'original' => content, 'alt_1' => content)
}

export interface WorkflowExecutionResult {
  success: boolean;
  generatedOutputs: GeneratedContentItem[];
  error?: string;
  shouldTriggerComparison?: boolean;
  analysisType?: string;
  customInstructions?: string;
  scoringContext?: ScoringContext;
}