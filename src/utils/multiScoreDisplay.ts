/**
 * MULTI-SCORE DISPLAY UTILITIES - PHASE 1
 *
 * IMPORTANT: These are UI-ONLY display scores for explanatory purposes.
 * They do NOT affect:
 * - Current ranking logic
 * - Winner selection
 * - Final score calculation
 * - Comparison algorithms
 * - Any stored data
 *
 * These are temporary heuristics that derive display-only scores from text content.
 * In Phase 2+, these will be replaced with real scoring from the AI engine.
 */

/**
 * Risk Level - Label-based assessment
 */
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface MultiScoreDisplay {
  conversion: number;  // 0-100
  trust: number;       // 0-100
  risk: RiskLevel;     // Low/Medium/High
}

/**
 * Phase 1.2-1.3: Detailed display scores with explanations and summary
 */
export interface MultiScoreDisplayDetailed {
  summary: string; // Phase 1.3: One-sentence overview
  conversion: {
    score: number;
    reasons: { text: string; isPositive: boolean }[];
  };
  trust: {
    score: number;
    reasons: { text: string; isPositive: boolean }[];
  };
  risk: {
    level: RiskLevel;
    reasons: string[];
  };
}

/**
 * Estimate Conversion Score (Display Only)
 *
 * Increases for:
 * - Clear CTAs
 * - Action verbs
 * - Urgency language
 * - Business-outcome language
 * - Metrics/percentages
 *
 * Decreases for:
 * - Vague language
 * - Purely descriptive text
 * - Lack of direction
 */
