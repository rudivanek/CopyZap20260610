import { ScoringContext, UseCaseKey } from '../types';

export const LS_KEY = 'copyzap_scoring_context_v1';
export const DEFAULT_USE_CASE_KEY: UseCaseKey = 'hero_section';

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

export function loadFromStorage(): { useCaseKey: UseCaseKey; useCaseLabel: string } | null {
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
    localStorage.setItem(LS_KEY, JSON.stringify({ useCaseKey: ctx.useCaseKey, useCaseLabel: ctx.useCaseLabel }));
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

export function buildContextFromKey(useCaseKey: UseCaseKey): ScoringContext {
  const option = USE_CASE_OPTIONS.find(o => o.key === useCaseKey);
  return {
    useCaseKey,
    useCaseLabel: option?.label ?? useCaseKey,
  };
}
