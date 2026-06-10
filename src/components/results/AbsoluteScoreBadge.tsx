import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { AbsoluteScoreBreakdown } from '../../types';

function getAbsoluteScoreColor(total: number): string {
  if (total <= 65) return '#dc2626';
  if (total <= 75) return '#d97706';
  if (total <= 85) return '#16a34a';
  return '#1d4ed8';
}

interface AbsoluteScoreBadgeProps {
  score: AbsoluteScoreBreakdown;
  /** If true, shows a compact inline version without the breakdown panel */
  compact?: boolean;
  /** If true, renders dimension bars directly with no toggle — always visible */
  alwaysOpen?: boolean;
}

const DimBar: React.FC<{ label: string; value: number; note: string }> = ({ label, value, note }) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-[10px] font-bold tabular-nums text-gray-700 dark:text-gray-300">{value}<span className="opacity-40">/25</span></span>
    </div>
    <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gray-400 dark:bg-gray-500"
        style={{ width: `${(value / 25) * 100}%` }}
      />
    </div>
    {note && <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-snug">{note}</p>}
  </div>
);

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-52 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] leading-snug rounded px-2 py-1.5 shadow-lg pointer-events-none whitespace-normal text-center">
          {text}
        </span>
      )}
    </span>
  );
};

export const AbsoluteScoreBadge: React.FC<AbsoluteScoreBadgeProps> = ({ score, compact = false, alwaysOpen = false }) => {
  const [expanded, setExpanded] = useState(false);
  const absColor = getAbsoluteScoreColor(score.total);

  if (compact) {
    return (
      <Tooltip text="Evaluated in isolation — does not change as new versions are added">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold bg-white/10 border-white/20 text-white cursor-default">
          <span className="opacity-70 font-normal">Abs</span>
          <span style={{ color: absColor }}>{score.total}</span>
        </span>
      </Tooltip>
    );
  }

  const dims = (
    <div className="space-y-3">
      <DimBar label="Clarity & Readability" value={score.clarity} note={score.clarity_note} />
      <DimBar label="Persuasion & Conversion" value={score.persuasion} note={score.persuasion_note} />
      <DimBar label="Audience Fit" value={score.audience_fit} note={score.audience_fit_note} />
      <DimBar label="Structure & Flow" value={score.structure} note={score.structure_note} />
    </div>
  );

  if (alwaysOpen) {
    return <div className="space-y-3">{dims}</div>;
  }

  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Absolute Score</span>
          <Tooltip text="Evaluated in isolation against a fixed rubric — does not change as new versions are added to your session. Scores may vary ±3-5 points between sessions due to AI evaluation variance. Focus on the dimension breakdown and notes rather than the exact number.">
            <Info size={11} className="text-gray-300 dark:text-gray-700" />
          </Tooltip>
        </div>
        <span className="text-lg font-black tabular-nums" style={{ color: absColor }}>{score.total}<span className="text-xs font-normal text-gray-400 ml-0.5">/100</span></span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 dark:border-gray-900 pt-3">
          {dims}
        </div>
      )}
    </div>
  );
};

/** Inline pair: shows both Session Score and Absolute Score labels + values */
interface DualScoreRowProps {
  sessionScore: number | null | undefined;
  absoluteScore: AbsoluteScoreBreakdown | null | undefined;
}

export const DualScoreRow: React.FC<DualScoreRowProps> = ({ sessionScore, absoluteScore }) => {
  const hasSession = typeof sessionScore === 'number';
  const hasAbsolute = absoluteScore && absoluteScore.total > 0;

  if (!hasSession && !hasAbsolute) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasSession && (
        <Tooltip text="Relative to other versions generated in this session">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-[11px] font-semibold text-white cursor-default">
            <span className="opacity-70 font-normal">Session</span>
            <span>{sessionScore}</span>
          </span>
        </Tooltip>
      )}
      {hasAbsolute && (
        <Tooltip text="Evaluated in isolation — does not change as new versions are added">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-white cursor-default">
            <span className="opacity-70 font-normal">Abs</span>
            <span style={{ color: getAbsoluteScoreColor(absoluteScore.total) }}>{absoluteScore.total}</span>
          </span>
        </Tooltip>
      )}
    </div>
  );
};

export default AbsoluteScoreBadge;
