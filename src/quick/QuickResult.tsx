import React, { useEffect, useMemo, useState } from 'react';
import { GeneratedContentItem } from '../types';
import FormattedContent from '../components/ui/FormattedContent';
import { contentToText } from '../services/api/contentText';
import type { AbsoluteScoreBreakdown } from '../services/api/absoluteScoring';
import { GOAL_OPTIONS } from '../utils/scoringContextStorage';
import { getAbsoluteScoreLabel, getAbsoluteScoreMarkClass } from '../utils/scoreColors';
import { deriveQuickLabel } from '../engine/buildQuickFormState';
import { prepareQuickEdit, QuickEditDraft, validateQuickEdit } from '../engine/editQuickVersion';
import { exportQuickReport } from '../engine/exportQuickReport';
import { effectiveGates } from '../engine/gateRules';
import { checkNumbers } from '../engine/numberCheck';
import type { NumberCheck } from '../engine/numberCheck';
import { ORIGINAL_VERSION_ID } from '../engine/pickWinner';
import { QUICK_SCORE_MARGIN } from '../engine/runQuickPipeline';
import type { QuickRunResult } from '../engine/runQuickPipeline';

interface QuickResultProps {
  result: QuickRunResult;
  isRescoring: boolean;
  onRescore: () => void;
  onNew: () => void;
  /** How long the run took, already formatted (m:ss). */
  elapsedLabel?: string;
  /** The name of the History entry, when it differs from the first line of the copy. */
  title?: string;
  /** Where saving stands: null before anything was tried. */
  saveState: 'saving' | 'saved' | 'failed' | null;
  onRetrySave: () => void;
  /** Rewrites the best version as asked. The page runs it behind the modal. */
  onChange: (instruction: string) => void;
  /** Why a change is not possible for this text right now; null when it is. */
  changeBlocked: (instruction: string) => string | null;
  /** What the last change or edit led to, or why it failed. */
  changeNotice: { tone: 'good' | 'neutral' | 'bad'; text: string } | null;
  /** Scores a version the user edited by hand. The page runs it behind the modal. */
  onScoreEdit: (draft: QuickEditDraft, text: string) => void;
}

/** One-click requests. Each is sent as written. */
const CHANGE_IDEAS = ['Shorter', 'More formal', 'Warmer', 'Stronger call to action'];

const card = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700';
// The copy itself always sits on a white "paper" surface, in light and dark theme:
// the shared markdown renderer writes dark text colours inline.
const paper = 'bg-white border border-gray-200 dark:border-gray-600';
const copyText = 'text-gray-700 [&_ul]:list-disc [&_ol]:list-decimal';
const primaryButton =
  'inline-flex items-center justify-center min-h-[44px] px-6 bg-primary-500 hover:bg-primary-400 ' +
  'text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
const secondaryButton =
  'inline-flex items-center justify-center min-h-[44px] px-5 bg-white dark:bg-gray-900 ' +
  'border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium ' +
  'hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500';
// Secondary button for use on the white paper surface (no dark-theme colours).
const paperButton =
  'inline-flex items-center justify-center min-h-[44px] px-5 bg-white border border-gray-400 ' +
  'text-gray-900 font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500';

const SUB_SCORES: { key: 'clarity' | 'persuasion' | 'audience_fit' | 'structure'; label: string }[] = [
  { key: 'clarity', label: 'Clarity' },
  { key: 'persuasion', label: 'Persuasion' },
  { key: 'audience_fit', label: 'Audience fit' },
  { key: 'structure', label: 'Structure' },
];

function reasons(score: AbsoluteScoreBreakdown | undefined): { label: string; note: string }[] {
  if (!score) return [];
  return [
    { label: 'Clarity', note: score.clarity_note },
    { label: 'Persuasion', note: score.persuasion_note },
    { label: 'Audience fit', note: score.audience_fit_note },
    { label: 'Structure', note: score.structure_note },
  ].filter(item => item.note && item.note.trim().length > 0);
}

const CopyButton: React.FC<{ content: GeneratedContentItem['content']; className: string; label?: string }> = ({
  content,
  className,
  label = 'Copy',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contentToText(content));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {copied ? 'Copied' : label}
    </button>
  );
};

