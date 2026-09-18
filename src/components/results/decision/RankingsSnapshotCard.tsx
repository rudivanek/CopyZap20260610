import React, { useMemo } from 'react';
import { calculateMultiScoreDisplay } from '../../../utils/multiScoreDisplay';
import { SubScoreChips } from '../SubScoreChips';
import { formatLocalDateTime } from '../../../utils/dateFormatting';
import { AbsoluteScoreBreakdown } from '../../../types';
import { deltaBadgeClass, getAbsoluteScoreMarkClass, getAbsoluteScoreLabel } from '../../../utils/scoreColors';

interface RankRow {
  versionId: string;
  optionLabel: string;
  finalScore: number;
  deltaVsBest: number;
  improvementPct?: number | null;
  isWinner: boolean;
  evaluatedAt?: string;
  contentText?: string;
  absoluteScore?: AbsoluteScoreBreakdown;
  humanAuthenticity?: number;
  overMarketingPenalty?: number;
  brandFit?: number;
  verificationFlags?: string[];
}

interface RankingsSnapshotCardProps {
  rows: RankRow[];
  baselineVersionId?: string;
  baselineScore?: number | null;
  hasBaseline?: boolean;
  latestEvaluatedAt?: number | null;
  onRowClick?: (versionId: string) => void;
  onViewAnalysis?: (versionId: string) => void;
  subScoresUsable?: boolean;
}

// Delta of one score vs the baseline, on whichever scale is in play.
function scoreDelta(
  rowTotal: number,
  baselineTotal: number
): { label: string; positive: boolean; negative: boolean } | null {
  const diff = rowTotal - baselineTotal;
  if (diff === 0) return null;
  const pct = baselineTotal > 0 ? ((diff / baselineTotal) * 100).toFixed(1) : '0.0';
  const sign = diff > 0 ? '+' : '';
  return {
    label: `${sign}${diff} pts (${sign}${pct}%)`,
    positive: diff > 0,
    negative: diff < 0,
  };
}

