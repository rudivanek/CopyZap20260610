export interface BrandVoicePreset {
  name: string;
  description: string;
  personality_traits: string[];
  tone_style: string;
  sentence_style: string;
  preferred_vocabulary: string[];
  forbidden_terms: string[];
  cta_style: string;
  punctuation_rules: {
    use_oxford_comma?: boolean;
    prefer_short_sentences?: boolean;
    max_sentence_length?: number;
    use_contractions?: boolean;
    exclamation_frequency?: 'rare' | 'moderate' | 'frequent';
  };
}

export const BRAND_VOICE_PRESETS: Record<string, BrandVoicePreset> = {
  'luxury-premium': {
    name: 'Luxury / Premium',
    description: 'Sophisticated, exclusive, and high-end brand voice for luxury products and services',
    personality_traits: ['sophisticated', 'exclusive', 'refined', 'timeless', 'elegant'],
    tone_style: 'formal-elegant',
    sentence_style: 'flowing-descriptive',
    preferred_vocabulary: ['curated', 'bespoke', 'exclusive', 'refined', 'exceptional', 'distinguished', 'premium', 'artisan', 'heritage'],
    forbidden_terms: ['cheap', 'discount', 'deal', 'bargain', 'sale', 'affordable', 'budget'],
    cta_style: 'subtle-invitation',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: false,
      max_sentence_length: 30,
      use_contractions: false,
      exclamation_frequency: 'rare'
    }
  },

  'corporate-trustworthy': {
    name: 'Corporate & Trustworthy',
    description: 'Professional, reliable, and authoritative voice for established businesses',
    personality_traits: ['professional', 'reliable', 'transparent', 'competent', 'trustworthy'],
    tone_style: 'formal-professional',
    sentence_style: 'clear-concise',
    preferred_vocabulary: ['innovative', 'proven', 'reliable', 'strategic', 'expertise', 'commitment', 'excellence', 'integrity', 'partnership'],
    forbidden_terms: ['maybe', 'hope', 'try', 'might', 'sort of', 'kind of', 'probably'],
    cta_style: 'direct-professional',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: true,
      max_sentence_length: 20,
      use_contractions: false,
      exclamation_frequency: 'rare'
    }
  },

  'friendly-warm': {
    name: 'Friendly & Warm',
    description: 'Approachable, conversational, and welcoming voice that builds connection',
    personality_traits: ['friendly', 'approachable', 'warm', 'genuine', 'helpful'],
    tone_style: 'conversational-warm',
    sentence_style: 'natural-flowing',
    preferred_vocabulary: ['welcome', 'together', 'community', 'family', 'support', 'care', 'help', 'guide', 'connect'],
    forbidden_terms: ['corporate', 'synergy', 'leverage', 'utilize', 'facilitate', 'implement'],
    cta_style: 'friendly-invitation',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: false,
      max_sentence_length: 25,
      use_contractions: true,
      exclamation_frequency: 'moderate'
    }
  },

  'playful-fun': {
    name: 'Playful & Fun',
    description: 'Energetic, lighthearted, and entertaining voice that delights',
    personality_traits: ['playful', 'energetic', 'creative', 'fun', 'quirky'],
    tone_style: 'casual-playful',
    sentence_style: 'short-punchy',
    preferred_vocabulary: ['awesome', 'amazing', 'love', 'exciting', 'fun', 'cool', 'wow', 'yay', 'fantastic'],
    forbidden_terms: ['boring', 'serious', 'formal', 'traditional', 'conventional', 'standard'],
    cta_style: 'enthusiastic-action',
    punctuation_rules: {
      use_oxford_comma: false,
      prefer_short_sentences: true,
      max_sentence_length: 15,
      use_contractions: true,
      exclamation_frequency: 'frequent'
    }
  },

  'minimalist-clean': {
    name: 'Minimalist & Clean',
    description: 'Simple, clear, and focused voice that cuts through noise',
    personality_traits: ['clear', 'focused', 'simple', 'direct', 'essential'],
    tone_style: 'neutral-clean',
    sentence_style: 'short-simple',
    preferred_vocabulary: ['simple', 'clear', 'essential', 'focus', 'pure', 'streamlined', 'efficient', 'minimal'],
    forbidden_terms: ['complicated', 'overwhelming', 'cluttered', 'excessive', 'unnecessary'],
    cta_style: 'direct-simple',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: true,
      max_sentence_length: 15,
      use_contractions: false,
      exclamation_frequency: 'rare'
    }
  },

  'tech-startup': {
    name: 'Tech Startup Energetic',
    description: 'Innovative, bold, and forward-thinking voice for tech companies',
    personality_traits: ['innovative', 'bold', 'disruptive', 'ambitious', 'visionary'],
    tone_style: 'confident-energetic',
    sentence_style: 'dynamic-impactful',
    preferred_vocabulary: ['innovative', 'transform', 'revolutionize', 'empower', 'scale', 'disrupting', 'breakthrough', 'cutting-edge', 'accelerate'],
    forbidden_terms: ['traditional', 'old-school', 'outdated', 'slow', 'conventional', 'legacy'],
    cta_style: 'bold-action',
    punctuation_rules: {
      use_oxford_comma: false,
      prefer_short_sentences: true,
      max_sentence_length: 18,
      use_contractions: true,
      exclamation_frequency: 'moderate'
    }
  },

  'storytelling-emotional': {
    name: 'Storytelling & Emotional',
    description: 'Narrative-driven, emotive voice that creates deep connection',
    personality_traits: ['authentic', 'emotive', 'inspiring', 'compassionate', 'human'],
    tone_style: 'warm-narrative',
    sentence_style: 'flowing-descriptive',
    preferred_vocabulary: ['journey', 'story', 'dream', 'passion', 'heart', 'inspire', 'imagine', 'believe', 'transform'],
    forbidden_terms: ['transaction', 'purchase', 'buy', 'sell', 'profit', 'deal'],
    cta_style: 'inspirational-invitation',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: false,
      max_sentence_length: 28,
      use_contractions: true,
      exclamation_frequency: 'moderate'
    }
  },

  'consulting-authority': {
    name: 'Consulting & Authority',
    description: 'Expert, insightful, and advisory voice that demonstrates thought leadership',
    personality_traits: ['expert', 'insightful', 'strategic', 'analytical', 'authoritative'],
    tone_style: 'professional-advisory',
    sentence_style: 'structured-analytical',
    preferred_vocabulary: ['insights', 'strategy', 'framework', 'methodology', 'optimize', 'enhance', 'leverage', 'best practices', 'assessment'],
    forbidden_terms: ['guess', 'try', 'hope', 'maybe', 'unsure', 'random'],
    cta_style: 'consultative-invitation',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: false,
      max_sentence_length: 25,
      use_contractions: false,
      exclamation_frequency: 'rare'
    }
  },

  'real-estate': {
    name: 'Real Estate Voice',
    description: 'Aspirational, trustworthy voice for real estate and property services',
    personality_traits: ['knowledgeable', 'trustworthy', 'aspirational', 'professional', 'local'],
    tone_style: 'professional-aspirational',
    sentence_style: 'descriptive-inviting',
    preferred_vocabulary: ['home', 'investment', 'neighborhood', 'lifestyle', 'opportunity', 'dream', 'location', 'community', 'value'],
    forbidden_terms: ['risky', 'uncertain', 'problematic', 'difficult', 'complicated'],
    cta_style: 'opportunity-driven',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: false,
      max_sentence_length: 22,
      use_contractions: false,
      exclamation_frequency: 'rare'
    }
  },

  'hospitality': {
    name: 'Hospitality Voice',
    description: 'Welcoming, service-oriented voice for hotels, restaurants, and hospitality',
    personality_traits: ['welcoming', 'attentive', 'warm', 'service-oriented', 'gracious'],
    tone_style: 'warm-welcoming',
    sentence_style: 'inviting-descriptive',
    preferred_vocabulary: ['welcome', 'experience', 'comfort', 'delight', 'savor', 'relax', 'enjoy', 'hospitality', 'memorable'],
    forbidden_terms: ['cheap', 'basic', 'standard', 'average', 'ordinary'],
    cta_style: 'warm-invitation',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: false,
      max_sentence_length: 24,
      use_contractions: false,
      exclamation_frequency: 'moderate'
    }
  },

  'ecommerce': {
    name: 'E-commerce Brand Voice',
    description: 'Persuasive, benefit-focused voice that drives conversions',
    personality_traits: ['persuasive', 'benefit-focused', 'urgent', 'value-driven', 'customer-centric'],
    tone_style: 'enthusiastic-persuasive',
    sentence_style: 'benefit-driven',
    preferred_vocabulary: ['save', 'exclusive', 'limited', 'free shipping', 'bestseller', 'trending', 'discover', 'shop', 'guarantee'],
    forbidden_terms: ['expensive', 'cost', 'pay more', 'overpriced', 'waste'],
    cta_style: 'urgent-action',
    punctuation_rules: {
      use_oxford_comma: false,
      prefer_short_sentences: true,
      max_sentence_length: 18,
      use_contractions: true,
      exclamation_frequency: 'frequent'
    }
  }
};

export const PRESET_OPTIONS = Object.keys(BRAND_VOICE_PRESETS).map(key => ({
  value: key,
  label: BRAND_VOICE_PRESETS[key].name
}));
