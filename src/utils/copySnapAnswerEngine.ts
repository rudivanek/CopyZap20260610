/**
 * Copy Snap ANSWER Mode - Enhanced Generation Engine
 *
 * Implements strict priority rules, conflict resolution, and quality validation
 * to ensure production-ready, safe-to-post replies across all option combinations.
 */

export interface AnswerOptions {
  replyStyle: 'helpful' | 'friendly' | 'confident' | 'witty' | 'direct';
  stance: 'neutral' | 'agree' | 'disagree';
  length: 'short' | 'medium' | 'long';
  humanTone: boolean;
  specialInstructions?: string;
}

export interface AnswerContext {
  originalText: string;
  detectedLang: string;
  langName: string;
}

interface GuardrailConfig {
  maxSentences: number;
  maxQuestions: number;
  allowEmojis: boolean;
  maxEmojis: number;
  humorDensity: 'none' | 'first-only' | 'balanced' | 'allowed';
  requireSoftener: boolean;
  allowRhetoricalQuestions: boolean;
  neutralStrategy: 'context' | 'reframe' | 'observation' | 'question';
}

/**
 * Step 1: PRIORITY & CONFLICT RESOLUTION
 * Priority order: Platform norms > Length > Reply Style > Stance
 */
function resolveGuardrails(options: AnswerOptions): GuardrailConfig {
  const { replyStyle, stance, length } = options;

  // Base configuration
  let config: GuardrailConfig = {
    maxSentences: 2,
    maxQuestions: 1,
    allowEmojis: false,
    maxEmojis: 0,
    humorDensity: 'none',
    requireSoftener: false,
    allowRhetoricalQuestions: false,
    neutralStrategy: 'observation'
  };

  // Step 1: Apply LENGTH constraints (highest priority for structure)
  if (length === 'short') {
    config.maxSentences = 2;
    config.maxQuestions = 1;
  } else if (length === 'medium') {
    config.maxSentences = 4;
    config.maxQuestions = 1; // Preferred limit
  } else if (length === 'long') {
    config.maxSentences = 6;
    config.maxQuestions = 2;
  }

  // Step 2: Apply REPLY STYLE modifiers
  if (replyStyle === 'friendly' || replyStyle === 'witty') {
    config.allowEmojis = true;
    config.maxEmojis = 1; // MAX ONE emoji
  }

  if (replyStyle === 'witty') {
    if (length === 'short' || length === 'medium') {
      config.humorDensity = 'allowed';
    } else if (length === 'long') {
      config.humorDensity = 'first-only'; // CRITICAL: Humor only in first sentence for Long
    }
  }

  if (replyStyle === 'direct') {
    config.allowRhetoricalQuestions = false;
    config.humorDensity = 'none';
    config.maxQuestions = 0; // Unless Neutral stance
  }

  // Step 3: Apply STANCE modifiers
  if (stance === 'disagree') {
    config.requireSoftener = true; // MUST start with acknowledgment
  }

  if (stance === 'neutral' && replyStyle === 'direct') {
    config.allowRhetoricalQuestions = true;
    config.maxQuestions = 1;
  }

  // Step 4: Determine Neutral strategy (rotate, don't default to questions)
  if (stance === 'neutral') {
    const strategies: Array<'context' | 'reframe' | 'observation' | 'question'> = [
      'context',
      'reframe',
      'observation',
      'question'
    ];
    // Use a simple rotation based on text length to provide variety
    const hash = options.specialInstructions?.length || 0;
    config.neutralStrategy = strategies[hash % strategies.length];
  }

  return config;
}

/**
 * Step 2: Build enhanced system prompt with guardrails
 */
