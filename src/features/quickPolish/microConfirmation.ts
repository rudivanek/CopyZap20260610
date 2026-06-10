import { ContentType } from './types';
import { analyzeDiff, EvidenceMetrics } from '../../utils/evidenceAnalyzer';

export type TrustMode = 'strict' | 'persuasion';

/**
 * Determines the trust mode for a given intent.
 * Strict = No new claims or CTAs allowed
 * Persuasion = Modest persuasion allowed, but no invented claims
 */
export function getTrustMode(intentId: string): TrustMode {
  const strictIntents = [
    'about',
    'email_intro',
    'problem_pain',
    'section_body'
  ];

  return strictIntents.includes(intentId) ? 'strict' : 'persuasion';
}

/**
 * Maps intent IDs to intent-specific micro-confirmation tags (evidence-based)
 */
function getIntentSpecificTag(intentId: string, evidence: EvidenceMetrics): string | null {
  // Email intro - check for conversational opening patterns
  if (intentId === 'email_intro') {
    // Check if output is concise and starts with engaging pattern
    if (evidence.lengthRatio <= 1.2 && evidence.outputWordCount < 100) {
      return 'Conversational opening';
    }
    return 'Email opening ready';
  }

  // Hero branding - should be concise
  if (intentId === 'hero_branding' && evidence.lengthRatio <= 0.95) {
    return 'Concise by design';
  }

  // Section body - improved flow if structure changed
  if (intentId === 'section_body' && (evidence.paragraphCountDelta !== 0 || evidence.sentenceCountDelta < 0)) {
    return 'Improved flow';
  }

  // About - balanced tone (no excessive hype)
  if (intentId === 'about' && !evidence.hypeReduced && evidence.hypeTokensInOutput === 0) {
    return 'Balanced tone';
  }

  // Product description - skimmable if more paragraphs or shorter sentences
  if (intentId === 'product_desc_short' && (evidence.paragraphCountDelta > 0 || evidence.avgSentenceLengthDelta < -3)) {
    return 'Skimmable structure';
  }

  // CTA - action-focused if concise
  if (intentId === 'cta' && evidence.outputWordCount < 50) {
    return 'Action-focused';
  }

  // SEO snippet - check if within SEO length
  if (intentId === 'seo_snippet' && evidence.outputWordCount >= 50 && evidence.outputWordCount <= 160) {
    return 'Search-friendly length';
  }

  // Instagram caption - caption-ready if within bounds
  if (intentId === 'instagram_caption' && evidence.outputWordCount < 200) {
    return 'Caption-ready';
  }

  // Ad short - punchy and compact
  if (intentId === 'ad_short' && evidence.outputWordCount < 30) {
    return 'Punchy and compact';
  }

  // Value prop - distilled if concise
  if (intentId === 'value_prop' && evidence.lengthRatio <= 0.9) {
    return 'Value distilled';
  }

  // Problem pain - clarified if structured better
  if (intentId === 'problem_pain' && evidence.paragraphCountDelta >= 0) {
    return 'Pain clarified';
  }

  return null;
}

interface MicroConfirmationParams {
  intentId: string;
  tone: string;
  contentType: ContentType;
  isRefined: boolean;
  sourceText?: string | any; // Source text for evidence analysis
  outputText: string | any; // Output text for evidence analysis
}

/**
 * Builds micro-confirmation tags for an output card using evidence-based analysis.
 * These tags show what rules/guardrails were applied (NOT scoring).
 * Max 3-4 tags total, based on actual text differences.
 */
