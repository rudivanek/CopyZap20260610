/**
 * Quick — the standard report.
 *
 * Uses Copy Maker's formatted HTML report (`exportAsFormattedHtml`) unchanged,
 * so there is one report generator for both interfaces. This file only prepares
 * what Quick hands to it, so that the report tells the same story as the screen:
 *
 *  - the winner is the version Quick shows as best
 *  - versions Quick set aside, or could not score, are not in the report
 *  - when Quick's winner is not the one the comparison step preferred, that
 *    step's written verdict (which is about another version) is left out
 *
 * The report's own text is always English, whatever the copy's language; the
 * report generator decides that for every caller. Quick adds a few rows to the
 * input summary: where the copy came from and what was kept or left out. It
 * also asks for the length of the original and of every version to be shown,
 * as on the result screen.
 *
 * The report code is large, so it is loaded only when a report is exported.
 * When the signed-in account is allowed to brand reports (active bought
 * credits or admin), its own logo, company name and footer line replace all
 * CopyZap branding on the export.
 */
import { FormState, GeneratedContentItem } from '../types';
import type { ComparisonResult } from '../services/api/comprehensiveScoring';
import { deriveQuickLabel } from './buildQuickFormState';
import { effectiveGates } from './gateRules';
import { ORIGINAL_VERSION_ID } from './pickWinner';
import type { QuickRunResult } from './runQuickPipeline';
import { supabase } from '../services/supabaseClient';
import type { ReportBrand } from '../utils/enhancedExports';

export interface QuickReportInput {
  formState: FormState;
  cards: GeneratedContentItem[];
  comparisonResult: ComparisonResult;
  /** Rows added to the report's input summary: the source page and what was kept or left out. */
  extraRows: [string, string][];
}

/** The written verdict of the comparison step. It names one version; it only applies when that version won. */
const VERDICT_FIELDS = ['winnerExplanation', 'finalRecommendation', 'winnerBreakdown', 'decisionLayer'] as const;

export function buildQuickReportInput(result: QuickRunResult, title?: string): QuickReportInput {
  const scores = result.scores;
  if (!scores) throw new Error('This result has no scores yet. Score it before exporting a report.');

  const winnerId = scores.winnerId;
  // Read the structural check the way the screen does (see gateRules.ts).
  const gates = effectiveGates(scores.gateByVersion, result.versions);
  const inReport = (versionId: string): boolean => {
    if (versionId === ORIGINAL_VERSION_ID || versionId === winnerId) return true;
    const gate = gates[versionId];
    const setAside = gate ? !gate.valid : false;
    return !setAside && scores.absoluteByVersion[versionId] !== undefined;
  };

  const source = scores.comparisonResult;
  const rows = source.rows
    .filter(row => inReport(row.versionId))
    .map(row => ({
      ...row,
      isWinner: row.versionId === winnerId,
    }))
    // Quick's best version first: with equal scores the report marks the first
    // row it meets, and that has to be the version the screen shows as best.
    .sort((a, b) => Number(b.isWinner) - Number(a.isWinner));
  const winnerRow = rows.find(row => row.isWinner);

  const comparisonResult = { ...source, rows } as ComparisonResult & Record<string, unknown>;
  if (winnerId && source.winnerVersionId !== winnerId) {
    for (const field of VERDICT_FIELDS) delete comparisonResult[field];
  }
  if (winnerId) {
    comparisonResult.winnerVersionId = winnerId;
    if (winnerRow?.optionLabel) comparisonResult.winnerLabel = winnerRow.optionLabel;
  }

  const extraRows: [string, string][] = [];
  if (result.source?.url) extraRows.push(['Source', result.source.url]);
  if (result.testimonials.count > 0) {
    extraRows.push(['Testimonials', `${result.testimonials.count} kept word for word`]);
  }
  if (result.parts.kept > 0 || result.parts.leftOut > 0) {
    const kept = result.parts.kept === 1 ? '1 kept as it is' : `${result.parts.kept} kept as they are`;
    extraRows.push(['Parts of the page', `${kept}, ${result.parts.leftOut} left out`]);
  }
  // Facts the user added on the check screen: a reader of the report sees where those claims came from.
  const userFacts = result.formState.quickUserFacts ?? [];
  if (userFacts.length > 0) extraRows.push(['Facts you added', userFacts.join(' · ')]);

  return {
    // The report takes its title and file name from the project description.
    formState: {
      ...result.formState,
      projectDescription: (title || deriveQuickLabel(result.formState.originalCopy || '')).trim() || 'CopyZap report',
    },
    cards: result.versions.filter(version => inReport(version.id)),
    comparisonResult,
    extraRows,
  };
}

/**
 * The CopyZap logo of the app (public/copyzap.png) as a data address. The
 * report is one file that is opened and sent on its own, so the logo is put
 * inside it rather than linked. Null when it cannot be read: the report then
 * shows the name as text, as before.
 */
async function logoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/copyzap.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) return null;
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

/** Reads a Blob as a data: URL string. Returns null on any failure. */
function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise<string | null>(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/**
 * The signed-in account's report brand, when it is allowed to brand reports
 * (active bought credits or admin). Null otherwise, so the report keeps the
 * default CopyZap branding.
 */
async function loadReportBrand(): Promise<ReportBrand | null> {
  try {
    const { data } = await supabase.rpc('report_branding_active');
    if (!data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as
      | { company_name: string; footer_line: string | null; logo_url: string | null }
      | null;
    if (!row || !row.company_name) return null;
    return {
      companyName: row.company_name,
      footerLine: row.footer_line ?? null,
      logoUrl: row.logo_url ?? null,
    };
  } catch {
    return null;
  }
}

/** Builds the report and hands it to the browser as an HTML file. */
export async function exportQuickReport(result: QuickRunResult, title?: string): Promise<void> {
  const input = buildQuickReportInput(result, title);
  const { exportAsFormattedHtml } = await import('../utils/enhancedExports');
  const brand = await loadReportBrand();
  // The default CopyZap logo is only needed when no account brand applies.
  const logo = brand ? null : await logoDataUrl();
  exportAsFormattedHtml(
    input.formState,
    input.cards,
    undefined,
    undefined,
    input.comparisonResult,
    undefined,
    undefined,
    undefined,
    undefined,
    input.extraRows,
    true,
    logo ?? undefined,
    brand ?? undefined
  );
}