export function estimateConversionDisplayScore(text: string): number {
  if (!text || text.trim().length === 0) return 50; // Neutral baseline

  const textLower = text.toLowerCase();
  let score = 50; // Start at neutral

  // Positive signals for conversion
  const ctaWords = ['get', 'start', 'try', 'buy', 'sign up', 'join', 'claim', 'download', 'subscribe', 'book', 'schedule', 'register', 'request'];
  const actionVerbs = ['discover', 'unlock', 'transform', 'achieve', 'boost', 'increase', 'improve', 'save', 'earn', 'gain'];
  const urgencyWords = ['now', 'today', 'limited', 'exclusive', 'don\'t miss', 'hurry', 'last chance', 'only', 'instant', 'immediately'];
  const businessOutcome = ['revenue', 'roi', 'growth', 'results', 'profit', 'conversion', 'sales', 'leads', 'customers'];

  // Count positive signals
  let ctaCount = 0;
  ctaWords.forEach(word => {
    if (textLower.includes(word)) ctaCount++;
  });

  let actionCount = 0;
  actionVerbs.forEach(verb => {
    if (textLower.includes(verb)) actionCount++;
  });

  let urgencyCount = 0;
  urgencyWords.forEach(word => {
    if (textLower.includes(word)) urgencyCount++;
  });

  let businessCount = 0;
  businessOutcome.forEach(word => {
    if (textLower.includes(word)) businessCount++;
  });

  // Metrics/percentages check
  const hasPercentages = /\d+%/.test(text);
  const hasNumbers = /\$\d+|\d+x|\d+,\d+/.test(text);

  // Calculate boosts
  score += Math.min(ctaCount * 5, 15);        // Up to +15 for CTAs
  score += Math.min(actionCount * 3, 12);     // Up to +12 for action verbs
  score += Math.min(urgencyCount * 4, 12);    // Up to +12 for urgency
  score += Math.min(businessCount * 2, 8);    // Up to +8 for business outcomes
  if (hasPercentages) score += 5;
  if (hasNumbers) score += 3;

  // Negative signals
  const vagueWords = ['maybe', 'might', 'could', 'possibly', 'perhaps', 'somewhat'];
  let vagueCount = 0;
  vagueWords.forEach(word => {
    if (textLower.includes(word)) vagueCount++;
  });

  score -= vagueCount * 4; // Penalty for vague language

  // Check if text is too descriptive (low verb-to-word ratio)
  const words = text.split(/\s+/).length;
  const hasLowActionRatio = (ctaCount + actionCount) / words < 0.02;
  if (hasLowActionRatio && words > 50) {
    score -= 8; // Penalty for overly descriptive content
  }

  // Clamp between 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Estimate Trust Score (Display Only)
 *
 * Increases for:
 * - Clarity
 * - Testimonials/proof
 * - Calm professional tone
 * - Low exaggeration
 * - Concrete explanations
 *
 * Decreases for:
 * - Overly aggressive tone
 * - Hype-heavy language
 * - Extreme unsupported claims
 */
export function estimateTrustDisplayScore(text: string): number {
  if (!text || text.trim().length === 0) return 50; // Neutral baseline

  const textLower = text.toLowerCase();
  let score = 50; // Start at neutral

  // Positive signals for trust
  const proofWords = ['proven', 'tested', 'certified', 'verified', 'guaranteed', 'research', 'study', 'data', 'evidence'];
  const testimonialWords = ['testimonial', 'review', 'customer', 'client', 'rated', 'trusted by', 'used by'];
  const clarityWords = ['simply', 'clear', 'transparent', 'straightforward', 'easy to understand', 'exactly', 'specifically'];
  const professionalWords = ['professional', 'expert', 'experienced', 'qualified', 'specialized', 'industry'];

  let proofCount = 0;
  proofWords.forEach(word => {
    if (textLower.includes(word)) proofCount++;
  });

  let testimonialCount = 0;
  testimonialWords.forEach(word => {
    if (textLower.includes(word)) testimonialCount++;
  });

  let clarityCount = 0;
  clarityWords.forEach(word => {
    if (textLower.includes(word)) clarityCount++;
  });

  let professionalCount = 0;
  professionalWords.forEach(word => {
    if (textLower.includes(word)) professionalCount++;
  });

  // Calculate boosts
  score += Math.min(proofCount * 5, 15);          // Up to +15 for proof
  score += Math.min(testimonialCount * 6, 12);    // Up to +12 for testimonials
  score += Math.min(clarityCount * 3, 9);         // Up to +9 for clarity
  score += Math.min(professionalCount * 2, 6);    // Up to +6 for professionalism

  // Negative signals - hype and exaggeration
  const hypeWords = ['revolutionary', 'breakthrough', 'amazing', 'incredible', 'unbelievable', 'mind-blowing', 'shocking', 'insane'];
  const aggressiveWords = ['must', 'need to', 'have to', 'cannot afford', 'missing out', 'stupid not to'];
  const extremeWords = ['best in the world', 'never before', 'only solution', 'guaranteed success', 'instant millionaire', 'overnight'];

  let hypeCount = 0;
  hypeWords.forEach(word => {
    if (textLower.includes(word)) hypeCount++;
  });

  let aggressiveCount = 0;
  aggressiveWords.forEach(word => {
    if (textLower.includes(word)) aggressiveCount++;
  });

  let extremeCount = 0;
  extremeWords.forEach(word => {
    if (textLower.includes(word)) extremeCount++;
  });

  // Apply penalties
  score -= Math.min(hypeCount * 5, 20);      // Up to -20 for hype
  score -= Math.min(aggressiveCount * 4, 15); // Up to -15 for aggressive tone
  score -= Math.min(extremeCount * 8, 25);   // Up to -25 for extreme claims

  // Check for excessive caps (shouting)
  const capsCount = (text.match(/[A-Z]{3,}/g) || []).length;
  if (capsCount > 3) {
    score -= 10; // Penalty for excessive caps
  }

  // Check for excessive exclamation marks
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    score -= 8; // Penalty for excessive excitement
  }

  // Clamp between 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Estimate Risk Level (Display Only)
 *
 * Risk becomes higher if text contains:
 * - Many percentages/ROI/numeric claims
 * - Bold unverifiable claims
 * - Case-style proof without evidence in source
 */
export function estimateRiskDisplayLevel(text: string): RiskLevel {
  if (!text || text.trim().length === 0) return 'Low'; // Default to low risk

  const textLower = text.toLowerCase();
  let riskScore = 0; // Internal risk scoring (0-10)

  // Count numeric claims
  const percentageCount = (text.match(/\d+%/g) || []).length;
  const roiMentions = textLower.includes('roi') || textLower.includes('return on investment');
  const multiplierCount = (text.match(/\d+x/g) || []).length;
  const dollarCount = (text.match(/\$\d+/g) || []).length;

  if (percentageCount > 3) riskScore += 2;
  if (percentageCount > 6) riskScore += 2;
  if (roiMentions) riskScore += 1;
  if (multiplierCount > 2) riskScore += 2;
  if (dollarCount > 3) riskScore += 1;

  // Unverifiable bold claims
  const boldClaims = [
    'guaranteed results',
    'proven to work',
    '100% success',
    'never fails',
    'scientifically proven',
    'clinically tested',
    'doctor recommended',
    'award-winning',
    '#1 in the world',
    'best in class'
  ];

  let boldClaimCount = 0;
  boldClaims.forEach(claim => {
    if (textLower.includes(claim)) boldClaimCount++;
  });

  if (boldClaimCount > 0) riskScore += 2;
  if (boldClaimCount > 2) riskScore += 2;

  // Case study mentions without supporting context
  const hasCaseStudy = textLower.includes('case study') || textLower.includes('case example');
  const hasProof = textLower.includes('research') || textLower.includes('data') || textLower.includes('study showed');

  if (hasCaseStudy && !hasProof) {
    riskScore += 2; // Mentions cases without backing them up
  }

  // Extreme ROI claims
  const extremeRoiClaims = ['10x roi', '20x roi', '50x roi', '100x roi', '1000% return', '500% increase'];
  extremeRoiClaims.forEach(claim => {
    if (textLower.includes(claim)) riskScore += 3;
  });

  // Map risk score to level
  if (riskScore >= 7) return 'High';
  if (riskScore >= 3) return 'Medium';
  return 'Low';
}

/**
 * Get short risk level label (for compact display)
 * Phase 1.1: Tighter labels for dense layouts
 */
export function getShortRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'Low':
      return 'Low';
    case 'Medium':
      return 'Med';
    case 'High':
      return 'High';
  }
}

/**
 * Get risk level label with explanation (for tooltips/titles)
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case 'Low':
      return 'Low claim risk';
    case 'Medium':
      return 'Medium claim risk - Some claims may need review';
    case 'High':
      return 'High claim risk - Claims should be verified';
  }
}

/**
 * Get risk level color class for styling
 * Phase 1.1: More subtle, professional colors
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'Low':
      return 'text-gray-600 dark:text-gray-400';
    case 'Medium':
      return 'text-gray-700 dark:text-gray-300';
    case 'High':
      return 'text-gray-800 dark:text-gray-200';
  }
}

/**
 * Get risk level background color for badges
 * Phase 1.1: Subtle tonal distinctions, not alarm-style
 */
export function getRiskLevelBg(level: RiskLevel): string {
  switch (level) {
    case 'Low':
      return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
    case 'Medium':
      return 'bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600';
    case 'High':
      return 'bg-gray-100 dark:bg-gray-800 border-gray-500 dark:border-gray-500';
  }
}

/**
 * Main function to calculate all display scores for a version
 */
export function calculateMultiScoreDisplay(text: string): MultiScoreDisplay {
  return {
    conversion: estimateConversionDisplayScore(text),
    trust: estimateTrustDisplayScore(text),
    risk: estimateRiskDisplayLevel(text)
  };
}

/**
 * PHASE 1.2-1.3: Detailed estimation functions with refined explanations
 * These are UI-ONLY heuristics for explaining the display scores
 */

