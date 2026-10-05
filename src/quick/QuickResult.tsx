import React, { useState } from 'react';
import { GeneratedContentItem } from '../types';
import FormattedContent from '../components/ui/FormattedContent';
import { contentToText } from '../services/api/contentText';
import type { AbsoluteScoreBreakdown } from '../services/api/absoluteScoring';
import { GOAL_OPTIONS } from '../utils/scoringContextStorage';
import { getAbsoluteScoreLabel, getAbsoluteScoreMarkClass } from '../utils/scoreColors';
import { deriveQuickLabel } from '../engine/buildQuickFormState';
import { ORIGINAL_VERSION_ID } from '../engine/pickWinner';
import type { QuickRunResult } from '../engine/runQuickPipeline';

interface QuickResultProps {
  result: QuickRunResult;
  isRescoring: boolean;
  onRescore: () => void;
  onNew: () => void;
  /** How long the run took, already formatted (m:ss). */
  elapsedLabel?: string;
}

const card = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700';
// The copy itself always sits on a white "paper" surface, in light and dark theme:
// the shared markdown renderer writes dark text colours inline.
const paper = 'bg-white border border-gray-200 dark:border-gray-600';
const copyText = 'text-gray-700 [&_ul]:list-disc [&_ol]:list-decimal';
const primaryButton =
  'inline-flex items-center justify-center min-h-[44px] px-6 bg-primary-500 hover:bg-primary-400 ' +
  'text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ' +
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
const linkButton =
  'inline-flex items-center min-h-[44px] text-primary-800 dark:text-primary-300 underline ' +
  'hover:text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500';

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

const QuickResult: React.FC<QuickResultProps> = ({ result, isRescoring, onRescore, onNew, elapsedLabel }) => {
  const [showOthers, setShowOthers] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

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

  const gate = scores?.gateByVersion[winner.id];
  const isIncomplete = gate ? !gate.valid : false;
  const gateProblems = (gate?.flags ?? []).map(flag =>
    flag.startsWith('too_short') ? 'it is much shorter than your original' : 'it repeats a passage'
  );
  const incompleteNote =
    gateProblems.length > 0
      ? `This version may be incomplete: ${Array.from(new Set(gateProblems)).join(' and ')}.`
      : 'This version may be incomplete.';
  const flags = (winnerRow?.verificationFlags ?? []).filter(flag => flag && flag.trim().length > 0);
  const whyNotes = reasons(winnerScore);

  const others = generated
    .filter(version => version.id !== winner.id)
    .map(version => ({ version, total: scores?.absoluteByVersion[version.id]?.total }))
    .sort((a, b) => (b.total ?? -1) - (a.total ?? -1));

  const goalOption = GOAL_OPTIONS.find(option => option.key === result.goalKey);
  const goalName = goalOption ? goalOption.label.split(' — ')[0] : result.goalKey;
  const scoreLabel = winnerTotal != null ? getAbsoluteScoreLabel(winnerTotal) : '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-gray-900 dark:text-white">{deriveQuickLabel(result.formState.originalCopy || '')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Goal: {goalName} · {result.formState.language}
          {elapsedLabel && ` · Finished in ${elapsedLabel}`}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        {/* Left: the copy */}
        <div className="flex flex-col gap-5 min-w-0 flex-[999_1_480px]">
          <article className={`${paper} p-5 sm:p-8 flex flex-col gap-4`}>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span className="text-xs font-semibold text-gray-600">Best version</span>
              {scores && !isIncomplete && (
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-900">
                  <span className="w-1 h-5 bg-status-good" aria-hidden="true" />
                  Recommended
                </span>
              )}
            </div>
            <FormattedContent content={winner.content} className={copyText} />
          </article>

          <div className="flex flex-wrap gap-2">
            <CopyButton content={winner.content} className={primaryButton} />
            <button type="button" onClick={onNew} className={secondaryButton}>
              Start over
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {original && (
                <button
                  type="button"
                  onClick={() => setShowOriginal(open => !open)}
                  aria-expanded={showOriginal}
                  className={linkButton}
                >
                  {showOriginal ? 'Hide' : 'See'} your original
                </button>
              )}
              {others.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowOthers(open => !open)}
                  aria-expanded={showOthers}
                  className={linkButton}
                >
                  {showOthers ? 'Hide' : 'See'} {others.length} other {others.length === 1 ? 'version' : 'versions'}
                </button>
              )}
            </div>

            {showOriginal && original && (
              <article className={`${paper} p-5 flex flex-col gap-3`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <span className="text-xs font-semibold text-gray-600">Your original</span>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-900">
                    {originalTotal != null ? (
                      <>
                        <span className={`w-1 h-5 ${getAbsoluteScoreMarkClass(originalTotal)}`} aria-hidden="true" />
                        {originalTotal} / 100
                      </>
                    ) : (
                      'Not scored'
                    )}
                  </span>
                </div>
                <FormattedContent content={original.content} className={copyText} />
              </article>
            )}

            {showOthers &&
                others.map(({ version, total }) => (
                  <article key={version.id} className={`${paper} p-5 flex flex-col gap-3`}>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <span className="text-xs font-semibold text-gray-600">
                        {version.sourceDisplayName || 'Version'}
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-900">
                        {total != null ? (
                          <>
                            <span className={`w-1 h-5 ${getAbsoluteScoreMarkClass(total)}`} aria-hidden="true" />
                            {total} / 100
                          </>
                        ) : (
                          'Not scored'
                        )}
                      </span>
                    </div>
                    <FormattedContent content={version.content} className={copyText} />
                    <CopyButton content={version.content} className={`${paperButton} self-start`} />
                  </article>
                ))}
          </div>

          {result.failedVersions > 0 && (
            <p className="text-gray-600 dark:text-gray-400">
              {result.failedVersions} of {result.failedVersions + generated.length} versions could not be written.
            </p>
          )}
        </div>

        {/* Right: score, reasons, checks */}
        <aside className="flex flex-col gap-4 min-w-0 flex-[1_1_280px]">
          <section aria-label="Quality score" className={`${card} p-6 flex flex-col gap-5`}>
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
            <section aria-label="Why this version" className={`${card} p-6 flex flex-col gap-3`}>
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

          {(flags.length > 0 || isIncomplete) && (
            <section aria-label="Check before publishing" className={`${card} p-6 flex flex-col gap-3`}>
              <h2 className="text-gray-900 dark:text-white">Check before publishing</h2>
              <ul className="flex flex-col gap-3 text-gray-700 dark:text-gray-300">
                {isIncomplete && (
                  <li className="flex items-start gap-2.5">
                    <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-warning" aria-hidden="true" />
                    <span>{incompleteNote}</span>
                  </li>
                )}
                {flags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span className="w-1 h-5 mt-0.5 shrink-0 bg-status-warning" aria-hidden="true" />
                    <span className="break-words">{flag}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default QuickResult;