export function buildAnswerPrompt(
  context: AnswerContext,
  options: AnswerOptions
): { system: string; user: string } {
  const { originalText, detectedLang, langName } = context;
  const guardrails = resolveGuardrails(options);

  // Base context
  const baseContext = `You are CopySnap, an AI assistant that generates thoughtful, production-ready social media replies. CRITICAL: The user's message is in ${langName}. You MUST respond in ${langName} (language code: ${detectedLang}). All sections of your JSON output must be in ${langName}.`;

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
   - Mode behavior (Answer, Improve, Question)
   - Tone settings (${options.replyStyle})
   - Stance settings (${options.stance})
   - Length settings (${options.length})
   - Default transformations or platform norms

3. If Special Instructions request a specific stance or opinion:
   → Output MUST reflect that stance explicitly
   → Override the selected stance setting

4. If Special Instructions request a specific output type (question, statement, etc.):
   → Output MUST be that type
   → Override mode defaults

5. If Special Instructions are brief (e.g., "Totally agreed", "I disagree"):
   → These are EXPLICIT STANCE INSTRUCTIONS
   → The output MUST clearly express this stance
   → Do NOT dilute or reinterpret the user's intent

CONFLICT RESOLUTION:
If there is ANY conflict between Special Instructions and other settings:
→ Special Instructions ALWAYS WIN
→ Ignore conflicting settings
→ Follow the user's explicit intent

═══════════════════════════════════════════════════════════════
` : '';

  // Check if Special Instructions explicitly request a question
  const specialInstructionsRequestQuestion = options.specialInstructions && (
    /question/i.test(options.specialInstructions) ||
    /ask/i.test(options.specialInstructions) ||
    /inquir/i.test(options.specialInstructions) ||
    /\?/.test(options.specialInstructions)
  );

  // ABSOLUTE ANSWER MODE CONSTRAINT (unless Special Instructions override)
  const answerModeConstraint = !specialInstructionsRequestQuestion ? `
╔═══════════════════════════════════════════════════════════════╗
║  ABSOLUTE ANSWER MODE CONSTRAINT (SYNTAX-LEVEL ENFORCEMENT)  ║
╚═══════════════════════════════════════════════════════════════╝

The output MUST be strictly declarative.

FORBIDDEN ELEMENTS:
✗ Questions of ANY kind
✗ Reflective prompts
✗ Engagement questions
✗ Discussion questions
✗ Rhetorical questions
✗ Follow-up questions
✗ Ending with a question

SYNTAX RULE (ABSOLUTE):
→ The presence of ANY question mark (?) is FORBIDDEN
→ Zero "?" characters allowed in the entire output
→ This is a hard constraint, not a guideline

WHY THIS MATTERS:
LLMs default to "engagement" as good UX. This is WRONG in Answer mode.
Users want declarative responses, not conversation prompts.

VALID ANSWER EXAMPLES:
✓ "Totally agreed. Real impact comes from helping, not critiquing."
✓ "I disagree. Speed matters more than polish in early stages."
✓ "This is a solid point about prioritization."

INVALID ANSWER EXAMPLES:
✗ "Totally agreed. What can we do to help more?" ← Question mark forbidden
✗ "Great point! How do you balance this?" ← Question mark forbidden
✗ "I see your perspective. Thoughts?" ← Question mark forbidden

FINAL CHECK:
Before returning output, scan for "?" character.
If found → Remove the question entirely.
Replace with a declarative statement instead.

═══════════════════════════════════════════════════════════════
` : '';

  // Priority and conflict resolution notice (for non-special-instruction conflicts)
  const priorityNotice = `
PRIORITY ORDER (when no Special Instructions conflict):
1. Special Instructions (if provided - HIGHEST)
2. Platform norms (Twitter/LinkedIn style)
3. Length constraints
4. Reply Style
5. Stance

When conflicts arise, higher priority rules override lower priority rules.`;

  // Length constraints
  const lengthRules = getLengthRules(options.length, guardrails, specialInstructionsRequestQuestion);

  // Reply Style rules
  const styleRules = getReplyStyleRules(options.replyStyle, guardrails, options.length, specialInstructionsRequestQuestion);

  // Stance rules
  const stanceRules = getStanceRules(options.stance, options.replyStyle, guardrails, specialInstructionsRequestQuestion);

  // Quality validation rules
  const qualityRules = `
MANDATORY QUALITY VALIDATION:

Before returning your reply, validate:
1. Reply is coherent as a standalone response
2. Reply adds value beyond restating the original
3. Reply respects selected stance (${options.stance})${options.specialInstructions ? '\n   → BUT: If Special Instructions specify a different stance, follow Special Instructions' : ''}
4. Reply matches selected style (${options.replyStyle})
5. Sentence count is within bounds (max ${guardrails.maxSentences})
6. ${!specialInstructionsRequestQuestion ? '⚠️ ABSOLUTE: Output contains ZERO question marks (?) - FORBIDDEN in Answer mode' : `Question count is within bounds (max ${guardrails.maxQuestions})`}
${guardrails.allowEmojis ? `7. Emoji count ≤ ${guardrails.maxEmojis}` : '7. NO emojis allowed'}
8. No hashtags unless clearly appropriate
9. No markdown formatting (**, __, etc.)
10. Ready to post without editing

${!specialInstructionsRequestQuestion ? `
⚠️ FINAL SYNTAX CHECK (ABSOLUTE):
→ Scan output for "?" character
→ If found: FAIL validation immediately
→ This is non-negotiable syntax enforcement
` : ''}

If validation fails: regenerate with stricter constraints.`;

  // Safety heuristics
  const safetyRules = `
INTERNAL SAFETY HEURISTICS:

- Avoid repeated sentence structures
- Avoid repeated CTA/question patterns
- Reduce semantic overlap with original text
- Prefer specificity over general advice
- Never be rude, aggressive, or dismissive
- Match the tone and formality of the original post`;

  // Anti-fluff rules (for Medium and Long)
  const antiFluffRules = (options.length === 'medium' || options.length === 'long') ? `

ANTI-FLUFF ENFORCEMENT (${options.length.toUpperCase()} LENGTH):

Generic motivational language is FORBIDDEN unless explicitly requested by Special Instructions.

BANNED PHRASES (unless in Special Instructions):
× "builders vs bystanders"
× "meaningful progress"
× "take action"
× "make a difference"
× "the key to success"
× "at the end of the day"
× "game changer"
× "level up"
× "move the needle"

QUALITY STANDARDS:
→ Replace abstractions with concrete examples
→ Replace slogans with specific observations
→ Replace motivational fluff with actual insight
→ If a sentence doesn't add NEW information, remove it

VALIDATION:
Before finalizing, ask: "Does this sentence teach something new or just restate in different words?"
If it just restates → DELETE IT.` : '';

  // Human tone instructions
  const humanToneInstructions = options.humanTone ? `

HUMAN TONE RULES:
- Write in a natural, human-sounding voice appropriate for real social media
- Use natural sentence rhythm: mix short and medium sentences
- Prefer concrete, specific language over abstract phrases
- Avoid buzzwords, clichés, and overly formal language
- Write conversationally, as a real person would
- Allow natural phrasing variations
- Avoid exaggerated enthusiasm or hype

HUMAN TONE GUARDRAIL:
Sound natural and conversational, but DO NOT:
→ Add motivational language or inspirational framing
→ Add collective framing (e.g. "we", "our", "us") unless it already appears in the input text
→ Replace concrete terms with vague or abstract phrasing (e.g. "things", "stuff", "this kind of work")

Human tone should improve readability and warmth without changing precision, intent, or specificity.` : '';

  // JSON structure
  const jsonStructure = `
Return ONLY valid JSON with this exact structure:
{
  "best": "string - your primary reply",
  "alternatives": ["string - alternative reply 1", "string - alternative reply 2"]
}

CRITICAL: Return exactly 2 alternatives.`;

  // Assemble system prompt - Special Instructions FIRST for highest priority
  const system = `${baseContext}

${specialInstructionsSection}

${answerModeConstraint}

${priorityNotice}

${lengthRules}

${styleRules}

${stanceRules}

${qualityRules}

${safetyRules}

${antiFluffRules}

${humanToneInstructions}

${jsonStructure}

Do NOT add markdown formatting, code blocks, or explanations. Just raw JSON.
Remember: ALL text in the JSON must be in ${langName}.
The output should be ready-to-post text.
${!specialInstructionsRequestQuestion ? '\n⚠️ CRITICAL REMINDER: NO question marks (?) allowed in Answer mode unless explicitly requested.' : ''}
${options.specialInstructions ? '\nREMINDER: Follow the Special Instructions above with absolute priority.' : ''}`;

  const user = `Message to reply to:\n\n${originalText}`;

  return { system, user };
}

/**
 * Length-specific rules with strict guardrails
 */
function getLengthRules(
  length: string,
  guardrails: GuardrailConfig,
  specialInstructionsRequestQuestion: boolean
): string {
  const lengthMap: Record<string, string> = {
    short: `LENGTH: SHORT (1-2 sentences)

ENFORCEMENT RULES:
- STRICT LIMIT: Maximum ${guardrails.maxSentences} sentences
${!specialInstructionsRequestQuestion ? '- NO questions allowed (Answer mode)' : `- Maximum ${guardrails.maxQuestions} question`}
- Must be readable as a reply on X / Twitter
- Every word must count

INTENT & QUALITY RULES:
SHORT output must be:
→ Direct and decisive
→ A clear restatement or crystallization of the core idea
→ NO metaphors, slogans, or examples
→ NO motivational language
→ NO filler or fluff

Purpose: Clarity and punch. Get straight to the point.`,

    medium: `LENGTH: MEDIUM (2-3 sentences)

ENFORCEMENT RULES:
- STRICT LIMIT: Maximum ${guardrails.maxSentences} sentences
${!specialInstructionsRequestQuestion ? '- NO questions allowed (Answer mode)' : `- Maximum ${guardrails.maxQuestions} question preferred`}

INTENT & QUALITY RULES:
MEDIUM output must be:
→ A paraphrase + light explanation
→ Focus on WHY the idea matters or HOW it works
→ Minimal idioms (max one if needed)
→ Avoid generic motivational phrasing ("builders vs bystanders", "meaningful progress")
→ Provide substance without verbosity

Purpose: Understanding and clarification. Help the reader grasp the concept.`,

    long: `LENGTH: LONG (4-6 sentences)

ENFORCEMENT RULES:
- STRICT LIMIT: Maximum ${guardrails.maxSentences} sentences
${!specialInstructionsRequestQuestion ? '- NO questions allowed (Answer mode)' : `- Maximum ${guardrails.maxQuestions} questions total`}
- MUST include at least ONE concrete insight or takeaway

INTENT & QUALITY RULES:
LONG output must be:
→ Expand the idea using concrete behaviors, implications, or mechanics
→ Prefer specificity over abstraction
→ Avoid clichés and slogans (e.g. "builders vs bystanders", "meaningful progress")
→ Do NOT moralize or lecture
→ Every sentence must add substantive value
→ Structure:
  1) Opening reaction or agreement
  2) Core insight with concrete details
  3) Implication or deeper observation
  ${!specialInstructionsRequestQuestion ? '4) Concluding statement (NO question)' : '4) Optional single question (if appropriate)'}