/**
 * PHASE 1.3: Helper to filter weak reasons and enforce thresholds
 */
interface ReasonCandidate {
  text: string;
  isPositive: boolean;
  strength: number; // 0-10, higher = more meaningful
}

function selectStrongestReasons(
  candidates: ReasonCandidate[],
  maxCount: number
): { text: string; isPositive: boolean }[] {
  // Filter out weak signals (strength < 4)
  const meaningful = candidates.filter(c => c.strength >= 4);

  // Sort by strength, take top N
  const sorted = meaningful.sort((a, b) => b.strength - a.strength);

  return sorted.slice(0, maxCount).map(c => ({
    text: c.text,
    isPositive: c.isPositive
  }));
}

/**
 * Estimate Conversion Score with Detailed Reasons (Display Only)
 * Phase 1.3: Stricter thresholds, max 3 reasons, no weak signals
 */
export function estimateConversionDisplayScoreDetailed(text: string): { score: number; reasons: { text: string; isPositive: boolean }[] } {
  if (!text || text.trim().length === 0) {
    return { score: 50, reasons: [] };
  }

  const textLower = text.toLowerCase();
  const candidates: ReasonCandidate[] = [];

  // Check for CTAs (require meaningful presence)
  const ctaWords = ['get', 'start', 'try', 'buy', 'sign up', 'join', 'claim', 'download', 'subscribe', 'book', 'schedule', 'register', 'request'];
  const ctaCount = ctaWords.filter(word => textLower.includes(word)).length;
  if (ctaCount >= 2) {
    candidates.push({
      text: `${ctaCount} clear CTAs found`,
      isPositive: true,
      strength: 8
    });
  } else if (ctaCount === 1) {
    candidates.push({
      text: 'CTA present',
      isPositive: true,
      strength: 6
    });
  }

  // Check for action verbs (require multiple)
  const actionVerbs = ['discover', 'unlock', 'transform', 'achieve', 'boost', 'increase', 'improve', 'save', 'earn', 'gain'];
  const actionCount = actionVerbs.filter(verb => textLower.includes(verb)).length;
  if (actionCount >= 3) {
    candidates.push({
      text: 'Strong action-oriented language',
      isPositive: true,
      strength: 7
    });
  } else if (actionCount === 2) {
    candidates.push({
      text: 'Action-focused wording',
      isPositive: true,
      strength: 5
    });
  }

  // Check for urgency (require clear presence)
  const urgencyWords = ['now', 'today', 'limited', 'exclusive', 'don\'t miss', 'hurry', 'last chance', 'only'];
  const urgencyCount = urgencyWords.filter(word => textLower.includes(word)).length;
  if (urgencyCount >= 2) {
    candidates.push({
      text: 'Multiple urgency triggers',
      isPositive: true,
      strength: 7
    });
  } else if (urgencyCount === 1) {
    candidates.push({
      text: 'Urgency cue present',
      isPositive: true,
      strength: 5
    });
  }

  // Check for business outcomes
  const businessOutcome = ['revenue', 'roi', 'growth', 'results', 'profit', 'conversion', 'sales', 'leads', 'customers'];
  const businessCount = businessOutcome.filter(word => textLower.includes(word)).length;
  if (businessCount >= 2) {
    candidates.push({
      text: 'Ties to business outcomes',
      isPositive: true,
      strength: 6
    });
  }

  // Check for vague language (only flag if meaningful)
  const vagueWords = ['maybe', 'might', 'could', 'possibly', 'perhaps', 'somewhat'];
  const vagueCount = vagueWords.filter(word => textLower.includes(word)).length;
  if (vagueCount >= 2) {
    candidates.push({
      text: 'Vague language weakens clarity',
      isPositive: false,
      strength: 6
    });
  }

  // Check for missing direction (only if truly sparse)
  const words = text.split(/\s+/).length;
  const totalSignals = ctaCount + actionCount + urgencyCount;
  if (words > 50 && totalSignals === 0) {
    candidates.push({
      text: 'No clear call to action',
      isPositive: false,
      strength: 7
    });
  }

  const score = estimateConversionDisplayScore(text);
  const reasons = selectStrongestReasons(candidates, 3); // Max 3 reasons

  return { score, reasons };
}

/**
 * Estimate Trust Score with Detailed Reasons (Display Only)
 * Phase 1.3: Stricter thresholds, max 3 reasons, no weak signals
 */
