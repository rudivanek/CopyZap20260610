import { Language, Tone, PageType, WordCount, Model, AiEngine, SectionType, GeneratedContentItemType } from '../types';

export const LANGUAGES: Language[] = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese'
];

export const TONES: Tone[] = [
  'Professional',
  'Friendly',
  'Bold',
  'Minimalist',
  'Creative',
  'Persuasive'
];

export const PAGE_TYPES: PageType[] = [
  'Homepage',
  'About',
  'Services',
  'Contact',
  'Other'
];

export const SECTION_TYPES: SectionType[] = [
  'Hero Section',
  'Benefits',
  'Features',
  'Services',
  'About',
  'Testimonials',
  'FAQ',
  'Full Copy',
  'Other'
];

export const WORD_COUNTS: WordCount[] = [
  'Short: 50-100',
  'Medium: 100-200',
  'Long: 200-400',
  'Custom'
];

// Legacy MODELS array - deprecated, kept for backward compatibility
export const MODELS = [
  { label: 'Claude Sonnet 4.5 (claude-sonnet-4-5)', value: 'claude-sonnet-4-5' },
  { label: 'Claude Haiku 4.5 (claude-haiku-4-5)', value: 'claude-haiku-4-5' },
  { label: 'Claude Opus 4.5 (claude-opus-4-5)', value: 'claude-opus-4-5' },
  { label: 'DeepSeek V3 (deepseek-chat)', value: 'deepseek-chat' },
  { label: 'GPT-4 Omni (gpt-4o)', value: 'gpt-4o' },
  { label: 'ChatGPT-4o Latest (chatgpt-4o-latest)', value: 'chatgpt-4o-latest' },
  { label: 'GPT-4 Turbo (gpt-4-turbo)', value: 'gpt-4-turbo' },
  { label: 'GPT-3.5 Turbo (gpt-3.5-turbo)', value: 'gpt-3.5-turbo' },
  { label: 'Grok 4 Latest (grok-4-latest)', value: 'grok-4-latest' },
  { label: 'Gemini 2.0 Flash (gemini-2.0-flash)', value: 'gemini-2.0-flash' }
];

/**
 * SCORING_MODEL - Fixed model for all scoring operations
 *
 * All evaluation/scoring operations use this single model to ensure:
 * - Consistent scoring across all users
 * - Deterministic evaluation results
 * - Reliable comparison between versions
 *
 * This does NOT affect content generation, which uses the user-selected model.
 */
export const SCORING_MODEL: Model = 'gpt-4o';

// New simplified AI engines (only 2 visible to users)
export const AI_ENGINES = [
  {
    value: 'claude',
    label: 'Claude',
    description: 'Recommended',
    helperText: 'Best for persuasive, long-form, and premium copy.'
  },
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o',
    helperText: 'Best for structured and precise output.'
  }
];

// Define max tokens per model to use the appropriate limits
export const MAX_TOKENS_PER_MODEL = {
  'claude-sonnet-4-5': 64000, // Claude Sonnet 4.5 allows up to 64K output tokens
  'claude-haiku-4-5': 64000, // Claude Haiku 4.5 allows up to 64K output tokens
  'claude-opus-4-5': 64000, // Claude Opus 4.5 allows up to 64K output tokens
  'deepseek-chat': 8192, // DeepSeek API hard limit is 8,192 tokens
  'gpt-4o': 16000, // GPT-4o allows up to 16K output tokens
  'chatgpt-4o-latest': 16384, // ChatGPT-4o Latest allows up to 16K output tokens
  'gpt-4-turbo': 16000, // GPT-4 Turbo allows up to 16K output tokens
  'gpt-3.5-turbo': 16000,  // GPT-3.5 Turbo allows up to 16K output tokens
  'grok-4-latest': 16000,  // Grok allows up to 16K output tokens
  'gemini-2.0-flash': 8192  // Gemini 2.0 Flash allows up to 8K output tokens
};