Purpose: Depth and substance. Add meaningful context and insight.

ANTI-FLUFF ENFORCEMENT:
- NO generic motivational language unless explicitly requested by Special Instructions
- NO abstract platitudes
- NO repeated points in different words
- Every sentence must advance the idea`
  };

  return lengthMap[length] || lengthMap['short'];
}

/**
 * Reply Style-specific rules
 */
function getReplyStyleRules(
  style: string,
  guardrails: GuardrailConfig,
  length: string,
  specialInstructionsRequestQuestion: boolean
): string {
  const styleMap: Record<string, string> = {
    helpful: `REPLY STYLE: HELPFUL
- Add ONE concrete idea, tip, or reframing
- Be informative and constructive
- Add value to the conversation
- NO filler explanations
- NO multiple tips in one reply
- Focus on being genuinely useful`,

    friendly: `REPLY STYLE: FRIENDLY
- Warm and conversational
${guardrails.allowEmojis ? `- Emojis allowed but MAX ${guardrails.maxEmojis}` : '- NO emojis'}
- Never combine multiple emojis
- NO sarcasm
- Personable but authentic
- Sound like a supportive peer
${!specialInstructionsRequestQuestion ? '- NO questions (Answer mode) - stay declarative' : ''}`,

    confident: `REPLY STYLE: CONFIDENT
