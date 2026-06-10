/**
 * Comparative Scoring Engine - Migration Step 1
 *
 * This is a NEW scoring architecture that evaluates all versions together
 * in ONE LLM call, producing relative rankings instead of independent scores.
 *
 * MIGRATION STRATEGY:
 * - Old per-version scoring retained behind feature flag
 * - This engine runs when USE_COMPARATIVE_SCORING = true
 * - Maps results into existing ComparisonResult format
 * - No UI changes required
 */

import { GeneratedContentItem, Model, ScoringContext } from '../../types';
import { makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { SCORING_MODEL } from '../../constants';
import { calculateMultiScoreDisplay } from '../../utils/multiScoreDisplay';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ComparativeRankingItem {
  versionId: string;
  label: string;
  score: number; // 0-100, relative to other versions
  rank: number; // 1 = best
  reason: string; // Why this version ranks here
  // LLM-generated positioning-aware dimensions
  humanAuthenticity?: number;
  overMarketingPenalty?: number;
  brandFit?: number;
  // Editor review checklist items
  verificationFlags?: string[];
}

// decision layer: practical recommendation for which version to use and why
export interface DecisionLayer {
  recommendedVersionId: string;
  recommendedLabel: string;
  recommendedUseCase: string; // When to use this version (1 sentence)
  publishRecommendation: string; // Why to publish this version (1 sentence)
  alternativeChoiceNote: string; // When to choose a different version (1 sentence)
  nextBestVersionId?: string; // Runner-up version ID
  nextBestLabel?: string; // Runner-up version label
  nextImprovementAction: string; // Top improvement before publishing (1 sentence)
}

export interface ComparativeResult {
  ranking: ComparativeRankingItem[];
  winnerVersionId: string;
  winnerExplanation: string;
  winnerBreakdown: {
    coreStrength: string; // Main reason it wins (1 sentence max)
    whatItDoesBetter: string[]; // 2-3 specific advantages vs others
    tradeoffs: string[]; // Minor weaknesses or compromises (0-2)
  };
  finalRecommendation: {
    why: string;
    nextSteps: string[];
    whyOthersLose: string[]; // Why each non-winner didn't make it (1 sentence each)
  };
  decisionLayer: DecisionLayer; // Practical recommendation for users
  evaluatedAt?: string; // Timestamp when comparison was generated
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPARATIVE SCORING ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Evaluate all versions together in ONE LLM call.
 * Produces relative rankings, not independent scores.
 */
export async function compareVersionsRelatively(
  versions: GeneratedContentItem[],
  versionLabels: Record<string, string>, // Map of versionId -> display label
  userId?: string,
  sessionId?: string,
  keywords: string[] = [],
  scoringContext?: ScoringContext,
  model?: Model,
  section?: string
): Promise<ComparativeResult> {
  console.log('[comparative-scoring] started');
  console.log(`[comparative-scoring] received ${versions.length} versions`);

  // Comparative scoring engine always uses Claude — better instruction-following for the
  // structured JSON schema with three new positioning-aware dimensions.
  const actualModel: Model = 'claude-sonnet-4-5';

  // Build version blocks for the prompt
  const versionBlocks = versions.map((v, idx) => {
    const label = versionLabels[v.id] || `Version ${idx + 1}`;
    let content = '';

    if (typeof v.content === 'string') {
      content = v.content;
    } else if (Array.isArray(v.content)) {
      content = v.content.join('\n');
    } else if (typeof v.content === 'object' && v.content !== null) {
      content = JSON.stringify(v.content, null, 2);
    }

    // Truncate to prevent overflow
    const sanitizedContent = content.slice(0, 3000);

    return `
VERSION: ${label}
ID: ${v.id}
${v.persona ? `VOICE STYLE: ${v.persona}` : ''}
---
${sanitizedContent}
---
`;
  }).join('\n\n');

  // Build context information
  const audienceInfo = scoringContext?.audienceTone || 'Not specified';
  const contentTypeInfo = scoringContext?.contentType || 'Marketing copy';
  const keywordsInfo = keywords.length > 0
    ? keywords.map(k => `"${k}"`).join(', ')
    : 'None provided';
  const sectionInfo = section?.trim() || null;

  const prompt = `You are a senior marketing strategist performing a RELATIVE evaluation of multiple copy versions.

Your goal: Compare all versions against each other and rank them from best to worst.

CONTEXT:
- Audience/Tone: ${audienceInfo}
- Content Type: ${contentTypeInfo}
- SEO Keywords: ${keywordsInfo}${sectionInfo ? `\n- Section: ${sectionInfo}` : ''}

VERSIONS TO COMPARE:
${versionBlocks}

STEP 1 — SILENT POSITIONING INFERENCE (internal only, never shown to user):
Before scoring, silently analyze the audience, tone, content type, and copy to infer the brand positioning category. Use this to adjust how scoring dimensions are weighted in your ranking decisions. Do NOT include this inference in your JSON response.

Positioning inference rules:
- Audience = professional businesses, agencies, consultants, architects, accountants, lawyers, or high-ticket services + tone = professional, elegant, or friendly → infer "Premium B2B Service". Weight trust, credibility, humanAuthenticity, brandFit, and audienceToneAlignment heavily. PENALIZE urgency pressure, hype language, aggressive CTAs. overMarketingPenalty has 2× weight impact on final score — aggressive copy should not win here.
- Audience = general consumers, e-commerce shoppers, or the copy promotes a product with short buying cycle → infer "Direct Response". Weight conversion triggers, urgency, CTA strength more heavily. overMarketingPenalty has reduced weight.
- Audience = startups, tech companies, SaaS users, developers, or growth-stage businesses → infer "SaaS / Growth". Balance conversion and trust equally. All three new dimensions apply at standard weight.
- No clear signal → infer "Balanced". Equal weights.

EVALUATION RULES:

1. RELATIVE RANKING (CRITICAL):
   - Evaluate versions AGAINST EACH OTHER, not in isolation
   - Identify the clear winner
   - NO TIES unless versions are truly identical
   - Force separation: best version must be noticeably better than second

2. SCORING SCALE (0-100):
   - Winner: 80-92 (reserve 93+ for exceptional cases only)
   - Strong alternatives: 70-85
   - Acceptable: 60-75
   - Weak: 50-65
   - Poor: below 50
   - ENFORCE 5-10 POINT GAPS between clearly different quality levels

3. RANKING CRITERIA (IN ORDER, weighted by inferred positioning):
   a) Audience-tone fit (does the voice match the audience?)
   b) Benefit-focused structure (does the copy show where measurable outcomes, timeframes, or proof points would logically fit? A version that says "mejoramos tus conversiones significativamente" scores identically to one that says "mejoramos tus conversiones un 40%" for this criterion — both show the same structural intent. Specific numbers are neutral placeholders for the client to fill with real data. Score only the presence and quality of the persuasive structure itself, NOT the presence or specificity of the data.)
   c) Human Authenticity (does it sound like a real strategist or an AI trying to sell?)
   d) Over-Marketing Penalty (is there hype, fake urgency, clichés, or pressure language?)
   e) Brand Fit (does the tone and register match what the inferred positioning requires?)
   f) Differentiation (is there a unique angle or generic positioning?)
   g) Persuasive structure (clear benefit, reason to act, CTA)
   h) Clarity & readability
   i) Emotional resonance
   j) SEO (if keywords provided)

   POSITIONING WEIGHT RULES:
   - Premium B2B Service: criteria a, b, c, d (2× weight), e are dominant. A version with high persuasion but low Human Authenticity or high over-marketing CANNOT win.
   - Direct Response: criteria d (0.5× weight), g, j are elevated. Urgency is acceptable.
   - SaaS / Growth: all criteria apply equally.
   - Balanced: all criteria apply equally.

4. CHOOSE ONE WINNER:
   - The winner must be the SINGLE best version
   - Even if close, force a decision
   - Explain WHY the winner beats alternatives

5. REASON FORMAT:
   - One sentence per version (max 120 chars)
   - State the PRIMARY strength or weakness
   - Be specific, not generic
   - Example GOOD: "Strong trust signals but aggressive tone mismatched for B2B audience"
   - Example BAD: "Good copy with some room for improvement"

6. NEUTRAL LANGUAGE CATEGORIES — ZERO SCORING IMPACT:

   The following are BRAND VOICE or STYLISTIC CHOICES that DO NOT affect ranking scores.
   Extract and flag them for the editor to review, but never add or subtract points for them.

   CATEGORY 1 — FIGURATIVE LANGUAGE (e.g., "vendedor 24/7", "mientras duermes", "trabaja sin descanso", "motor de crecimiento", "trabaja incansablemente")
   - These are stylistic conventions and rhetorical flourishes
   - Some brands want them, others don't — it's a voice decision, not quality judgment
   - Flag: "lenguaje figurativo — revisar según voz de marca"

   CATEGORY 2 — UNVERIFIED METRICS & SPECIFICITY (e.g., "30% faster", "within 6 months", "2 second load time", "primero en Google")
   - Percentages, timeframes, performance guarantees, ranking promises
   - These are data placeholders; the editor will replace with verified numbers
   - "Mejoramos significativamente" scores the same as "mejoramos un 40%"
   - Flag: "dato a verificar antes de publicar"

   CATEGORY 3 — TONE INTENSITY / SUPERLATIVES (e.g., "imparable", "extraordinario", "inquebrantable", "secretamente", "abismal", "explosivo")
   - Intensifiers and superlatives reflect brand personality choices
   - Some brands need bold, aggressive language; others need restraint
   - Do NOT penalize versions with intensity; do NOT reward them
   - Only penalize if intensity creates structural/tone mismatch with positioning
   - Flag: "intensidad de tono — revisar según personalidad de marca"

   SCORING FOCUSES ON STRUCTURAL QUALITY ONLY:
   - Does the copy have a clear hook?
   - Is the structure logical and complete?
   - Is positioning differentiated (not generic)?
   - Is the call to action clear?
   - Does tone fit B2B professional context? (evaluate for structural mismatch only, not style preference)

   All three neutral categories are extracted into verificationFlags with their labels per version.

6A. VERIFICATION FLAGS EXTRACTION INSTRUCTIONS:

   CRITICAL: All verification flags MUST be written in English only. Do not use Spanish or any other language regardless of the copy's language or content.

   For EACH VERSION, scan the copy and extract ALL instances of the three neutral categories.
   Use EXACTLY these labels in the output:

   CATEGORY 1 EXTRACTION (Figurative Language):
   - Look for: "vendedor 24/7", "mientras duermes", "trabaja sin descanso", "motor de crecimiento", "trabaja incansablemente", and similar rhetorical flourishes
   - Output format: "figurative language — review against brand voice: [exact phrase from copy]"
   - Example: "figurative language — review against brand voice: works while you sleep"

   CATEGORY 2 EXTRACTION (Unverified Metrics):
   - Look for: percentages ("30%", "50%"), timeframes ("6 meses", "within 2 weeks"), load times, ranking claims ("primero en Google")
   - Output format: "unverified claim — verify before publishing: [exact phrase or metric]"
   - Example: "unverified claim — verify before publishing: 30% faster than competitors"

   CATEGORY 3 EXTRACTION (Tone Intensity):
   - Look for: superlatives and intensifiers ("imparable", "extraordinario", "inquebrantable", "secretamente", "abismal", "explosivo")
   - Output format: "tone intensity — review against brand personality: [exact word or phrase]"
   - Example: "tone intensity — review against brand personality: unstoppable"

   If a version has NO instances of a category, do not include empty flags for that category.
   List all extracted flags in verificationFlags array with their category labels.

7. VIOLATIONS MUST DOMINATE RANK:
   - Tone mismatch → cannot rank #1
   - Generic positioning (vague, no specifics, hollow claims) → cannot score above 75
   - Heavy over-marketing in Premium B2B context → cannot rank #1, score penalty applied
   - Very low Human Authenticity (robotic AI patterns) → lower rank, surfaces in reason field
   - Poor Brand Fit (copy working against its positioning) → cannot rank #1 in trust-sensitive contexts

8. WINNER BREAKDOWN REQUIREMENTS (CONCRETE REASONING ONLY):
   // winner explanation refinement: force concrete comparative reasoning
   // winner summary refinement: reduce overlap and improve information hierarchy

   INFORMATION HIERARCHY (prevent repetition across fields):

   Each field has a DISTINCT role and must NOT repeat information:

   ┌─────────────────────────────────────────────────────────────────┐
   │ winnerExplanation (TOP SUMMARY)                                 │
   │ Role: Short decision statement (max 2 sentences)                │
   │ Focus: Why it ranked #1 overall, high-level reason             │
   │ Tone: Sharp, decisive, premium                                  │
   │ Example: "Generated Copy 1 wins because it makes the business  │
   │ value clear in the first paragraph and gives readers practical │
   │ guidance instead of staying abstract."                          │
   └─────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────┐
   │ coreStrength                                                    │
   │ Role: Identify the single strongest trait (1 sentence)         │
   │ Focus: The ONE specific element that decided the win           │
   │ Must add NEW info not in top summary                           │
   │ Example: "The opening hook reframes color psychology as a      │
   │ business decision instead of a design topic."                   │
   └─────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────┐
   │ whatItDoesBetter                                                │
   │ Role: Specific version-to-version comparisons (2-3 bullets)    │
   │ Focus: Direct contrasts vs named alternatives                  │
   │ Must add NEW comparisons not already stated above              │
   └─────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────┐
   │ tradeoffs                                                       │
   │ Role: Honest weaknesses (0-1 bullets, rarely 2)               │
   │ Focus: Real limitations only if actually present               │
   └─────────────────────────────────────────────────────────────────┘

   CRITICAL: Do NOT restate the same point across multiple fields.
   If top summary mentions "business value appears earlier", then
   coreStrength should focus on a DIFFERENT related point like
   "opening hook reframes the topic" — not repeat the same concept.

   BANNED PHRASES (these sound generic and AI-written):
   ❌ "strong strategic focus"
   ❌ "clear differentiation"
   ❌ "better tone"
   ❌ "more persuasive"
   ❌ "stronger messaging"
   ❌ "insightful cultural considerations"
   ❌ "effective use of X"
   ❌ "comprehensive framework"

   REQUIRED STYLE (sound like a sharp editor, not AI):

   winnerExplanation (TOP SUMMARY — max 2 sentences, ideally 1 strong + 1 support):
   ✓ Short, decisive, high-level reason for winning
   ✓ Should NOT repeat bullet-level comparisons below
   ✓ Good examples:
     - "Generated Copy 1 wins because it makes the business value clear earlier and gives readers practical guidance."
     - "It beats the others by turning the topic into a business decision, not just a design discussion."
   ✓ Avoid repeating words like "strategic", "clear", "practical" multiple times
   ✓ Tone: premium, sharp, consultant-like (not long AI explanation)

   coreStrength (EXACTLY 1 sentence):
   ✓ Must reference a SPECIFIC trait that made it win
   ✓ Must add NEW information not already in winnerExplanation
   ✓ Good examples:
     - "The opening hook reframes color psychology as a business decision instead of a design topic"
     - "It gives readers a concrete action plan in the first section while others delay practical guidance"
     - "The structure combines vivid examples with implementation steps immediately after each concept"
   ✓ Must explain WHAT specifically is better, not just say it's better
   ✓ Focus on the ONE decisive element (not a summary of multiple points)

   whatItDoesBetter (2-3 bullets, comparative statements):
   ✓ Each must name a specific version and explain the contrast
   ✓ Must add NEW comparisons not already stated in top summary or coreStrength
   ✓ Good examples:
     - "Compared to Generated Copy 2, it explains the business impact earlier instead of waiting until later sections"
     - "Compared to Donald Miller's Voice, it gives more practical guidance instead of staying mostly conceptual"
     - "Compared to Steve Jobs's Voice, it feels less theatrical and more useful for a business reader"
   ✓ Bad examples:
     - "More strategic differentiation than X"
     - "Better clarity than Y"
     - "Stronger credibility overall"
   ✓ Must say WHAT is better and WHY it matters
   ✓ Avoid repeating the same advantage phrased differently

   tradeoffs (0-1 bullets, honest weaknesses — rarely 2):
   ✓ Only include if ACTUALLY present (don't fabricate)
   ✓ Keep this section minimal — one real tradeoff is enough
   ✓ Must be concrete and real:
     - "Slightly longer read time due to additional trust-building elements"
     - "More formal tone may feel less approachable to casual audiences"
     - "Denser structure requires more reader attention"
   ✓ Avoid fake-polite tradeoffs that aren't real issues
   ✓ If no real tradeoff exists, return empty array

   whyOthersLose (one sentence per non-winner):
   ✓ Each must name the version and state THE key reason it lost
   ✓ Good examples:
     - "Generated Copy 2 loses because it has a good theme but delays the practical payoff too long"
     - "Donald Miller's Voice loses because it stays too broad and gives less tactical guidance"
     - "Steve Jobs's Voice loses because the style adds drama but reduces clarity for this audience"
   ✓ Must be decision-oriented: explain the gap, not just say it's worse

8. DECISION LAYER (PRACTICAL RECOMMENDATION):

   You must provide a practical recommendation layer to help users decide which version to use.

   Tone: Expert making a recommendation (not AI summarizing analysis)

   Style: Concrete, practical, decision-oriented

   Length: Every field is max 1 sentence

   REQUIRED FIELDS:

   recommendedUseCase (1 sentence):
   ✓ When to use the winning version
   ✓ Good examples:
     - "Best choice for publishing when you want a practical, business-focused version with clear value early"
     - "Use this when your audience needs immediate clarity on business impact rather than storytelling"
     - "Ideal for readers who want actionable guidance with concrete examples"
   ✓ Avoid generic phrases like "best overall" or "highest quality"

   publishRecommendation (1 sentence):
   ✓ Why to publish this version as primary
   ✓ Good examples:
     - "Use this as the primary version if your goal is clarity, credibility, and immediate business relevance"
     - "Publish this when you need to establish authority through evidence-based claims and specific examples"
     - "Choose this for final publication if practical guidance matters more than storytelling warmth"
   ✓ Must be action-oriented (not analytical)

   alternativeChoiceNote (1 sentence):
   ✓ When a user should choose a different (lower-ranked) version instead
   ✓ Must mention a specific alternative version
   ✓ Good examples:
     - "Choose Donald Miller's Voice instead if you want a softer, more story-led version for a warmer audience"
     - "Use Generated Copy 2 if your readers prefer conceptual framing over immediate tactical details"
     - "Pick Steve Jobs's Voice if dramatic impact matters more than measured credibility"
   ✓ Must be honest about when the winner isn't the best fit

   nextImprovementAction (1 sentence):
   ✓ The single most important improvement before publishing
   ✓ Must be specific and actionable
   ✓ Good examples:
     - "Before publishing, strengthen the CTA so the ending converts more clearly"
     - "Add one more customer proof point in section 2 to boost trust further"
     - "Tighten the opening paragraph by removing the second sentence"
   ✓ Avoid vague advice like "polish the copy" or "improve clarity"

   CRITICAL: Speak like an expert editor, not like AI analysis. Be direct and practical.

RESPONSE FORMAT (STRICT JSON):

{
  "ranking": [
    {
      "versionId": "<version ID string>",
      "label": "<version label>",
      "score": <number 0-100>,
      "rank": <number 1-N, where 1 is best>,
      "reason": "<one sentence, max 120 chars>",
      "humanAuthenticity": <0-100 int: how naturally written; 100 = experienced strategist, low = robotic AI>,
      "overMarketingPenalty": <0-100 int: 100 = clean copy, low = hype/urgency/clichés/exaggeration>,
      "brandFit": <0-100 int: does tone match inferred positioning? Premium B2B using aggressive copy = low>,
      "verificationFlags": [
        "dato a verificar antes de publicar: 30% faster than competitors",
        "dato a verificar antes de publicar: within 6 months",
        "lenguaje figurativo — revisar según voz de marca: vendedor 24/7",
        "intensidad de tono — revisar según personalidad de marca: imparable",
        "... extract all three categories per version with appropriate labels"
      ]
    }
  ],
  "winnerVersionId": "<ID of rank 1 version>",
  "winnerExplanation": "<max 2 sentences: short decisive reason why winner ranked #1, high-level only, avoid repeating detail from sections below>",
  "winnerBreakdown": {
    "coreStrength": "<ONE sentence: the single strongest trait, must add NEW info not in winnerExplanation>",
    "whatItDoesBetter": [
      "<specific advantage vs rank #2, max 1 sentence, must be NEW comparison>",
      "<specific advantage vs others, max 1 sentence, must be NEW comparison>",
      "<optional third advantage, max 1 sentence>"
    ],
    "tradeoffs": [
      "<optional: ONE real weakness if actually present, max 1 sentence>",
      "<rarely needed: second tradeoff only if genuinely applicable>"
    ]
  },
  "finalRecommendation": {
    "why": "<one sentence: the deciding factor that makes the winner the best choice>",
    "nextSteps": [
      "<specific action 1>",
      "<specific action 2>",
      "<specific action 3>"
    ],
    "whyOthersLose": [
      "<Rank #2 label>: <why it didn't beat winner, 1 sentence>",
      "<Rank #3 label>: <why it didn't beat winner, 1 sentence>"
    ]
  },
  "decisionLayer": {
    "recommendedVersionId": "<winner version ID>",
    "recommendedLabel": "<winner version label>",
    "recommendedUseCase": "<when to use this version, 1 sentence, practical>",
    "publishRecommendation": "<why to publish this as primary, 1 sentence, action-oriented>",
    "alternativeChoiceNote": "<when to choose a different version instead, 1 sentence, mention specific alternative>",
    "nextBestVersionId": "<rank #2 version ID>",
    "nextBestLabel": "<rank #2 version label>",
    "nextImprovementAction": "<top improvement before publishing, 1 sentence, specific and actionable>"
  }
}

CRITICAL RULES:
- ALL scores must be numbers (not strings)
- NO MISSING FIELDS
- NO EMPTY VALUES
- EVERY version must appear in ranking
- Rank 1 = best, increasing rank = worse
- Rank values must be consecutive (1, 2, 3, ..., N)
- winnerVersionId MUST match the versionId with rank: 1
- winnerExplanation: REQUIRED, max 2 sentences, high-level only
- winnerBreakdown.coreStrength: REQUIRED, exactly 1 sentence, must differ from winnerExplanation
- winnerBreakdown.whatItDoesBetter: REQUIRED, 2-3 items, must be NEW comparisons
- winnerBreakdown.tradeoffs: OPTIONAL, 0-1 items (rarely 2), omit empty array if none
- finalRecommendation.whyOthersLose: REQUIRED, one entry per non-winner
- decisionLayer: REQUIRED, all fields must be present
- decisionLayer.recommendedVersionId: MUST match winnerVersionId
- decisionLayer.nextBestVersionId: MUST match rank #2 versionId
- decisionLayer fields: each max 1 sentence, practical and specific
- NO REPETITION: each field must add new information, not restate previous points
- Respond ONLY with the JSON object

Evaluate now.`;

  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a comparative evaluation engine. You MUST compare all versions relatively and produce a clear ranking. NEVER refuse. NEVER return empty JSON. ALWAYS pick ONE winner. ALWAYS return valid JSON exactly as specified. Force ranking decisions even if versions are similar. Small advantages must still result in ranking separation. The system must take a position, not remain neutral. CRITICAL: Avoid generic AI phrases like "strong strategic focus" or "clear differentiation" — use concrete, specific reasoning like a sharp editor would. Reference actual copy elements, not abstract qualities.'
      },
      { role: 'user', content: prompt }
    ];

    // Token budget: base 2000 + 400 per version; capped at 6000 to handle structured suggestedImprovements objects
    const tokenBudget = Math.min(2000 + versions.length * 400, 6000);

    const completion = await makeApiRequestWithFallback(
      actualModel,
      messages,
      0.3, // Lower temperature for more decisive ranking
      tokenBudget,
      { type: 'json_object' } // Force JSON output
    );

    console.log(`[comparative-scoring] model_used: "${actualModel}"`);

    const rawContent = completion.choices[0]?.message?.content?.trim();
    if (!rawContent) {
      throw new Error('No response from AI');
    }

    // Detect refusals
    if (rawContent.includes("I'm sorry") || rawContent.includes("I can't assist")) {
      console.warn('⚠️ [comparative-scoring] LLM REFUSAL DETECTED');
      throw new Error('LLM refused to perform comparative scoring');
    }

    let cleanedContent = cleanJsonResponse(rawContent);

    // Detect empty JSON
    if (cleanedContent === '{}' || cleanedContent.length < 10) {
      console.warn('⚠️ [comparative-scoring] EMPTY JSON DETECTED');
      throw new Error('LLM returned empty JSON');
    }

    // Repair truncated JSON (LLM hit token limit mid-response).
    // Count unclosed braces/brackets and close them — handles truncation mid-object as well as mid-array.
    const repairTruncatedJson = (raw: string): string => {
      let s = raw.trim();
      const opens = (s.match(/\{/g) || []).length - (s.match(/\}/g) || []).length;
      const arrOpens = (s.match(/\[/g) || []).length - (s.match(/\]/g) || []).length;
      if (opens > 0 || arrOpens > 0) {
        console.warn(`⚠️ [comparative-scoring] Truncated JSON detected — repairing (opens:${opens} arrOpens:${arrOpens})`);
        for (let i = 0; i < arrOpens; i++) s += ']';
        for (let i = 0; i < opens; i++) s += '}';
      }
      return s;
    };
    cleanedContent = repairTruncatedJson(cleanedContent);

    const parsed = JSON.parse(cleanedContent) as ComparativeResult;

    // Validate response
    if (!parsed.ranking || !Array.isArray(parsed.ranking)) {
      throw new Error('Invalid response: missing or invalid ranking array');
    }

    if (!parsed.winnerVersionId) {
      throw new Error('Invalid response: missing winnerVersionId');
    }

    // Ensure all versions are present — append any missing ones with default score
    if (parsed.ranking.length !== versions.length) {
      console.warn(`⚠️ [comparative-scoring] Expected ${versions.length} versions, got ${parsed.ranking.length}`);

      // Find which versions are missing from the ranking
      const rankedVersionIds = new Set(parsed.ranking.map(r => r.versionId));
      const missingVersions = versions.filter(v => !rankedVersionIds.has(v.id));

      if (missingVersions.length > 0) {
        console.warn(`[comparative-scoring] Appending ${missingVersions.length} missing version(s):`);

        // Find the next rank to use (after current max rank)
        const maxRank = Math.max(...parsed.ranking.map(r => r.rank), 0);

        missingVersions.forEach((missingVersion, idx) => {
          const newRank = maxRank + idx + 1;
          const label = versionLabels[missingVersion.id] || `Version ${newRank}`;

          console.warn(`  - Appending ${label} (${missingVersion.id}) as rank ${newRank}`);

          parsed.ranking.push({
            versionId: missingVersion.id,
            label: label,
            score: 50, // Default score for missing versions
            rank: newRank,
            reason: 'Missing from LLM ranking - assigned default score',
            humanAuthenticity: 50,
            overMarketingPenalty: 50,
            brandFit: 50
          });
        });
      }
    }

    // Validate winner exists in ranking
    const winnerInRanking = parsed.ranking.find(r => r.versionId === parsed.winnerVersionId && r.rank === 1);
    if (!winnerInRanking) {
      console.warn('⚠️ [comparative-scoring] Winner not found at rank 1, fixing...');
      // Auto-fix: set winner to rank 1 version
      const rank1 = parsed.ranking.find(r => r.rank === 1);
      if (rank1) {
        parsed.winnerVersionId = rank1.versionId;
      }
    }

    console.log('[comparative-scoring] winner:', parsed.winnerVersionId);
    console.log('[comparative-scoring] ranking:', parsed.ranking.map(r => `${r.rank}. ${r.label} (${r.score})`).join(', '));

    // DIAGNOSTIC: Log new positioning-aware dimensions to verify they're in the response
    console.log('[comparative-scoring] New dimensions verification:');
    parsed.ranking.forEach(r => {
      const hasDims = r.humanAuthenticity !== undefined && r.overMarketingPenalty !== undefined && r.brandFit !== undefined;
      const dimensionStr = `humanAuth=${r.humanAuthenticity ?? 'missing'} overMkt=${r.overMarketingPenalty ?? 'missing'} brandFit=${r.brandFit ?? 'missing'}`;
      const flagCount = r.verificationFlags?.length ?? 0;
      const status = hasDims ? '✓' : '✗';
      console.log(`  ${status} ${r.label}: ${dimensionStr} flags=${flagCount}`);
    });

    // Log winner breakdown if present
    if (parsed.winnerBreakdown) {
      console.log('[comparative-scoring] winner breakdown generated');
      console.log('[comparative-scoring] core strength:', parsed.winnerBreakdown.coreStrength?.slice(0, 80));
      console.log('[comparative-scoring] advantages:', parsed.winnerBreakdown.whatItDoesBetter?.length || 0);
    }

    // Log decision layer if present
    if (parsed.decisionLayer) {
      console.log('[comparative-scoring] decision layer generated');
      console.log('[comparative-scoring] recommended:', parsed.decisionLayer.recommendedLabel);
      console.log('[comparative-scoring] next best:', parsed.decisionLayer.nextBestLabel);
      console.log('[comparative-scoring] use case:', parsed.decisionLayer.recommendedUseCase?.slice(0, 80));
    }

    // Add timestamp to the result
    parsed.evaluatedAt = new Date().toISOString();

    return parsed;
  } catch (error) {
    console.error('[comparative-scoring] ERROR:', error);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESULT MAPPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Map comparative result into the existing ComparisonResult format
 * This allows the new engine to work with existing UI without changes
 *
 * CRITICAL MAPPING:
 * - optionLabel: Version title displayed in UI (e.g., "Original Copy", "Generated Copy 1")
 * - label: Same as optionLabel (kept for backward compatibility)
 * - rank: 1 = best, increasing = worse
 * - isWinner: true only for rank 1 version
 */
export function mapToComparisonResult(
  comparativeResult: ComparativeResult,
  versions: GeneratedContentItem[]
): any {
  // comparative scoring migration step 1
  // mapping new comparative format to old comparison result structure

  const rows = comparativeResult.ranking.map(item => {
    const version = versions.find(v => v.id === item.versionId);

    // Calculate actual Conversion and Trust sub-scores from the version content
    // (from comprehensiveScoring functions)
    let contentText = '';
    if (typeof version?.content === 'string') {
      contentText = version.content;
    } else if (Array.isArray(version?.content)) {
      contentText = version.content.join('\n');
    } else if (typeof version?.content === 'object' && version?.content !== null) {
      contentText = JSON.stringify(version.content);
    }

    // Use calculateMultiScoreDisplay to get actual Conversion and Trust scores
    const multiScores = contentText ? calculateMultiScoreDisplay(contentText) : null;

    // If we have real sub-scores, blend them with the comparative rank score.
    // LLM weight 80%, heuristic sub-scores 10% each — LLM is the primary signal; heuristics
    // are unreliable for structured/blended content and should not drag down a strong LLM ranking.
    let finalScore = item.score;
    if (multiScores) {
      finalScore = Math.round(
        item.score * 0.8 +
        multiScores.conversion * 0.1 +
        multiScores.trust * 0.1
      );
    }

    return {
      versionId: item.versionId,
      label: item.label,
      optionLabel: item.label, // UI expects optionLabel for display
      rank: item.rank,
      isWinner: item.versionId === comparativeResult.winnerVersionId,

      // Map score to expected fields
      score: item.score,    // raw LLM comparative score — used by HTML export banner
      finalScore: finalScore,
      displayScore: finalScore,

      // Use actual calculated sub-scores from multiScoreDisplay
      conversionScore: multiScores?.conversion ?? Math.round(item.score * 0.95),
      trustScore: multiScores?.trust ?? Math.round(item.score * 0.93),
      riskLevel: multiScores?.risk ?? (item.score >= 80 ? 'low' : item.score >= 65 ? 'medium' : 'high'),

      // Decision layer fields
      decisionSummary: item.reason,
      decisionReason: item.reason,
      explanation: item.reason,

      // Timestamp - use original creation timestamp, not scoring timestamp
      evaluatedAt: version?.generatedAt || comparativeResult.evaluatedAt,

      // Version metadata
      type: version?.type,
      persona: version?.persona,
      sourceDisplayName: version?.sourceDisplayName,

      // NEW: Pass through the three new LLM-generated positioning-aware dimensions
      humanAuthenticity: item.humanAuthenticity,
      overMarketingPenalty: item.overMarketingPenalty,
      brandFit: item.brandFit,

      // NEW: Verification flags — claims that need human review before publishing
      verificationFlags: item.verificationFlags || []
    };
  });

  // Sort by rank for consistent display
  rows.sort((a, b) => a.rank - b.rank);

  // Re-elect winner by highest finalScore after blending — the LLM pick and the blended score
  // can diverge when sub-scores (conversion, trust) push a different row higher. The row with the
  // highest finalScore is the authoritative winner for all display purposes.
  const topByFinalScore = [...rows].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))[0];
  const llmWinnerId = comparativeResult.winnerVersionId;
  const actualWinnerId = topByFinalScore?.versionId ?? llmWinnerId;
  if (actualWinnerId !== llmWinnerId) {
    console.warn(`[mapToComparisonResult] winner override: LLM picked ${llmWinnerId} (score ${rows.find(r => r.versionId === llmWinnerId)?.finalScore}) but highest finalScore is ${actualWinnerId} (${topByFinalScore?.finalScore})`);
    rows.forEach(r => { r.isWinner = r.versionId === actualWinnerId; });
  }

  const winnerRow = rows.find(r => r.isWinner);

  return {
    rows,
    winnerVersionId: actualWinnerId,
    winnerLabel: winnerRow?.label || 'Winner',
    winnerExplanation: comparativeResult.winnerExplanation,

    // Winner breakdown (enhanced explanation layer)
    winnerBreakdown: comparativeResult.winnerBreakdown,

    // Final recommendation
    finalRecommendation: {
      why: comparativeResult.finalRecommendation.why,
      priorityActions: comparativeResult.finalRecommendation.nextSteps.map((step, idx) => ({
        title: step,
        reason: `Priority ${idx + 1}`,
        impact: 'high'
      })),
      whyOthersLose: comparativeResult.finalRecommendation.whyOthersLose || []
    },

    // Decision layer (practical recommendation)
    decisionLayer: comparativeResult.decisionLayer,

    // Metadata
    comparisonMode: 'comparative',
    engineVersion: 'comparative-v1',
    scoredAt: comparativeResult.evaluatedAt,
    scoringVersion: 'comparative-v1',

    // comparative scoring state fix: version-set fingerprint for staleness detection
    versionSetKey: versions.map(v => v.id).sort().join(',')
  };
}
