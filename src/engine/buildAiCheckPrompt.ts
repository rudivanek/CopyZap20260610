/**
 * Quick — "Check with another AI".
 *
 * Builds one Markdown text the user pastes into ChatGPT, Claude, Grok or any
 * other AI, which then scores the copy itself with CopyZap's own rubric and
 * says whether it agrees with CopyZap's scores, and where it does not.
 *
 * Nothing is attached and no file is made: the text holds everything.
 *
 * The order matters. The other AI gets the rubric and the copy first and is
 * told to write down its own scores before it reads CopyZap's, which come last
 * in their own section. In one paste it still sees everything at once, so this
 * lowers the pull of CopyZap's numbers but does not remove it. The "two steps"
 * variant (step1 then step2, sent as two messages) is fully blind.
 *
 * To keep the text short enough to paste, it holds only two texts: the
 * original and the version Quick shows as best. Everything is in English,
 * whatever the copy's language, like the rest of Quick.
 */
import { GeneratedContentItem } from '../types';
import { buildAbsoluteSystemPrompt } from '../services/api/absoluteScoring';
import type { AbsoluteScoreBreakdown } from '../services/api/absoluteScoring';
import { contentToText } from '../services/api/contentText';
import { textKindLabel } from '../services/api/textKinds';
import { countWords } from '../utils/markdownUtils';
import { buildQuickScoringContext, quickGoalName, quickTextKindOf } from './buildQuickFormState';
import { ORIGINAL_VERSION_ID } from './pickWinner';
import type { QuickRunResult } from './runQuickPipeline';

export interface AiCheckPrompt {
  /** Everything in one message. */
  full: string;
  /** Two-step check, first message: the rubric and the copy, no CopyZap scores. */
  step1: string;
  /** Two-step check, second message: CopyZap's scores and the comparison. */
  step2: string;
}