- Clear and assertive
- Avoid sounding final or dismissive
- Use declarative statements
- Back up claims with reasoning
${guardrails.requireSoftener ? '- For Disagree: MUST include softening clause' : ''}
- Authoritative but inviting dialogue
${!specialInstructionsRequestQuestion ? '- NO questions (Answer mode)' : ''}`,

    witty: `REPLY STYLE: WITTY
- Clever and light, NEVER sarcastic
${guardrails.humorDensity === 'first-only' ? `- CRITICAL: Humor allowed ONLY in FIRST sentence (length=${length})` : ''}
${guardrails.humorDensity === 'allowed' ? '- Light humor throughout is acceptable' : ''}
${guardrails.humorDensity === 'none' ? '- NO humor allowed' : ''}
- Humor must be appropriate and friendly
- Never mean-spirited or dismissive
${guardrails.allowEmojis ? `- Emojis allowed but MAX ${guardrails.maxEmojis}` : ''}
- Wit should enhance, not replace substance
${!specialInstructionsRequestQuestion ? '- NO questions (Answer mode)' : ''}`,

    direct: `REPLY STYLE: DIRECT
- Concise and to-the-point
- NO emojis
- Minimal adjectives
- Prefer statements over questions
${!specialInstructionsRequestQuestion ? '- ABSOLUTELY NO questions (Answer mode)' : guardrails.allowRhetoricalQuestions ? '- Rhetorical questions allowed ONLY if Stance=Neutral' : '- NO rhetorical questions'}
- No fluff or hedging
- Clear and straightforward`
  };

  return styleMap[style] || styleMap['helpful'];
}

/**
 * Stance-specific rules with mandatory guardrails
 */
function getStanceRules(
  stance: string,
  replyStyle: string,
  guardrails: GuardrailConfig,
  specialInstructionsRequestQuestion: boolean
): string {
  const stanceMap: Record<string, string> = {
    neutral: `STANCE: NEUTRAL