export function estimateTrustDisplayScoreDetailed(text: string): { score: number; reasons: { text: string; isPositive: boolean }[] } {
  if (!text || text.trim().length === 0) {
    return { score: 50, reasons: [] };
  }

  const textLower = text.toLowerCase();
  const candidates: ReasonCandidate[] = [];

  // Check for proof/credibility (require meaningful presence)
  const proofWords = ['proven', 'tested', 'certified', 'verified', 'guaranteed', 'research', 'study', 'data', 'evidence'];
  const proofCount = proofWords.filter(word => textLower.includes(word)).length;
  if (proofCount >= 2) {
    candidates.push({
      text: 'Multiple proof elements cited',
      isPositive: true,
      strength: 8
    });
  } else if (proofCount === 1) {
    candidates.push({
      text: 'Includes proof language',
      isPositive: true,
      strength: 6
    });
  }

  // Check for testimonials/social proof
  const testimonialWords = ['testimonial', 'review', 'customer', 'client', 'rated', 'trusted by', 'used by'];
  const testimonialCount = testimonialWords.filter(word => textLower.includes(word)).length;
  if (testimonialCount >= 2) {
    candidates.push({
      text: 'Social proof referenced',
      isPositive: true,
      strength: 7
    });
  }

  // Check for hype language (require meaningful presence)
  const hypeWords = ['revolutionary', 'breakthrough', 'amazing', 'incredible', 'unbelievable', 'mind-blowing', 'shocking', 'insane'];
  const hypeCount = hypeWords.filter(word => textLower.includes(word)).length;
  if (hypeCount >= 2) {
    candidates.push({
      text: 'Hype language reduces credibility',
      isPositive: false,
      strength: 7
    });
  } else if (hypeCount === 1) {
    candidates.push({
      text: 'Exaggerated claims present',
      isPositive: false,
      strength: 5
    });
  }

  // Check for excessive caps (meaningful threshold)
  const capsCount = (text.match(/[A-Z]{3,}/g) || []).length;
  if (capsCount > 5) {
    candidates.push({
      text: 'Excessive caps feel pushy',
      isPositive: false,
      strength: 6
    });
  }

  // Check for extreme claims
  const extremeWords = ['best in the world', 'never before', 'only solution', 'guaranteed success', 'instant millionaire', 'overnight'];
  const extremeCount = extremeWords.filter(word => textLower.includes(word)).length;
  if (extremeCount >= 1) {
    candidates.push({
      text: 'Extreme claims lack support',
      isPositive: false,
      strength: 8
    });
  }

  // Check for aggressive pressure tactics
  const aggressiveWords = ['must', 'need to', 'have to', 'cannot afford', 'missing out', 'stupid not to'];
  const aggressiveCount = aggressiveWords.filter(word => textLower.includes(word)).length;
  if (aggressiveCount >= 2) {
    candidates.push({
      text: 'Pressure language undermines trust',
      isPositive: false,
      strength: 7
    });
  }

  const score = estimateTrustDisplayScore(text);
  const reasons = selectStrongestReasons(candidates, 3); // Max 3 reasons

  return { score, reasons };
}

/**
 * Estimate Risk Level with Detailed Reasons (Display Only)
 * Phase 1.3: Stricter thresholds, max 2 reasons, no weak signals
 */
export function estimateRiskDisplayLevelDetailed(text: string): { level: RiskLevel; reasons: string[] } {
  if (!text || text.trim().length === 0) {
    return { level: 'Low', reasons: [] };
  }

  const textLower = text.toLowerCase();
  interface RiskCandidate {
    text: string;
    strength: number;
  }
  const candidates: RiskCandidate[] = [];

  const level = estimateRiskDisplayLevel(text);

  // Build reasons based on meaningful detection
  const percentageCount = (text.match(/\d+%/g) || []).length;
  if (percentageCount >= 5) {
    candidates.push({
      text: `Heavy use of percentage claims (${percentageCount})`,
      strength: 8
    });
  } else if (percentageCount >= 3) {
    candidates.push({
      text: `Multiple percentage claims (${percentageCount})`,
      strength: 6
    });
  }

  const multiplierCount = (text.match(/\d+x/g) || []).length;
  if (multiplierCount >= 3) {
    candidates.push({
      text: `Many growth multipliers (${multiplierCount}x patterns)`,
      strength: 7
    });
  }

  const boldClaims = [
    'guaranteed results', 'proven to work', '100% success', 'never fails',
    'scientifically proven', 'clinically tested', 'award-winning', '#1 in the world'
  ];
  const boldClaimCount = boldClaims.filter(claim => textLower.includes(claim)).length;
  if (boldClaimCount >= 2) {
    candidates.push({
      text: 'Multiple bold claims need verification',
      strength: 9
    });
  } else if (boldClaimCount === 1) {
    candidates.push({
      text: 'Strong claim needs support',
      strength: 7
    });
  }

  const hasCaseStudy = textLower.includes('case study') || textLower.includes('case example');
  const hasProof = textLower.includes('research') || textLower.includes('data') || textLower.includes('study showed');
  if (hasCaseStudy && !hasProof) {
    candidates.push({
      text: 'Case studies lack detail',
      strength: 6
    });
  }

  // Check for extreme ROI claims
  const extremeRoiClaims = ['10x roi', '20x roi', '50x roi', '100x roi', '1000% return', '500% increase'];
  const hasExtremeRoi = extremeRoiClaims.some(claim => textLower.includes(claim));
  if (hasExtremeRoi) {
    candidates.push({
      text: 'Extreme ROI claims present',
      strength: 9
    });
  }

  // Sort by strength and take top 2
  const meaningful = candidates.filter(c => c.strength >= 5);
  const sorted = meaningful.sort((a, b) => b.strength - a.strength);
  const reasons = sorted.slice(0, 2).map(c => c.text);

  return { level, reasons };
}

/**
 * Phase 1.3: Generate one-sentence summary based on scores
 * Returns a concise, copywriter-friendly overview
 */
function generateMultiScoreSummary(
  conversion: number,
  trust: number,
  risk: RiskLevel
): string {
  // Determine strongest and weakest aspects
  const conversionLevel = conversion >= 70 ? 'high' : conversion >= 50 ? 'moderate' : 'low';
  const trustLevel = trust >= 70 ? 'high' : trust >= 50 ? 'moderate' : 'low';

  // Generate concise summary based on profile
  if (conversionLevel === 'high' && trustLevel === 'high' && risk === 'Low') {
    return 'Strong action-oriented copy with good credibility.';
  }

  if (conversionLevel === 'high' && trustLevel === 'low') {
    return 'Pushes action but may lack credibility signals.';
  }

  if (conversionLevel === 'low' && trustLevel === 'high') {
    return 'Credible messaging, but light on conversion focus.';
  }

  if (risk === 'High') {
    return 'Claims should be reviewed for verification.';
  }

  if (conversionLevel === 'high' && risk === 'Medium') {
    return 'Action-focused with some claims to verify.';
  }

  if (trustLevel === 'low' && risk === 'High') {
    return 'Multiple credibility and claim issues detected.';
  }

  if (conversionLevel === 'moderate' && trustLevel === 'moderate') {
    return 'Balanced but no standout strengths.';
  }

  if (conversionLevel === 'low' && trustLevel === 'low') {
    return 'Lacks clear direction and trust signals.';
  }

  // Default neutral summary
  return 'Mixed signals across conversion and trust.';
}

