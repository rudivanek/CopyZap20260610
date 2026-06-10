/**
 * Absolute Scoring Engine
 *
 * Evaluates each piece of copy in complete isolation using a fixed 4-dimension rubric.
 * Scores NEVER change regardless of what other versions exist in the session.
 *
 * Total: 0–100 (4 dimensions × 0–25 each)
 */
import { User } from '../../types';
import { makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { SCORING_MODEL } from '../../constants';

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

export async function generateAbsoluteScore(
  content: unknown,
  currentUser?: User,
  sessionId?: string
): Promise<AbsoluteScoreBreakdown> {
  const text = extractText(content).slice(0, 6000).trim();

  if (!text) {
    return fallbackScore('Empty content');
  }

  try {
    const response = await makeApiRequestWithFallback(
      SCORING_MODEL,
      [
        { role: 'system', content: ABSOLUTE_SCORE_SYSTEM_PROMPT },
        { role: 'user', content: `Score this copy:\n\n"""\n${text}\n"""` }
      ],
      0.3,
      512,
      { type: 'json_object' }
    );

    const tokenUsage = response.usage?.total_tokens ?? 0;
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        SCORING_MODEL,
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
    const total = clamp(
      typeof parsed.total === 'number' ? parsed.total : clarity + persuasion + audience_fit + structure,
      100
    );

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
