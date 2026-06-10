export interface ScoreColorClasses {
  text: string;
  bg: string;
  border: string;
}

export function getScoreColorClasses(score: number | undefined): ScoreColorClasses {
  if (!score || score === 0) {
    return {
      text: 'text-gray-500 dark:text-gray-400',
      bg: 'bg-gray-500 dark:bg-gray-600',
      border: 'border-gray-300 dark:border-gray-600'
    };
  }

  if (score >= 80) {
    return {
      text: 'text-emerald-600 dark:text-emerald-400 font-bold',
      bg: 'bg-emerald-600 dark:bg-emerald-500',
      border: 'border-emerald-500 dark:border-emerald-400'
    };
  }

  if (score >= 50) {
    return {
      text: 'text-amber-600 dark:text-amber-400 font-bold',
      bg: 'bg-amber-600 dark:bg-amber-500',
      border: 'border-amber-500 dark:border-amber-400'
    };
  }

  return {
    text: 'text-rose-600 dark:text-rose-400 font-bold',
    bg: 'bg-rose-600 dark:bg-rose-500',
    border: 'border-rose-500 dark:border-rose-400'
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

export function getScoreLabel(score: number | undefined): string {
  if (!score || score === 0) {
    return '';
  }

  if (score >= 80) {
    return 'EXCELLENT';
  }

  if (score >= 50) {
    return 'GOOD';
  }

  return 'POOR';
}