export const OUTPUT_STRUCTURE_OPTIONS = [
  { value: 'header1', label: 'Header 1' },
  { value: 'header2', label: 'Header 2' },
  { value: 'structured', label: 'Structured with clear Subheadings' },
  { value: 'paragraphs', label: 'Paragraph' },
  { value: 'problem', label: 'Problem' },
  { value: 'solution', label: 'Solution' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'features', label: 'Features' },
  { value: 'bullets', label: 'Bullet Points' },
  { value: 'numbered', label: 'Numbered list' },
  { value: 'qaFormat', label: 'Q&A' },
  { value: 'faqJson', label: 'FAQ (JSON)' },
  { value: 'callToAction', label: 'Call to Action' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'statistics', label: 'Statistics' },
  { value: 'casestudy', label: 'Case Study' },
  { value: 'quote', label: 'Quote' },
  { value: 'summary', label: 'Summary' },
  { value: 'introduction', label: 'Introduction' },
  { value: 'conclusion', label: 'Conclusion' }
];

// Industry niche categories and options
export const INDUSTRY_NICHE_CATEGORIES = [
  {
    category: 'Business & Services',
    options: [
      { value: 'e-commerce', label: 'E-commerce' },
      { value: 'real-estate', label: 'Real Estate' },
      { value: 'legal-services', label: 'Legal Services' },
      { value: 'financial-services', label: 'Financial Services' },
      { value: 'consulting-coaching', label: 'Consulting & Coaching' },
      { value: 'marketing-advertising', label: 'Marketing & Advertising' },
      { value: 'web-design-development', label: 'Web Design & Development' },
      { value: 'saas-tech', label: 'SaaS / Tech' }
    ]
  },
  {
    category: 'Health & Wellness',
    options: [
      { value: 'healthcare-medical', label: 'Healthcare / Medical' },
      { value: 'mental-health-therapy', label: 'Mental Health / Therapy' },
      { value: 'fitness-training', label: 'Fitness / Personal Training' },
      { value: 'nutrition-diet', label: 'Nutrition / Diet Coaching' },
      { value: 'spa-beauty', label: 'Spa & Beauty' }
    ]
  },
  {
    category: 'Education',
    options: [
      { value: 'online-courses', label: 'Online Courses' },
      { value: 'coaching-mentorship', label: 'Coaching & Mentorship' },
      { value: 'schools-universities', label: 'Schools / Universities' },
      { value: 'elearning-platforms', label: 'E-learning Platforms' }
    ]
  },
  {
    category: 'Hospitality & Travel',
    options: [
      { value: 'hotels-resorts', label: 'Hotels / Resorts' },
      { value: 'restaurants-cafes', label: 'Restaurants / Cafés' },
      { value: 'tourism-tour-operators', label: 'Tourism / Tour Operators' },
      { value: 'event-planning', label: 'Event Planning' }
    ]
  },
  {
    category: 'Arts & Culture',
    options: [
      { value: 'photography', label: 'Photography' },
      { value: 'music-bands', label: 'Music / Bands' },
      { value: 'artists-galleries', label: 'Artists / Galleries' },
      { value: 'museums-cultural', label: 'Museums / Cultural Spaces' }
    ]
  },
  {
    category: 'Lifestyle & Fashion',
    options: [
      { value: 'fashion-apparel', label: 'Fashion & Apparel' },
      { value: 'jewelry-accessories', label: 'Jewelry & Accessories' },
      { value: 'home-decor', label: 'Home Decor' },
      { value: 'cosmetics-skincare', label: 'Cosmetics & Skincare' }
    ]
  },
  {
    category: 'Non-Profit & Community',
    options: [
      { value: 'ngo-charities', label: 'NGOs / Charities' },
      { value: 'religious-organizations', label: 'Religious Organizations' },
      { value: 'community-projects', label: 'Community Projects' }
    ]
  }
];

// Flattened industry niche options for simpler selection
export const INDUSTRY_NICHE_OPTIONS = INDUSTRY_NICHE_CATEGORIES.flatMap(
  category => category.options
);