/** A version's score with its quality mark, for use on the white paper surface. */
/** A scorer's note reads "kind — advice: the words it is about". Claims are one kind; the rest is tone. */
const isClaimNote = (note: string) => /^unverified claim/i.test(note);
/** Claims show the words themselves; tone notes keep their kind in front. */
function noteText(note: string): string {
  const cut = note.indexOf(': ');
  const words = cut >= 0 ? note.slice(cut + 2).trim() : note.trim();
  if (isClaimNote(note) || cut < 0) return words;
  const kind = note.slice(0, cut).split(' — ')[0].trim();
  return kind ? `${kind.charAt(0).toUpperCase()}${kind.slice(1)}: ${words}` : words;
}

const NO_NUMBERS: NumberCheck = { added: [], dropped: [] };
/** How many number findings of one kind are listed before "and N more". */
const NUMBER_NOTES_SHOWN = 6;

/** Numbers a version adds or leaves out, each with the sentence it stands in. */
const NumberNotes: React.FC<{ check: NumberCheck }> = ({ check }) => (
  <>
    {[
      { title: 'Numbers not in your original', items: check.added },
      { title: 'Numbers from your original that are missing', items: check.dropped },
    ]
      .filter(group => group.items.length > 0)
      .map(group => (
        <div key={group.title}>
          <p className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
            <span className="w-1 h-4 bg-status-warning" aria-hidden="true" />
            {group.title}
          </p>
          <ul className="mt-1 list-disc pl-5 text-gray-900 dark:text-gray-100">
            {group.items.slice(0, NUMBER_NOTES_SHOWN).map((item, index) => (
              <li key={index} className="break-words">
                <span className="font-semibold">{item.numbers.join(', ')}</span>
                {item.context !== item.numbers.join(', ') && (
                  <span className="text-gray-600 dark:text-gray-400"> in “{item.context}”</span>
                )}
              </li>
            ))}
            {group.items.length > NUMBER_NOTES_SHOWN && (
              <li className="list-none text-gray-600 dark:text-gray-400">
                and {group.items.length - NUMBER_NOTES_SHOWN} more
              </li>
            )}
          </ul>
        </div>
      ))}
  </>
);

const ScoreTag: React.FC<{ total: number | undefined }> = ({ total }) => (
  <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-900 tabular-nums">
    {total != null ? (
      <>
        <span className={`w-1 h-5 ${getAbsoluteScoreMarkClass(total)}`} aria-hidden="true" />
        {total} / 100
      </>
    ) : (
      'Not scored'
    )}
  </span>
);

