/**
 * Session-related error types for unified error handling
 */

export class SessionCreationError extends Error {
  public readonly code: string = 'SESSION_CREATION_FAILED';
  public readonly userMessage: string;

  constructor(message?: string, public readonly originalError?: any) {
    super(message || 'Session creation failed');
    this.name = 'SessionCreationError';
    this.userMessage = 'We couldn\'t create a tracking session. Please retry. If the issue persists, contact support.';

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SessionCreationError);
    }
  }
}

/**
 * Check if an error is a SessionCreationError
 */
export function isSessionCreationError(error: any): error is SessionCreationError {
  return error instanceof SessionCreationError || error?.code === 'SESSION_CREATION_FAILED';
}
