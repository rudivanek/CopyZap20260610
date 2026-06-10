/**
 * Performance Trace Utility
 *
 * Tracks timing and data metrics for Dashboard data loading operations.
 * Provides both console logging and in-memory storage for debugging.
 *
 * GATING: Performance traces are only logged when:
 * - URL contains ?perf=1 query parameter, OR
 * - NODE_ENV is 'development'
 *
 * This prevents console spam in production.
 */

// Check if performance tracing is enabled
const isPerfTracingEnabled = (): boolean => {
  // Check URL param ?perf=1
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('perf') === '1') {
      return true;
    }
  }

  // Check if in development mode
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

export interface TraceEntry {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  rowCount?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface TraceSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  trigger: string; // e.g., "dashboard-mount", "tab-switch", "refresh"
  entries: TraceEntry[];
}

class PerformanceTracer {
  private currentSession: TraceSession | null = null;
  private sessions: TraceSession[] = [];
  private maxSessions = 5; // Keep last 5 traces
  private enabled: boolean = false;

  constructor() {
    // Cache enabled state on construction
    this.enabled = isPerfTracingEnabled();
  }

  startSession(trigger: string): string {
    const sessionId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      sessionId,
      startTime: performance.now(),
      trigger,
      entries: []
    };

    if (this.enabled) {
      console.log(`[PERF TRACE] Started session: ${sessionId} (trigger: ${trigger})`);
    }
    return sessionId;
  }

  endSession(sessionId?: string) {
    if (!this.currentSession) return;

    if (sessionId && this.currentSession.sessionId !== sessionId) {
      if (this.enabled) {
        console.warn(`[PERF TRACE] Session ID mismatch: expected ${sessionId}, got ${this.currentSession.sessionId}`);
      }
      return;
    }

    this.currentSession.endTime = performance.now();
    this.currentSession.totalDuration = this.currentSession.endTime - this.currentSession.startTime;

    // Store completed session
    this.sessions.unshift(this.currentSession);
    if (this.sessions.length > this.maxSessions) {
      this.sessions.pop();
    }

    // Log summary only if enabled
    if (this.enabled) {
      const summary = this.currentSession.entries.map(e => ({
        op: e.operation,
        ms: Math.round(e.duration),
        rows: e.rowCount ?? 'N/A'
      }));

      console.log(`[PERF TRACE] ✓ Session completed: ${this.currentSession.sessionId}`);
      console.log(`[PERF TRACE] Total duration: ${Math.round(this.currentSession.totalDuration)}ms`);
      console.table(summary);
    }

    this.currentSession = null;
  }

  async trace<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: { metadata?: Record<string, unknown> }
  ): Promise<T> {
    if (!this.currentSession) {
      if (this.enabled) {
        console.warn(`[PERF TRACE] No active session for operation: ${operation}`);
      }
      return fn(); // Execute without tracing
    }

    const startTime = performance.now();
    if (this.enabled) {
      console.log(`[PERF TRACE] → ${operation} starting...`);
    }

    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Try to extract row count from result
      let rowCount: number | undefined;
      if (result && typeof result === 'object') {
        if ('data' in result && Array.isArray((result as any).data)) {
          rowCount = (result as any).data.length;
        } else if (Array.isArray(result)) {
          rowCount = result.length;
        }
      }

      const entry: TraceEntry = {
        operation,
        startTime,
        endTime,
        duration,
        rowCount,
        metadata: options?.metadata
      };

      this.currentSession.entries.push(entry);

      if (this.enabled) {
        console.log(
          `[PERF TRACE] ✓ ${operation} completed in ${Math.round(duration)}ms` +
          (rowCount !== undefined ? ` (${rowCount} rows)` : '')
        );
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const entry: TraceEntry = {
        operation,
        startTime,
        endTime,
        duration,
        error: error instanceof Error ? error.message : String(error),
        metadata: options?.metadata
      };

      this.currentSession.entries.push(entry);

      if (this.enabled) {
        console.error(
          `[PERF TRACE] ✗ ${operation} failed in ${Math.round(duration)}ms:`,
          error
        );
      }

      throw error;
    }
  }

  getLastSession(): TraceSession | null {
    return this.sessions[0] || null;
  }

  getAllSessions(): TraceSession[] {
    return [...this.sessions];
  }

  clearSessions() {
    this.sessions = [];
    this.currentSession = null;
  }
}

// Global singleton instance
export const performanceTracer = new PerformanceTracer();

// Convenience exports
export const startTrace = (trigger: string) => performanceTracer.startSession(trigger);
export const endTrace = (sessionId?: string) => performanceTracer.endSession(sessionId);
export const trace = <T>(operation: string, fn: () => Promise<T>, options?: { metadata?: Record<string, unknown> }) =>
  performanceTracer.trace(operation, fn, options);
