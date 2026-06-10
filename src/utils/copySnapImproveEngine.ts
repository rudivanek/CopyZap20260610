/**
 * Copy Snap IMPROVE Mode - Enhanced Generation Engine
 *
 * Implements conflict resolution, quality validation, and guardrails
 * to ensure high-quality outputs across all option combinations.
 */

export interface ImproveOptions {
  goal: 'clearer' | 'persuasive' | 'shorter' | 'punchier';
  platform: 'general' | 'x' | 'linkedin' | 'email';
  length: 'short' | 'same' | 'longer';
  humanTone: boolean;
  specialInstructions?: string;
}

export interface ImproveContext {
  inputText: string;
  detectedLang: string;
  langName: string;
  category?: string;
}

interface ConflictResolution {
  effectiveGoal: string;
  effectiveLength: string;
  platformConstraints: string[];
  warnings: string[];
}

/**
 * Step 1: Resolve conflicts between goals, platforms, and length
 */
function resolveConflicts(options: ImproveOptions): ConflictResolution {
  const warnings: string[] = [];
  const platformConstraints: string[] = [];

  // Priority order: Platform > Length > Goals

  // Platform constraints
  if (options.platform === 'email') {
    platformConstraints.push('No emojis allowed');
    platformConstraints.push('Persuasive CTAs must be polite and specific');
    platformConstraints.push('Professional but warm tone');
  }

  if (options.platform === 'x' && options.length === 'short') {
    platformConstraints.push('Output must be one concise sentence');
    platformConstraints.push('No generic CTAs like "Reply if..." or "Let me know..."');
  }

  if (options.platform === 'linkedin') {
    platformConstraints.push('Professional tone, minimal emojis');
    platformConstraints.push('Clear opinions, no fluff');
  }

  if (options.platform === 'x') {
    platformConstraints.push('Concise, conversational, scroll-stopping');
    platformConstraints.push('Natural use of emojis is acceptable');
  }

  // Length conflict resolution
  let effectiveLength = options.length;
  let effectiveGoal = options.goal;

  if (options.length === 'short') {
    if (options.goal === 'persuasive') {
      warnings.push('Short + Persuasive: Using micro-CTA only (4-6 words max)');
      effectiveGoal = 'clearer'; // Downweight persuasive
    }
    effectiveLength = 'short';
  }

  if (options.length === 'longer' && options.goal === 'shorter') {
    warnings.push('Conflict: "Longer" length overrides "Shorter" goal');
    effectiveGoal = 'clearer'; // Neutral goal when conflicting
  }

  if (options.length === 'short' && options.goal === 'shorter') {
    warnings.push('Redundant: Both length and goal are "shorter"');
  }

  return {
    effectiveGoal,
    effectiveLength,
    platformConstraints,
    warnings
  };
}

/**
 * Step 2: Detect content category for context-aware improvements
 */
function detectCategory(text: string): string {
  const lower = text.toLowerCase();

  if (/\b(shipped|deployed|released|launched|implemented|built|api|cache|performance|bug|feature)\b/i.test(text)) {
    return 'tech-product';
  }

  if (/\b(marketing|campaign|conversion|sales|customers|clients|roi|strategy)\b/i.test(text)) {
    return 'business-marketing';
  }

  if (/\b(founded|startup|users|milestone|grateful|journey|building)\b/i.test(text)) {
    return 'founder-update';
  }

  if (/\b(learned|experience|insight|years|working in|discovered)\b/i.test(text)) {
    return 'linkedin-insight';
  }

  if (/\b(reach out|interested|schedule|meeting|call|demo|discuss)\b/i.test(text)) {
    return 'email';
  }

  return 'general';
}

/**
 * Step 3: Generate category-aware CTA variants (non-generic)
 */
function generateCTA(category: string, platform: string): string {
  if (platform === 'email') {
    const emailCTAs = [
      'Would next Tuesday at 2pm work?',
      'I have slots open this week.',
      'Let me send you the details.',
      'Happy to walk you through it.'
    ];
    return emailCTAs[Math.floor(Math.random() * emailCTAs.length)];
  }

  const ctaMap: Record<string, string[]> = {
    'tech-product': [
      'Want the migration steps?',
      'Should we share a quick guide?',
      'Curious about the implementation?',
      'Need help with the upgrade?'
    ],
    'business-marketing': [
      'Curious how other teams handle this?',
      'This is where most teams get stuck.',
      'Want to see the breakdown?',
      'Here\'s what worked for us.'
    ],
    'founder-update': [
      'If you\'re building too, what\'s been hardest?',
      'What milestone are you chasing?',
      'DM me if you want to chat about this.',
      'Share your wins — I want to hear them.'
    ],
    'linkedin-insight': [
      'What\'s been your experience?',
      'Does this match what you\'ve seen?',
      'Curious what others think.',
      'Any counterpoints?'
    ],
    'general': [
      'Thoughts?',
      'What do you think?',
      'Does this resonate?'
    ]
  };

  const ctas = ctaMap[category] || ctaMap['general'];
  return ctas[Math.floor(Math.random() * ctas.length)];
}

