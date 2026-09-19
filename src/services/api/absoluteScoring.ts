/**
 * Absolute Scoring Engine
 *
 * Evaluates each piece of copy in complete isolation using a fixed 4-dimension rubric.
 * Scores NEVER change regardless of what other versions exist in the session.
 *
 * Total: 0–100 (4 dimensions × 0–25 each)
 */
import { User, GoalKey, Model } from '../../types';
import { makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
// Absolute scoring is pinned to claude-sonnet-4-6, matching comparativeScoring.
// The shared SCORING_MODEL constant is 'gpt-4o', which routes to OpenAI and fails
// (invalid key); the app's scoring is Claude-based. sonnet-4-6 also stays within
// the 150s edge-function timeout when several absolute scores run in parallel.
const ABSOLUTE_SCORE_MODEL: Model = 'claude-sonnet-4-6';

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

const ABSOLUTE_SCORE_SYSTEM_PROMPT = `You are a professional copy evaluator. Score the following copy on four dimensions, each from 0-25. Evaluate in complete isolation — do not compare to any other version. Apply the same fixed standard regardless of copy type, industry, length, or subject matter.

Calibration is critical. Use this scale strictly: 0-50 = poor copy with fundamental problems; 51-65 = below average, significant issues; 66-75 = average professional copy, competent but unremarkable; 76-85 = strong professional copy, clear value and good execution; 86-92 = excellent, would perform well in competitive context; 93-100 = exceptional, rare, reserved for truly outstanding work. Most competently written professional copy should score between 66-80. A score above 85 requires genuinely exceptional execution across all four dimensions. When in doubt, score lower rather than higher — inflation destroys the usefulness of this scale.

Dimension 1 — Clarity & Readability (0-25): Is the core message immediately understandable? Is the language appropriate for the apparent target audience? Are sentences well-constructed without unnecessary complexity?

Dimension 2 — Persuasion & Conversion Mechanics (0-25): Does the copy address a recognizable pain point? Is there a clear value proposition and meaningful CTA?

Dimension 3 — Audience Fit (0-25): Does the tone, vocabulary, and framing match the apparent intended audience? Would the target reader feel this was written for them?

Dimension 4 — Structure & Flow (0-25): Does the copy have a logical progression? Does each section lead naturally to the next? Does it maintain momentum throughout?

Return JSON only, no preamble, no markdown: { "clarity": 0-25, "persuasion": 0-25, "audience_fit": 0-25, "structure": 0-25, "total": 0-100, "clarity_note": "one sentence that identifies a specific strength OR a specific weakness in that dimension — reference actual content from the copy where possible, not generic observations. Avoid vague statements like 'the message is clear' — instead say what specifically makes it clear or what specific element weakens it.", "persuasion_note": "one sentence that identifies a specific strength OR a specific weakness in that dimension — reference actual content from the copy where possible, not generic observations. Avoid vague statements like 'the message is clear' — instead say what specifically makes it clear or what specific element weakens it.", "audience_fit_note": "one sentence that identifies a specific strength OR a specific weakness in that dimension — reference actual content from the copy where possible, not generic observations. Avoid vague statements like 'the message is clear' — instead say what specifically makes it clear or what specific element weakens it.", "structure_note": "one sentence that identifies a specific strength OR a specific weakness in that dimension — reference actual content from the copy where possible, not generic observations. Avoid vague statements like 'the message is clear' — instead say what specifically makes it clear or what specific element weakens it." }`;

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return (content as string[]).join('\n');
  if (content && typeof content === 'object') {
    const c = content as any;
    if (c.headline) {
      const sections = (c.sections || [])
        .map((s: any) => `${s.title || ''}\n${s.content || (s.listItems || []).join('\n')}`)
        .join('\n\n');
      return `${c.headline}\n\n${sections}`;
    }
    if (c.content) return extractText(c.content);
  }
  return '';
}

