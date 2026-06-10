/**
 * Debug Auto-Apply Utility
 *
 * Provides structured logging for all auto-apply events in Copy Maker Form.
 * Enable via URL query parameter: ?debugAutoApply=1
 *
 * Usage:
 *   import { logAutoApply, isDebugAutoApplyEnabled } from '@/utils/debugAutoApply';
 *
 *   if (isDebugAutoApplyEnabled()) {
 *     logAutoApply({
 *       ruleId: "CM-AUTO-001",
 *       target: "mode",
 *       before: "standard",
 *       after: "advanced",
 *       source: "template_load",
 *       context: { templateId: "123", templateName: "Blog Post" }
 *     });
 *   }
 */

export interface AutoApplyEvent {
  ruleId: string;
  target: 'mode' | 'accordion' | 'field' | 'tab' | 'session' | string;
  before?: any;
  after?: any;
  source: string;
  context?: Record<string, any>;
  timestamp?: number;
}

/**
 * Check if debug auto-apply logging is enabled via URL parameter
 */
export function isDebugAutoApplyEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.get('debugAutoApply') === '1';
}

/**
 * Log an auto-apply event with structured data
 */
export function logAutoApply(event: AutoApplyEvent): void {
  if (!isDebugAutoApplyEnabled()) return;

  const enrichedEvent: AutoApplyEvent = {
    ...event,
    timestamp: Date.now()
  };

  // Use a distinctive emoji prefix for easy filtering in console
  console.log('🔄 [AutoApply]', enrichedEvent);

  // Also log to a global array for inspection
  if (typeof window !== 'undefined') {
    if (!(window as any).__autoApplyEvents) {
      (window as any).__autoApplyEvents = [];
    }
    (window as any).__autoApplyEvents.push(enrichedEvent);
  }
}

/**
 * Get all logged auto-apply events (for inspection in console)
 */
export function getAutoApplyEvents(): AutoApplyEvent[] {
  if (typeof window === 'undefined') return [];
  return (window as any).__autoApplyEvents || [];
}

/**
 * Clear all logged events
 */
export function clearAutoApplyEvents(): void {
  if (typeof window !== 'undefined') {
    (window as any).__autoApplyEvents = [];
  }
}

/**
 * Export events as JSON for analysis
 */
export function exportAutoApplyEvents(): string {
  return JSON.stringify(getAutoApplyEvents(), null, 2);
}
