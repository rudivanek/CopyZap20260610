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
import type { QuickRunResult } from './runQuickPipeline';

const TABLE = 'pmc_saved_outputs';
export const QUICK_TAG = 'quick-app';
const TITLE_MAX_CHARS = 120;
const BRIEF_PIECE_MAX_CHARS = 160;

/** One line of the History list. Light: no copy, no scores per version. */
export interface QuickHistoryEntry {
  id: string;
  title: string;
  goalKey: string | null;
  /** For the goal "Other": the user's own words. Null for the five fixed goals. */
  goalLabel: string | null;
  score: number | null;
  originalScore: number | null;
  /** Host of the page the copy was fetched from; null for pasted copy. */
  sourceHost: string | null;
  createdAt: string;
  /** The run's session: its usage rows carry it, so its credits can be summed. Null for old entries. */
  sessionId: string | null;
  /** First line of the brief the copy was written from (the "What you need" field),
   *  truncated for the list. Null for runs that did not start from a brief. */
  briefPiece: string | null;
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
  /** The brief the copy was written from. Absent for pasted or fetched copy. */
  briefRecord?: QuickRunResult['briefRecord'];
  /** The kept parts' text. Absent in entries saved before versions could be changed. */
  keptTexts?: string[];
  /** The user's decisions about claims in the best version (see claimReview.ts). Absent when none were found or asked. */
  claimReview?: QuickRunResult['claimReview'];
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
    ...(result.claimReview ? { claimReview: result.claimReview } : {}),
    ...(result.source ? { source: result.source } : {}),
    ...(result.briefRecord ? { briefRecord: result.briefRecord } : {}),
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
        title: cleanTitle(deriveQuickLabel(result.formState.originalCopy || '')),
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
      'id, title, created_at, goal_key:output_data->quick->>goalKey, goal_label:input_data->>quickGoalLabel, winner_score:output_data->quick->>winnerScore, original_score:output_data->quick->>originalScore, source_host:output_data->quick->source->>host, brief_piece:output_data->quick->briefRecord->fields->0->>value, session_id'
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
    goalLabel: typeof row.goal_label === 'string' && row.goal_label ? row.goal_label : null,
    score: toNumber(row.winner_score),
    originalScore: toNumber(row.original_score),
    sourceHost: typeof row.source_host === 'string' && row.source_host ? row.source_host : null,
    briefPiece: typeof row.brief_piece === 'string' && row.brief_piece ? row.brief_piece.slice(0, BRIEF_PIECE_MAX_CHARS) : null,
    createdAt: String(row.created_at ?? ''),
    sessionId: typeof row.session_id === 'string' && row.session_id ? row.session_id : null,
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
    ...(quick.claimReview && typeof quick.claimReview.versionId === 'string' && Array.isArray(quick.claimReview.decisions)
      ? { claimReview: quick.claimReview }
      : {}),
    ...(quick.source && typeof quick.source.url === 'string' && typeof quick.source.host === 'string'
      ? { source: { url: quick.source.url, host: quick.source.host } }
      : {}),
    ...(quick.briefRecord && Array.isArray(quick.briefRecord.fields) && typeof quick.briefRecord.draft === 'string'
      ? {
          briefRecord: {
            fields: quick.briefRecord.fields.filter(
              (field): field is { label: string; value: string } =>
                !!field && typeof field.label === 'string' && typeof field.value === 'string'
            ),
            website: typeof quick.briefRecord.website === 'string' ? quick.briefRecord.website : undefined,
            websiteRead: typeof quick.briefRecord.websiteRead === 'boolean' ? quick.briefRecord.websiteRead : undefined,
            draft: quick.briefRecord.draft,
            editedBeforeScoring: quick.briefRecord.editedBeforeScoring === true,
            metaDescription: typeof quick.briefRecord.metaDescription === 'string' && quick.briefRecord.metaDescription ? quick.briefRecord.metaDescription : undefined,
            shapeNote: typeof quick.briefRecord.shapeNote === 'string' && quick.briefRecord.shapeNote ? quick.briefRecord.shapeNote : undefined,
          },
        }
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

/**
 * Admin only: lists another user's Quick history (same shape as listQuickResults).
 * Backed by the SECURITY DEFINER RPC admin_list_user_quick_results, which calls
 * is_app_admin() and raises if the caller is not an admin. Read-only: nothing is
 * written to the other user's rows.
 */
export async function adminListQuickResults(userId: string): Promise<QuickHistoryEntry[]> {
  const { data, error } = await supabase.rpc('admin_list_user_quick_results', { p_user_id: userId });
  if (error) throw new Error(error.message || 'History could not be loaded.');
  return ((data as Record<string, unknown>[] | null) ?? []).map(row => ({
    id: String(row.id),
    title: cleanTitle(String(row.title ?? '')),
    goalKey: typeof row.goal_key === 'string' && row.goal_key ? row.goal_key : null,
    goalLabel: typeof row.goal_label === 'string' && row.goal_label ? row.goal_label : null,
    score: toHistoryNumber(row.winner_score),
    originalScore: toHistoryNumber(row.original_score),
    sourceHost: typeof row.source_host === 'string' && row.source_host ? row.source_host : null,
    briefPiece: typeof row.brief_piece === 'string' && row.brief_piece ? row.brief_piece.slice(0, BRIEF_PIECE_MAX_CHARS) : null,
    createdAt: String(row.created_at ?? ''),
    sessionId: row.session_id != null ? String(row.session_id) : null,
  }));
}

/** Admin only: opens another user's saved run in full. Read-only. */
export async function adminLoadQuickResult(id: string): Promise<LoadedQuickResult | null> {
  const { data, error } = await supabase.rpc('admin_load_quick_result', { p_result_id: id });
  if (error) throw new Error(error.message || 'The result could not be opened.');
  return rowToQuickResult(data as Record<string, unknown> | null);
}

function toHistoryNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value !== '' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}