export function buildMicroConfirmation(params: MicroConfirmationParams): string[] {
  const { intentId, tone, contentType, isRefined, sourceText, outputText } = params;
  const tags: string[] = [];
  const trustMode = getTrustMode(intentId);

  // Analyze evidence (only if sourceText is provided)
  let evidence: EvidenceMetrics | null = null;
  if (sourceText) {
    evidence = analyzeDiff(sourceText, outputText, intentId, contentType);
  }

  // Priority 1: Refinement applied (if applicable)
  if (isRefined) {
    tags.push('Refinement applied');
  }

  // Priority 2: Intent-specific tag (evidence-based if we have evidence)
  if (evidence) {
    const intentTag = getIntentSpecificTag(intentId, evidence);
    if (intentTag && tags.length < 4) {
      tags.push(intentTag);
    }
  }

  // Priority 3: Length/shape tag (evidence-based)
  if (evidence && tags.length < 4) {
    if (evidence.lengthRatio <= 0.85) {
      tags.push('Concise');
    } else if (evidence.lengthRatio >= 1.15) {
      tags.push('Expanded');
    } else if (evidence.lengthRatio >= 0.90 && evidence.lengthRatio <= 1.10) {
      tags.push('Kept length');
    }
  }

  // Priority 4: Structure tag (evidence-based)
  if (evidence && tags.length < 4) {
    if (evidence.paragraphCountDelta > 0 || evidence.avgSentenceLengthDelta < -3) {
      tags.push('More scannable');
    } else if (evidence.sentenceCountDelta < -2 && evidence.avgSentenceLengthDelta < -2) {
      tags.push('Structure tightened');
    } else if (evidence.paragraphCountDelta < 0 && evidence.lengthRatio < 0.9) {
      tags.push('More compact');
    }
  }

  // Priority 5: Trust tag based on trust mode (only ONE trust tag)
  if (tags.length < 4) {
    if (trustMode === 'strict') {
      // In strict mode, prefer showing "No CTA added" only if we have evidence it wasn't added
      if (evidence && !evidence.hasCtaInOutput) {
        tags.push('No CTA added');
      } else {
        tags.push('No new claims');
      }
    } else {
      // Persuasion mode
      tags.push('No invented claims');
    }
  }

  // Priority 6: Special evidence-based tags if room
  if (evidence && tags.length < 4) {
    if (evidence.hypeReduced) {
      tags.push('Reduced hype');
    } else if (evidence.ctaRemoved) {
      tags.push('CTA removed');
    } else if (evidence.isHtml && evidence.htmlPreserved) {
      tags.push('HTML preserved');
    }
  }

  // Fallbacks: Only if we don't have enough tags
  if (tags.length < 3) {
    tags.push('Tone aligned');
  }
  if (tags.length < 3) {
    tags.push('Clarity flow');
  }
  if (tags.length < 3) {
    tags.push('Meaning preserved');
  }

  // Return max 4 tags
  return tags.slice(0, 4);
}

/**
 * Formats micro-confirmation tags as a display string.
 * Can return either dot-separated or as array for chip display.
 */
export function formatMicroConfirmation(tags: string[]): string {
  return tags.join(' · ');
}

// ========================================
// VERSION ROLE EXPLANATIONS - EDITORIAL
// ========================================

type VersionDepth = 'concise' | 'overview' | 'in_depth' | 'narrative';
type IntentGroup = 'brand_identity' | 'action_short_form';

interface VersionRoleParams {
  outputText: string | any;
  intentId: string;
  isRefined: boolean;
  contentType: ContentType;
  languageCode?: string;
}

/**
 * "Why this version" label (localized)
 */
export const WHY_THIS_VERSION_LABEL: Record<string, string> = {
  en: 'Why this version',
  es: 'Por qué esta versión',
  de: 'Warum diese Version',
  fr: 'Pourquoi cette version'
};

/**
 * Refinement progression prefix (localized)
 */
const REFINEMENT_PREFIX: Record<string, string> = {
  en: 'Building on the previous version, ',
  es: 'Construyendo sobre la versión anterior, ',
  de: 'Aufbauend auf der vorherigen Version, ',
  fr: 'S\'appuyant sur la version précédente, '
};

/**
 * Intent group classification
 */
const INTENT_GROUPS: Record<string, IntentGroup> = {
  // Brand / Identity intents
  hero_branding: 'brand_identity',
  about: 'brand_identity',
  section_body: 'brand_identity',
  value_prop: 'brand_identity',

  // Action / Short-form intents
  cta: 'action_short_form',
  ad_short: 'action_short_form',
  instagram_caption: 'action_short_form',
  seo_snippet: 'action_short_form',
  email_intro: 'action_short_form',
  product_desc_short: 'action_short_form',
  problem_pain: 'action_short_form'
};

/**
 * Version role explanation templates (localized)
 * Structure: [language][intentGroup][depth] = explanation
 */