/**
 * Main function to calculate all display scores with detailed explanations
 * Phase 1.3: Now includes one-sentence summary
 */
export function calculateMultiScoreDisplayDetailed(text: string): MultiScoreDisplayDetailed {
  const conversion = estimateConversionDisplayScoreDetailed(text);
  const trust = estimateTrustDisplayScoreDetailed(text);
  const risk = estimateRiskDisplayLevelDetailed(text);

  const summary = generateMultiScoreSummary(conversion.score, trust.score, risk.level);

  return {
    summary,
    conversion,
    trust,
    risk
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DUAL SCORE SYSTEM — Editorial Quality + Conversion Potential
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Editorial Quality (0-100)
 * How well-written, clear, and professional the copy is.
 * Derived from: trust signals, absence of hype, sentence clarity, professionalism.
 */
export function computeEditorialQuality(text: string): number {
  if (!text || !text.trim()) return 50;
  const textLower = text.toLowerCase();
  let score = 50;

  // Positive: professional clarity signals
  const clarityWords = ['clear', 'straightforward', 'specifically', 'exactly', 'transparent', 'precisely'];
  const professionalWords = ['professional', 'expert', 'experienced', 'qualified', 'specialized', 'certified'];
  const structureSignals = ['first', 'second', 'finally', 'in addition', 'furthermore', 'therefore', 'as a result'];

  clarityWords.forEach(w => { if (textLower.includes(w)) score += 3; });
  professionalWords.forEach(w => { if (textLower.includes(w)) score += 2; });
  structureSignals.forEach(w => { if (textLower.includes(w)) score += 2; });

  // Positive: well-structured sentences (avg length 10-25 words is ideal)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    const words = text.split(/\s+/).length;
    const avgLen = words / sentences.length;
    if (avgLen >= 10 && avgLen <= 25) score += 8;
    else if (avgLen >= 8 && avgLen <= 30) score += 4;
  }

  // Negative: hype, ALL CAPS, excessive exclamations, grammatically weak patterns
  const hypeWords = ['revolutionary', 'breakthrough', 'unbelievable', 'mind-blowing', 'insane', 'crazy'];
  const aggressiveWords = ['cannot afford to miss', 'stupid not to', 'missing out'];
  hypeWords.forEach(w => { if (textLower.includes(w)) score -= 5; });
  aggressiveWords.forEach(w => { if (textLower.includes(w)) score -= 6; });

  const capsCount = (text.match(/[A-Z]{4,}/g) || []).length;
  if (capsCount > 2) score -= 8;
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 4) score -= 6;
  if (exclamations > 8) score -= 6;

  // Positive: reasonable word count (not too short, not bloated)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 50 && wordCount <= 400) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Conversion Potential (0-100)
 * How likely the copy is to make the reader take action.
 * Derived from: CTA presence, urgency, benefit-oriented language, specificity.
 */
export function computeConversionPotential(text: string): number {
  // Re-uses the existing conversion estimator as the primary signal,
  // supplemented with benefit-focus and specificity signals.
  if (!text || !text.trim()) return 50;
  const textLower = text.toLowerCase();
  let score = estimateConversionDisplayScore(text);

  // Additional signals for conversion potential
  const benefitWords = ['save time', 'save money', 'reduce', 'eliminate', 'avoid', 'increase revenue', 'grow', 'scale', 'automate'];
  const specificitySignals = [/\d+%/, /\$\d+/, /\d+x/, /\d+ (days|weeks|months|hours)/i];
  const ctaStrengthWords = ['book a call', 'start free', 'get started', 'try free', 'claim your', 'reserve your', 'schedule'];

  benefitWords.forEach(w => { if (textLower.includes(w)) score += 3; });
  specificitySignals.forEach(r => { if (r.test(text)) score += 4; });
  ctaStrengthWords.forEach(w => { if (textLower.includes(w)) score += 5; });

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPANDED PERSUASION BREAKDOWN — 10 dimensions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PersuasionBreakdown {
  emotionalImpact: number;
  clarity: number;
  trust: number;
  specificity: number;
  urgency: number;
  professionalism: number;
  readability: number;
  ctaStrength: number;
  audienceFit: number;
  differentiation: number;
}

export function computePersuasionBreakdown(text: string): PersuasionBreakdown {
  if (!text || !text.trim()) {
    return { emotionalImpact: 50, clarity: 50, trust: 50, specificity: 50, urgency: 50, professionalism: 50, readability: 50, ctaStrength: 50, audienceFit: 50, differentiation: 50 };
  }
  const t = text.toLowerCase();

  // Emotional Impact
  let emotional = 50;
  const emotionWords = ['transform', 'imagine', 'feel', 'experience', 'discover', 'unlock', 'powerful', 'incredible', 'inspiring', 'motivate', 'passion', 'freedom', 'confidence'];
  emotionWords.forEach(w => { if (t.includes(w)) emotional += 4; });
  emotional = Math.max(0, Math.min(100, emotional));

  // Clarity
  let clarity = estimateConversionDisplayScore(text) * 0.4 + 30;
  const claritySignals = ['simply', 'clear', 'easy', 'straightforward', 'step by step', 'in short', 'what you get'];
  claritySignals.forEach(w => { if (t.includes(w)) clarity += 5; });
  // Penalise very long sentences
  const avgSentLen = text.split(/[.!?]+/).filter(s => s.trim()).reduce((acc, s) => acc + s.split(/\s+/).length, 0) / Math.max(1, text.split(/[.!?]+/).filter(s => s.trim()).length);
  if (avgSentLen > 30) clarity -= 10;
  clarity = Math.max(0, Math.min(100, Math.round(clarity)));

  // Trust — re-use existing
  const trust = estimateTrustDisplayScore(text);

  // Specificity
  let specificity = 40;
  const specificSignals = [/\d+%/, /\$\d+/, /\d+x/, /\d+ (days|weeks|months|hours|minutes)/i, /\d+ clients/i, /\d+ customers/i];
  specificSignals.forEach(r => { if (r.test(text)) specificity += 10; });
  const vaguePhrases = ['many', 'some', 'various', 'several', 'a lot', 'lots of', 'significant'];
  vaguePhrases.forEach(w => { if (t.includes(w)) specificity -= 3; });
  specificity = Math.max(0, Math.min(100, Math.round(specificity)));

  // Urgency
  let urgency = 35;
  const urgencyWords = ['now', 'today', 'limited', "don't wait", 'hurry', 'last chance', 'only', 'expires', 'deadline', 'immediately', 'act now', 'this week', 'before'];
  urgencyWords.forEach(w => { if (t.includes(w)) urgency += 7; });
  urgency = Math.max(0, Math.min(100, Math.round(urgency)));

  // Professionalism
  let professionalism = computeEditorialQuality(text);

  // Readability — inverse of complexity penalty
  let readability = 70;
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const avgWords = sentenceCount > 0 ? wordCount / sentenceCount : wordCount;
  if (avgWords <= 15) readability += 10;
  else if (avgWords <= 20) readability += 5;
  else if (avgWords > 30) readability -= 15;
  else if (avgWords > 25) readability -= 8;
  const longWords = text.split(/\s+/).filter(w => w.length > 10).length;
  const longWordRatio = wordCount > 0 ? longWords / wordCount : 0;
  if (longWordRatio > 0.2) readability -= 10;
  readability = Math.max(0, Math.min(100, Math.round(readability)));

  // CTA Strength
  let ctaStrength = 30;
  const strongCTAs = ['book a call', 'start free', 'get started', 'try free', 'claim your', 'reserve your', 'schedule', 'get instant', 'download now', 'sign up free', 'request a demo'];
  const softCTAs = ['learn more', 'find out', 'contact us', 'get in touch', 'click here', 'see how'];
  strongCTAs.forEach(w => { if (t.includes(w)) ctaStrength += 15; });
  softCTAs.forEach(w => { if (t.includes(w)) ctaStrength += 6; });
  ctaStrength = Math.max(0, Math.min(100, Math.round(ctaStrength)));

  // Audience Fit — proxy: does the copy signal knowledge of its audience's pain/context?
  let audienceFit = 50;
  const audienceSignals = ['your team', 'your business', 'your clients', 'your customers', 'you need', 'you want', 'you deserve', 'for you', 'made for', 'built for', 'designed for'];
  audienceSignals.forEach(w => { if (t.includes(w)) audienceFit += 5; });
  audienceFit = Math.max(0, Math.min(100, Math.round(audienceFit)));

  // Differentiation — proxy: unique angle signals
  let differentiation = 40;
  const diffSignals = ['only', 'unlike', 'instead of', 'without', 'no contract', 'no setup', 'unique', 'first', 'proprietary', 'exclusive', 'one of a kind'];
  diffSignals.forEach(w => { if (t.includes(w)) differentiation += 7; });
  differentiation = Math.max(0, Math.min(100, Math.round(differentiation)));

  return { emotionalImpact: emotional, clarity, trust, specificity, urgency, professionalism, readability, ctaStrength, audienceFit, differentiation };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUDIENCE FIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type FitLevel = 'High' | 'Medium' | 'Low';

export interface AudienceFitResult {
  smbOwners: FitLevel;
  corporateExecutives: FitLevel;
  traditionalIndustries: FitLevel;
  highPressureSales: FitLevel;
  smbReason?: string;
  corporateReason?: string;
  traditionalReason?: string;
  highPressureReason?: string;
}

function fitLevel(score: number): FitLevel {
  if (score >= 2) return 'High';
  if (score >= 0) return 'Medium';
  return 'Low';
}

export function computeAudienceFit(text: string, includeReasons = false): AudienceFitResult {
  if (!text || !text.trim()) {
    return { smbOwners: 'Medium', corporateExecutives: 'Medium', traditionalIndustries: 'Medium', highPressureSales: 'Medium' };
  }
  const t = text.toLowerCase();

  // SMB Owners: respond to ROI, time savings, easy adoption, direct benefits
  let smb = 0;
  ['save time', 'save money', 'easy', 'simple', 'small business', 'owner', 'entrepreneur', 'affordable', 'quick'].forEach(w => { if (t.includes(w)) smb++; });
  ['enterprise', 'c-suite', 'board', 'stakeholder', 'compliance', 'governance'].forEach(w => { if (t.includes(w)) smb--; });

  // Corporate Executives: respond to ROI, strategic framing, credibility, data
  let corp = 0;
  ['roi', 'strategic', 'growth', 'revenue', 'stakeholder', 'enterprise', 'scalable', 'efficiency', 'data', 'results'].forEach(w => { if (t.includes(w)) corp++; });
  ['quick', 'easy', 'simple setup', 'no contract', 'affordable'].forEach(w => { if (t.includes(w)) corp--; });

  // Traditional Industries (manufacturing, law, accounting, construction)
  let trad = 0;
  ['reliable', 'proven', 'trusted', 'established', 'compliance', 'certified', 'professional', 'industry', 'experience'].forEach(w => { if (t.includes(w)) trad++; });
  ['disrupt', 'viral', 'hack', 'explosive', 'rapid', 'instant', 'social media', 'influencer'].forEach(w => { if (t.includes(w)) trad--; });

  // High-pressure sales teams: respond to urgency, conversion triggers, competition framing
  let sales = 0;
  ['close', 'deal', 'pipeline', 'leads', 'conversion', 'urgency', 'quota', 'target', 'outperform', 'win', 'now', 'today', 'limited'].forEach(w => { if (t.includes(w)) sales++; });
  ['thoughtful', 'careful', 'considered', 'long-term', 'sustainable', 'gradual'].forEach(w => { if (t.includes(w)) sales--; });

  const result: AudienceFitResult = {
    smbOwners: fitLevel(smb),
    corporateExecutives: fitLevel(corp),
    traditionalIndustries: fitLevel(trad),
    highPressureSales: fitLevel(sales),
  };

  if (includeReasons) {
    result.smbReason = smb >= 2 ? 'Direct benefit language and accessible framing resonate with business owners.' : smb >= 0 ? 'Some relevant signals but lacks small business specificity.' : 'Enterprise framing may feel misaligned for SMB audiences.';
    result.corporateReason = corp >= 2 ? 'Strategic language and ROI framing align with executive decision-making.' : corp >= 0 ? 'Partial executive fit; could benefit from more strategic framing.' : 'Too informal or tactical for C-suite audiences.';
    result.traditionalReason = trad >= 2 ? 'Credibility and reliability signals map well to traditional industry expectations.' : trad >= 0 ? 'Neutral fit; lacks the trust signals traditional buyers expect.' : 'Disruption or hype language may alienate traditional industry audiences.';
    result.highPressureReason = sales >= 2 ? 'Urgency and conversion language match high-pressure sales environments.' : sales >= 0 ? 'Moderate fit; adding urgency and competitive framing would improve it.' : 'Too soft or measured for fast-moving sales contexts.';
  }

  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RISK FACTORS — version-specific, concrete
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function computeRiskFactors(text: string, verificationFlags?: string[]): string[] {
  if (!text || !text.trim()) return [];
  const t = text.toLowerCase();
  const risks: string[] = [];

  // Unverified claims risk
  const percentCount = (text.match(/\d+%/g) || []).length;
  if (percentCount > 0) {
    const examples = (text.match(/\d+%[^.!?,]*/g) || []).slice(0, 2).map(s => s.trim().slice(0, 60));
    risks.push(`Contains ${percentCount} percentage claim${percentCount > 1 ? 's' : ''} (e.g. "${examples[0]}") — source must be verified before publishing or reader trust is compromised.`);
  }

  const timeframeClaims = text.match(/\d+\s*(days?|weeks?|months?|hours?)\s+(or less|guaranteed|results)/gi);
  if (timeframeClaims && timeframeClaims.length > 0) {
    risks.push(`Timeframe guarantee "${timeframeClaims[0].trim()}" implies contractual commitment — legal review recommended.`);
  }

  // Tone mismatch risk
  const hypeInProfContext = ['revolutionary', 'explosive', 'insane', 'shocking', 'mind-blowing', 'unbelievable'];
  const hypeFound = hypeInProfContext.filter(w => t.includes(w));
  if (hypeFound.length >= 1) {
    risks.push(`Intensifier "${hypeFound[0]}" creates tone mismatch risk in professional or B2B contexts — may undermine credibility.`);
  }

  // Superlative / best-in-class risk
  const superlatives = ['best in', '#1', 'number one', 'only solution', 'most powerful', 'most advanced'];
  const supFound = superlatives.filter(w => t.includes(w));
  if (supFound.length >= 1) {
    risks.push(`Claim "${supFound[0]}" is a comparative superlative — requires substantiation to avoid false advertising risk.`);
  }

  // Aggressive pressure
  const pressurePhrases = ['you cannot afford', "you'd be stupid", 'missing out if', 'everyone else is'];
  const pressFound = pressurePhrases.filter(w => t.includes(w));
  if (pressFound.length >= 1) {
    risks.push(`Pressure phrase "${pressFound[0]}" risks alienating risk-averse readers and is inappropriate for high-trust audiences.`);
  }

  // Figurative language structural risk (from verification flags)
  if (verificationFlags && verificationFlags.length > 0) {
    const figFlags = verificationFlags.filter(f => f.includes('lenguaje figurativo'));
    if (figFlags.length >= 2) {
      risks.push(`Multiple figurative expressions (${figFlags.length} flagged) — cumulative effect may make copy feel exaggerated or off-brand depending on voice guidelines.`);
    }
  }

  // Very short copy risk
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 40) {
    risks.push(`Copy is very short (${wordCount} words) — may lack sufficient context to build trust or justify the CTA.`);
  }

  return risks.slice(0, 5); // cap at 5 specific risks
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WORD COUNT + READING LEVEL (Flesch-Kincaid proxy)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ReadingLevel = 'Easy' | 'Medium' | 'Advanced';

export interface WordCountAndReadingLevel {
  wordCount: number;
  readingLevel: ReadingLevel;
  fleschScore: number; // approximate
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function computeWordCountAndReadingLevel(text: string): WordCountAndReadingLevel {
  if (!text || !text.trim()) return { wordCount: 0, readingLevel: 'Easy', fleschScore: 100 };

  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  if (wordCount === 0) return { wordCount: 0, readingLevel: 'Easy', fleschScore: 100 };

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

  // Flesch Reading Ease approximation
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / wordCount;
  const fleschScore = Math.round(206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord));
  const clamped = Math.max(0, Math.min(100, fleschScore));

  let readingLevel: ReadingLevel;
  if (clamped >= 60) readingLevel = 'Easy';
  else if (clamped >= 30) readingLevel = 'Medium';
  else readingLevel = 'Advanced';

  return { wordCount, readingLevel, fleschScore: clamped };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WINNER TYPE CLASSIFICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type WinnerType = 'Clear Winner' | 'Moderate Winner' | 'Close Call';

export function classifyWinnerType(winnerScore: number, secondScore: number): { type: WinnerType; reason: string } {
  const gap = winnerScore - secondScore;
  if (gap >= 10) {
    return { type: 'Clear Winner', reason: `${gap}-point gap over the next best version shows a decisive advantage.` };
  }
  if (gap >= 5) {
    return { type: 'Moderate Winner', reason: `${gap}-point gap indicates a meaningful but not dominant lead.` };
  }
  return { type: 'Close Call', reason: `Only ${gap} points separate the top two versions — either could perform well.` };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// .md-ONLY FIELDS (EVAL / COMPARE exports)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type EvaluationConfidence = 'High' | 'Medium' | 'Low';
export type ConversionStrategyType =
  | 'Problem Agitation'
  | 'Authority Positioning'
  | 'Fear of Loss'
  | 'Operational Clarity'
  | 'ROI Framing'
  | 'Efficiency Positioning'
  | 'Social Proof'
  | 'Urgency & Scarcity';
export type CommercialIntensity = 'High' | 'Medium' | 'Low';

export function computeEvaluationConfidence(text: string): { confidence: EvaluationConfidence; reason?: string } {
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 30) return { confidence: 'Low', reason: 'Copy is too short to evaluate persuasion signals reliably.' };
  if (wordCount < 80) return { confidence: 'Medium', reason: 'Short copy limits the depth of heuristic signal detection.' };
  return { confidence: 'High' };
}

export function computeConversionStrategy(text: string): ConversionStrategyType {
  const t = text.toLowerCase();
  const scores: Record<ConversionStrategyType, number> = {
    'Problem Agitation': 0,
    'Authority Positioning': 0,
    'Fear of Loss': 0,
    'Operational Clarity': 0,
    'ROI Framing': 0,
    'Efficiency Positioning': 0,
    'Social Proof': 0,
    'Urgency & Scarcity': 0,
  };

  // Problem Agitation
  ['struggling', 'problem', 'challenge', 'pain', 'frustrated', 'tired of', 'stop wasting', 'finally', 'enough'].forEach(w => { if (t.includes(w)) scores['Problem Agitation']++; });
  // Authority Positioning
  ['expert', 'trusted by', 'years of experience', 'industry leader', 'certified', 'award', 'recognized', 'specialist'].forEach(w => { if (t.includes(w)) scores['Authority Positioning']++; });
  // Fear of Loss
  ['missing out', 'risk', 'losing', 'cost of not', 'while competitors', 'falling behind', 'left behind'].forEach(w => { if (t.includes(w)) scores['Fear of Loss']++; });
  // Operational Clarity
  ['step by step', 'how it works', 'simple process', 'in 3 steps', 'easy to', 'setup', 'integration', 'onboarding'].forEach(w => { if (t.includes(w)) scores['Operational Clarity']++; });
  // ROI Framing
  ['roi', 'return on investment', 'revenue', 'profit', 'increase sales', 'grow revenue', 'more clients', 'higher margins'].forEach(w => { if (t.includes(w)) scores['ROI Framing']++; });
  // Efficiency Positioning
  ['save time', 'automate', 'faster', 'reduce', 'eliminate manual', 'streamline', 'workflow', 'productivity'].forEach(w => { if (t.includes(w)) scores['Efficiency Positioning']++; });
  // Social Proof
  ['clients', 'customers', 'testimonial', 'review', 'rated', 'trusted by', 'used by', 'case study', 'success story'].forEach(w => { if (t.includes(w)) scores['Social Proof']++; });
  // Urgency & Scarcity
  ['limited', 'only', 'expires', 'deadline', 'now', 'today', "don't wait", 'last chance', 'act now', 'hurry'].forEach(w => { if (t.includes(w)) scores['Urgency & Scarcity']++; });

  // Return highest scoring strategy
  const sorted = (Object.entries(scores) as [ConversionStrategyType, number][]).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

export function computeCommercialIntensity(text: string): CommercialIntensity {
  const t = text.toLowerCase();
  let intensity = 0;

  const highIntensity = ['now', 'today', 'limited', 'hurry', 'last chance', 'act now', 'explosive', 'massive', 'never before', 'guaranteed', 'instant'];
  const lowIntensity = ['learn', 'explore', 'discover', 'understand', 'see how', 'find out', 'introducing'];

  highIntensity.forEach(w => { if (t.includes(w)) intensity += 2; });
  lowIntensity.forEach(w => { if (t.includes(w)) intensity -= 1; });

  const exclamations = (text.match(/!/g) || []).length;
  intensity += Math.min(exclamations, 4);

  if (intensity >= 5) return 'High';
  if (intensity >= 2) return 'Medium';
  return 'Low';
}

export function computeMostLikelyConversionDriver(text: string): string {
  const strategy = computeConversionStrategy(text);
  const t = text.toLowerCase();

  const driverMap: Record<ConversionStrategyType, string> = {
    'Problem Agitation': 'The copy identifies a specific pain point, making the reader feel understood before presenting the solution — reducing resistance to action.',
    'Authority Positioning': 'Credibility signals (expertise, certification, track record) lower perceived risk, making the purchase decision feel safer.',
    'Fear of Loss': 'Loss-aversion framing activates the reader\'s fear of falling behind competitors or missing a time-sensitive opportunity.',
    'Operational Clarity': 'Demystifying the process removes the "how does this actually work" objection that often blocks decisions.',
    'ROI Framing': 'Concrete revenue or efficiency gains frame the purchase as an investment, not a cost — bypassing price sensitivity.',
    'Efficiency Positioning': 'Time and effort savings resonate with busy professionals who value their own time above monetary cost.',
    'Social Proof': 'Peer validation reduces individual risk perception — the reader reasons that "if others succeeded, I can too."',
    'Urgency & Scarcity': 'Artificial or real scarcity triggers the reader\'s loss-aversion instinct, creating pressure to act before the moment passes.',
  };

  return driverMap[strategy] || 'The primary conversion trigger is a combination of clarity and relevance to the reader\'s context.';
}
