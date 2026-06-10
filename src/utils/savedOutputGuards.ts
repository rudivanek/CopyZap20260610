/**
 * Runtime guards for SavedOutput data contract enforcement
 *
 * These guards detect when code tries to use SavedOutputMeta (metadata only)
 * as SavedOutputDetail (full record with input_data/output_data).
 *
 * In DEV mode: logs warning and auto-fetches detail
 * In PROD mode: silently auto-fetches detail
 *
 * This prevents regressions where new code accidentally tries to access
 * heavy fields that aren't included in list queries.
 */

import { SavedOutputMeta, SavedOutputDetail } from '../types';
import { getSavedOutputDetail } from '../services/supabaseClient';

/**
 * Safe hasOwnProperty check
 */
function hasOwn(obj: any, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Type guard to check if a record has full detail
 *
 * Returns TRUE only if:
 * - Record has own properties 'input_data' and 'output_data'
 * - AND both are not null/undefined
 *
 * This prevents false positives when fields exist but are null/empty.
 */
export function isSavedOutputDetail(output: SavedOutputMeta | SavedOutputDetail): output is SavedOutputDetail {
  if (!output || typeof output !== 'object') return false;

  return (
    hasOwn(output, 'input_data') &&
    hasOwn(output, 'output_data') &&
    output.input_data != null &&
    output.output_data != null
  );
}

/**
 * Type guard to check if a record is metadata-only (no full detail)
 */
export function isSavedOutputMeta(output: SavedOutputMeta | SavedOutputDetail): output is SavedOutputMeta {
  return !isSavedOutputDetail(output);
}

/**
 * Ensures a saved output has full detail, fetching if necessary
 *
 * Usage:
 * ```ts
 * // Before rendering a saved output that needs input_data/output_data:
 * const fullOutput = await ensureSavedOutputDetail(savedOutput);
 * // Now fullOutput.input_data and fullOutput.output_data are guaranteed to exist
 * ```
 *
 * @param output - SavedOutputMeta or SavedOutputDetail
 * @returns SavedOutputDetail with input_data and output_data
 * @throws Error if detail fetch fails
 */
export async function ensureSavedOutputDetail(
  output: SavedOutputMeta | SavedOutputDetail
): Promise<SavedOutputDetail> {
  // Already has full detail
  if (isSavedOutputDetail(output)) {
    return output;
  }

  // Missing detail - fetch it
  if (import.meta.env.DEV) {
    console.warn(
      '[SavedOutput Guard] Detected SavedOutputMeta being used where SavedOutputDetail is needed.',
      'Automatically fetching full detail for output:', output.id,
      '\nStack trace:', new Error().stack
    );
  }

  const { data, error } = await getSavedOutputDetail(output.id);

  if (error || !data) {
    const errorMsg = `Failed to fetch full saved output detail for ${output.id}: ${error?.message || 'Unknown error'}`;
    console.error('[SavedOutput Guard]', errorMsg);
    throw new Error(errorMsg);
  }

  if (!isSavedOutputDetail(data)) {
    const errorMsg = `Fetched saved output ${output.id} but it still lacks input_data or output_data!`;
    console.error('[SavedOutput Guard]', errorMsg, data);
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Development-only assertion that a saved output has full detail
 *
 * Use this at the start of functions that render/process saved outputs to catch bugs early.
 *
 * Usage:
 * ```ts
 * function renderSavedOutput(output: SavedOutputDetail) {
 *   assertSavedOutputDetail(output); // Throws in DEV if output lacks detail
 *   // Safe to access output.input_data and output.output_data
 * }
 * ```
 *
 * @param output - Should be SavedOutputDetail
 * @throws Error in DEV mode if output lacks input_data or output_data
 */
export function assertSavedOutputDetail(output: SavedOutputMeta | SavedOutputDetail): asserts output is SavedOutputDetail {
  if (!import.meta.env.DEV) return; // Only check in dev mode

  if (!isSavedOutputDetail(output)) {
    const error = new Error(
      `[SavedOutput Guard] Expected SavedOutputDetail but received SavedOutputMeta!\n` +
      `Output ${output.id} is missing input_data or output_data.\n` +
      `This likely means:\n` +
      `  1. You're trying to render a saved output from a list query (getUserSavedOutputsMeta)\n` +
      `  2. You forgot to call getSavedOutputDetail() before rendering\n` +
      `\nFix: Call ensureSavedOutputDetail(output) or getSavedOutputDetail(output.id) first.`
    );
    console.error(error.message);
    throw error;
  }
}

/**
 * Helper to safely access input_data with fallback
 *
 * Use when you want to gracefully handle missing input_data in shared code.
 * Logs warning in DEV mode if input_data is missing.
 *
 * @param output - SavedOutputMeta or SavedOutputDetail
 * @param fallback - Value to return if input_data is missing
 * @returns input_data or fallback
 */
export function getInputDataSafe<T = any>(
  output: SavedOutputMeta | SavedOutputDetail,
  fallback: T = {} as T
): T {
  const detail = output as SavedOutputDetail;

  if (!hasOwn(detail, 'input_data') || detail.input_data == null) {
    if (import.meta.env.DEV) {
      console.warn(
        '[SavedOutput Guard] Attempted to access input_data on SavedOutputMeta.',
        'Output:', output.id,
        'Using fallback:', fallback
      );
    }
    return fallback;
  }

  return detail.input_data as T;
}

/**
 * Helper to safely access output_data with fallback
 *
 * Use when you want to gracefully handle missing output_data in shared code.
 * Logs warning in DEV mode if output_data is missing.
 *
 * @param output - SavedOutputMeta or SavedOutputDetail
 * @param fallback - Value to return if output_data is missing
 * @returns output_data or fallback
 */
export function getOutputDataSafe<T = any>(
  output: SavedOutputMeta | SavedOutputDetail,
  fallback: T = {} as T
): T {
  const detail = output as SavedOutputDetail;

  if (!hasOwn(detail, 'output_data') || detail.output_data == null) {
    if (import.meta.env.DEV) {
      console.warn(
        '[SavedOutput Guard] Attempted to access output_data on SavedOutputMeta.',
        'Output:', output.id,
        'Using fallback:', fallback
      );
    }
    return fallback;
  }

  return detail.output_data as T;
}

/**
 * Development helper: Log summary of a saved output's data availability
 *
 * Useful for debugging data flow issues.
 *
 * Usage:
 * ```ts
 * logSavedOutputSummary(output, 'After fetching from API');
 * ```
 */
export function logSavedOutputSummary(output: SavedOutputMeta | SavedOutputDetail, context: string = '') {
  if (!import.meta.env.DEV) return;

  const detail = output as SavedOutputDetail;
  const hasInputData = hasOwn(detail, 'input_data') && detail.input_data != null;
  const hasOutputData = hasOwn(detail, 'output_data') && detail.output_data != null;
  const type = isSavedOutputDetail(output) ? 'SavedOutputDetail' : 'SavedOutputMeta';

  console.log(
    `[SavedOutput Summary] ${context}`,
    `\n  Type: ${type}`,
    `\n  ID: ${output.id}`,
    `\n  Title: ${output.title}`,
    `\n  Has input_data: ${hasInputData}`,
    `\n  Has output_data: ${hasOutputData}`,
    `\n  Tags: ${output.tags?.join(', ') || 'none'}`,
    `\n  Saved mode: ${output.saved_mode}`,
    output
  );
}