/**
 * Step 4: Build enhanced system prompt with conflict resolution
 */
export function buildImprovePrompt(
  context: ImproveContext,
  options: ImproveOptions
): { system: string; user: string } {
  const { inputText, detectedLang, langName } = context;
  const category = detectCategory(inputText);
  const resolution = resolveConflicts(options);

  // Base context
  const baseContext = `You are CopySnap, an AI assistant that improves text. CRITICAL: The user's input is in ${langName}. You MUST respond in ${langName} (language code: ${detectedLang}). All sections of your JSON output must be in ${langName}.`;

  // CRITICAL: Special Instructions section (HIGHEST PRIORITY)
  const specialInstructionsSection = options.specialInstructions ? `
═══════════════════════════════════════════════════════════════
SPECIAL INSTRUCTIONS (HIGHEST PRIORITY - MANDATORY)
═══════════════════════════════════════════════════════════════

User's Special Instructions:
"${options.specialInstructions}"

CRITICAL ENFORCEMENT RULES:
1. These Special Instructions have ABSOLUTE PRIORITY over all other settings
2. The output MUST follow these instructions EXACTLY, even if they conflict with:
   - Goal settings (${options.goal})
   - Platform settings (${options.platform})
   - Length settings (${options.length})
   - Default transformations or improvements

3. If Special Instructions request a specific tone, stance, or style:
   → Output MUST reflect that explicitly
   → Override the selected goal and platform settings

4. If Special Instructions are brief (e.g., "Totally agreed", "Make it more critical"):
   → These are EXPLICIT INSTRUCTIONS that must be incorporated
   → The improved output MUST clearly express this direction
   → Do NOT dilute or reinterpret the user's intent

CONFLICT RESOLUTION:
If there is ANY conflict between Special Instructions and other settings:
→ Special Instructions ALWAYS WIN
→ Ignore conflicting settings
→ Follow the user's explicit intent

═══════════════════════════════════════════════════════════════
` : '';

  // Goal instructions with conflict-aware logic
  const goalInstructions = getGoalInstructions(
    resolution.effectiveGoal,
    options.platform,
    resolution.effectiveLength,
    category
  );

  // Platform-specific instructions
  const platformInstructions = getPlatformInstructions(
    options.platform,
    resolution.platformConstraints
  );

  // Length instructions with quality guardrails
  const lengthInstructions = getLengthInstructions(
    resolution.effectiveLength,
    options.platform,
    category
  );

  // Quality validation rules
  const qualityRules = `
CRITICAL QUALITY RULES (MANDATORY):

${options.specialInstructions ? `0. SPECIAL INSTRUCTIONS OVERRIDE:
   - If Special Instructions are provided, they take ABSOLUTE PRIORITY
   - The output MUST follow Special Instructions even if they conflict with mode settings
   - Do NOT ignore or dilute user intent from Special Instructions
` : ''}
1. MINIMUM MEANING CHECKS:
   - Output MUST contain a clear subject (what changed / what it is)
   - Output MUST contain at least one concrete benefit or implication
   - Output MUST be a complete grammatical sentence
   - Output MUST NOT end with vague fragments like:
     × "to improve."
     × "to help."
     × "to make things better."
     × "for better results."

2. SHORT MODE RULES:
   - Reduce word count by 20-40%
   - PRESERVE the core action
   - PRESERVE the primary benefit
   - NEVER remove the benefit clause when shortening
   - Remove hedging phrases, filler, or secondary clauses first

   BAD EXAMPLE (never allowed):
   "Shipped a new caching layer to improve."

   GOOD EXAMPLE:
   "Shipped a new caching layer to improve performance during peak hours."

3. PERSUASIVE MODE RULES:
   - DO NOT use generic CTAs:
     × "Reply if you'd like…"
     × "Let me know if…"
     × "Happy to share…"

   - Use category-specific CTAs instead:
     ${category === 'tech-product' ? '✓ "Want the migration steps?"' : ''}
     ${category === 'business-marketing' ? '✓ "Curious how other teams handle this?"' : ''}
     ${category === 'founder-update' ? '✓ "If you\'re building too, what\'s been hardest?"' : ''}
     ${category === 'email' ? '✓ "Would next Tuesday at 2pm work?"' : ''}

   - For length=Short: Use micro-CTA only (4-6 words max)

4. LONGER MODE RULES:
   - Add ONLY ONE extra sentence
   - That sentence MUST add clarity or implication
   - DO NOT repeat generic phrases:
     × "smoother experience"
     × "better results"
     × "improved performance"

   - Category-based expansion:
     ${category === 'tech-product' ? '→ Add where users notice it (peak load, large files, sync)' : ''}
     ${category === 'business-marketing' ? '→ Add outcome (fewer handoffs, faster decisions)' : ''}
     ${category === 'email' ? '→ Add clear next step' : ''}
     ${category === 'linkedin-insight' ? '→ Add implication or takeaway' : ''}

5. SEMANTIC OVERLAP CHECK:
   - If your output has >70% semantic overlap with original: REGENERATE
   - If output differs only by synonyms: REGENERATE
   - Apply actual structural improvements, not just word swaps`;

  // Human tone instructions (if enabled)
  const humanToneInstructions = options.humanTone ? `

HUMAN TONE RULES:
- Write in a natural, human-sounding voice
- Use natural sentence rhythm: mix short and medium sentences
- Prefer concrete, specific language over abstract phrases
- Avoid buzzwords and corporate language
- Write conversationally, as a real person would
- NO exaggerated enthusiasm or hype
- Avoid AI-style phrases:
  × "In today's fast-paced world"
  × "It's important to note"
  × "Unlock the power of"
  × "Leverage", "synergy", "game-changing"` : '';

  // JSON structure
  const jsonStructure = `
Return ONLY valid JSON with this exact structure:
{
  "best": "string - your primary improved version",
  "alternatives": ["string - alternative 1", "string - alternative 2"],
  "notes": ["tip 1", "tip 2", "tip 3"]
}

CRITICAL: Return exactly 2 alternatives and exactly 3 notes (tips).`;

  // Assemble system prompt - Special Instructions FIRST for highest priority
  const system = `${baseContext}

${specialInstructionsSection}

${goalInstructions}

${platformInstructions}

${lengthInstructions}

${qualityRules}

${humanToneInstructions}

${jsonStructure}

Do NOT add markdown formatting, code blocks, or explanations. Just raw JSON.
Remember: ALL text in the JSON must be in ${langName}.
${options.specialInstructions ? '\nREMINDER: Follow the Special Instructions above with absolute priority.' : ''}`;

  const user = `Original text:\n\n${inputText}`;

  return { system, user };
}

