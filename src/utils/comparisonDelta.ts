export interface ComparisonDelta {
  deltaPoints: number;
  deltaPercent: number;
  label: string;
  positive: boolean;
  negative: boolean;
  neutral: boolean;
}

export function getComparisonDelta(
  versionScore: number,
  baselineScore: number | null | undefined
): ComparisonDelta | null {
  if (baselineScore == null || baselineScore <= 0) return null;
  const deltaPoints = Math.round(versionScore - baselineScore);
  const deltaPercent = parseFloat(
    (((versionScore - baselineScore) / baselineScore) * 100).toFixed(1)
  );
  return formatDeltaFromParts(deltaPoints, deltaPercent);
}

export function formatDeltaFromParts(
  deltaPoints: number,
  deltaPercent: number
): ComparisonDelta {
  if (deltaPoints === 0) {
    return { deltaPoints: 0, deltaPercent: 0, label: '0 pts (0.0%)', positive: false, negative: false, neutral: true };
  }
  const sign = deltaPoints > 0 ? '+' : '−';
  const absPoints = Math.abs(deltaPoints);
  const absPercent = Math.abs(deltaPercent).toFixed(1);
  return {
    deltaPoints,
    deltaPercent,
    label: `${sign}${absPoints} pts (${sign}${absPercent}%)`,
    positive: deltaPoints > 0,
    negative: deltaPoints < 0,
    neutral: false,
  };
}
