/**
 * Quick — saving and History.
 *
 * Every finished run is stored as one row in `pmc_saved_outputs`, the table
 * Copy Maker's saved outputs already use, in the same shape
 * (`input_data` = the settings, `output_data` = the result). That keeps one
 * place for saved work and lets a Quick result be opened in Copy Maker.
 *
 * What only Quick needs (winner, scores per version, testimonial and quote
 * findings, run time) sits under `output_data.quick`. Rows written by Quick
 * carry the tag QUICK_TAG, which is how History tells them apart.
 *
 * No database change: the table, its columns and its owner-only access rules
 * exist already.
 */
import { FormState, GeneratedContentItem, GoalKey, User } from '../types';
import { DEFAULT_FORM_STATE } from '../constants';
import { supabase } from '../services/supabaseClient';
import type { ComparisonResult } from '../services/api/comprehensiveScoring';
import type { AbsoluteScoreBreakdown } from '../services/api/absoluteScoring';
import type { GateResult } from '../utils/structuralGate';
import { deriveQuickLabel } from './buildQuickFormState';
import { ORIGINAL_VERSION_ID } from './pickWinner';
import { formatTitle } from './quickFormats';
import type { QuickRunResult } from './runQuickPipeline';

const TABLE = 'pmc_saved_outputs';
export const QUICK_TAG = 'quick-app';
const TITLE_MAX_CHARS = 120;

/** One line of the History list. Light: no copy, no scores per version. */
export interface QuickHistoryEntry {
  id: string;
  title: string;
  goalKey: string | null;
  score: number | null;
  originalScore: number | null;
  /** Host of the page the copy was fetched from; null for pasted copy. */
  sourceHost: string | null;
  createdAt: string;
}

/** What Quick stores next to the result so it can show it again exactly as it was. */
interface QuickExtras {
  version: 1;
  goalKey: GoalKey;
  winnerId: string | null;
  winnerScore: number | null;
  originalScore: number | null;
  scored: boolean;
  absoluteByVersion: Record<string, AbsoluteScoreBreakdown>;
  gateByVersion: Record<string, GateResult>;
  unscoredIds: string[];
  scoringError?: string;
  failedVersions: number;
  testimonials: QuickRunResult['testimonials'];
  quoteFlags: QuickRunResult['quoteFlags'];
  /** Absent in entries saved before parts could be kept or left out. */
  parts?: QuickRunResult['parts'];
  /** The page the copy was fetched from. Absent for pasted copy and for older entries. */
  source?: QuickRunResult['source'];
  /** The kept parts' text. Absent in entries saved before versions could be changed. */
  keptTexts?: string[];
  runSeconds: number | null;
}

export interface LoadedQuickResult {
  id: string;
  title: string;
  result: QuickRunResult;
  runSeconds: number | null;
}

function cleanTitle(title: string): string {
  const text = (title || '').replace(/\s+/g, ' ').trim();
  return (text || 'Untitled copy').slice(0, TITLE_MAX_CHARS);
}

function toRow(result: QuickRunResult, runSeconds: number | null) {
  const { copyResult, ...inputs } = result.formState;
  const scores = result.scores;
  const winnerScore = scores?.winnerId ? scores.absoluteByVersion[scores.winnerId]?.total ?? null : null;
  const originalScore = scores?.absoluteByVersion[ORIGINAL_VERSION_ID]?.total ?? null;

  const quick: QuickExtras = {
    version: 1,
    goalKey: result.goalKey,
    winnerId: scores?.winnerId ?? null,
    winnerScore,
    originalScore,
    scored: !!scores,
    absoluteByVersion: scores?.absoluteByVersion ?? {},
    gateByVersion: scores?.gateByVersion ?? {},
    unscoredIds: scores?.unscoredIds ?? [],
    scoringError: result.scoringError,
    failedVersions: result.failedVersions,
    testimonials: result.testimonials,
    quoteFlags: result.quoteFlags,
    parts: result.parts,
    keptTexts: result.keptTexts,
    ...(result.source ? { source: result.source } : {}),
    runSeconds,
  };

  return {
    input_data: { ...inputs, isLoading: false },
    output_data: {
      improvedCopy: copyResult?.improvedCopy ?? '',
      generatedVersions: result.versions,
      comparisonResult: scores?.comparisonResult ?? null,
      quick,
    },
    session_id: result.formState.sessionId ?? null,
  };
}

/** Stores a finished run and returns the id of its History entry. */
export async function saveQuickResult(result: QuickRunResult, user: User, runSeconds: number | null): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        ...toRow(result, runSeconds),
        user_id: user.id,
        // A format run is named after its format: "Newsletter: <the copy's first heading>".
        title: cleanTitle(formatTitle(result.formState.quickFormat, deriveQuickLabel(result.formState.originalCopy || ''))),
        description: 'Quick',
        tags: [QUICK_TAG],
        saved_mode: 'advanced',
      },
    ])
    .select('id')
    .single();

  if (error || !data?.id) throw new Error(error?.message || 'The result could not be saved.');
  return data.id as string;
}