// Restructured Voice Style options with categories
export const CATEGORIZED_VOICE_STYLES = [
  {
    category: 'Humanization Options',
    options: [
      { 
        value: 'Humanize', 
        label: 'Humanize', 
        tooltip: 'Transform text into a warm, conversational, relatable voice while preserving meaning and structure. Uses natural language patterns with subtle constraints on emojis and exclamation marks.' 
      },
      { 
        value: 'humanizeNoAIDetection', 
        label: 'Humanize (No AI Detection)', 
        tooltip: 'Transform text into natural, human-sounding content with imperfections, casual phrases, and conversational flow designed to avoid AI detection systems.' 
      },
    ]
  },
  {
    category: 'Generic Tone/Style',
    options: [
      { 
        value: 'Luxury Brand', 
        label: 'Luxury Brand', 
        tooltip: 'Sophisticated, exclusive, refined. Uses precise language with an air of exclusivity and timeless elegance.' 
      },
      { 
        value: 'Tech Startup', 
        label: 'Tech Startup', 
        tooltip: 'Modern, innovative, solution-oriented. Fast-paced with technical precision and forward-thinking language.' 
      },
      { 
        value: 'Professional Formal', 
        label: 'Professional Formal', 
        tooltip: 'Polished, authoritative, structured. Ideal for corporate communications requiring credibility.' 
      },
      { 
        value: 'Friendly Conversational', 
        label: 'Friendly Conversational', 
        tooltip: 'Warm, approachable, relatable. Uses casual language that builds connection and trust.' 
      },
      { 
        value: 'Bold Direct', 
        label: 'Bold Direct', 
        tooltip: 'Straightforward, confident, no-nonsense. Gets right to the point with clear value statements.' 
      },
      { 
        value: 'Cool Trendy', 
        label: 'Cool Trendy', 
        tooltip: 'Fresh, contemporary, culturally aware. Perfect for youth-oriented brands and modern audiences.' 
      },
      { 
        value: 'Minimalist', 
        label: 'Minimalist', 
        tooltip: 'Clean, essential, focused. Uses fewer words with greater impact, emphasizing clarity and simplicity.' 
      },
      { 
        value: 'Playful', 
        label: 'Playful', 
        tooltip: 'Fun, lighthearted, engaging. Uses humor and creativity to capture attention and create enjoyment.' 
      },
      { 
        value: 'High-End Exclusive', 
        label: 'High-End Exclusive', 
        tooltip: 'Premium, select, aspirational. Creates a sense of belonging to an elite group with privileged access.' 
      },
      { 
        value: 'Soft Empathetic', 
        label: 'Soft Empathetic', 
        tooltip: 'Caring, understanding, supportive. Focuses on emotional connection and addressing pain points.' 
      }
    ]
  },
  {
    category: 'Personas',
    options: [
      { 
        value: 'Alex Hormozi', 
        label: 'Alex Hormozi', 
        tooltip: 'Framework-focused, value-first, direct. Great for SaaS and offers.' 
      },
      { 
        value: 'Brené Brown', 
        label: 'Brené Brown', 
        tooltip: 'Empathetic, vulnerable, emotionally intelligent. Good for community or values-based messaging.' 
      },
      { 
        value: 'David Ogilvy', 
        label: 'David Ogilvy', 
        tooltip: 'Fact-driven, research-backed, elegant persuasion. The father of advertising\'s approach to long-form copy that sells through education and credibility.' 
      },
      { 
        value: 'Don Draper', 
        label: 'Don Draper', 
        tooltip: 'Emotional, cinematic, persuasion-heavy. Ideal for product storytelling or brand positioning.' 
      },
      { 
        value: 'Donald Miller', 
        label: 'Donald Miller', 
        tooltip: 'Clear, story-structured, benefit-driven. Ideal for service pages and value propositions.' 
      },
      { 
        value: 'Elon Musk', 
        label: 'Elon Musk', 
        tooltip: 'Visionary, technical, future-focused. Ideal for innovative tech products and moonshot ideas.' 
      },
      { 
        value: 'Gary Halbert', 
        label: 'Gary Halbert', 
        tooltip: 'Aggressive, emotional, classic direct-response copywriting. Perfect for high-conversion copy.' 
      },
      { 
        value: 'Maider Tomasena', 
        label: 'Maider Tomasena', 
        tooltip: 'Authentic, strategic, purpose-driven. Excellent for thoughtful business messaging and leadership content.' 
      },
      { 
        value: 'Marie Forleo', 
        label: 'Marie Forleo', 
        tooltip: 'Witty, upbeat, empowering. Best for women-focused branding or creator-led offers.' 
      },
      { 
        value: 'Richard Branson', 
        label: 'Richard Branson', 
        tooltip: 'Bold, adventurous, customer-focused. Excellent for disruptive brands and innovative services.' 
      },
      { 
        value: 'Seth Godin', 
        label: 'Seth Godin', 
        tooltip: 'Punchy, metaphorical, counter-intuitive. Great for thought leadership.' 
      },
      { 
        value: 'Simon Sinek', 
        label: 'Simon Sinek', 
        tooltip: 'Purpose-driven, inspirational, \'Start with Why\' tone. Great for mission-oriented messaging.' 
      },
      { 
        value: 'Steve Jobs', 
        label: 'Steve Jobs', 
        tooltip: 'Bold, visionary, minimalist. Great for launches and hero sections.' 
      },
      { 
        value: 'Tony Robbins', 
        label: 'Tony Robbins', 
        tooltip: 'High-energy, motivational, urgency-driven. Great for personal development or sales.' 
      }
    ]
  }
];