CRITICAL: Neutral must NOT default to questions${!specialInstructionsRequestQuestion ? ' (FORBIDDEN in Answer mode)' : ''}.

Use the following strategy: ${guardrails.neutralStrategy}

${guardrails.neutralStrategy === 'context' ? `- Provide context or framing
- Add relevant background
- Help readers understand the landscape` : ''}

${guardrails.neutralStrategy === 'reframe' ? `- Rephrase or synthesize the point
- Offer a different angle
- Clarify the nuance` : ''}

${guardrails.neutralStrategy === 'observation' ? `- Make a balanced observation
- Note an implication
- Point out what's interesting` : ''}

${guardrails.neutralStrategy === 'question' && specialInstructionsRequestQuestion ? `- Ask ONE thoughtful question
- Make it open-ended and meaningful
- Invite genuine dialogue` : guardrails.neutralStrategy === 'question' ? `- Make a balanced observation instead of a question
- Note an implication
- Point out what's interesting` : ''}

${!specialInstructionsRequestQuestion ? 'ABSOLUTE: NO questions allowed in Answer mode.' : 'NEVER ask multiple questions in Neutral replies.'}
Rotate between strategies for variety.`,

    agree: `STANCE: AGREE
- MUST add original perspective
- NEVER just restate the original post
- Avoid generic praise:
  × "Totally agree"
  × "So true"
  × "This is spot on"
  ...unless followed by insight

- Add WHY you agree or WHAT it reminds you of
- Build on the idea with your own experience
- Supportive but substantive`,

    disagree: `STANCE: DISAGREE (CRITICAL RULES)

${guardrails.requireSoftener ? 'MANDATORY: Start with acknowledgment or softener' : ''}

Approved softening phrases:
- "In my experience…"
- "I've seen cases where…"
- "I agree in part, but…"
- "That's one way to look at it…"
- "Interesting point, though…"

DISALLOWED:
× Absolutist language
× Declarative "you're wrong" tone
× Lecture-style explanations
× Dismissive phrasing

${replyStyle === 'confident' ? 'SPECIAL: Confident + Disagree must still invite dialogue' : ''}