/** Stores a changed result (for example after scoring again) over its existing entry. The title is kept. */
export async function updateQuickResult(id: string, result: QuickRunResult, runSeconds: number | null): Promise<void> {
  const { error } = await supabase.from(TABLE).update(toRow(result, runSeconds)).eq('id', id);
  if (error) throw new Error(error.message || 'The result could not be saved.');
}

/** The user's Quick results, newest first, without their copy. */
export async function listQuickResults(userId: string, limit = 100): Promise<QuickHistoryEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      'id, title, created_at, goal_key:output_data->quick->>goalKey, winner_score:output_data->quick->>winnerScore, original_score:output_data->quick->>originalScore, source_host:output_data->quick->source->>host'
    )
    .eq('user_id', userId)
    .contains('tags', [QUICK_TAG])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message || 'History could not be loaded.');

  const toNumber = (value: unknown): number | null => {
    const parsed = typeof value === 'number' ? value : typeof value === 'string' && value !== '' ? Number(value) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };

  return ((data as Record<string, unknown>[] | null) ?? []).map(row => ({
    id: String(row.id),
    title: cleanTitle(String(row.title ?? '')),
    goalKey: typeof row.goal_key === 'string' && row.goal_key ? row.goal_key : null,
    score: toNumber(row.winner_score),
    originalScore: toNumber(row.original_score),
    sourceHost: typeof row.source_host === 'string' && row.source_host ? row.source_host : null,
    createdAt: String(row.created_at ?? ''),
  }));
}

/** Rebuilds a stored row into the result the screen shows. Returns null when the row is not a Quick result. */
export function rowToQuickResult(row: Record<string, unknown> | null | undefined): LoadedQuickResult | null {
  if (!row || typeof row !== 'object') return null;
  const output = row.output_data as Record<string, unknown> | null;
  const quick = output?.quick as QuickExtras | undefined;
  const versions = output?.generatedVersions as GeneratedContentItem[] | undefined;
  if (!output || !quick || quick.version !== 1 || !Array.isArray(versions) || versions.length < 2) return null;

  const comparisonResult = (output.comparisonResult as ComparisonResult | null) ?? null;
  const hasScores = quick.scored && !!comparisonResult;

  const formState: FormState = {
    ...DEFAULT_FORM_STATE,
    ...((row.input_data as Partial<FormState> | null) ?? {}),
    isLoading: false,
    copyResult: {
      improvedCopy: (output.improvedCopy as string) ?? '',
      generatedVersions: versions,
      comparisonResult: comparisonResult ?? undefined,
    },
  };

  const result: QuickRunResult = {
    formState,
    versions,
    goalKey: quick.goalKey,
    scores: hasScores
      ? {
          comparisonResult: comparisonResult as ComparisonResult,
          absoluteByVersion: quick.absoluteByVersion ?? {},
          gateByVersion: quick.gateByVersion ?? {},
          winnerId: quick.winnerId ?? null,
          unscoredIds: quick.unscoredIds ?? [],
        }
      : null,
    scoringError: quick.scoringError,
    failedVersions: quick.failedVersions ?? 0,
    testimonials: quick.testimonials ?? { count: 0, movedIds: [] },
    quoteFlags: quick.quoteFlags ?? {},
    parts: quick.parts ?? { kept: 0, leftOut: 0 },
    keptTexts: Array.isArray(quick.keptTexts) ? quick.keptTexts.filter(text => typeof text === 'string') : [],
    ...(quick.source && typeof quick.source.url === 'string' && typeof quick.source.host === 'string'
      ? { source: { url: quick.source.url, host: quick.source.host } }
      : {}),
  };

  return {
    id: String(row.id),
    title: cleanTitle(String(row.title ?? '')),
    result,
    runSeconds: typeof quick.runSeconds === 'number' ? quick.runSeconds : null,
  };
}

/** Loads one saved result in full. Returns null when it does not exist or is not a Quick result. */
export async function loadQuickResult(id: string): Promise<LoadedQuickResult | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message || 'The result could not be opened.');
  return rowToQuickResult(data as Record<string, unknown> | null);
}

export async function renameQuickResult(id: string, title: string): Promise<string> {
  const clean = cleanTitle(title);
  const { error } = await supabase.from(TABLE).update({ title: clean }).eq('id', id);
  if (error) throw new Error(error.message || 'The name could not be changed.');
  return clean;
}

export async function deleteQuickResult(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message || 'The result could not be deleted.');
}