const VERSION_ROLE_TEMPLATES: Record<string, Record<IntentGroup, Record<VersionDepth, string>>> = {
  en: {
    brand_identity: {
      concise: 'A concise version that communicates the core positioning at a glance.',
      overview: 'A balanced overview that introduces the brand and its focus clearly.',
      in_depth: 'An expanded explanation that gives more context around the brand and its offering.',
      narrative: 'An in-depth brand narrative that explains positioning, structure, and differentiation.'
    },
    action_short_form: {
      concise: 'A short, punchy version designed for quick impact.',
      overview: 'A clear version that explains the message without unnecessary detail.',
      in_depth: 'An expanded version that provides additional context while staying focused.',
      narrative: 'A more detailed version that explains the message step by step.'
    }
  },
  es: {
    brand_identity: {
      concise: 'Una versión concisa que comunica el posicionamiento central de un vistazo.',
      overview: 'Una visión equilibrada que presenta la marca y su enfoque claramente.',
      in_depth: 'Una explicación ampliada que proporciona más contexto sobre la marca y su oferta.',
      narrative: 'Una narrativa de marca profunda que explica posicionamiento, estructura y diferenciación.'
    },
    action_short_form: {
      concise: 'Una versión corta y contundente diseñada para un impacto rápido.',
      overview: 'Una versión clara que explica el mensaje sin detalles innecesarios.',
      in_depth: 'Una versión ampliada que proporciona contexto adicional manteniéndose enfocada.',
      narrative: 'Una versión más detallada que explica el mensaje paso a paso.'
    }
  },
  de: {
    brand_identity: {
      concise: 'Eine prägnante Version, die die Kernpositionierung auf einen Blick kommuniziert.',
      overview: 'Ein ausgewogener Überblick, der die Marke und ihren Fokus klar vorstellt.',
      in_depth: 'Eine erweiterte Erklärung, die mehr Kontext zur Marke und ihrem Angebot bietet.',
      narrative: 'Eine tiefgehende Markenerzählung, die Positionierung, Struktur und Differenzierung erklärt.'
    },
    action_short_form: {
      concise: 'Eine kurze, prägnante Version für schnelle Wirkung.',
      overview: 'Eine klare Version, die die Botschaft ohne unnötige Details erklärt.',
      in_depth: 'Eine erweiterte Version, die zusätzlichen Kontext bietet und fokussiert bleibt.',
      narrative: 'Eine detailliertere Version, die die Botschaft Schritt für Schritt erklärt.'
    }
  },
  fr: {
    brand_identity: {
      concise: 'Une version concise qui communique le positionnement central en un coup d\'œil.',
      overview: 'Un aperçu équilibré qui présente la marque et son orientation clairement.',
      in_depth: 'Une explication étendue qui donne plus de contexte sur la marque et son offre.',
      narrative: 'Un récit de marque approfondi qui explique le positionnement, la structure et la différenciation.'
    },
    action_short_form: {
      concise: 'Une version courte et percutante conçue pour un impact rapide.',
      overview: 'Une version claire qui explique le message sans détails inutiles.',
      in_depth: 'Une version étendue qui fournit un contexte supplémentaire tout en restant ciblée.',
      narrative: 'Une version plus détaillée qui explique le message étape par étape.'
    }
  }
};

/**
 * Classifies the version depth based on output characteristics
 */
function classifyVersionDepth(outputText: string, contentType: ContentType): VersionDepth {
  const text = String(outputText).trim();
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  // Check for narrative indicators first (overrides word count)
  const paragraphCount = contentType === 'html'
    ? (text.match(/<p>/g) || []).length
    : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  const hasMarkdownHeadline = /^#+\s/.test(text) || /^\*\*.*\*\*$/m.test(text);
  const hasHtmlHeadline = /<h[1-6]>/i.test(text);

  if (paragraphCount >= 3 || hasMarkdownHeadline || hasHtmlHeadline) {
    return 'narrative';
  }

  // Word count-based classification
  if (wordCount < 40) {
    return 'concise';
  } else if (wordCount <= 120) {
    return 'overview';
  } else {
    return 'in_depth';
  }
}

/**
 * Gets the intent group for a given intent ID
 */
function getIntentGroup(intentId: string): IntentGroup {
  return INTENT_GROUPS[intentId] || 'action_short_form';
}

/**
 * Gets the localized "Why this version" label
 */
export function getWhyThisVersionLabel(languageCode: string = 'en'): string {
  const lang = languageCode.toLowerCase().substring(0, 2);
  return WHY_THIS_VERSION_LABEL[lang] || WHY_THIS_VERSION_LABEL.en;
}

/**
 * Builds a version role explanation that describes WHAT KIND of version this is
 * and WHY a user would choose it.
 *
 * This is NOT scoring or mechanical diff analysis. It explains the editorial role.
 */
export function buildVersionRoleExplanation(params: VersionRoleParams): string {
  const { outputText, intentId, isRefined, contentType, languageCode = 'en' } = params;

  // Step 1: Classify version depth
  const depth = classifyVersionDepth(outputText as string, contentType);

  // Step 2: Determine intent group
  const intentGroup = getIntentGroup(intentId);

  // Step 3: Get localized template
  const lang = languageCode.toLowerCase().substring(0, 2);
  const templates = VERSION_ROLE_TEMPLATES[lang] || VERSION_ROLE_TEMPLATES.en;
  const groupTemplates = templates[intentGroup];
  let explanation = groupTemplates[depth];

  // Step 4: Add refinement prefix if applicable
  if (isRefined) {
    const prefix = REFINEMENT_PREFIX[lang] || REFINEMENT_PREFIX.en;
    // Lowercase the first letter of the explanation for grammatical correctness
    explanation = prefix + explanation.charAt(0).toLowerCase() + explanation.slice(1);
  }

  return explanation;
}

// Legacy export for backward compatibility (not used in QuickPolish anymore)
export const buildWhyThisVersion = buildVersionRoleExplanation;
