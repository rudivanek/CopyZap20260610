export interface ScoreColorClasses {
  text: string;
  bg: string;
  border: string;
}

// Score quality is signalled by a coloured mark beside the number, never by
// colouring the digits themselves. Numbers stay in neutral ink so they remain
// legible and so colour carries one meaning only.
//
// Bands: >= 80 good, >= 50 warning, < 50 critical, 0/undefined unknown.
// Thresholds are a product decision and are not part of this step.

export function getScoreColorClasses(score: number | undefined): ScoreColorClasses {
  if (!score || score === 0) {
    return {
      text: 'text-gray-500 dark:text-gray-400',
      bg: 'bg-gray-400 dark:bg-gray-500',
      border: 'border-gray-300 dark:border-gray-600'
    };
  }

  if (score >= 80) {
    return {
      text: 'text-gray-900 dark:text-gray-100',
      bg: 'bg-status-good',
      border: 'border-status-good'
    };
  }

  if (score >= 50) {
    return {
      text: 'text-gray-900 dark:text-gray-100',
      bg: 'bg-status-warning',
      border: 'border-status-warning'
    };
  }

  return {
    text: 'text-gray-900 dark:text-gray-100',
    bg: 'bg-status-critical',
    border: 'border-status-critical'
  };
}

export function getScoreTextClass(score: number | undefined): string {
  return getScoreColorClasses(score).text;
}

export function getScoreBgClass(score: number | undefined): string {
  return getScoreColorClasses(score).bg;
}

export function getScoreBorderClass(score: number | undefined): string {
  return getScoreColorClasses(score).border;
}

// Colour for the dot, bar or ring that sits beside the number — the mark that
// now carries the quality signal. Returns a background class.
export function getScoreMarkClass(score: number | undefined): string {
  return getScoreBgClass(score);
}

// Shared delta badge styling — positive deltas map to status-good, negative to
// status-warning. One helper so the two cards that render deltas stay in sync.
export function deltaBadgeClass(positive: boolean): string {
  return positive
    ? 'text-status-good bg-status-good/10 border border-status-good/30'
    : 'text-status-warning bg-status-warning/10 border border-status-warning/30';
}

// Absolute score is evaluated in isolation against a fixed rubric, so its
// bands (65 / 75) differ from the session-score bands (80 / 50) above. That
// mismatch is a product decision about two separate scoring systems, not a
// styling choice — left intentionally inconsistent here.
export function getAbsoluteScoreMarkClass(total: number): string {
  if (total <= 65) return 'bg-status-critical';
  if (total <= 75) return 'bg-status-warning';
  return 'bg-status-good';
}

// The top band (> 85) earns a word, not a colour. Returns '' for everything
// else so the call site is a single conditional render.
export function getAbsoluteScoreLabel(total: number): string {
  return total > 85 ? 'Excellent' : '';
}

export function getScoreLabel(score: number | undefined): string {
  if (!score || score === 0) {
    return '';
  }

  if (score >= 80) {
    return 'Excellent';
  }

  if (score >= 50) {
    return 'Good';
  }

  return 'Needs work';
}
