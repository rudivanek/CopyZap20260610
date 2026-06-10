/**
 * Debug logging utility for production
 *
 * Logs are only shown when:
 * - Running in development mode, OR
 * - localStorage has copyzap_debugCompare === "1", OR
 * - URL contains ?debugCompare=1
 *
 * All debug logs are also captured in a buffer for in-app viewing.
 */

function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }

  if (typeof window !== 'undefined') {
    if (localStorage.getItem('copyzap_debugCompare') === '1') {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('debugCompare') === '1';
  }

  return false;
}

function formatArg(arg: any): string {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

const logBuffer: { level: 'log' | 'warn' | 'error'; timestamp: string; message: string }[] = [];

function pushToBuffer(level: 'log' | 'warn' | 'error', args: any[]) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
  const message = args.map(formatArg).join(' ');
  logBuffer.push({ level, timestamp, message });
}

export const debugCompare = {
  log: (...args: any[]) => {
    if (isDebugEnabled()) {
      pushToBuffer('log', args);
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    pushToBuffer('error', args);
    console.error(...args);
  },

  warn: (...args: any[]) => {
    if (isDebugEnabled()) {
      pushToBuffer('warn', args);
      console.warn(...args);
    }
  },

  getLogs: () => [...logBuffer],

  clearLogs: () => {
    logBuffer.length = 0;
  },

  hasLogs: () => logBuffer.length > 0,
};