export const RankingsSnapshotCard: React.FC<RankingsSnapshotCardProps> = ({
  rows,
  baselineVersionId,
  baselineScore,
  onRowClick,
  onViewAnalysis,
  subScoresUsable = true,
}) => {
  // Absolute is THE score when any version has one; otherwise fall back to the
  // session score (older 'current' method that produced no absolute scores).
  const usingAbsolute = rows.some(r => r.absoluteScore != null);

  const isBaselineRow = (r: RankRow) =>
    r.versionId === baselineVersionId ||
    (!baselineVersionId && r.optionLabel === 'Original Copy');

  const getPrimary = (r: RankRow): number | null =>
    usingAbsolute ? (r.absoluteScore?.total ?? null) : r.finalScore;

  const baselineRow =
    rows.find(r => r.versionId === baselineVersionId) ??
    rows.find(r => r.optionLabel === 'Original Copy') ??
    null;
  const baselinePrimary = usingAbsolute
    ? (baselineRow?.absoluteScore?.total ?? null)
    : (baselineScore ?? null);

  // Order rows by the primary score (desc). Rows without a score sink to the bottom.
  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => (getPrimary(b) ?? -1) - (getPrimary(a) ?? -1)),
    [rows, usingAbsolute]
  );

  // Winner = highest primary score among non-baseline versions. This is the
  // version we recommend, and the ranking order already reflects it.
  const winnerId = useMemo(() => {
    let id: string | null = null;
    let best = -Infinity;
    for (const r of rows) {
      if (isBaselineRow(r)) continue;
      const p = getPrimary(r);
      if (p != null && p > best) {
        best = p;
        id = r.versionId;
      }
    }
    return id;
  }, [rows, usingAbsolute]);

  return (
    <div
      id="results-rankings"
      className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">
          Rankings
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 dark:text-gray-700">
          {usingAbsolute ? 'Score = Absolute quality (0–100)' : 'Score'}
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {orderedRows.map((row, idx) => {
          const isBaseline = isBaselineRow(row);
          const isWinner = row.versionId === winnerId;

          const primary = getPrimary(row);
          const dlt =
            !isBaseline && primary != null && baselinePrimary != null
              ? scoreDelta(primary, baselinePrimary)
              : null;
          const dltClass = dlt
            ? dlt.positive
              ? deltaBadgeClass(true)
              : deltaBadgeClass(false)
            : '';

          const subScores = row.contentText ? calculateMultiScoreDisplay(row.contentText) : null;
          const hasActionChips = onRowClick || (!isBaseline && onViewAnalysis);

          return (
            <div
              key={row.versionId}
              className={[
                'flex items-start gap-3 py-3 transition-colors',
                isWinner ? 'border-l-2 border-l-status-good pl-3 pr-4' : 'px-4',
              ].join(' ')}
            >
              {/* Rank number */}
              <span className="text-xs tabular-nums w-4 flex-shrink-0 text-gray-300 dark:text-gray-700 font-bold mt-0.5">
                {idx + 1}
              </span>

              {/* Name + tags + action chips */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span
                    className={`text-sm truncate ${
                      isWinner
                        ? 'font-bold text-gray-900 dark:text-white'
                        : 'font-normal text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {row.optionLabel}
                  </span>
                  {isWinner && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      Recommended
                    </span>
                  )}
                  {isBaseline && (
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Baseline
                    </span>
                  )}
                </div>
                {row.evaluatedAt && (
                  <div className="text-xs text-gray-400 dark:text-gray-600">
                    {formatLocalDateTime(row.evaluatedAt)}
                  </div>
                )}
                {subScores && (
                  <div className="mt-1">
                    <SubScoreChips
                      conversion={subScores.conversion}
                      trust={subScores.trust}
                      risk={subScores.risk}
                      compact={true}
                      hasSignal={subScoresUsable}
                    />
                  </div>
                )}
                {/* Action chips */}
                {hasActionChips && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {onRowClick && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onRowClick(row.versionId); }}
                        className="text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                      >
                        Output
                      </button>
                    )}
                    {!isBaseline && onViewAnalysis && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onViewAnalysis(row.versionId); }}
                        className="text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                      >
                        Analysis
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Single score column — Absolute (or session fallback) + delta */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {dlt && (
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${dltClass}`}
                  >
                    {dlt.label}
                  </span>
                )}
                {primary != null ? (
                  <div className="flex items-center gap-1.5">
                    {usingAbsolute && (
                      <span
                        aria-hidden="true"
                        className={`w-1 h-5 flex-shrink-0 ${getAbsoluteScoreMarkClass(primary)}`}
                      />
                    )}
                    <span
                      className={`text-base tabular-nums ${
                        isWinner
                          ? 'font-black text-gray-900 dark:text-white'
                          : 'font-bold text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {primary}
                    </span>
                    {usingAbsolute && getAbsoluteScoreLabel(primary) && (
                      <span className="text-xs text-gray-400 dark:text-gray-600 font-medium">
                        {getAbsoluteScoreLabel(primary)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs tabular-nums text-gray-300 dark:text-gray-700 font-normal">
                    …
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footnote */}
      <p
        style={{
          fontSize: '12px',
          color: '#9ca3af',
          fontStyle: 'italic',
          marginTop: '12px',
          padding: '0 16px 12px',
        }}
      >
        {usingAbsolute ? (
          <>
            &#9432; La puntuación es una medida absoluta de calidad (0–100), evaluada contra un
            estándar fijo para el objetivo indicado; no cambia al añadir versiones. El orden del
            ranking refleja esta puntuación, y la versión #1 es la recomendada.
          </>
        ) : (
          <>
            &#9432; Las puntuaciones son relativas entre las versiones comparadas en esta sesión.
            Agregar nuevas versiones puede ajustar los puntajes ligeramente. Enfócate en el orden
            del ranking y la mejora porcentual vs. el texto original.
          </>
        )}
      </p>
    </div>
  );
};
