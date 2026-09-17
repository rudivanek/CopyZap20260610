import { ScoringContext, UseCaseKey, GoalKey } from '../types';

export const LS_KEY = 'copyzap_scoring_context_v1';
export const DEFAULT_USE_CASE_KEY: UseCaseKey = 'hero_section';
export const DEFAULT_GOAL_KEY: GoalKey = 'convert';

export const USE_CASE_OPTIONS: { key: UseCaseKey; label: string }[] = [
  { key: 'hero_section', label: 'Hero section' },
  { key: 'landing_page', label: 'Landing page' },
  { key: 'seo_page', label: 'SEO page' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'linkedin_ad', label: 'LinkedIn ad' },
  { key: 'twitter_ad', label: 'X (Twitter) ad' },
  { key: 'google_ad', label: 'Google ad' },
  { key: 'general_improve', label: 'General improvement' },
  { key: 'custom', label: 'Custom' },
];

export const GOAL_OPTIONS: { key: GoalKey; label: string }[] = [
  { key: 'convert', label: 'Convert — drive an action / sale' },
  { key: 'nurture', label: 'Nurture — keep a warm relationship' },
  { key: 'inform', label: 'Inform — announce or update' },
  { key: 'educate', label: 'Educate — teach or onboard' },
  { key: 'brand', label: 'Brand — build trust / identity' },
  { key: 'custom', label: 'Custom' },
];

export function loadFromStorage(): { useCaseKey: UseCaseKey; useCaseLabel: string; goalKey?: GoalKey; goalLabel?: string } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveToStorage(ctx: ScoringContext) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      useCaseKey: ctx.useCaseKey,
      useCaseLabel: ctx.useCaseLabel,
      goalKey: ctx.goalKey,
      goalLabel: ctx.goalLabel,
    }));
  } catch {
    // ignore
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

export function buildContextFromKey(useCaseKey: UseCaseKey, goalKey: GoalKey = DEFAULT_GOAL_KEY): ScoringContext {
  const option = USE_CASE_OPTIONS.find(o => o.key === useCaseKey);
  const goal = GOAL_OPTIONS.find(o => o.key === goalKey);
  return {
    useCaseKey,
    useCaseLabel: option?.label ?? useCaseKey,
    goalKey,
    goalLabel: goal?.label ?? goalKey,
  };
}
