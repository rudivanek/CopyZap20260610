import type { ClientReportData, ClientReportVersion } from './buildClientReportData';

/**
 * Pre-export audit for the client report.
 *
 * Every defect found during the August review shared one shape: something
 * upstream failed or returned junk, the pipeline shrugged, and a polished-
 * looking report shipped anyway. This module is the opposite of that — it
 * inspects the FINISHED report data and reports what is wrong before the file
 * reaches a client.
 *
 * Deliberate scope for v1: it only READS. It never fixes, never omits and
 * never blocks. The caller shows the issues and the operator decides. That
 * keeps it incapable of breaking an export, and lets us find out whether the
 * checks are accurate before they are ever allowed to change behaviour.
 *
 * Every check here is deterministic. No AI, no judgement calls — a check that
 * can be argued with is a check that gets ignored.
 */

export type AuditSeverity = 'error' | 'warn';

export interface AuditIssue {
  severity: AuditSeverity;
  /** Stable identifier, for filtering/telemetry later. */
  code: string;
  /** Spanish, operator-facing. Names the specific proposal and what to do. */
  message: string;
}

// ── text normalisation ───────────────────────────────────────────────────────

/**
 * Normalise for comparison only — never for display. Collapses whitespace,
 * unifies the several quote and dash characters the model and the crawler use
 * interchangeably, and lowercases. Accents are PRESERVED: the scraped source
 * has them too, and stripping them would mask a real mismatch.
 */
function normalise(text: string): string {
  return String(text || '')
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″«»]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function stripTags(html: string): string {
  return String(html || '').replace(/<[^>]+>/g, ' ');
}

/**
 * Quotes shorter than this are section names, button labels and single words
 * ("Ofertas", "Inicio"). They collide constantly and flagging them would bury
 * the real findings in noise.
 */
const MIN_QUOTE_LENGTH = 25;

/**
 * Pull quoted spans out of report prose. Covers the three forms the narrative
 * and the deep analysis actually produce: <q> tags, angle quotes, and straight
 * or curly quotes inside the strengths/limits bullets.
 */
function extractQuotes(text: string): string[] {
  const out: string[] = [];
  const patterns = [
    /<q>([\s\S]*?)<\/q>/g,
    /«([^»]{2,400})»/g,
    /[“]([^”]{2,400})[”]/g,
    /&#0?39;([^&]{2,400})&#0?39;/g,
    /'([^']{2,400})'/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const q = stripTags(m[1]).trim();
      if (q.length >= MIN_QUOTE_LENGTH) out.push(q);
    }
  }
  return out;
}

/**
 * A quote counts as present when it appears verbatim in the source, OR when
 * the model truncated it with an ellipsis and the leading part appears. Both
 * are honest reproductions; anything else is the model paraphrasing the site
 * inside quotation marks, which is the failure we care about.
 */
function quoteIsInSource(quote: string, source: string): boolean {
  const q = normalise(quote);
  if (!q) return true;
  if (source.includes(q)) return true;
  const truncated = q.replace(/\s*(\.\.\.|…)\s*$/, '').trim();
  if (truncated !== q && truncated.length >= MIN_QUOTE_LENGTH && source.includes(truncated)) {
    return true;
  }
  return false;
}

/** Percentages and multi-digit figures cited as evidence. */
function extractFigures(text: string): string[] {
  const out: string[] = [];
  const re = /\+?\d[\d.,]*\s*%|\b\d{2,3}(?:[.,]\d+)?\s*%/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0]);
  return out;
}

function figureIsInSource(figure: string, source: string): boolean {
  // Compare on digits alone: "9.2 %", "9,2%" and "9.2%" are the same claim.
  const digits = figure.replace(/[^\d]/g, '');
  if (digits.length < 2) return true;
  return source.replace(/[^\d]/g, '').includes(digits);
}

function shortLabel(v: ClientReportVersion): string {
  return v.displayName || v.shortName || v.key;
}

/** Word→number, to check the spelled-out heading against the real count. */
const NUMBER_WORDS: Record<string, number> = {
  una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10,
};

// ── the audit ────────────────────────────────────────────────────────────────

/**
 * @param data       the finished report data, exactly as the renderer receives it
 * @param sourceText every piece of copy the report is allowed to quote — the
 *                   scraped baseline plus the generated proposals, joined
 */
