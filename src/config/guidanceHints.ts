
export interface GuidanceHint {
  id: string;
  text: string;
  durationMs: number;
  once: boolean;
  enabled: boolean;
}

// ===== CORE FLOW =====
export const GUIDANCE_HINTS: Record<string, GuidanceHint> = {
  after_generate: {
    id: 'after_generate',
    text: "Click 'Score' to compare performance.",
    durationMs: 3200,
    once: false,
    enabled: true,
  },
  after_score: {
    id: 'after_score',
    text: "Now compare your scored versions and choose the strongest one.",
    durationMs: 3200,
    once: false,
    enabled: true,
  },
  after_select: {
    id: 'after_select',
    text: "Want to improve it further? Try a rewrite or voice style.",
    durationMs: 3200,
    once: false,
    enabled: true,
  },
};

export const getHint = (id: string): GuidanceHint | undefined => GUIDANCE_HINTS[id];

export const getAllHints = (): GuidanceHint[] => Object.values(GUIDANCE_HINTS);
