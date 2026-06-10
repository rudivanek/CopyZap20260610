/**
 * Bulletproof token tracking functionality (Phase 3: DB-Driven Pricing)
 */
import { User } from '../../types';
import { calculateTokenCost } from './utils';
import {
  calculateCostFromDbPricing,
  calculateCostFromDbPricingAverage
} from '../../utils/pricingResolver';

// Store failed tracking attempts for retry
let failedTrackingQueue: Array<{
  tracking_id: string; // Unique identifier for this tracking attempt
  user_id: string;
  operation_type: string;
  model: string;
  tokens_used: number;
  cost_usd: number;
  session_id?: string;
  attempts: number;
  lastAttempt: number;
  // Phase 3: Token breakdown
  input_tokens_used?: number;
  output_tokens_used?: number;
  reasoning_tokens_used?: number;
  cost_source?: string;
  pricing_row_id?: string | null;
}> = [];

/**
 * Track token usage with bulletproof reliability (Phase 3: Token Breakdown Support)
 * @param user - The user who consumed tokens
 * @param tokenUsage - Total number of tokens consumed
 * @param model - AI model used
 * @param operationType - Type of operation performed
 * @param sessionId - Optional session ID to group related API calls
 * @param retryCount - Current retry attempt (internal use)
 * @param trackingId - Unique tracking ID (internal use)
 * @param tokenBreakdown - Optional token breakdown (input, output, reasoning)
 */
export async function trackTokenUsage(
  user: User,
  tokenUsage: number,
  model: string,
  operationType: string,
  sessionId?: string,
  retryCount: number = 0,
  trackingId?: string,
  tokenBreakdown?: {
    inputTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
  }
): Promise<void> {
  // Recording is now handled server-side in the ai-completion edge function.
  return;
}

/**
 * Retry failed tracking attempts from queue
 * Call this periodically (e.g., every 5 minutes)
 */
export async function retryFailedTracking(): Promise<void> {
  if (failedTrackingQueue.length === 0) return;

  console.log(`🔄 Retrying ${failedTrackingQueue.length} failed tracking attempts...`);

  const currentTime = Date.now();
  const itemsToRetry = failedTrackingQueue.filter(
    item => item.attempts < 5 && (currentTime - item.lastAttempt) > 60000 // Wait 1 minute between retries
  );

  for (const item of itemsToRetry) {
    try {
      await trackTokenUsage(
        { id: item.user_id } as User,
        item.tokens_used,
        item.model,
        item.operation_type,
        item.session_id,
        item.attempts,
        item.tracking_id
      );

      // Remove successful retry from queue
      failedTrackingQueue = failedTrackingQueue.filter(
        queueItem => queueItem.tracking_id !== item.tracking_id
      );

    } catch (error) {
      console.error('Background retry failed for token tracking:', error);
    }
  }

  // Remove items that have failed too many times (over 5 attempts)
  const removedItems = failedTrackingQueue.filter(item => item.attempts >= 5);
  if (removedItems.length > 0) {
    console.warn(`⚠️ Removing ${removedItems.length} token tracking attempts that failed over 5 times`);
    failedTrackingQueue = failedTrackingQueue.filter(item => item.attempts < 5);
  }
}

/**
 * Get failed tracking queue status (for admin monitoring)
 */
export function getTrackingQueueStatus(): {
  queueLength: number;
  oldestFailure: number | null;
  totalFailedTokens: number;
} {
  const totalFailedTokens = failedTrackingQueue.reduce((sum, item) => sum + item.tokens_used, 0);
  const oldestFailure = failedTrackingQueue.length > 0 
    ? Math.min(...failedTrackingQueue.map(item => item.lastAttempt))
    : null;

  return {
    queueLength: failedTrackingQueue.length,
    oldestFailure,
    totalFailedTokens
  };
}

/**
 * Estimate token count for text (rough approximation)
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English
  // This is just for estimation, actual tokens are returned by API
  return Math.ceil(text.length / 4);
}

/**
 * Extract token breakdown from API response usage object (Phase 3)
 *
 * Converts standard LLM API usage objects to our token breakdown format.
 * Supports OpenAI, Anthropic, and custom formats.
 *
 * @param usage - Usage object from API response
 * @returns Token breakdown or undefined if not available
 */
export function extractTokenBreakdown(usage: any): {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
} | undefined {
  if (!usage) return undefined;

  // Check for standard OpenAI format (prompt_tokens, completion_tokens)
  if (usage.prompt_tokens !== undefined && usage.completion_tokens !== undefined) {
    return {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      reasoningTokens: usage.reasoning_tokens || 0
    };
  }

  // Check for Anthropic format (input_tokens, output_tokens)
  if (usage.input_tokens !== undefined && usage.output_tokens !== undefined) {
    return {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens
    };
  }

  // No breakdown available
  return undefined;
}