// Keep the original flat array for backwards compatibility
export const SPEAK_LIKE_OPTIONS = CATEGORIZED_VOICE_STYLES.flatMap(category => category.options);

// New constants for new fields
export const READER_FUNNEL_STAGES = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'consideration', label: 'Consideration' },
  { value: 'decision', label: 'Decision' },
  { value: 'retention', label: 'Retention' },
  { value: 'advocacy', label: 'Advocacy' }
];

export const PREFERRED_WRITING_STYLES = [
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'informative', label: 'Informative' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'educational', label: 'Educational' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'inspirational', label: 'Inspirational' }
];

export const LANGUAGE_STYLE_CONSTRAINTS = [
  'Avoid passive voice',
  'No idioms',
  'Avoid jargon',
  'Short sentences',
  'Simple vocabulary',
  'Avoid clichés',
  'Gender-neutral language',
  'Inclusive language'
];

export const DEFAULT_FORM_STATE = {
  tab: 'create' as const,
  language: 'English' as Language,
  tone: 'Professional' as Tone,
  wordCount: 'Medium: 100-200' as WordCount,
  customWordCount: 150,
  competitorUrls: ['', '', ''],
  pageType: 'Homepage' as PageType,
  section: '',
  businessDescription: '',
  originalCopy: '',
  targetAudience: '',
  keyMessage: '',
  desiredEmotion: '',
  callToAction: '',
  brandValues: '',
  keywords: '',
  keywordsExplicit: false,
  context: '',
  briefDescription: '',
  projectDescription: '', // Initialize project description as empty string
  model: 'claude-sonnet-4-5' as Model, // Legacy - kept for backward compatibility
  aiEngine: 'claude' as AiEngine, // New simplified engine selection (default: Claude)
  customerId: '',
  customerName: '',
  outputStructure: [], // Changed from 'none' string to empty array
  excludedTerms: '', // Initialize excluded terms as empty string
  isLoading: false,
  isGeneratingAlternative: false,
  generationProgress: [], // Initialize progress messages as an empty array
  // New fields with default values
  productServiceName: '',
  industryNiche: '',
  toneLevel: 50,  // Default to middle of scale
  readerFunnelStage: '',
  competitorCopyText: '',
  targetAudiencePainPoints: '',
  preferredWritingStyle: '',
  languageStyleConstraints: [],
  selectedPersona: '',  // Default to empty (no persona selected)
  // New generation options
  generateSeoMetadata: false,
  generateScores: false,
  generateGeoScore: false, // Default to false for GEO score generation
  sessionId: undefined,
  // SEO metadata variant counts
  numUrlSlugs: 1,
  numMetaDescriptions: 1,
  numH1Variants: 1,
  numH2Variants: 1,
  numH3Variants: 1,
  numOgTitles: 1,
  numOgDescriptions: 1,
  // Word count control
  forceElaborationsExamples: false, // Default to false for forcing elaborations
  // Strict word count control
  prioritizeWordCount: false, // Default to false for strict word count adherence
  wordCountTolerancePercentage: 20, // Default to 20% below target triggers revision
  faqSchemaEnabled: false, // Default to false for FAQPage Schema generation
  // Little word count control
  adhereToLittleWordCount: false, // Default to false for little word count adherence
  littleWordCountTolerancePercentage: 20, // Default to 20% tolerance for little word count
  enhanceForGEO: false, // Default to false for GEO enhancement
  addTldrSummary: true, // Default to true for TL;DR summary when GEO is enabled
  location: '', // Default to empty string for location targeting
  geoRegions: '', // Default to empty string for geo regions targeting
  includeSectionTitles: true, // Default to true for AI-generated section titles in structured output
  copyResult: {
    improvedCopy: '',
    generatedVersions: [] // Initialize generatedVersions as an empty array
  }
};