export function auditReportData(data: ClientReportData, sourceText: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const add = (severity: AuditSeverity, code: string, message: string) =>
    issues.push({ severity, code, message });

  const source = normalise(sourceText);
  const haveSource = source.length > 200;

  // 1 ── Executive summary. The narrative call failing silently produced a
  // report with no summary and generic findings (August, PhixWave).
  if (!data.executiveSummary?.length) {
    add('error', 'no-summary',
      'Falta el resumen ejecutivo. La llamada de narrativa falló — vuelve a exportar para reintentarla.');
  }

  if (!data.findings?.length) {
    add('error', 'no-findings', 'El reporte no tiene hallazgos prioritarios.');
  }

  const shown = (data.versions || []).filter(v => v.isShownInFull);

  for (const v of shown) {
    // 2 ── The "Sin observaciones destacadas" panel: a failed deep analysis
    // cached as if it were valid.
    if (!v.strengths?.length && !v.improvements?.length) {
      add('error', 'version-sin-analisis',
        `${shortLabel(v)} no tiene fortalezas ni límites. Pulsa «Retry analysis» en esa propuesta y vuelve a exportar.`);
    }

    // 3 ── A version developed in full with no copy to show.
    const withText = (v.sections || []).filter(s => s.text && s.text.trim());
    if (!v.isBaseline && !withText.length) {
      add('error', 'version-sin-texto',
        `${shortLabel(v)} se muestra como sección completa pero no tiene texto de copy.`);
    }

    // 4 ── Hero typography is capped at the first paragraph, but a hero block
    // holding the entire proposal still means the splitter found no structure
    // (Sales Boost: 27 paragraphs in one hero).
    for (const s of v.sections || []) {
      if (!s.isHero) continue;
      const paras = String(s.text || '').split(/\n\s*\n/).filter(p => p.trim());
      if (paras.length > 2) {
        add('warn', 'hero-largo',
          `${shortLabel(v)}: el bloque de apertura tiene ${paras.length} párrafos — el separador no encontró estructura en este copy.`);
      }
    }

    // 5 ── A single paragraph this long is concatenated crawler output, not
    // prose someone wrote.
    for (const s of v.sections || []) {
      for (const p of String(s.text || '').split(/\n\s*\n/)) {
        if (p.trim().length > 700) {
          add('warn', 'parrafo-largo',
            `${shortLabel(v)}: hay un párrafo de ${p.trim().length} caracteres — probablemente texto concatenado por el rastreador.`);
          break;
        }
      }
    }
  }

  // 6 ── Spelled-out counts in the headings against the real number of items.
  const headingCount = (word: string) => NUMBER_WORDS[normalise(word)];
  const fw = headingCount(data.findingsCountWord || '');
  if (fw !== undefined && data.findings && fw !== data.findings.length) {
    add('error', 'conteo-hallazgos',
      `El encabezado dice «${data.findingsCountWord}» pero hay ${data.findings.length} hallazgos.`);
  }
  const rw = headingCount(data.roadmapCountWord || '');
  if (rw !== undefined && data.roadmap && rw !== data.roadmap.length) {
    add('error', 'conteo-hoja-ruta',
      `El encabezado dice «${data.roadmapCountWord}» pero hay ${data.roadmap.length} mejoras.`);
  }

  // 7 ── The pitch only works if the winner beats the baseline.
  if (data.journey && data.journey.winner <= data.journey.baseline) {
    add('error', 'ganadora-no-supera',
      `La propuesta ganadora (${data.journey.winner}) no supera tu copy actual (${data.journey.baseline}).`);
  }

  // 8 ── Quotes and figures must appear in the copy the report is describing.
  // This is the check that protects against the failure that actually loses a
  // client: an invented quotation or statistic about their own website.
  if (haveSource) {
    // ONLY prose that claims to describe copy that already exists.
    //
    // Improvements and roadmap items are deliberately excluded: they quote
    // text the model is PROPOSING, not reproducing — "tasa de entrega superior
    // al 98%", "latencia promedio de X ms", "gestionamos 3x más volumen" are
    // invented examples, and they can never appear in the source. Checking
    // them would fire on every report and the audit would be ignored within a
    // week. The executive summary, the findings and the strengths all describe
    // what is there, so a quotation in them must be reproducible.
    const prose: string[] = [];
    for (const p of data.executiveSummary || []) prose.push(p);
    for (const f of data.findings || []) prose.push(f.title || '', f.bodyHtml || '');
    for (const v of shown) {
      for (const s of v.strengths || []) prose.push(s);
    }

    const seenQuote = new Set<string>();
    const seenFigure = new Set<string>();

    for (const chunk of prose) {
      for (const q of extractQuotes(chunk)) {
        const key = normalise(q);
        if (seenQuote.has(key)) continue;
        seenQuote.add(key);
        if (!quoteIsInSource(q, source)) {
          const preview = q.length > 90 ? q.slice(0, 90) + '…' : q;
          // WARN, not error, on purpose. A dry run over the shipped reports
          // showed the model sometimes re-inflects an honest quotation
          // ("reconocido" for "Reconocidos"), which trips exact matching. Until
          // the real false-positive rate is measured on live exports — where
          // sourceText holds the COMPLETE copy, not the paywalled excerpt —
          // this stays advisory. Promote to 'error' once it proves accurate.
          add('warn', 'cita-no-encontrada',
            `Revisa esta cita, no aparece literal en el texto analizado: «${preview}»`);
        }
      }
      for (const fig of extractFigures(stripTags(chunk))) {
        if (seenFigure.has(fig)) continue;
        seenFigure.add(fig);
        if (!figureIsInSource(fig, source)) {
          add('warn', 'cifra-no-encontrada',
            `Cifra citada que no aparece en el texto analizado: ${fig}`);
        }
      }
    }
  }

  return issues;
}

/** Operator-facing summary for the confirm dialog. */
export function formatAuditIssues(issues: AuditIssue[]): string {
  const errors = issues.filter(i => i.severity === 'error');
  const warns = issues.filter(i => i.severity === 'warn');
  const lines: string[] = [];
  if (errors.length) {
    lines.push(`${errors.length} ${errors.length === 1 ? 'problema serio' : 'problemas serios'}:`);
    for (const e of errors) lines.push(`  • ${e.message}`);
  }
  if (warns.length) {
    if (lines.length) lines.push('');
    lines.push(`${warns.length} ${warns.length === 1 ? 'aviso' : 'avisos'}:`);
    for (const w of warns) lines.push(`  • ${w.message}`);
  }
  return lines.join('\n');
}