/** Where the other AIs open. Plain addresses: the text is too long to pass in a link. */
export const AI_CHECK_TARGETS: { key: string; name: string; url: string }[] = [
  { key: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { key: 'claude', name: 'Claude', url: 'https://claude.ai/new' },
  { key: 'grok', name: 'Grok', url: 'https://grok.com/' },
];

const DIMENSIONS: { key: 'clarity' | 'persuasion' | 'audience_fit' | 'structure'; label: string }[] = [
  { key: 'clarity', label: 'Clarity' },
  { key: 'persuasion', label: 'Persuasion' },
  { key: 'audience_fit', label: 'Audience fit' },
  { key: 'structure', label: 'Structure' },
];

/**
 * CopyZap's own scoring instructions, without the part that asks for JSON:
 * the other AI answers in its own words. The JSON request is one paragraph
 * ending the base text; goal and kind notes follow it after a blank line.
 */
function rubricText(result: QuickRunResult): string {
  const kind = quickTextKindOf(result.formState);
  const context = buildQuickScoringContext(result.goalKey, kind, result.formState.quickGoalLabel);
  const full = buildAbsoluteSystemPrompt(context.goalKey, context.goalLabel, kind);
  const marker = '\n\nReturn JSON only';
  const start = full.indexOf(marker);
  if (start < 0) return full.trim();
  const rest = full.slice(start + 2);
  const nextBreak = rest.indexOf('\n\n');
  return (full.slice(0, start) + (nextBreak >= 0 ? rest.slice(nextBreak) : '')).trim();
}

interface CheckText {
  letter: string;
  name: string;
  text: string;
  score?: AbsoluteScoreBreakdown;
}

function checkTexts(result: QuickRunResult, best: GeneratedContentItem): CheckText[] {
  const scores = result.scores?.absoluteByVersion ?? {};
  const original = result.versions.find(version => version.id === ORIGINAL_VERSION_ID);
  const texts: CheckText[] = [];
  if (original) {
    texts.push({
      letter: 'A',
      name: 'Original',
      text: contentToText(original.content).trim(),
      score: scores[ORIGINAL_VERSION_ID],
    });
  }
  texts.push({
    letter: original ? 'B' : 'A',
    name: `CopyZap's best version${best.sourceDisplayName ? ` (${best.sourceDisplayName})` : ''}`,
    text: contentToText(best.content).trim(),
    score: scores[best.id],
  });
  return texts;
}

function contextLines(result: QuickRunResult): string[] {
  const lines: string[] = [];
  const goal = quickGoalName(result.goalKey, result.formState.quickGoalLabel, true);
  if (goal) lines.push(`- **Goal of the copy:** ${goal}`);
  const kind = textKindLabel(quickTextKindOf(result.formState));
  if (kind) lines.push(`- **Kind of text:** ${kind}`);
  if (result.source?.url) lines.push(`- **Source page:** ${result.source.url}`);
  const facts = result.formState.quickUserFacts ?? [];
  if (facts.length > 0) {
    lines.push(
      '- **Facts the user supplied** (the improved version may use these; they are not invented):',
      ...facts.map(fact => `  - ${fact}`)
    );
  }
  return lines;
}

function copySection(texts: CheckText[]): string {
  return texts
    .map(
      item =>
        `### Text ${item.letter} — ${item.name} (${countWords(item.text)} words)\n\n` +
        `<<<START TEXT ${item.letter}>>>\n${item.text}\n<<<END TEXT ${item.letter}>>>`
    )
    .join('\n\n');
}

function scoresSection(texts: CheckText[]): string {
  const header = `| Text | ${DIMENSIONS.map(d => `${d.label} (0–25)`).join(' | ')} | Total (0–100) |`;
  const divider = `|---|${DIMENSIONS.map(() => '---').join('|')}|---|`;
  const rows = texts.map(item => {
    const s = item.score;
    if (!s) return `| ${item.letter} | ${DIMENSIONS.map(() => '–').join(' | ')} | not scored |`;
    return `| ${item.letter} | ${DIMENSIONS.map(d => s[d.key]).join(' | ')} | ${s.total} |`;
  });
  const notes = texts
    .filter(item => item.score)
    .map(item => {
      const s = item.score as AbsoluteScoreBreakdown;
      const lines = DIMENSIONS.map(d => s[`${d.key}_note` as keyof AbsoluteScoreBreakdown])
        .map((note, i) => (typeof note === 'string' && note.trim() ? `- ${DIMENSIONS[i].label}: ${note.trim()}` : ''))
        .filter(Boolean);
      return lines.length > 0 ? `**CopyZap's reasons for Text ${item.letter}:**\n${lines.join('\n')}` : '';
    })
    .filter(Boolean);
  return [header, divider, ...rows].join('\n') + (notes.length > 0 ? `\n\n${notes.join('\n\n')}` : '');
}

const NORMAL_SPREAD =
  'Any scorer, including you, gives the same text slightly different scores on different readings. ' +
  'Treat a difference of up to 2 points on one dimension, or up to 5 points on the total, as normal variation, not as disagreement.';

function answerFormat(texts: CheckText[]): string {
  const letters = texts.map(t => t.letter).join(' and ');
  const pair = texts.length > 1;
  return [
    'Answer in English, in exactly this structure:',
    '',
    '## 1. My own scores',
    `A table with one row per text (${letters}): Clarity, Persuasion, Audience fit, Structure (each 0–25) and Total (0–100). ` +
      'Below it, one short line of evidence per dimension and text, pointing to the actual copy.',
    '',
    '## 2. Comparison with CopyZap',
    'A table: Text | Dimension | CopyZap | Mine | Difference. Include the totals.',
    '',
    '## 3. Where I agree',
    'Two to four short points.',
    '',
    '## 4. Where I disagree',
    'Every gap beyond normal variation, with the reason, pointing to the copy. Write "None" if there is none.',
    '',
    '## 5. Verdict',
    'One word first: **Agree**, **Mostly agree**, **Partly agree** or **Disagree**. Then one or two sentences.',
    '- Agree: every total within 5 points of CopyZap' + (pair ? ', and the same text comes out ahead.' : '.'),
    '- Mostly agree: ' + (pair ? 'the same text comes out ahead; ' : '') + 'a total differs by 6–10 points.',
    '- Partly agree: a total differs by 11–15 points' + (pair ? ', but the same text still comes out ahead.' : '.'),
    pair
      ? "- Disagree: you would rank the texts the other way round, or a total differs by more than 15 points."
      : '- Disagree: a total differs by more than 15 points.',
    ...(pair ? ['', `Finally, answer yes or no: is Text B a real improvement on Text A?`] : []),
  ].join('\n');
}

/** The text for the other AI. `best` is the version Quick shows as best. */
export function buildAiCheckPrompt(result: QuickRunResult, best: GeneratedContentItem): AiCheckPrompt {
  const texts = checkTexts(result, best);
  const context = contextLines(result);
  const rubric = rubricText(result);

  const intro = [
    '# Independent check of a CopyZap score',
    '',
    'You are an independent, critical copy evaluator. CopyZap, an AI tool that scores and improves marketing copy, ' +
      'scored the text' +
      (texts.length > 1 ? 's' : '') +
      " below. I want your honest, independent opinion on whether that scoring is fair. Do not be polite to CopyZap: if you disagree, say so and say why.",
  ].join('\n');

  const materials = [
    '## Section 1 — The rubric CopyZap scores with',
    '',
    'Use exactly this rubric, so the scores can be compared.',
    '',
    rubric
      .split('\n')
      .map(line => (line.trim() ? `> ${line}` : '>'))
      .join('\n'),
    ...(context.length > 0 ? ['', '**About this copy:**', ...context] : []),
    '',
    '## Section 2 — The copy',
    '',
    'The copy may be in any language; judge it in its own language.',
    '',
    copySection(texts),
  ].join('\n');

  const scores = ["## Section 3 — CopyZap's scores", '', scoresSection(texts)].join('\n');

  const full = [
    intro,
    '',
    '**Work in this order:**',
    '1. Read Section 1 (the rubric) and Section 2 (the copy) only.',
    "2. Score the copy yourself and write your scores down in your answer (part 1 below) before you read Section 3.",
    "3. Only then read Section 3 (CopyZap's scores) and compare.",
    '',
    NORMAL_SPREAD,
    '',
    answerFormat(texts),
    '',
    '---',
    '',
    materials,
    '',
    '---',
    '',
    '_Do not read Section 3 until you have written your own scores._',
    '',
    scores,
  ].join('\n');

  const step1 = [
    intro,
    '',
    "This is step 1 of 2. **Only score the copy now.** I will send CopyZap's scores in a second message; do not guess them.",
    '',
    'Answer in English with:',
    '## 1. My own scores',
    'A table with one row per text: Clarity, Persuasion, Audience fit, Structure (each 0–25) and Total (0–100). ' +
      'Below it, one short line of evidence per dimension and text, pointing to the actual copy.',
    '',
    '---',
    '',
    materials,
  ].join('\n');

  const step2 = [
    "Step 2 of 2. Here are CopyZap's scores for the same texts. Compare them with the scores you gave in your previous answer. Do not change your own scores.",
    '',
    NORMAL_SPREAD,
    '',
    answerFormat(texts).replace(
      /## 1\. My own scores\n[^\n]*\n\n/,
      '## 1. My own scores\nRepeat your scores from your previous answer, unchanged.\n\n'
    ),
    '',
    '---',
    '',
    scores,
  ].join('\n');

  return { full, step1, step2 };
}