/**
 * Goal-specific instructions with conflict awareness
 */
function getGoalInstructions(
  goal: string,
  platform: string,
  length: string,
  category: string
): string {
  const goalMap: Record<string, string> = {
    clearer: `Your primary goal: Make the copy CLEARER and easier to understand.
- Simplify complex sentences
- Use concrete, specific language
- Remove ambiguity
- Make the main point obvious`,

    persuasive: `Your primary goal: Make the copy more PERSUASIVE and compelling.
- Strengthen the value proposition
- Add a contextual call-to-action (category: ${category})
- Emphasize benefits over features
${length === 'short' ? '- Use micro-CTA only (4-6 words max)' : ''}
${platform === 'x' ? '- No generic CTAs like "Reply if..." or "Let me know..."' : ''}`,

    shorter: `Your primary goal: Make the copy SHORTER and more concise.
- Reduce word count by 20-40%
- Remove redundancy and filler
- CRITICAL: Preserve the core action AND primary benefit
- Never create incomplete thoughts`,

    punchier: `Your primary goal: Make the copy PUNCHIER with stronger impact.
- Use strong, active verbs
- Apply active voice
- Make every word count
- Create immediate impact`
  };

  return goalMap[goal] || goalMap['clearer'];
}

/**
 * Platform-specific instructions
 */
function getPlatformInstructions(
  platform: string,
  constraints: string[]
): string {
  const platformMap: Record<string, string> = {
    general: 'Platform: General use (versatile, neutral tone)',
    x: 'Platform: X (Twitter) - concise, conversational, scroll-stopping',
    linkedin: 'Platform: LinkedIn - professional but personal, clear opinions, no fluff',
    email: 'Platform: Email - formal or semi-formal, polite, specific'
  };

  let instructions = platformMap[platform] || platformMap['general'];

  if (constraints.length > 0) {
    instructions += '\n\nPlatform Constraints:\n' + constraints.map(c => `- ${c}`).join('\n');
  }

  return instructions;
}

/**
 * Length-specific instructions with quality guardrails
 */
