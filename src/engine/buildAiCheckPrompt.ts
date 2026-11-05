/**
 * Quick — "Check with another AI".
 *
 * Builds one Markdown text the user pastes into ChatGPT, Claude, Grok or any
 * other AI, which then scores the copy itself with CopyZap's own rubric and
 * says whether it agrees with CopyZap's scores, and where it does not.
 *
 * Nothing is attached and no file is made: the text holds everything.
 *
 * The answer is made for a business owner to read: the verdict first, then a
 * table of the totals and a text chart, then one table per text with CopyZap's score and the other AI's side by side, the
 * gap, and why. The texts are called "Your original" and "CopyZap's best
 * version", never by letters. CopyZap's scores come last in the text, after
 * the instruction to score first; in one paste the other AI still sees
 * everything at once, so this is not blind. The "two steps" variant (step1
 * then step2, sent as two messages) is fully blind, and since 2026-10-19 it is
 * the default: with our scores in view, GPT-4o landed within a few points of
 * them every time (tested on 6 results), so the one-paste check proved
 * little. Blind, on 15 results, Claude Opus and GPT-4o found the best version
 * better than the original every time they scored both texts.
 *
 * The answer opens with the question that matters to the user: is the best
 * version better than the original? A few points between AIs is normal: they
 * grade on slightly different scales (GPT-4o about 3 to 5 points milder).
 *
 * To keep the text short enough to paste, it holds only two texts: the
 * original and the version Quick shows as best. Everything is in English,
 * whatever the copy's language, like the rest of Quick.
 */
import { GeneratedContentItem } from '../types';
import { buildAbsoluteSystemPrompt, SPECIFICITY_NOTE } from '../services/api/absoluteScoring';
import type { AbsoluteScoreBreakdown } from '../services/api/absoluteScoring';
import { contentToText } from '../services/api/contentText';
import { textKindLabel } from '../services/api/textKinds';
import { countWords } from '../utils/markdownUtils';
import { buildQuickScoringContext, deriveQuickLabel, quickGoalName, quickTextKindOf } from './buildQuickFormState';
import { ORIGINAL_VERSION_ID } from './pickWinner';
import { confirmedClaims } from './claimReview';
import type { QuickRunResult } from './runQuickPipeline';

/** What identifies the result in the answer, so the user can find it again later. */
export interface AiCheckLabel {
  /** The name of the History entry, when it differs from the first line of the copy. */
  title?: string;
  /** The address that opens this result in CopyZap. Absent while the result is not saved. */
  resultUrl?: string;
}

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
  // The specificity request asks the scorer for a JSON field: not for the other AI.
  const full = buildAbsoluteSystemPrompt(context.goalKey, context.goalLabel, kind).replace(SPECIFICITY_NOTE, '');
  const marker = '\n\nReturn JSON only';
  const start = full.indexOf(marker);
  if (start < 0) return full.trim();
  const rest = full.slice(start + 2);
  const nextBreak = rest.indexOf('\n\n');
  return (full.slice(0, start) + (nextBreak >= 0 ? rest.slice(nextBreak) : '')).trim();
}

interface CheckText {
  /** How the text is called everywhere in the check and in the answer. */
  name: string;
  /** Marker name around the text, in capitals. */
  marker: string;
  text: string;
  score?: AbsoluteScoreBreakdown;
}

const ORIGINAL_NAME = 'Your original';
const BEST_NAME = "CopyZap's best version";
/** A result from "Start from a brief" whose best version is the draft itself. */
const DRAFT_NAME = "CopyZap's draft";

/**
 * A result from "Start from a brief" (2026-11-05): there is no copy of the
 * user's to compare with. The "original" is CopyZap's own draft, so checking
 * "is the best version better than the original?" asked the other AI to
 * compare a text with itself. Such a result is checked as one text, against
 * the brief it was written from.
 */
function fromBrief(result: QuickRunResult): boolean {
  return !!result.briefRecord;
}

/** The brief as the other AI reads it, one field per line. Empty for other results. */
function briefLines(result: QuickRunResult): string[] {
  if (!fromBrief(result)) return [];
  const skip = ['Started from'];
  return (result.briefRecord?.fields ?? [])
    .filter(field => field && field.value && !skip.includes(field.label))
    .map(field => `  - ${plain(field.label)}: ${field.value.replace(/\s+/g, ' ').trim()}`);
}


