/**
 * Session Contract - Shared utilities for session lifecycle management
 *
 * This module provides standardized utilities for:
 * - Session name sanitization and formatting
 * - Intent context comparison for session reset decisions
 * - Session reset reason tracking
 */

export type SessionResetReason =
  | 'mode-change'
  | 'platform-change'
  | 'output-type-change'
  | 'project-change'
  | 'clear'
  | 'unmount'
  | 'context-change'
  | 'preset-change';

export interface CopyMakerIntentContext {
  feature: 'copy-maker';
  outputType?: string;
  projectDescription?: string;
  customerId?: string;
}

export interface CopySnapIntentContext {
  feature: 'copysnap';
  mode: 'improve' | 'answer' | 'question';
  platform?: string;
  preset?: string;
}

export type IntentContext = CopyMakerIntentContext | CopySnapIntentContext;

/**
 * Sanitizes a session name for storage
 * - Trims whitespace
 * - Replaces newlines/tabs with single spaces
 * - Collapses multiple spaces
 * - Truncates to maxLen and appends "…" if needed
 *
 * @param name - Raw session name
 * @param maxLen - Maximum length (default 100)
 * @returns Sanitized session name
 */
export function sanitizeSessionName(name: string, maxLen: number = 100): string {
  if (!name || typeof name !== 'string') {
    return 'Untitled Session';
  }

  // Trim and replace newlines/tabs with single space
  let cleaned = name.trim().replace(/[\n\r\t]+/g, ' ');

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Truncate if needed
  if (cleaned.length > maxLen) {
    return cleaned.substring(0, maxLen - 1) + '…';
  }

  return cleaned || 'Untitled Session';
}

/**
 * Determines if a session should be reset based on intent context changes
 *
 * @param prevContext - Previous intent context (or null if no previous session)
 * @param nextContext - Next intent context
 * @returns true if session should be reset, false if can reuse
 */
export function shouldResetSession(
  prevContext: IntentContext | null,
  nextContext: IntentContext
): boolean {
  // No previous context = create new session
  if (!prevContext) {
    return true;
  }

  // Different features = always reset
  if (prevContext.feature !== nextContext.feature) {
    return true;
  }

  // Feature-specific comparisons
  if (prevContext.feature === 'copy-maker' && nextContext.feature === 'copy-maker') {
    return shouldResetCopyMakerSession(prevContext, nextContext);
  }

  if (prevContext.feature === 'copysnap' && nextContext.feature === 'copysnap') {
    return shouldResetCopySnapSession(prevContext, nextContext);
  }

  return false;
}

/**
 * Copy Maker specific session reset logic
 */
function shouldResetCopyMakerSession(
  prev: CopyMakerIntentContext,
  next: CopyMakerIntentContext
): boolean {
  // Output type changed
  const prevOutputType = (prev.outputType || '').trim();
  const nextOutputType = (next.outputType || '').trim();
  if (prevOutputType !== nextOutputType) {
    return true;
  }

  // Project description changed materially
  const prevDesc = (prev.projectDescription || '').trim();
  const nextDesc = (next.projectDescription || '').trim();
  if (prevDesc !== nextDesc) {
    return true;
  }

  // Customer changed
  const prevCustomer = (prev.customerId || '').trim();
  const nextCustomer = (next.customerId || '').trim();
  if (prevCustomer !== nextCustomer) {
    return true;
  }

  return false;
}

/**
 * CopySnap specific session reset logic
 */
function shouldResetCopySnapSession(
  prev: CopySnapIntentContext,
  next: CopySnapIntentContext
): boolean {
  // Mode changed
  if (prev.mode !== next.mode) {
    return true;
  }

  // Platform changed (only relevant for improve mode)
  if (next.mode === 'improve') {
    const prevPlatform = (prev.platform || '').trim();
    const nextPlatform = (next.platform || '').trim();
    if (prevPlatform !== nextPlatform) {
      return true;
    }
  }

  // Preset changed (goal/style/type)
  const prevPreset = (prev.preset || '').trim();
  const nextPreset = (next.preset || '').trim();
  if (prevPreset !== nextPreset) {
    return true;
  }

  return false;
}

/**
 * Get human-readable description of reset reason
 */
export function getResetReasonDescription(reason: SessionResetReason): string {
  const descriptions: Record<SessionResetReason, string> = {
    'mode-change': 'Mode changed',
    'platform-change': 'Platform changed',
    'output-type-change': 'Output type changed',
    'project-change': 'Project description changed',
    'clear': 'User cleared form',
    'unmount': 'Component unmounted',
    'context-change': 'Intent context changed',
    'preset-change': 'Preset changed'
  };

  return descriptions[reason] || 'Unknown reason';
}