Always:
- Be respectful and constructive
- Offer counterpoint, not correction
- Invite further discussion
- Non-inflammatory tone`
  };

  return stanceMap[stance] || stanceMap['neutral'];
}

/**
 * Step 3: Validate answer output quality
 */
export function validateAnswerOutput(
  original: string,
  reply: string,
  options: AnswerOptions
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const guardrails = resolveGuardrails(options);

  // Check 1: Not empty
  if (!reply || reply.trim().length === 0) {
    errors.push('Reply is empty');
    return { valid: false, errors, warnings };
  }

  const trimmed = reply.trim();

  // Check 2: Minimum meaningful length
  if (trimmed.length < 10) {
    errors.push('Reply is too short to be meaningful');
  }

  // Check 3: Coherent standalone response
  if (!/[.!?]$/.test(trimmed)) {
    warnings.push('Reply may not be a complete sentence');
  }

  // Check 4: Sentence count validation
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > guardrails.maxSentences) {
    errors.push(`Reply exceeds max sentences (${sentences.length} > ${guardrails.maxSentences})`);
  }

  // Check 5: Question count validation
  const questions = (trimmed.match(/\?/g) || []).length;

  // CRITICAL: Check if Special Instructions explicitly request a question
  const specialInstructionsRequestQuestion = options.specialInstructions && (
    /question/i.test(options.specialInstructions) ||
    /ask/i.test(options.specialInstructions) ||
    /inquir/i.test(options.specialInstructions) ||
    /\?/.test(options.specialInstructions)
  );

  // ABSOLUTE constraint: NO questions in Answer mode unless explicitly requested
  if (!specialInstructionsRequestQuestion && questions > 0) {
    errors.push(`CRITICAL: Answer mode forbids questions unless explicitly requested in Special Instructions. Found ${questions} question mark(s).`);
  } else if (questions > guardrails.maxQuestions) {
    errors.push(`Reply exceeds max questions (${questions} > ${guardrails.maxQuestions})`);
  }

  // Check 6: Emoji validation
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = trimmed.match(emojiRegex) || [];

  if (!guardrails.allowEmojis && emojis.length > 0) {
    errors.push(`Emojis not allowed for style=${options.replyStyle}`);
  }

  if (guardrails.allowEmojis && emojis.length > guardrails.maxEmojis) {
    errors.push(`Too many emojis (${emojis.length} > ${guardrails.maxEmojis})`);
  }

  // Check 7: Markdown formatting check
  if (/\*\*|\__|\`\`/.test(trimmed)) {
    errors.push('Reply contains markdown formatting (not allowed)');
  }

  // Check 8: Stance validation - Disagree must have softener
  if (options.stance === 'disagree' && guardrails.requireSoftener) {
    const softenerPatterns = [
      /in my experience/i,
      /i've seen/i,
      /i agree in part/i,
      /that's one way/i,
      /interesting point/i,
      /fair point/i,
      /i hear you/i,
      /i get that/i
    ];

    const hasSoftener = softenerPatterns.some(pattern => pattern.test(trimmed));
    if (!hasSoftener) {
      warnings.push('Disagree stance should start with acknowledgment or softener');
    }
  }

  // Check 9: Stance validation - Agree must add perspective
  if (options.stance === 'agree') {
    const genericAgree = [
      /^totally agree\.?$/i,
      /^so true\.?$/i,
      /^this is spot on\.?$/i,
      /^100%\.?$/i,
      /^exactly\.?$/i
    ];

    const isGeneric = genericAgree.some(pattern => pattern.test(trimmed));
    if (isGeneric) {
      errors.push('Agree stance must add perspective, not just echo');
    }
  }

  // Check 10: Value-add check (semantic overlap)
  const originalWords = new Set(original.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const replyWords = new Set(trimmed.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  const commonWords = new Set(
    [...replyWords].filter(word => originalWords.has(word))
  );

  const overlapRatio = originalWords.size > 0 ? commonWords.size / originalWords.size : 0;

  if (overlapRatio > 0.7) {
    warnings.push('Reply has high semantic overlap with original (>70%)');
  }

  // Check 11: Length-specific validation
  if (options.length === 'long') {
    // Long replies should have substance
    if (sentences.length < 4) {
      warnings.push('Long length expected 4-6 sentences, got fewer');
    }

    // Check for concrete insight (simplified heuristic)
    const hasInsight = /because|since|this means|the key|what matters|here's why|consider|notice|think about/i.test(trimmed);
    if (!hasInsight) {
      warnings.push('Long reply should include concrete insight or takeaway');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Step 4: Generate fallback output when validation fails
 */
export function generateFallbackAnswer(
  original: string,
  detectedLang: string,
  langName: string
): { system: string; user: string } {
  const system = `You are CopySnap. The user's message is in ${langName}. You MUST respond in ${langName} (language code: ${detectedLang}).

Your task: Generate a HELPFUL and NEUTRAL reply to the user's message. Keep it MEDIUM length (2-4 sentences).

CRITICAL RULES:
- Add value to the conversation
- Be respectful and constructive
- Provide balanced perspective
- NO emojis or markdown
- Return a complete, coherent reply
- ABSOLUTELY NO QUESTIONS - output must be strictly declarative
- Zero "?" characters allowed

⚠️ SYNTAX RULE: The presence of ANY question mark (?) is FORBIDDEN.

Return ONLY valid JSON:
{
  "best": "your reply",
  "alternatives": ["alternative 1", "alternative 2"]
}

Do NOT add markdown or explanations. Just raw JSON in ${langName}.`;

  const user = `Message to reply to:\n\n${original}`;

  return { system, user };
}