function checkTexts(result: QuickRunResult, best: GeneratedContentItem): CheckText[] {
  const scores = result.scores?.absoluteByVersion ?? {};
  const original = result.versions.find(version => version.id === ORIGINAL_VERSION_ID);
  const texts: CheckText[] = [];
  // From a brief: one text, the one Quick shows as best.
  if (fromBrief(result)) {
    const isDraft = !!original && contentToText(original.content).trim() === contentToText(best.content).trim();
    return [{
      name: isDraft ? DRAFT_NAME : BEST_NAME,
      marker: isDraft ? 'DRAFT' : 'BEST VERSION',
      text: contentToText(best.content).trim(),
      score: scores[best.id],
    }];
  }
  if (original) {
    texts.push({
      name: ORIGINAL_NAME,
      marker: 'YOUR ORIGINAL',
      text: contentToText(original.content).trim(),
      score: scores[ORIGINAL_VERSION_ID],
    });
  }
  texts.push({
    name: BEST_NAME,
    marker: 'BEST VERSION',
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
  const brief = briefLines(result);
  if (brief.length > 0) {
    lines.push(
      '- **The brief the user gave CopyZap** (CopyZap wrote the copy from it; judge whether the copy does what it asks):',
      ...brief
    );
  }
  const facts = result.formState.quickUserFacts ?? [];
  if (facts.length > 0) {
    lines.push(
      '- **Facts the user supplied** (the improved version may use these; they are not invented):',
      ...facts.map(fact => `  - ${fact}`)
    );
  }
  const confirmed = confirmedClaims(result);
  if (confirmed.length > 0) {
    lines.push(
      '- **Facts the user confirmed in CopyZap** (the best version states these; the user checked them and says they are true, so they are not invented):',
      ...confirmed.map(fact => `  - ${fact}`)
    );
  }
  return lines;
}

/** "Judged as: Educate — teach or onboard · Web page". Empty when neither is known. */
function judgedAsLine(result: QuickRunResult): string {
  const goal = quickGoalName(result.goalKey, result.formState.quickGoalLabel, true);
  const kind = textKindLabel(quickTextKindOf(result.formState));
  const parts = [goal, kind].filter(Boolean);
  return parts.length > 0 ? `*Judged as: ${parts.join(' · ')}*` : '';
}

/** Text that goes inside the bold label: no characters that would break Markdown. */
function plain(text: string): string {
  return text.replace(/[*_`|\[\]<>"]/g, '').replace(/\s+/g, ' ').trim();
}

/** The date of the version checked, as "15 Oct 2026". Today when it is not known. */
function checkDate(best: GeneratedContentItem): string {
  const when = best.generatedAt ? new Date(best.generatedAt) : new Date();
  const date = Number.isNaN(when.getTime()) ? new Date() : when;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * The lines the other AI copies to the top of its answer, so the answer can be
 * told apart later, in a chat history, a forwarded email or a screenshot:
 * what was checked (title, source page, date), what it was judged for, and a
 * link back to the result. The link only opens for the person who made the
 * result, logged in.
 */
function headerLines(result: QuickRunResult, best: GeneratedContentItem, label: AiCheckLabel): string[] {
  const original = result.versions.find(version => version.id === ORIGINAL_VERSION_ID);
  let title = plain(label.title || deriveQuickLabel(original ? contentToText(original.content) : '') || '');
  if (title.length > 60) title = `${title.slice(0, 57).trimEnd()}…`;
  const parts = ['CopyZap check', title && `"${title}"`, result.source?.host, checkDate(best)].filter(Boolean);
  const lines = [`**${parts.join(' · ')}**`];
  const judgedAs = judgedAsLine(result);
  if (judgedAs) lines.push(judgedAs);
  if (label.resultUrl) lines.push(`[Open this result in CopyZap](${label.resultUrl})`);
  return lines;
}

function copySection(texts: CheckText[]): string {
  return texts
    .map(
      item =>
        `### ${item.name} (${countWords(item.text)} words)\n\n` +
        `<<<START: ${item.marker}>>>\n${item.text}\n<<<END: ${item.marker}>>>`
    )
    .join('\n\n');
}

function scoresSection(texts: CheckText[]): string {
  return texts
    .map(item => {
      const s = item.score;
      if (!s) return `### ${item.name}\n\nNot scored.`;
      const rows = DIMENSIONS.map(d => {
        const note = s[`${d.key}_note` as keyof AbsoluteScoreBreakdown];
        return `| ${d.label} | ${s[d.key]} | ${typeof note === 'string' ? note.trim().replace(/\|/g, '/') : ''} |`;
      });
      const leftOutPenalty = s.left_out_penalty ?? 0;
      const claimsPenalty = s.claims_penalty ?? 0;
      const briefPenalty = s.brief_penalty ?? 0;
      const cap = s.specificity_cap ?? 0;
      const hasPointsOff = leftOutPenalty > 0 || claimsPenalty > 0 || briefPenalty > 0 || cap > 0;
      const partsSum = s.clarity + s.persuasion + s.audience_fit + s.structure;
      const extraRows: string[] = [];
      if (hasPointsOff) {
        extraRows.push(`| Parts add up to | ${partsSum} | |`);
        if (leftOutPenalty > 0) {
          const leftOutItems = (s.left_out ?? []).map(item => item.replace(/\|/g, '/')).join('; ');
          extraRows.push(`| Points off: leaves out facts your original states | −${leftOutPenalty} | ${leftOutItems} |`);
        }
        if (claimsPenalty > 0) {
          const claimsOpen = s.claims_open ?? 0;
          extraRows.push(
            `| Points off: claims not in your original | −${claimsPenalty} | ${claimsOpen} claim(s) CopyZap could not find in the original |`
          );
        }
        if (cap > 0) {
          extraRows.push(`| Capped: mostly general claims | at most ${cap} | few concrete facts about this company |`);
        }
        if (briefPenalty > 0) {
          const misses = (s.brief_misses ?? []).map(item => item.replace(/\|/g, '/')).join('; ');
          extraRows.push(`| Points off: not what the brief asked for | −${briefPenalty} | ${misses} |`);
        }
      }
      return [
        `### ${item.name}`,
        '',
        "| Part (0–25) | CopyZap | CopyZap's reason |",
        '|---|---|---|',
        ...rows,
        ...extraRows,
        `| **Total (0–100)** | **${s.total}** | |`,
      ].join('\n');
    })
    .join('\n\n');
}

const NORMAL_SPREAD =
  'Any scorer, including you, gives the same text slightly different scores on different readings, and different AIs grade on slightly different scales. ' +
  'Treat a difference of up to 2 points on one part, or up to 5 points on the total, as normal variation, not as disagreement.';

function verdictBands(pair: boolean): string[] {
  return [
    '- Agree: every total within 5 points of CopyZap' + (pair ? ", and you also find CopyZap's best version stronger." : '.'),
    '- Mostly agree: ' + (pair ? 'you also find the best version stronger; ' : '') + 'a total differs by 6–10 points.',
    '- Partly agree: a total differs by 11–15 points' + (pair ? ', but you still find the best version stronger.' : '.'),
    pair
      ? '- Disagree: you find your original stronger than the best version, or a total differs by more than 15 points.'
      : '- Disagree: a total differs by more than 15 points.',
    // 2026-10-20 (GrokBot): an answer said "Mostly agree" with a 19-point gap on one total.
    '- The largest gap on any total decides the verdict, even when the other totals are close. For a text with points off, use the gap to CopyZap\'s \'Parts add up to\' number. Check it against these bands before you write the verdict.',
  ];
}

/** One table per text, CopyZap's score and the other AI's side by side. */
function tableInstructions(texts: CheckText[]): string[] {
  return [
    `Then one table for each text, in this order: ${texts.map(t => `"${t.name}"`).join(', then ')}. ` +
      'Use the text\'s name as a heading above its table. Each table has exactly these columns and rows:',
    '',
    '| | CopyZap | <your name, e.g. ChatGPT, Claude or Grok> | Gap | Why |',
    '|---|---|---|---|---|',
    '| Clarity | … | … | … | … |',
    '| Persuasion | … | … | … | … |',
    '| Audience fit | … | … | … | … |',
    '| Structure | … | … | … | … |',
    '| **Total** | … | … | … | |',
    '',
    'Rules for the table:',
    '- Gap = your score minus CopyZap\'s, with a sign (+3, −2, 0). Put the gap in bold when it is beyond normal variation.',
    '- Why: when the gap is within normal variation, write only "Normal variation". When it is beyond, one short sentence that points to the actual copy (quote a few words).',
    '- Give each part your own score from 0 to 25 and the total from 0 to 100, using the rubric.',
    '- Your scores use only the rubric, without CopyZap\'s points off. When CopyZap\'s total shows points off, compute the gap on the total from CopyZap\'s \'Parts add up to\' number, not from its total.',
  ];
}

/** Blocks in a text bar: one per 5 points, so 100 points is 20 blocks. */
const BAR_BLOCKS = 20;

/** A text bar for a total from 0 to 100: filled blocks, then empty ones up to 20. */
export function textBar(total: number): string {
  const filled = Math.max(0, Math.min(BAR_BLOCKS, Math.round(total / 5)));
  return '█'.repeat(filled) + '░'.repeat(BAR_BLOCKS - filled);
}

/** Short names for the summary table and the chart. */
const SHORT_NAME: Record<string, string> = {
  [ORIGINAL_NAME]: 'Your original',
  [BEST_NAME]: 'Best version',
};

/**
 * The summary: a table of totals and a chart made of block characters, which
 * every AI can show without tools. A real chart was left out on purpose
 * (2026-10-15): ChatGPT would draw it with code, Claude may or may not, and
 * the answer would look different, or break, from one AI to the next.
 * CopyZap's bars are filled in here, so the other AI only adds its own.
 */
function summaryInstructions(texts: CheckText[]): string[] {
  const pair = texts.length > 1;
  const scored = texts.filter(t => t.score);
  const total = (t: CheckText) => {
    if (!t.score) return '–';
    const partsSum = t.score.clarity + t.score.persuasion + t.score.audience_fit + t.score.structure;
    const pointsOff = partsSum - t.score.total;
    if (pointsOff > 0) {
      return `${t.score.total} (${partsSum} before ${pointsOff} points off)`;
    }
    return String(t.score.total);
  };
  const improvement =
    pair && texts[0].score && texts[1].score ? texts[1].score.total - texts[0].score.total : null;
  const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
  const width = Math.max(...texts.map(t => (SHORT_NAME[t.name] ?? t.name).length)) + 2;

  const chartLines: string[] = [];
  for (const t of scored) {
    const label = (SHORT_NAME[t.name] ?? t.name).padEnd(width);
    chartLines.push(`${label}CopyZap   ${textBar(t.score!.total)}  ${t.score!.total}`);
    chartLines.push(`${' '.repeat(width)}<you>     <your bar>  <your total>`);
  }

  return [
    'Then the summary, in two parts.',
    '',
    'First a table of the totals, with exactly these rows' + (improvement != null ? ' (the last row is the best version\'s total minus the original\'s):' : ':'),
    '',
    '| | CopyZap | <your name> | Gap |',
    '|---|---|---|---|',
    ...texts.map(t => `| ${t.name} | ${total(t)} | … | … |`),
    ...(improvement != null ? [`| **Improvement** | **${signed(improvement)}** | **…** | |`] : []),
    '',
    'Then this chart, in a code block so the bars line up. Copy the CopyZap lines exactly as they are. ' +
      'For each of your lines, put your name in place of <you>, padded with spaces to the same width as "CopyZap", and draw your bar the same way: ' +
      `${BAR_BLOCKS} characters in all, one █ for every 5 points of your total (rounded to the nearest whole block), then ░ for the rest. Then your total.`,
    '',
    '```',
    ...chartLines,
    '```',
  ];
}

function answerFormat(texts: CheckText[], header: string[] = [], brief = false): string {
  const pair = texts.length > 1;
  return [
    'Answer in English. Keep it short and easy to read for a business owner, not a copywriter. Use exactly this structure and nothing else:',
    '',
    ...(header.length > 0
      ? [
          'Start with these lines, copied exactly as they are, each on its own line, so a reader knows later which copy this is and what it was judged for:',
          '',
          ...header.map(line => `${line}  `),
          '',
          'Then one line:',
        ]
      : ['Start with one line:']),
    ...(pair
      ? [
          `**Is CopyZap's best version better than your original?** Yes or No, by your own scores, and why in one plain sentence.`,
          '',
          'Then one line:',
        ]
      : []),
    ...(brief
      ? [
          `**Does the copy do what the brief asks?** Yes, Mostly or No, in one plain sentence. Name anything the brief asks for that the copy misses or gets wrong, for example the form of address (usted or tú), the main offer, the differentiator or the requested action.`,
          '',
          'Then one line:',
        ]
      : []),
    `**Verdict: <Agree / Mostly agree / Partly agree / Disagree>.** followed by one or two plain sentences that say what that means for the user.`,
    ...verdictBands(pair),
    '',
    ...summaryInstructions(texts),
    '',
    ...tableInstructions(texts).map((line, i) => (i === 0 ? line.replace(/^Then one table/, 'Then the details: one table') : line)),
    '',
    brief
      ? 'Then, only if you find any of these in the copy, a short section headed **Worth knowing:** with one line for each item: a fact it states that neither the brief nor the facts the user supplied state (it may not be true; quote it); a sentence that is broken or incomplete (quote it). Leave the section out when there are none. These do not change your scores.'
      : 'Then, only if you find any of these in CopyZap\'s best version, a short section headed **Worth knowing:** with one line for each item: a fact it states that neither your original nor the facts the user supplied state (it may not be true; quote it); a fact from your original it leaves out; a sentence that is broken or incomplete (quote it). Leave the section out when there are none. These do not change your scores.',
    '',
    brief
      ? `Do not add any other sections, introductions or summaries, and do not draw any other chart or image. Call the copy only "${texts[0]?.name ?? DRAFT_NAME}".`
      : "Do not add any other sections, introductions or summaries, and do not draw any other chart or image. Call the texts only by the names used here (\"Your original\", \"CopyZap's best version\"), never by letters.",
  ].join('\n');
}

/** What step 1 asks for: one table per text, every text scored. */
function stepOneAnswer(texts: CheckText[], brief = false): string {
  const several = texts.length > 1;
  return (
    `Answer in English with ${several ? `${texts.length} tables, one per text` : 'one table'}, using the text's name as its heading: ` +
    'Clarity, Persuasion, Audience fit, Structure (each 0–25) and Total (0–100), with one short reason per part that points to the actual copy. ' +
    (several ? 'Score every text; do not stop after the first one. ' : '') +
    'Nothing else, except this last line, copied exactly as it is, on its own line at the very end of your answer: "**Step 1 of 2 done — this is only half the check.** Go back to CopyZap, click **Copy step 2: our scores**, and paste it here. Then I will tell you ' +
    (brief
      ? 'whether the copy does what your brief asks and whether I agree with CopyZap\'s scores."'
      : 'whether CopyZap\'s best version is better than your original and whether I agree with CopyZap\'s scores."')
  );
}


/** The text for the other AI. `best` is the version Quick shows as best. */
export function buildAiCheckPrompt(
  result: QuickRunResult,
  best: GeneratedContentItem,
  label: AiCheckLabel = {}
): AiCheckPrompt {
  const texts = checkTexts(result, best);
  const brief = fromBrief(result);
  const context = contextLines(result);
  const rubric = rubricText(result);
  const header = headerLines(result, best, label);

  const intro = [
    '# Independent check of a CopyZap score',
    '',
    'You are an independent, critical copy evaluator. CopyZap, an AI tool that scores and improves marketing copy, ' +
      (brief ? 'wrote the copy below from the user\'s brief and scored it.' : 'scored the text' + (texts.length > 1 ? 's' : '') + ' below.') +
      " I want your honest, independent opinion on whether that scoring is fair. Do not be polite to CopyZap: if you disagree, say so and say why.",
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
    ...(texts.length > 1
      ? ['', `"${ORIGINAL_NAME}" is the copy the user gave CopyZap; "${BEST_NAME}" is CopyZap's rewrite of it. The user will read your answer, so these names speak to them.`]
      : []),
    '',
    copySection(texts),
  ].join('\n');

  const scores = ["## Section 3 — CopyZap's scores", '', scoresSection(texts)].join('\n');

  const full = [
    intro,
    '',
    "Score the copy in Section 2 yourself with the rubric in Section 1 before you look at CopyZap's scores in Section 3, then compare.",
    '',
    NORMAL_SPREAD,
    '',
    answerFormat(texts, header, brief),
    '',
    '---',
    '',
    materials,
    '',
    '---',
    '',
    scores,
  ].join('\n');

  const step1 = [
    intro,
    '',
    "This is step 1 of 2. **Only score the copy now.** I will send CopyZap's scores in a second message; do not guess them.",
    '',
    stepOneAnswer(texts, brief),
    '',
    '---',
    '',
    materials,
    '',
    '---',
    '',
    // Repeated after the texts: on long pages GPT-4o scored the first text and
    // stopped (tested 2026-10-19), having lost the instruction above them.
    `**Now score ${texts.length > 1 ? `both texts, ${texts.map(t => `"${t.name}"`).join(' and then ')}` : `"${texts[0].name}"`}.** ` +
      stepOneAnswer(texts, brief),
  ].join('\n');

  const step2 = [
    "Step 2 of 2. Here are CopyZap's scores for the same texts. Compare them with the scores you gave in your previous answer. Do not change your own scores.",
    '',
    NORMAL_SPREAD,
    '',
    answerFormat(texts, header, brief),
    '',
    '---',
    '',
    scores,
  ].join('\n');

  return { full, step1, step2 };
}