const GOAL_GUIDANCE: Record<string, string> = {
  convert: `\n\nGOAL CONTEXT — CONVERT: This copy exists to drive a specific action or sale. The call-to-action is the single most important conversion element, so it must dominate the Persuasion & Conversion Mechanics score (dimension 2). Anchor Persuasion to the CTA: a strong, specific, well-placed CTA with a clear action verb and appropriate urgency earns the top band (20–25); a generic, soft, or buried CTA (e.g. a bare "Contáctanos" / "Contact us" with no verb or urgency) caps Persuasion at about 15/25; a missing or purely informational close caps it at about 12/25. This gap must be large enough to change the ranking — a page that does not clearly ask for the action cannot be a top scorer for this goal, however strong the rest of the copy is. Do NOT reward loudness or hype: an aggressive, pushy, or exaggerated CTA (inflated or unsupported promises, or a tone that clashes with the brand voice) is worse than a calm, specific one and must lose Persuasion points for hurting credibility. Also reward decision-driving structure and a low-friction, concrete next step.`,
  nurture: `\n\nGOAL CONTEXT — NURTURE: This copy exists to maintain a warm ongoing relationship, not to close a sale. Do NOT penalize the absence of a hard CTA or urgency — a soft CTA or none at all is appropriate here. Weight Audience Fit and Clarity most heavily and reward warmth, relevance and reader value. Treat aggressive selling, hype or pressure as OFF-tone and score it down.`,
  inform: `\n\nGOAL CONTEXT — INFORM: This copy exists to announce or update. Weight Clarity and Structure & Flow most heavily — the information must be immediately understandable and well organized. Do NOT penalize the absence of persuasion or a CTA. Treat hype or salesy framing as off-tone.`,
  educate: `\n\nGOAL CONTEXT — EDUCATE: This copy exists to teach or onboard. Weight Clarity and Structure & Flow most heavily — logical progression, comprehension and completeness matter most. Persuasion and urgency are largely irrelevant, so do not penalize their absence. Penalize jargon, confusing sequence, or gaps that block understanding.`,
  brand: `\n\nGOAL CONTEXT — BRAND: This copy exists to build trust and identity, not to close immediately. Weight Audience Fit (tone and voice match) and Clarity most heavily and reward a distinct, consistent, credible voice. Treat hype, exaggeration and aggressive CTAs as OFF-brand and score them down; do not reward urgency.`,
};

function buildAbsoluteSystemPrompt(goalKey?: GoalKey): string {
  const guidance = goalKey && goalKey !== 'custom' ? (GOAL_GUIDANCE[goalKey] || '') : '';
  return ABSOLUTE_SCORE_SYSTEM_PROMPT + guidance;
}

export async function generateAbsoluteScore(
  content: unknown,
  currentUser?: User,
  sessionId?: string,
  goalKey?: GoalKey
): Promise<AbsoluteScoreBreakdown> {
  const text = extractText(content).slice(0, 6000).trim();

  if (!text) {
    return fallbackScore('Empty content');
  }

  try {
    const response = await makeApiRequestWithFallback(
      ABSOLUTE_SCORE_MODEL,
      [
        { role: 'system', content: buildAbsoluteSystemPrompt(goalKey) },
        { role: 'user', content: `Score this copy:\n\n"""\n${text}\n"""` }
      ],
      0.3,
      512,
      { type: 'json_object' },
      currentUser?.email,
      'absolute_score',
      sessionId
    );

    const tokenUsage = response.usage?.total_tokens ?? 0;
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        ABSOLUTE_SCORE_MODEL,
        'absolute_score',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(response.usage)
      );
    }

    const raw = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(cleanJsonResponse(raw));

    const clamp = (n: unknown, max: number) =>
      Math.min(max, Math.max(0, Math.round(Number(n) || 0)));

    const clarity     = clamp(parsed.clarity, 25);
    const persuasion  = clamp(parsed.persuasion, 25);
    const audience_fit = clamp(parsed.audience_fit, 25);
    const structure   = clamp(parsed.structure, 25);
    // Total is defined as the sum of the four 0–25 dimensions, so it always matches the
    // sub-score breakdown shown in reports (previously used the model's independently
    // returned total, which could drift ±1–2 from the actual sum).
    const total = clamp(clarity + persuasion + audience_fit + structure, 100);

    return {
      clarity,
      persuasion,
      audience_fit,
      structure,
      total,
      clarity_note:      String(parsed.clarity_note      || ''),
      persuasion_note:   String(parsed.persuasion_note   || ''),
      audience_fit_note: String(parsed.audience_fit_note || ''),
      structure_note:    String(parsed.structure_note    || ''),
    };
  } catch {
    return fallbackScore('Scoring failed');
  }
}

function fallbackScore(reason: string): AbsoluteScoreBreakdown {
  return {
    clarity: 0, persuasion: 0, audience_fit: 0, structure: 0, total: 0,
    clarity_note: reason,
    persuasion_note: reason,
    audience_fit_note: reason,
    structure_note: reason,
  };
}