function getLengthInstructions(
  length: string,
  platform: string,
  category: string
): string {
  const lengthMap: Record<string, string> = {
    short: `Length: SHORTER than the original (reduce by 20-40%)
- Remove hedging phrases and filler first
- PRESERVE core action and primary benefit
- Ensure output is a complete thought
- Never truncate mid-sentence or mid-clause`,

    same: `Length: ROUGHLY THE SAME as the original (±10%)
- Apply improvements without major length changes
- Focus on clarity and impact, not expansion or reduction`,

    longer: `Length: LONGER than the original (expand by 20-40%)
- Add ONLY ONE extra sentence
- New sentence must add clarity or implication
- Category-specific expansion (${category}):
  ${getCategoryExpansionGuidance(category)}
- NO generic phrases like "smoother experience" or "better results"`
  };

  return lengthMap[length] || lengthMap['same'];
}

/**
 * Category-specific expansion guidance
 */
function getCategoryExpansionGuidance(category: string): string {
  const guidanceMap: Record<string, string> = {
    'tech-product': '→ Specify where users notice it (peak load, large files, sync)',
    'business-marketing': '→ Describe the outcome (fewer handoffs, faster decisions)',
    'email': '→ Add a clear, specific next step',
    'linkedin-insight': '→ Add the implication or key takeaway',
    'founder-update': '→ Add context about the journey or what\'s next',
    'general': '→ Add relevant context or clarification'
  };

  return guidanceMap[category] || guidanceMap['general'];
}

/**
 * Step 5: Validate output quality
 */
export function validateImprovedOutput(
  original: string,
  improved: string,
  options: ImproveOptions
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Not empty
  if (!improved || improved.trim().length === 0) {
    errors.push('Output is empty');
    return { valid: false, errors, warnings };
  }

  // Check 2: Contains meaningful content
  const trimmed = improved.trim();
  if (trimmed.length < 10) {
    errors.push('Output is too short to be meaningful');
  }

  // Check 3: No vague endings
  const vaguEndings = [
    /to improve\.?\s*$/i,
    /to help\.?\s*$/i,
    /to make things better\.?\s*$/i,
    /for better results\.?\s*$/i,
    /to enhance\.?\s*$/i
  ];

  for (const pattern of vaguEndings) {
    if (pattern.test(trimmed)) {
      errors.push('Output ends with a vague fragment (e.g., "to improve.")');
      break;
    }
  }

  // Check 4: Complete sentence
  if (!/[.!?]$/.test(trimmed)) {
    warnings.push('Output may not be a complete sentence');
  }

  // Check 5: Semantic overlap check (simplified)
  const originalWords = new Set(original.toLowerCase().split(/\s+/));
  const improvedWords = new Set(improved.toLowerCase().split(/\s+/));

  const commonWords = new Set(
    [...originalWords].filter(word => improvedWords.has(word))
  );

  const overlapRatio = commonWords.size / originalWords.size;

  if (overlapRatio > 0.85) {
    warnings.push('Output may be too similar to original (>85% word overlap)');
  }

  // Check 6: Short mode validation
  if (options.length === 'short') {
    const originalLength = original.split(/\s+/).length;
    const improvedLength = improved.split(/\s+/).length;

    if (improvedLength >= originalLength) {
      warnings.push('Short mode did not reduce length');
    }

    // Check for benefit preservation
    if (originalLength > 10 && improvedLength < 5) {
      warnings.push('Short mode may have removed too much content');
    }
  }

  // Check 7: Longer mode validation
  if (options.length === 'longer') {
    const originalLength = original.split(/\s+/).length;
    const improvedLength = improved.split(/\s+/).length;

    if (improvedLength <= originalLength) {
      warnings.push('Longer mode did not increase length');
    }

    // Check for generic phrases
    const genericPhrases = [
      /smoother experience/i,
      /better results/i,
      /improved performance/i,
      /enhanced productivity/i
    ];

    for (const pattern of genericPhrases) {
      if (pattern.test(improved) && !pattern.test(original)) {
        warnings.push('Longer mode may have added generic filler');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Step 6: Generate fallback output when validation fails
 */
export function generateFallbackOutput(
  original: string,
  detectedLang: string,
  langName: string
): { system: string; user: string } {
  const system = `You are CopySnap. The user's input is in ${langName}. You MUST respond in ${langName} (language code: ${detectedLang}).

Your task: Rewrite the text to be CLEARER and more concise, maintaining the same length.

CRITICAL RULES:
- Keep all key information
- Make it easier to understand
- Use simple, direct language
- Return a complete, meaningful sentence
- NO vague endings

Return ONLY valid JSON:
{
  "best": "your rewritten version",
  "alternatives": ["alternative 1", "alternative 2"],
  "notes": ["tip 1", "tip 2", "tip 3"]
}

Do NOT add markdown or explanations. Just raw JSON in ${langName}.`;

  const user = `Original text:\n\n${original}`;

  return { system, user };
}