const QuickResult: React.FC<QuickResultProps> = ({
  result,
  isRescoring,
  onRescore,
  onNew,
  elapsedLabel,
  title,
  saveState,
  onRetrySave,
  onChange,
  changeBlocked,
  changeNotice,
  onScoreEdit,
}) => {
  // Editing by hand: the best version as plain text, protected parts as bracketed lines.
  const [draft, setDraft] = useState<QuickEditDraft | null>(null);
  const [editText, setEditText] = useState('');
  const versionCount = result.versions.length;
  // A new version arrived (the edit was scored): the editor has done its job.
  useEffect(() => {
    setDraft(null);
  }, [versionCount]);
  const openEditor = () => {
    const prepared = prepareQuickEdit(result);
    if (!prepared) return;
    setDraft(prepared);
    setEditText(prepared.text);
    // The editor opens under the best version, which can be far down the page.
    window.setTimeout(() => {
      document.getElementById('quick-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('quick-edit')?.focus({ preventScroll: true });
    }, 60);
  };
  const goToChange = () => {
    document.getElementById('quick-change-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById('quick-change')?.focus({ preventScroll: true }), 400);
  };
  const editProblem = draft ? validateQuickEdit(result, editText, draft.text) : null;
  const [instruction, setInstruction] = useState('');
  const changeProblem = instruction.trim() ? changeBlocked(instruction) : null;
  const submitChange = (text: string) => {
    if (isRescoring || !text.trim() || changeBlocked(text)) return;
    onChange(text.trim());
    setInstruction('');
  };
  // Ids of the other versions whose text is currently open.
  const [openIds, setOpenIds] = useState<string[]>([]);
  // The report is built in the browser and handed over as an HTML file.
  const [exportState, setExportState] = useState<'idle' | 'working' | 'failed'>('idle');
  const handleExport = async () => {
    if (exportState === 'working') return;
    setExportState('working');
    try {
      await exportQuickReport(result, title);
      setExportState('idle');
    } catch {
      setExportState('failed');
    }
  };
  const toggleOpen = (id: string) =>
    setOpenIds(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]));

  // The numbers each version adds to the original or leaves out of it. Worked
  // out here from the two texts (no model call), so it also covers results
  // that were saved before this check existed.
  const numbersByVersion = useMemo(() => {
    const byVersion: Record<string, NumberCheck> = {};
    const source = result.versions.find(version => version.id === ORIGINAL_VERSION_ID);
    const originalText = source ? contentToText(source.content) : '';
    if (!originalText.trim()) return byVersion;
    for (const version of result.versions) {
      if (version.id === ORIGINAL_VERSION_ID) continue;
      byVersion[version.id] = checkNumbers(contentToText(version.content), originalText);
    }
    return byVersion;
  }, [result.versions]);

  const { scores, versions } = result;
  const generated = versions.filter(version => version.id !== ORIGINAL_VERSION_ID);
  const winner = (scores?.winnerId ? generated.find(version => version.id === scores.winnerId) : undefined) ?? generated[0];

  if (!winner) return null;

  const rows = scores?.comparisonResult.rows ?? [];
  const winnerRow = rows.find(row => row.versionId === winner.id);
  const winnerScore = scores?.absoluteByVersion[winner.id];
  const originalScore = scores?.absoluteByVersion[ORIGINAL_VERSION_ID];
  const winnerTotal = winnerScore?.total;
  const originalTotal = originalScore?.total;
  const delta = winnerTotal != null && originalTotal != null ? winnerTotal - originalTotal : null;
  // Improvement relative to the original's own score, e.g. 71 -> 85 is +20%.
  const deltaPercent =
    delta != null && originalTotal != null && originalTotal > 0 ? Math.round((delta / originalTotal) * 100) : null;
  const original = versions.find(version => version.id === ORIGINAL_VERSION_ID);

  // A repetition the original has itself is not held against a version.
  const gates = effectiveGates(scores?.gateByVersion);
  const gate = gates[winner.id];
  const isIncomplete = gate ? !gate.valid : false;
  const gateProblems = (gate?.flags ?? []).map(flag =>
    flag.startsWith('too_short') ? 'it is much shorter than your original' : 'it repeats a passage'
  );
  const incompleteNote =
    gateProblems.length > 0
      ? `This version may be incomplete: ${Array.from(new Set(gateProblems)).join(' and ')}.`
      : 'This version may be incomplete.';
  const flags = (winnerRow?.verificationFlags ?? []).filter(flag => flag && flag.trim().length > 0);
  // The same wording and grouping as in the rankings table.
  const claimNotes = flags.filter(isClaimNote).map(noteText);
  const toneNotes = flags.filter(flag => !isClaimNote(flag)).map(noteText);
  const whyNotes = reasons(winnerScore);
  // Quoted passages in this version that are not in the original.
  const quoteFlags = result.quoteFlags[winner.id] ?? [];
  const numberNotes = numbersByVersion[winner.id] ?? NO_NUMBERS;
  const hasNumberNotes = numberNotes.added.length > 0 || numberNotes.dropped.length > 0;
  const testimonialsMoved = result.testimonials.movedIds.includes(winner.id);

  const others = generated
    .filter(version => version.id !== winner.id)
    .map(version => ({
      version,
      total: scores?.absoluteByVersion[version.id]?.total,
      // A version the structural check set aside cannot win, whatever it scores.
      setAside: gates[version.id] ? !gates[version.id].valid : false,
    }))
    .sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
  // The scorer cannot tell versions apart that are this close to the best one.
  const isClose = (total: number | undefined) =>
    total != null && winnerTotal != null && Math.abs(winnerTotal - total) <= QUICK_SCORE_MARGIN;
  const closeCount = others.filter(item => !item.setAside && isClose(item.total)).length;

  // Comparison & rankings: every scored version, best first, the original last.
  const rankingOf = (version: typeof winner) => {
    const score = scores?.absoluteByVersion[version.id];
    const row = rows.find(item => item.versionId === version.id);
    const gate = gates[version.id];
    const gain = score && originalTotal != null ? score.total - originalTotal : null;
    const notes = (row?.verificationFlags ?? []).filter(flag => flag && flag.trim().length > 0);
    return {
      version,
      score,
      gain,
      gainPercent: gain != null && originalTotal != null && originalTotal > 0 ? Math.round((gain / originalTotal) * 100) : null,
      setAside: gate ? !gate.valid : false,
      claims: notes.filter(isClaimNote).map(noteText),
      tone: notes.filter(note => !isClaimNote(note)).map(noteText),
      quotes: result.quoteFlags[version.id] ?? [],
      numbers: numbersByVersion[version.id] ?? NO_NUMBERS,
    };
  };
  const ranked = generated
    .map(rankingOf)
    .filter(item => item.score && !item.setAside)
    .sort((a, b) =>
      a.version.id === winner.id ? -1 : b.version.id === winner.id ? 1 : (b.score?.total ?? 0) - (a.score?.total ?? 0)
    );
  const unranked = generated.map(rankingOf).filter(item => !item.score || item.setAside);
  const baseline = original ? rankingOf(original) : null;
  // The table shows whenever there are scores, also when no version could be ranked.
  const hasRankings = !!scores && ranked.length + unranked.length > 0;
  const judgedAs = [
    scores?.comparisonResult.scoringContext?.useCaseLabel && `Judged as: ${scores.comparisonResult.scoringContext.useCaseLabel}`,
    `Goal: ${GOAL_OPTIONS.find(option => option.key === result.goalKey)?.label ?? result.goalKey}`,
  ]
    .filter(Boolean)
    .join(' · ');

  // The bar at the bottom of the screen: one entry per part of the result.
  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const jumpToVersion = (id: string) => {
    // The best version is the card at the top; the others open in their list.
    if (id === winner.id) {
      jumpTo('quick-best');
      return;
    }
    setOpenIds(current => (current.includes(id) ? current : [...current, id]));
    // Wait for the version to open before scrolling to it.
    window.setTimeout(() => jumpTo(`quick-version-${id}`), 60);
  };

  const goalOption = GOAL_OPTIONS.find(option => option.key === result.goalKey);
  const goalName = goalOption ? goalOption.label.split(' — ')[0] : result.goalKey;
  const scoreLabel = winnerTotal != null ? getAbsoluteScoreLabel(winnerTotal) : '';

  const hasChecks = flags.length > 0 || isIncomplete || quoteFlags.length > 0 || testimonialsMoved || hasNumberNotes;
  const jumpLink =
    'shrink-0 inline-flex items-center min-h-[40px] text-xs text-gray-900 dark:text-gray-100 hover:underline ' +
    'focus:outline-none focus:ring-2 focus:ring-primary-500';
  // Dark orange, not the bright accent: small text in the bright one is too faint to read.
  const jumpLinkBest =
    'shrink-0 inline-flex items-center min-h-[40px] text-xs text-primary-800 dark:text-primary-300 ' +
    'hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500';
  const jumpSeparator = <span aria-hidden="true" className="shrink-0 text-xs text-gray-400">/</span>;

  return (
    <div className="flex flex-col gap-6 pb-14">
      {/* The same bar as at the bottom of the HTML report: across the whole
          window, the original first, then every version in the order it was
          made, then the rankings. */}
      <nav
        aria-label="Jump to"
        className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700"
      >
        <div className="px-6 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <span className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-400 pr-1">Jump to:</span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={jumpLink}>
            Top
          </button>
          {jumpSeparator}
          <button type="button" onClick={() => jumpTo('quick-original')} className={jumpLink}>
            Your original
          </button>
          {result.versions
            .filter(version => version.id !== ORIGINAL_VERSION_ID)
            .map(version => (
              <React.Fragment key={version.id}>
                {jumpSeparator}
                {/* The best version stands out in the accent colour; "(best)" says it in words too. */}
                <button
                  type="button"
                  onClick={() => jumpToVersion(version.id)}
                  className={version.id === winner.id ? jumpLinkBest : jumpLink}
                >
                  {version.id === winner.id ? (
                    // Bold has to sit on a span: the app's own button style fixes a button's weight.
                    <span className="font-bold">{version.sourceDisplayName || 'Version'}&nbsp;(best)</span>
                  ) : (
                    version.sourceDisplayName || 'Version'
                  )}
                </button>
              </React.Fragment>
            ))}
          {hasRankings && (
            <>
              {jumpSeparator}
              <button type="button" onClick={() => jumpTo('quick-rankings')} className={jumpLink}>
                Rankings
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="flex flex-col gap-1">
        <h1 className="text-gray-900 dark:text-white">{title || deriveQuickLabel(result.formState.originalCopy || '')}</h1>
        {result.source && /^https?:\/\//i.test(result.source.url) && (
          <p className="text-gray-600 dark:text-gray-400 break-words">
            Source:{' '}
            <a
              href={result.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-800 dark:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {result.source.url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}
            </a>
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-400">
          Goal: {goalName} · {result.formState.language}
          {elapsedLabel && ` · Finished in ${elapsedLabel}`}
          {result.testimonials.count > 0 &&
            ` · ${result.testimonials.count} ${result.testimonials.count === 1 ? 'testimonial' : 'testimonials'} kept word for word`}
          {result.parts.kept > 0 &&
            ` · ${result.parts.kept} ${result.parts.kept === 1 ? 'part kept as it is' : 'parts kept as they are'}`}
          {result.parts.leftOut > 0 && ` · ${result.parts.leftOut} left out`}
          {saveState === 'saved' && ' · Saved'}
          {saveState === 'saving' && ' · Saving…'}
        </p>
        {saveState === 'failed' && (
          <p role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-900 dark:text-gray-100">
            <span className="w-1 h-5 shrink-0 bg-status-warning" aria-hidden="true" />
            <span>This result is not saved yet. If you leave this page it is lost.</span>
            <button
              type="button"
              onClick={onRetrySave}
              className="inline-flex items-center min-h-[44px] text-primary-800 dark:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Save again
            </button>
          </p>
        )}
      </div>

      {/* What you can do with the result. Stays at the top of the screen while
          the page scrolls, so the buttons are never out of reach on a long page.
          The bar at the bottom is the counterpart: where you can go. */}
      <div
        role="toolbar"
        aria-label="Actions"
        className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-gray-50 dark:bg-black border-b border-gray-300 dark:border-gray-700 flex flex-col gap-2"
      >
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <CopyButton content={winner.content} className={`${primaryButton} shrink-0`} />
          <button
            type="button"
            onClick={handleExport}
            disabled={!scores || exportState === 'working'}
            className={`${secondaryButton} shrink-0`}
          >
            {exportState === 'working' ? 'Building report…' : 'Export report'}
          </button>
          <button
            type="button"
            onClick={openEditor}
            disabled={!scores || !scores.winnerId || isRescoring || draft !== null}
            className={`${secondaryButton} shrink-0`}
          >
            Edit it myself
          </button>
          <button
            type="button"
            onClick={goToChange}
            disabled={!scores || !scores.winnerId || isRescoring}
            className={`${secondaryButton} shrink-0`}
          >
            Change it
          </button>
          <button type="button" onClick={onNew} className={`${secondaryButton} shrink-0`}>
            Start over
          </button>
        </div>
        {exportState === 'failed' && (
          <p role="alert" className="flex items-start gap-2.5 text-gray-900 dark:text-gray-100">
            <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-critical" aria-hidden="true" />
            <span>The report could not be built. Try again.</span>
          </p>
        )}
      </div>

      {/* One column on phones (best version, score, then the rest); two columns from 1024px. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr] items-start gap-x-8 gap-y-5">
        {/* Top left: the best version */}
        <div className="flex flex-col gap-5 min-w-0 lg:col-start-1 lg:row-start-1">
          <article id="quick-best" className={`${paper} p-5 sm:p-8 flex flex-col gap-4 scroll-mt-20`}>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span className="text-xs font-semibold text-gray-600">Best version</span>
              {scores && !isIncomplete && (
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-900">
                  <span className="w-1 h-5 bg-status-good" aria-hidden="true" />
                  Recommended
                </span>
              )}
            </div>
            <FormattedContent content={winner.content} className={copyText} colorScores={false} />
          </article>

          {draft && (
            <section id="quick-editor" aria-label="Edit it yourself" className={`${card} p-5 flex flex-col gap-3 scroll-mt-20`}>
              <div className="flex flex-col gap-1">
                <label htmlFor="quick-edit" className="font-semibold text-gray-900 dark:text-gray-100">
                  Edit it yourself
                </label>
                <p className="text-gray-600 dark:text-gray-400">
                  This is the best version as plain text. Change what you want, then have your version scored. Nothing
                  is rewritten for you, so it costs only a scoring run.
                </p>
                {draft.zones.length > 0 && (
                  <p className="text-gray-600 dark:text-gray-400">
                    A line in [[double brackets]] stands for a part that stays as it is. Leave that line where the part
                    belongs; the part itself comes back when your edit is scored.
                  </p>
                )}
              </div>
              <textarea
                id="quick-edit"
                value={editText}
                onChange={event => setEditText(event.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full min-h-[320px] px-3.5 py-3 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onScoreEdit(draft, editText)}
                  disabled={isRescoring || editProblem !== null}
                  className={primaryButton}
                >
                  Score my edit
                </button>
                <button type="button" onClick={() => setDraft(null)} className={secondaryButton}>
                  Cancel
                </button>
                {editProblem && <span className="text-gray-900 dark:text-gray-100">{editProblem}</span>}
              </div>
            </section>
          )}

          {scores && scores.winnerId && (
            <section id="quick-change-panel" aria-label="What should change?" className={`${card} p-5 flex flex-col gap-3 scroll-mt-20`}>
              <div className="flex flex-col gap-1">
                <label htmlFor="quick-change" className="font-semibold text-gray-900 dark:text-gray-100">
                  What should change?
                </label>
                <p className="text-gray-600 dark:text-gray-400">
                  Say it in your own words. CopyZap rewrites the best version, scores it, and keeps whichever is better.
                  Uses credits.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  id="quick-change"
                  type="text"
                  value={instruction}
                  maxLength={300}
                  placeholder="For example: shorter, and mention the free diagnosis earlier"
                  onChange={event => setInstruction(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') submitChange(instruction);
                  }}
                  className="flex-[1_1_260px] min-w-0 min-h-[44px] px-3.5 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => submitChange(instruction)}
                  disabled={isRescoring || !instruction.trim() || changeProblem !== null}
                  className={primaryButton}
                >
                  Change it
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Or one click:</span>
                {CHANGE_IDEAS.map(idea => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => submitChange(idea)}
                    disabled={isRescoring || changeBlocked(idea) !== null}
                    className="min-h-[44px] px-3 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {idea}
                  </button>
                ))}
              </div>
              {(changeProblem || changeBlocked('Shorter')) && (
                <p className="text-gray-900 dark:text-gray-100">{changeProblem || changeBlocked('Shorter')}</p>
              )}
              {changeNotice && (
                <p role="status" className="flex items-start gap-2.5 text-gray-900 dark:text-gray-100">
                  <span
                    className={
                      'w-1 h-5 mt-0.5 shrink-0 ' +
                      (changeNotice.tone === 'good'
                        ? 'bg-status-good'
                        : changeNotice.tone === 'bad'
                          ? 'bg-status-critical'
                          : 'bg-status-warning')
                    }
                    aria-hidden="true"
                  />
                  <span className="break-words">{changeNotice.text}</span>
                </p>
              )}
            </section>
          )}
        </div>

        {/* Right: score, reasons, checks */}
        <aside className="flex flex-col gap-4 min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <section id="quick-score" aria-label="Quality score" className={`${card} p-6 flex flex-col gap-5 scroll-mt-20`}>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Quality score</span>

            {winnerTotal != null && winnerScore ? (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-12 ${getAbsoluteScoreMarkClass(winnerTotal)}`} aria-hidden="true" />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-semibold leading-none text-gray-900 dark:text-white tabular-nums">
                        {winnerTotal}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/ 100</span>
                    </div>
                    {scoreLabel && (
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{scoreLabel}</span>
                    )}
                  </div>
                  {delta != null && originalTotal != null ? (
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                        {delta > 0 && `+${delta} ${delta === 1 ? 'point' : 'points'}`}
                        {delta < 0 && `−${Math.abs(delta)} ${delta === -1 ? 'point' : 'points'}`}
                        {delta === 0 && 'Same score'}
                        {delta !== 0 && deltaPercent != null && ` (${delta > 0 ? '+' : '−'}${Math.abs(deltaPercent)}%)`}
                        {delta !== 0 ? ' vs your original' : ' as your original'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">Your original scored {originalTotal} / 100.</p>
                      {closeCount > 0 && (
                        <p className="text-gray-600 dark:text-gray-400">
                          {closeCount === 1 ? '1 other version scores' : `${closeCount} other versions score`} about the
                          same. Scores within {QUICK_SCORE_MARGIN} points cannot be told apart.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">Your original could not be scored.</p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {SUB_SCORES.map(sub => (
                    <div key={sub.key} className="flex flex-col gap-1.5">
                      <div className="flex justify-between gap-3 text-gray-900 dark:text-gray-100">
                        <span>{sub.label}</span>
                        <span className="font-semibold tabular-nums">{winnerScore[sub.key]} / 25</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true">
                        <div
                          className="h-1.5 bg-gray-900 dark:bg-gray-100"
                          style={{ width: `${Math.max(0, Math.min(100, (winnerScore[sub.key] / 25) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-gray-700 dark:text-gray-300">
                  {scores
                    ? 'This version could not be scored.'
                    : 'Scoring did not finish, so this is the first version, unscored.'}
                </p>
                {result.scoringError && (
                  <p className="text-gray-600 dark:text-gray-400 break-words">{result.scoringError}</p>
                )}
                <button type="button" onClick={onRescore} disabled={isRescoring} className={`${secondaryButton} self-start`}>
                  {isRescoring ? 'Scoring…' : 'Score again'}
                </button>
              </div>
            )}
          </section>

          {whyNotes.length > 0 && (
            <section id="quick-why" aria-label="Why this version" className={`${card} p-6 flex flex-col gap-3 scroll-mt-20`}>
              <h2 className="text-gray-900 dark:text-white">Why this version</h2>
              <ul className="flex flex-col gap-2 text-gray-700 dark:text-gray-300">
                {whyNotes.map(item => (
                  <li key={item.label}>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{item.label}:</span> {item.note}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasChecks && (
            <section id="quick-checks" aria-label="Check before publishing" className={`${card} p-6 flex flex-col gap-3 scroll-mt-20`}>
              <h2 className="text-gray-900 dark:text-white">Check before publishing</h2>
              {(quoteFlags.length > 0 || testimonialsMoved || isIncomplete) && (
              <ul className="flex flex-col gap-3 text-gray-700 dark:text-gray-300">
                {quoteFlags.map((quote, index) => (
                  <li key={`quote-${index}`} className="flex items-start gap-2.5">
                    <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-critical" aria-hidden="true" />
                    <span className="break-words">
                      Quoted words that are not in your original. Remove them or replace them with the exact words:
                      “{quote}”
                    </span>
                  </li>
                ))}
                {testimonialsMoved && (
                  <li className="flex items-start gap-2.5">
                    <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-warning" aria-hidden="true" />
                    <span>
                      This version did not keep the place for a part that stays as it is, so that part was put back
                      before the last section. Check that the position fits.
                    </span>
                  </li>
                )}
                {isIncomplete && (
                  <li className="flex items-start gap-2.5">
                    <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-warning" aria-hidden="true" />
                    <span>{incompleteNote}</span>
                  </li>
                )}
              </ul>
              )}
              <NumberNotes check={numberNotes} />
              {claimNotes.length > 0 && (
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <span className="w-1 h-4 bg-status-warning" aria-hidden="true" />
                    Claims to verify
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-gray-900 dark:text-gray-100">
                    {claimNotes.map((claim, index) => (
                      <li key={index} className="break-words">{claim}</li>
                    ))}
                  </ul>
                </div>
              )}
              {toneNotes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Brand voice and tone to review</p>
                  <ul className="mt-1 list-disc pl-5 text-gray-600 dark:text-gray-400">
                    {toneNotes.map((note, index) => (
                      <li key={index} className="break-words">{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </aside>

        {/* Below the best version: the original (always shown) and the other versions (closed) */}
        <div className="flex flex-col gap-5 min-w-0 lg:col-start-1 lg:row-start-2">
          {original && (
            <article id="quick-original" className={`${paper} p-5 flex flex-col gap-3 scroll-mt-20`}>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <span className="text-xs font-semibold text-gray-600">Your original</span>
                <ScoreTag total={originalTotal} />
              </div>
              <FormattedContent content={original.content} className={copyText} colorScores={false} />
            </article>
          )}

          {others.length > 0 && (
            <section aria-label="Other versions" className="flex flex-col gap-2">
              <h2 className="text-gray-900 dark:text-white">Other versions</h2>
              {others.map(({ version, total, setAside }) => {
                const isOpen = openIds.includes(version.id);
                return (
                  <article key={version.id} id={`quick-version-${version.id}`} className={`${paper} scroll-mt-20`}>
                    <button
                      type="button"
                      onClick={() => toggleOpen(version.id)}
                      aria-expanded={isOpen}
                      className="w-full min-h-[52px] px-5 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold text-gray-900">{version.sourceDisplayName || 'Version'}</span>
                        {setAside && (
                          <span className="text-xs text-gray-600">Set aside: repeats a paragraph or is cut short</span>
                        )}
                        {!setAside && isClose(total) && (
                          <span className="text-xs text-gray-600">About the same as the best</span>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-4">
                        <ScoreTag total={total} />
                        <span className="text-xs text-primary-800 underline">{isOpen ? 'Hide' : 'Show'}</span>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pt-4 pb-5 flex flex-col gap-3 border-t border-gray-200">
                        <FormattedContent content={version.content} className={copyText} colorScores={false} />
                        <CopyButton content={version.content} className={`${paperButton} self-start`} />
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}

          {result.failedVersions > 0 && (
            <p className="text-gray-600 dark:text-gray-400">
              {result.failedVersions} of {result.failedVersions + generated.length} versions could not be written.
            </p>
          )}
        </div>
      </div>

      {hasRankings && (
        <section id="quick-rankings" aria-label="Comparison and rankings" className="flex flex-col gap-3 scroll-mt-20">
          <div className="flex flex-col gap-1">
            <h2 className="text-gray-900 dark:text-white">Comparison &amp; rankings</h2>
            <p className="text-gray-600 dark:text-gray-400">{judgedAs}</p>
          </div>
          <ol className={`${card} divide-y divide-gray-200 dark:divide-gray-700`}>
            {[...ranked, ...unranked, ...(baseline ? [baseline] : [])].map((item, index) => {
              const isBaseline = item.version.id === ORIGINAL_VERSION_ID;
              const isWinner = item.version.id === winner.id;
              const isRanked = index < ranked.length;
              const total = item.score?.total;
              return (
                <li key={item.version.id} className={'px-5 py-4 flex flex-col gap-2 ' + (isWinner ? 'bg-gray-50 dark:bg-gray-800' : '')}>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                    <span className="w-6 shrink-0 font-semibold text-gray-600 dark:text-gray-400 tabular-nums">
                      {isRanked ? index + 1 : '–'}
                    </span>
                    <span className="flex-[1_1_220px] min-w-0 flex flex-wrap items-baseline gap-x-2">
                      {isBaseline ? (
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Your original</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => jumpToVersion(item.version.id)}
                          className="min-h-[44px] text-left font-semibold text-gray-900 dark:text-gray-100 hover:underline break-words focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {item.version.sourceDisplayName || 'Version'}
                        </button>
                      )}
                      {isWinner && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100">
                          <span className="w-1 h-4 bg-status-good" aria-hidden="true" />
                          Winner
                        </span>
                      )}
                      {isBaseline && <span className="text-xs text-gray-600 dark:text-gray-400">baseline</span>}
                      {item.setAside && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Set aside: repeats a paragraph or is cut short
                        </span>
                      )}
                      {!isBaseline && !isWinner && !item.setAside && isClose(total) && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">About the same as the best</span>
                      )}
                    </span>
                    <span className="w-28 shrink-0 text-gray-900 dark:text-gray-100 tabular-nums">
                      {isBaseline || item.gain == null
                        ? ''
                        : `${item.gain >= 0 ? '+' : ''}${item.gain}${item.gainPercent != null ? ` | ${item.gain >= 0 ? '+' : ''}${item.gainPercent}%` : ''}`}
                    </span>
                    <span className="w-24 shrink-0 text-right">
                      {total != null ? <ScoreTag total={total} /> : <span className="text-gray-600 dark:text-gray-400">Not scored</span>}
                    </span>
                  </div>
                  {item.score && (
                    <p className="pl-11 text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                      Clarity {item.score.clarity}/25 · Persuasion {item.score.persuasion}/25 · Audience fit{' '}
                      {item.score.audience_fit}/25 · Structure {item.score.structure}/25
                    </p>
                  )}
                  {(item.quotes.length > 0 ||
                    item.claims.length > 0 ||
                    item.tone.length > 0 ||
                    item.numbers.added.length > 0 ||
                    item.numbers.dropped.length > 0) && (
                    <div className="pl-11 flex flex-col gap-2">
                      {item.quotes.length > 0 && (
                        <div>
                          <p className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                            <span className="w-1 h-4 bg-status-critical" aria-hidden="true" />
                            Quoted words not in your original
                          </p>
                          <ul className="mt-1 list-disc pl-5 text-gray-900 dark:text-gray-100">
                            {item.quotes.map((quote, n) => (
                              <li key={n} className="break-words">“{quote}”</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <NumberNotes check={item.numbers} />
                      {item.claims.length > 0 && (
                        <div>
                          <p className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                            <span className="w-1 h-4 bg-status-warning" aria-hidden="true" />
                            Claims to verify
                          </p>
                          <ul className="mt-1 list-disc pl-5 text-gray-900 dark:text-gray-100">
                            {item.claims.map((claim, n) => (
                              <li key={n} className="break-words">{claim}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.tone.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Brand voice and tone to review</p>
                          <ul className="mt-1 list-disc pl-5 text-gray-600 dark:text-gray-400">
                            {item.tone.map((note, n) => (
                              <li key={n} className="break-words">{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
};

export default QuickResult;
