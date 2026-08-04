import {
  FormState,
  GeneratedContentItem,
  GeneratedContentItemType,
  StructuredCopyOutput,
  StructuredCopySection,
  VersionDeepAnalysis,
  ComparisonDeepAnalysisMeta,
  SuggestedImprovement,
} from '../../types';
import { ComparisonResult } from '../../services/api/comprehensiveScoring';
import {
  computeWordCountAndReadingLevel,
  computeRiskFactors,
} from '../multiScoreDisplay';
import { stripMarkdown } from '../markdownUtils';

export const SUPPRESS_ZERO_VALUE_NUMERIC_FINDINGS = true;
export const CLIENT_REPORT_PREVIEW_PERCENT = 25;

// Single destination for every CTA in the report (cover, paywall bands,
// roadmap block, final CTA). Change this one constant to repoint them all.
const CTA_CONTACT_URL = 'https://sharpen.studio/contacta-web/';

// Maximum number of proposals rendered as full version sections (heading,
// copy, paywall band, strengths/limits). The winner plus the next
// highest-scoring proposals up to this cap are developed in full; the rest
// appear only as compact rows in the ranking table.
export const MAX_PROPOSALS_SHOWN = 3;

// Card types that represent a real generated copy version. Everything else
// (SEO metadata, FAQ schema, GEO outputs, analysis/comparison cards) is noise
// for this report and is excluded from the version count and the body.
const COPY_VERSION_TYPES = new Set<GeneratedContentItemType>([
  GeneratedContentItemType.Improved,
  GeneratedContentItemType.Alternative,
  GeneratedContentItemType.RestyledImproved,
  GeneratedContentItemType.RestyledAlternative,
  GeneratedContentItemType.Boosted,
]);

function isCopyVersionCard(card: GeneratedContentItem): boolean {
  return COPY_VERSION_TYPES.has(card.type)
    || card.id === '__original__'
    || card.type === GeneratedContentItemType.Original;
}

const STUDIO = {
  name: 'Sharpen.Studio',
  site: 'sharpen.studio',
  email: 'hola@sharpen.studio',
  ctaPrimaryUrl: CTA_CONTACT_URL,
  ctaSecondaryUrl: CTA_CONTACT_URL,
};

// Bilingual section-label map (English + Spanish → Spanish display label).
// Per spec 3.1 rule 4. No regex used to resolve labels — plain object lookup.
const SECTION_LABEL_MAP: Record<string, string> = {
  hero: 'Encabezado',
  encabezado: 'Encabezado',
  headline: 'Encabezado',
  introduction: 'Introducción',
  introduccion: 'Introducción',
  intro: 'Introducción',
  features: 'Características',
  caracteristicas: 'Características',
  benefits: 'Beneficios',
  beneficios: 'Beneficios',
  'how it works': 'Cómo funciona',
  'como funciona': 'Cómo funciona',
  services: 'Servicios',
  servicios: 'Servicios',
  courses: 'Cursos',
  cursos: 'Cursos',
  portfolio: 'Portafolio',
  portafolio: 'Portafolio',
  about: 'Nosotros',
  nosotros: 'Nosotros',
  'case studies': 'Casos de éxito',
  'case study': 'Casos de éxito',
  'casos de éxito': 'Casos de éxito',
  'casos de exito': 'Casos de éxito',
  pricing: 'Precios',
  precios: 'Precios',
  faq: 'Preguntas frecuentes',
  cta: 'Cierre',
  'call to action': 'Cierre',
  cierre: 'Cierre',
  testimonials: 'Testimonios',
  testimonios: 'Testimonios',
  footer: 'Pie',
  pie: 'Pie',
};

// Hints for sections excluded from the analysis (cookie/nav/footer/etc.).
const EXCLUDED_SECTION_HINTS = [
  'testimoni', 'review', 'cookie', 'consent', 'navigation', 'nav', 'menu',
  'breadcrumb', 'footer', 'pie', 'aviso de cookies', 'política de privacidad',
  'politica de privacidad',
];

// ── Types ────────────────────────────────────────────────────────────────────

export interface ClientReportSectionSlice {
  label: string;
  text: string;
  isHero: boolean;
  isFaded: boolean;
}

export interface ClientReportVersion {
  key: string;
  displayName: string;
  roleLine: string;
  isBaseline: boolean;
  isWinner: boolean;
  // Whether this version is developed as a full section (heading, copy,
  // paywall band, strengths/limits). True for the winner + next highest-
  // scoring proposals up to MAX_PROPOSALS_SHOWN, and always for the baseline.
  isShownInFull: boolean;
  isScored: boolean;
  score: number;
  deltaPoints: number | null;
  deltaPercent: number | null;
  editorialQuality: number;
  conversionPotential: number;
  wordCount: number;
  readingLevelEs: string;
  sections: ClientReportSectionSlice[];
  strengths: string[];
  improvements: string[];
  shortName: string;
  sectionKicker: string;
  sectionNumber: number;
  paywallLine: string;
  keptPercent: number;
  strengthsHeading: string;
  improvementsHeading: string;
  rankSubline: string;
}

export interface ClientReportFinding {
  category: string;
  title: string;
  bodyHtml: string;
}

export interface ClientReportRoadmapItem {
  points: number;
  titleHtml: string;
  bodyHtml: string;
}

export interface ClientReportHeadToHead {
  originalHeadline: string;
  originalSub: string;
  originalNote: string;
  winnerHeadline: string;
  winnerSub: string;
  winnerNote: string;
}

export interface ClientReportBrief {
  audience: string;
  keyMessage: string;
  cta: string;
  emotion: string;
  brandValues: string;
  toneLine: string;
  keywords: string[];
  excludedSections: string[];
  excludedSectionsList: string;
}

export interface ClientReportCompany {
  name: string;
  url: string;
  hasUrl: boolean;
  analyzedAt: string;
  analyzedAtLabel: string;
  analyzedAtTimeLabel: string;
  language: string;
}

export interface ClientReportStudio {
  name: string;
  nameWithAccentDot: string;
  site: string;
  email: string;
  ctaPrimaryUrl: string;
  ctaSecondaryUrl: string;
}

// Re-exported so renderers can import the canonical CTA URL from one place.
export { CTA_CONTACT_URL };

export interface ClientReportJourney {
  baseline: number;
  winner: number;
  potential: number;
  winnerDeltaPoints: number;
  winnerDeltaPercent: number;
  versionCount: number;
  proposalCount: number;
}

export interface ClientReportData {
  studio: ClientReportStudio;
  company: ClientReportCompany;
  journey: ClientReportJourney;
  executiveSummary: string[];
  findings: ClientReportFinding[];
  brief: ClientReportBrief;
  headToHead: ClientReportHeadToHead;
  versions: ClientReportVersion[];
  versionsByScore: ClientReportVersion[];
  roadmap: ClientReportRoadmapItem[];
  previewPercent: number;
  findingsCountWord: string;
  roadmapCountWord: string;
  winnerDisplayName: string;
  lastIndex: number;
  // True count of generated copy versions in the session (excludes baseline
  // and SEO/FAQ/GEO noise). The cover stamp reports this so it never
  // undercounts the work done in Copy Maker.
  generatedProposalCount: number;
  // Proposals that have no comparison score. Excluded from the ranking table
  // but surfaced in a note so they are not silently omitted.
  unscoredProposalCount: number;
  // Cap applied to full version sections (mirrors MAX_PROPOSALS_SHOWN).
  maxProposalsShown: number;
}

export interface ClientReportNarrative {
  companyName: string;
  briefEs: {
    audience: string;
    keyMessage: string;
    cta: string;
    emotion: string;
    brandValues: string;
  };
  executiveSummary: string[];
  findings: ClientReportFinding[];
  headToHead: { originalNote: string; winnerNote: string };
  versionLabels: Array<{
    versionId: string;
    displayName: string;
    roleLine: string;
  }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const NUMBER_WORDS = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco',
  'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
];
const NUMBER_WORDS_CAP = [
  'Cero', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco',
  'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Once', 'Doce',
];

function numberWord(n: number, cap = false): string {
  const arr = cap ? NUMBER_WORDS_CAP : NUMBER_WORDS;
  return arr[n] ?? String(n);
}

function stripProtocol(url: string): string {
  return (url || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

// Extract the first http(s) URL found inside an arbitrary text string. Returns ''
// when none is present. Used to pull a URL out of free-text fields like
// projectDescription ("Sitio: https://example.com — consultoría B2B") without
// assuming the whole field is a URL.
function extractFirstUrl(text: string | undefined): string {
  if (!text) return '';
  const match = text.match(/https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/i);
  return match ? match[0] : '';
}

// Resolve the analysed URL via a priority chain (spec 4.2):
//   1. first URL inside formState.projectDescription (extracted, not assumed whole),
//   2. the wizard's analyze-url flow (stored in competitorUrls[0]),
//   3. the first URL appearing in the original copy,
//   4. none — renderer omits the link and rewrites the disclaimer.
// Whichever source wins, the URL is NEVER used as the company name; that is
// resolved separately from og:site_name / <title> / the AI.
function resolveAnalyzedUrl(formState: FormState): string {
  const fromProject = extractFirstUrl(formState.projectDescription);
  if (fromProject) return fromProject;
  const fromWizard = formState.competitorUrls?.[0]?.trim();
  if (fromWizard) return fromWizard;
  const fromOriginal = extractFirstUrl(formState.originalCopy);
  if (fromOriginal) return fromOriginal;
  return '';
}

function slugifyCompany(name: string): string {
  return (name || 'empresa')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'empresa';
}

const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatSpanishDate(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} de ${SPANISH_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatSpanishDateTime(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} de ${SPANISH_MONTHS[d.getMonth()]} de ${d.getFullYear()}, ${hh}:${mm} h`;
}

function readingLevelEs(level: string): string {
  const l = (level || '').toLowerCase();
  if (l === 'advanced' || l === 'avanzado') return 'avanzado';
  if (l === 'medium' || l === 'intermediate' || l === 'intermedio') return 'intermedio';
  if (l === 'easy' || l === 'basic' || l === 'básico' || l === 'basico') return 'básico';
  return 'intermedio';
}

function toneLineFor(formState: FormState): string {
  const tone = formState.tone || 'Profesional';
  const toneEs: Record<string, string> = {
    Professional: 'Profesional cercano',
    Friendly: 'Cercano profesional',
    Bold: 'Directo seguro',
    Creative: 'Creativo profesional',
    Persuasive: 'Persuasivo profesional',
    Minimalist: 'Minimalista claro',
  };
  const toneLabel = toneEs[tone] || tone;
  const wc = formState.wordCount || '';
  let wcLabel = '';
  if (wc.startsWith('Medium')) wcLabel = '100–200 palabras por sección';
  else if (wc.startsWith('Short')) wcLabel = '50–100 palabras por sección';
  else if (wc.startsWith('Long')) wcLabel = '200–400 palabras por sección';
  else if (wc === 'Custom') wcLabel = `${formState.customWordCount ?? ''} palabras por sección`;
  const lang = formState.language === 'Spanish' ? 'español' : (formState.language || 'español').toLowerCase();
  return [toneLabel, wcLabel, lang].filter(Boolean).join(' · ');
}

// ── Content → plain text ─────────────────────────────────────────────────────

function contentToStructured(content: GeneratedContentItem['content']): {
  headline: string;
  sections: StructuredCopySection[];
} {
  if (!content) return { headline: '', sections: [] };
  if (typeof content === 'string') {
    return { headline: '', sections: [{ title: 'Encabezado', content }] };
  }
  if (Array.isArray(content)) {
    return { headline: '', sections: [{ title: 'Encabezado', content: content.join('\n') }] };
  }
  if (typeof content === 'object' && content !== null && 'headline' in content) {
    const s = content as StructuredCopyOutput;
    return { headline: s.headline || '', sections: s.sections || [] };
  }
  if (typeof content === 'object' && content !== null && 'content' in content) {
    return contentToStructured((content as any).content);
  }
  return { headline: '', sections: [] };
}

// Plain text WITHOUT markers (used for word-count, risk-factor, AI input scrubbing).
function contentToPlainText(content: GeneratedContentItem['content']): string {
  const { headline, sections } = contentToStructured(content);
  const parts: string[] = [];
  if (headline) parts.push(stripMarkdown(headline));
  for (const s of sections) {
    if (s.content) parts.push(stripMarkdown(s.content));
    if (s.listItems?.length) parts.push(s.listItems.map(stripMarkdown).join('\n'));
  }
  return parts.filter(Boolean).join('\n\n');
}

// Plain text WITH \n---\n markers and section titles as the first line of each block,
// so splitSections can recover labels for both string and structured content.
function contentToPlainTextWithMarkers(content: GeneratedContentItem['content']): string {
  if (typeof content === 'string') return stripMarkdown(content);
  if (Array.isArray(content)) return content.map(stripMarkdown).join('\n---\n');
  const { headline, sections } = contentToStructured(content);
  const parts: string[] = [];
  if (headline) parts.push(stripMarkdown(headline).trim());
  for (const s of sections) {
    let block = '';
    if (s.title) block += stripMarkdown(s.title).trim() + '\n\n';
    if (s.content) block += stripMarkdown(s.content).trim();
    if (s.listItems?.length) {
      block += (block ? '\n' : '') + s.listItems.map(i => '• ' + stripMarkdown(i).trim()).join('\n');
    }
    if (block.trim()) parts.push(block.trim());
  }
  return parts.join('\n---\n');
}

// Headline and sub from the first kept section's TEXT (label already stripped
// by splitSections), never from the label/headline field (spec, item 3).
function headlineAndSub(content: GeneratedContentItem['content']): { headline: string; sub: string } {
  const plain = contentToPlainTextWithMarkers(content);
  const sections = splitSections(plain).filter(
    s => s.label !== 'Pie' && s.label !== 'Testimonios',
  );
  if (!sections.length) return { headline: '', sub: '' };
  const paras = sections[0].text.split('\n\n').map(p => p.trim()).filter(p => p);
  const headline = paras[0] || '';
  let sub = paras.slice(1, 3).join(' ').trim();
  if (!sub && sections[1]) {
    sub = sections[1].text.split('\n\n')[0].trim();
  }
  return { headline, sub };
}

// ── splitSections — NO regex in the splitting logic (spec 3.1) ────────────────

function splitSections(text: string): { label: string; text: string }[] {
  const parseBlocks = (src: string): { label: string; text: string }[] => {
    if (!src || !src.trim()) return [];
    let blocks = src.split('\n---\n');
    if (blocks.length < 2) blocks = src.split('---');
    if (blocks.length < 2) blocks = src.split('\n\n');
    const result: { label: string; text: string }[] = [];
    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      const lines = trimmed.split('\n');
      const firstLine = lines[0].trim();
      const words = firstLine.split(' ').filter(w => w.length > 0);
      const endsWithPunct =
        firstLine.endsWith('.') || firstLine.endsWith('!') ||
        firstLine.endsWith('?') || firstLine.endsWith(':') ||
        firstLine.endsWith(';');
      let label = '';
      let body = trimmed;
      if (words.length > 0 && words.length <= 4 && firstLine.length > 0 && !endsWithPunct) {
        // Normalize accents so "Introducción" matches the unaccented key
        // "introduccion". Without this, accented section names never resolve,
        // the label stays empty, and the marker line bleeds into the body text.
        const norm = firstLine.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const mapped = SECTION_LABEL_MAP[norm];
        if (mapped) {
          label = mapped;
          body = lines.slice(1).join('\n').trim();
        } else {
          // Treat any short first line without ending punctuation as a section
          // label even when it is not a recognised name (e.g. custom headings
          // like "El Problema Que Nadie Te Dice"). Without this, custom headings
          // stay in the body as plain text, the section renders without a
          // label, and the paywall band falls back to the generic sentence.
          // Title-case the heading as given so it reads as a label, not prose.
          label = titleCase(firstLine);
          body = lines.slice(1).join('\n').trim();
        }
      }
      result.push({ label, text: body });
    }
    return result;
  };

  let sections = parseBlocks(text);

  // Rule 6: never a single section containing the entire copy.
  if (sections.length === 1 && sections[0].text.length > 400) {
    const paragraphs = text.split('\n\n').map(b => b.trim()).filter(b => b);
    if (paragraphs.length > 1) {
      sections = paragraphs.map(p => ({ label: '', text: p }));
    }
  }
  return sections;
}

// Title-case a short heading line: capitalise the first letter of each word,
// preserving the original casing of the rest (so "El Problema Que Nadie Te
// Dice" stays readable rather than being lowercased or ALLCAPS-ed). Used for
// custom section headings that are not in SECTION_LABEL_MAP.
function titleCase(line: string): string {
  return line.split(' ').map(w => w.length ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
}

// ── Zero-value suppression (spec 5) ───────────────────────────────────────────

function looksLikeZeroValueNumeric(text: string): boolean {
  return /(^|[^\d.])(\+\s*0(\.0+)?\s*(%|pts|puntos)?|0(\.0+)?\s*%|0\s*\/\s*\d+)/i.test(text);
}

function suppressZeroFlags(flags: string[]): string[] {
  if (!SUPPRESS_ZERO_VALUE_NUMERIC_FINDINGS) return flags;
  return (flags || []).filter(f => !looksLikeZeroValueNumeric(f));
}

// Strip zero-value numeric tokens from reproduced copy text (spec 5, place 4).
// Also drop orphan bullets: if a bullet line's only numeric value was suppressed,
// the remaining "• label" carries no information, so drop the whole line.
function suppressZeroValuesInText(text: string): string {
  if (!SUPPRESS_ZERO_VALUE_NUMERIC_FINDINGS) return text;
  const suppressed = text
    .replace(/\+\s*0(?:\.0+)?\s*(?:%|pts|puntos|personas|usuarios|clientes|empresas)?/gi, ' ')
    .replace(/\b0(?:\.0+)?\s*%/g, ' ')
    .replace(/\b0(?:\.0+)?\s*\/\s*\d+/g, ' ')
    .replace(/[ \t]{2,}/g, ' ');
  // Drop lines that are just a bullet + label with no remaining digits.
  const lines = suppressed.split('\n');
  const kept = lines.filter(line => {
    const trimmed = line.trim();
    if (/^[•\-*·]\s+/.test(trimmed) && !/\d/.test(trimmed)) return false;
    return true;
  });
  return kept.join('\n').trim();
}

// ── Section slicing — text is REMOVED, not hidden (spec 3) ────────────────────

// Crawls inject noise that becomes very visible once the baseline renders at
// 100%: portfolio entries surface as eleven separate one-line sections, button
// labels ("Cotizar proyecto") become standalone sections, and some sections
// ("Nosotros") carry an empty <p></p>. This pass:
//   1. drops sections whose text is empty/whitespace,
//   2. drops standalone button/nav labels (short, no sentence punctuation),
//   3. merges consecutive short list-like entries into one "Portafolio" section.
function cleanBaselineSections(sections: { label: string; text: string }[]): { label: string; text: string }[] {
  const cleaned = sections.filter(s => s.text.trim().length > 0);

  const out: { label: string; text: string }[] = [];

  // Group consecutive short no-punctuation blocks into runs. A run of ≥2 such
  // blocks (or a single block containing a slash/dash separator) is a
  // portfolio list and gets merged into one "Portafolio" section. An ISOLATED
  // short block with no separator is a button/nav label ("Cotizar proyecto",
  // "Ver más") and is dropped — never labelled "Portafolio" (issue #6).
  type Sec = { label: string; text: string };
  const isShortNoPunct = (t: string) => {
    const txt = t.trim();
    if (!txt) return false;
    const words = txt.split(/\s+/).filter(Boolean);
    if (words.length > 10) return false;
    return !/[.!?;:](\s|$)/.test(txt);
  };
  const hasSeparator = (t: string) => /[/—–-]/.test(t);

  let i = 0;
  while (i < cleaned.length) {
    const sec = cleaned[i];
    if (!isShortNoPunct(sec.text)) {
      out.push(sec);
      i++;
      continue;
    }
    // Collect the run of consecutive short no-punct blocks.
    const run: Sec[] = [];
    while (i < cleaned.length && isShortNoPunct(cleaned[i].text)) {
      run.push(cleaned[i]);
      i++;
    }
    // A run is a portfolio list if it has ≥2 entries, or any entry has a
    // slash/dash separator. Otherwise it is a single isolated button label.
    const isPortfolioRun = run.length >= 2 || run.some(s => hasSeparator(s.text));
    if (isPortfolioRun) {
      out.push({ label: 'Portafolio', text: run.map(s => s.text).join('\n') });
    }
    // else: isolated button label — dropped.
  }
  return out;
}

function sliceSections(
  content: GeneratedContentItem['content'],
  previewPercent: number,
  versionNameForWarning: string,
  isBaseline: boolean,
): { sections: ClientReportSectionSlice[]; remainingLabels: string[]; keptPercent: number } {
  const plain = contentToPlainTextWithMarkers(content);
  let sections = splitSections(plain);

  // Drop Pie and Testimonios before measuring (spec 3.2).
  sections = sections.filter(s => s.label !== 'Pie' && s.label !== 'Testimonios');
  if (!sections.length) return { sections: [], remainingLabels: [], keptPercent: 100 };

  // The baseline is the client's own published text — show 100% of it, no fade,
  // no paywall. The whole report rests on "this is what we read from your site",
  // so truncating it would make the diagnosis unverifiable. But crawls inject
  // noise (portfolio entries as separate sections, button labels, empty
  // blocks) that becomes very visible at 100% — clean it first (issue #3).
  if (isBaseline) {
    sections = cleanBaselineSections(sections);
    const slices: ClientReportSectionSlice[] = sections.map((s, i) => ({
      label: s.label || '',
      text: s.text,
      isHero: i === 0,
      isFaded: false,
    }));
    const finalSlices = slices.map(s => ({
      ...s,
      text: suppressZeroValuesInText(s.text),
    }));
    return { sections: finalSlices, remainingLabels: [], keptPercent: 100 };
  }

  const totalChars = sections.reduce((a, s) => a + s.text.length, 0) || 1;
  const target = Math.max(1, Math.round((totalChars * previewPercent) / 100));

  const slices: ClientReportSectionSlice[] = [];
  const remainingLabels: string[] = [];
  let acc = 0;
  let stopped = false;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];

    if (stopped) {
      // Only list sections with a recognisable label in "Te falta por ver".
      // Blocks with no label are excluded rather than named "Sección".
      if (sec.label) remainingLabels.push(sec.label);
      continue;
    }

    if (i === 0) {
      // Hero section: always kept in full (it is the minimum visible unit).
      slices.push({ label: sec.label || '', text: sec.text, isHero: true, isFaded: false });
      acc += sec.text.length;
      continue;
    }

    // Subsequent sections: add paragraphs one at a time, stop at target,
    // but always keep at least one paragraph so the section is not empty.
    const paragraphs = sec.text.split('\n\n').map(p => p.trim()).filter(p => p);
    if (!paragraphs.length) continue;

    const kept: string[] = [];
    for (const para of paragraphs) {
      kept.push(para);
      acc += para.length;
      if (acc >= target) break;
    }

    if (kept.length) {
      slices.push({
        label: sec.label || '',
        text: kept.join('\n\n'),
        isHero: false,
        isFaded: false,
      });
    }

    // If we did not keep every paragraph, the rest of this section + all
    // subsequent sections are "remaining" (paywalled). But only list sections
    // that were cut ENTIRELY (issue #4): the section where the cut lands is
    // partly visible, so it must not appear in "Te falta por ver".
    const unkeptCount = paragraphs.length - kept.length;
    if (unkeptCount > 0 || acc >= target) {
      stopped = true;
    }
  }

  // Mark the last visible slice as faded.
  if (slices.length) slices[slices.length - 1].isFaded = true;

  // Real kept-character percentage (spec change: print the real number, not the constant).
  const keptChars = slices.reduce((a, s) => a + s.text.length, 0);
  const keptPercent = totalChars > 0 ? Math.round((keptChars / totalChars) * 100) : 100;

  // Self-check (spec 3.3) — fires when a non-baseline version keeps > 40% of its chars.
  // The baseline is excluded: it deliberately shows 100%.
  if (keptPercent > 40) {
    console.warn(
      `[clientReport] La versión "${versionNameForWarning}" muestra ${keptPercent}% del copy (límite 40%). Revisa el corte de secciones.`,
    );
  }

  const finalSlices = slices.map(s => ({
    ...s,
    text: suppressZeroValuesInText(s.text),
  }));

  return { sections: finalSlices, remainingLabels, keptPercent };
}

// ── Sub-scores — average, not doubled (spec 4.3) ─────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Source fields (absoluteScore.clarity etc.) are each 0–25. Sum of two is 0–50.
// Multiply by 2 to normalise to 0–100.
function averageSubscore(a: number | undefined, b: number | undefined): number {
  const av = (a ?? 0) + (b ?? 0);
  return clamp(Math.round(av * 2), 0, 100);
}

// ── Findings fallback — no cloning, distinct titles (spec 4.4) ────────────────

function buildFallbackFindings(
  risks: string[],
  improvements: string[],
): ClientReportFinding[] {
  const out: ClientReportFinding[] = [];
  const seenTitles = new Set<string>();
  const push = (category: string, title: string, bodyHtml: string) => {
    const t = title.replace(/[.:]$/, '').trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seenTitles.has(key)) return;
    if (looksLikeZeroValueNumeric(t + ' ' + bodyHtml)) return;
    seenTitles.add(key);
    // Store RAW — renderer escapes once.
    out.push({ category, title: t, bodyHtml });
  };

  const riskCategories = ['Credibilidad', 'Prueba social', 'Lenguaje', 'SEO', 'Claridad', 'Estructura'];
  risks.forEach((r, i) => {
    // Title is a short problem statement, body is the fuller text — not a truncation.
    const title = shortProblemTitle(r);
    push(riskCategories[i % riskCategories.length], title, r);
  });
  improvements.forEach(imp => {
    const title = shortProblemTitle(imp);
    push('Conversión', title, imp);
  });
  return out.slice(0, 4);
}

// Derive a short, distinct problem-statement title from a risk/improvement line,
// without resorting to truncating the body with an ellipsis (spec 4.4 / pitfall 8).
function shortProblemTitle(line: string): string {
  const clean = line.replace(/[.:]\s*$/, '').trim();
  // Take the first clause (up to a comma or colon) if it reads as a noun phrase.
  const firstClause = clean.split(/[,:;]/)[0].trim();
  return firstClause || clean;
}

// ── Roadmap from deep analysis ───────────────────────────────────────────────

function roadmapFromAnalysis(
  analysis: VersionDeepAnalysis | undefined,
): { items: ClientReportRoadmapItem[]; projected: number | null } {
  if (!analysis?.suggestedImprovements?.length) return { items: [], projected: null };
  const items: ClientReportRoadmapItem[] = [];
  let projected: number | null = null;
  for (const imp of analysis.suggestedImprovements) {
    const obj = typeof imp === 'object' && imp !== null ? (imp as SuggestedImprovement) : { text: String(imp) };
    const text = obj.text || '';
    if (!text) continue;
    if (looksLikeZeroValueNumeric(text)) continue;
    const pts = Math.max(1, Math.min(5, obj.points_delta ?? 2));
    if (obj.projected_score != null) projected = obj.projected_score;
    const title = text.split(/[.:]/)[0].trim() || text.trim();
    const body = text.slice(title.length).replace(/^[:.]\s*/, '').trim() || text.trim();
    // Store RAW markup — renderer sanitizes once. Add a period after the bold
    // title so it doesn't run on into the body (issue #6).
    items.push({
      points: pts,
      titleHtml: `<strong>${title}.</strong>`,
      bodyHtml: body,
    });
  }
  return { items, projected: projected != null ? Math.min(100, projected) : null };
}

// ── Company name & URL (spec 4.1, 4.2) ───────────────────────────────────────

function deriveCompanyName(formState: FormState, analyzedUrl: string): string {
  // Prefer the AI's reading (handled by caller). This fallback NEVER uses the page
  // headline or a form description field (spec 4.1).
  if (analyzedUrl) {
    const host = stripProtocol(analyzedUrl).split('/')[0].replace(/^www\./, '');
    const root = host.split('.').slice(-2, -1)[0];
    if (root) return root.charAt(0).toUpperCase() + root.slice(1);
  }
  return 'Tu empresa';
}

// ── Main builder ─────────────────────────────────────────────────────────────

export function buildClientReportData(
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  _originalInputScore: any,
  comparisonResult: ComparisonResult | null | undefined,
  versionDeepAnalysis: Record<string, VersionDeepAnalysis> | null | undefined,
  comparisonDeepAnalysisMeta: ComparisonDeepAnalysisMeta | null | undefined,
  narrative: ClientReportNarrative | null,
): ClientReportData {
  const ORIGINAL_VERSION_ID = '__original__';
  // Keep only real copy versions (improved/alternative/restyled/boosted) plus the
  // original baseline. SEO metadata, FAQ schema, GEO outputs and analysis/
  // comparison cards are noise here and would otherwise inflate the version
  // count or be silently dropped by the old name-based filter (issue #2).
  const contentCards = (generatedOutputCards ?? []).filter(isCopyVersionCard);
  const hasOriginalInCards = contentCards.some(c => c.id === ORIGINAL_VERSION_ID || c.type === GeneratedContentItemType.Original);
  const originalRowInComparison = comparisonResult?.rows?.find(r => r.versionId === ORIGINAL_VERSION_ID);
  if (!hasOriginalInCards && originalRowInComparison && formState.originalCopy?.trim()) {
    contentCards.unshift({
      id: ORIGINAL_VERSION_ID,
      type: GeneratedContentItemType.Original,
      content: formState.originalCopy.trim(),
      generatedAt: formState.originalCopyEnteredAt || new Date().toISOString(),
      sourceDisplayName: 'Original Copy',
      score: originalRowInComparison.finalScore != null
        ? { overall: originalRowInComparison.finalScore, clarity: '0', persuasiveness: '0', toneMatch: '0', engagement: '0' }
        : undefined,
    });
  }

  // Score maps.
  const scoreMap = new Map<string, number>();
  const editorialMap = new Map<string, number>();
  const conversionMap = new Map<string, number>();
  if (comparisonResult?.rows) {
    for (const row of comparisonResult.rows) {
      if (row.versionId && row.finalScore != null) scoreMap.set(row.versionId, row.finalScore);
      const abs = contentCards.find(c => c.id === row.versionId)?.absoluteScore;
      if (abs) {
        // Average of the two sub-scores, clamped 0–100 (spec 4.3).
        editorialMap.set(row.versionId, averageSubscore(abs.clarity, abs.structure));
        conversionMap.set(row.versionId, averageSubscore(abs.persuasion, abs.audience_fit));
      }
    }
  }

  const winnerRow = comparisonResult?.rows?.find(r => r.isWinner);
  const winnerVersionId = winnerRow?.versionId || comparisonResult?.winnerVersionId || '';
  const baselineRow = comparisonResult?.rows?.find(r => r.versionId === ORIGINAL_VERSION_ID) ||
    comparisonResult?.rows?.find(r => (r as any).isBaseline);
  const baselineScore = baselineRow?.finalScore ?? scoreMap.get(ORIGINAL_VERSION_ID) ?? 0;
  const winnerScore = winnerRow?.finalScore ?? (winnerVersionId ? scoreMap.get(winnerVersionId) ?? 0 : 0);

  const winnerAnalysis = winnerVersionId ? versionDeepAnalysis?.[winnerVersionId] : undefined;
  const { items: roadmapItems, projected } = roadmapFromAnalysis(winnerAnalysis);
  const roadmapSum = roadmapItems.reduce((a, i) => a + i.points, 0);
  const potential = projected != null ? projected : Math.min(100, winnerScore + roadmapSum);

  const winnerDeltaPoints = Math.max(0, Math.round(winnerScore - baselineScore));
  const winnerDeltaPercent = baselineScore > 0 ? Math.round((winnerDeltaPoints / baselineScore) * 100) : 0;

  // One source of truth for the analysis timestamp (spec 4.5).
  const analyzedAt = comparisonDeepAnalysisMeta?.evaluatedAt || formState.originalCopyEnteredAt || new Date().toISOString();

  // Company URL: resolved via a priority chain (spec 4.2) — first URL inside
  // projectDescription, then the wizard's analyze-url capture (competitorUrls[0]),
  // then the first URL in the original copy. If none is found, the renderer
  // omits the site div and rewrites the disclaimer. We do NOT fabricate a URL,
  // and the URL is never used as the company name.
  const companyUrlRaw = resolveAnalyzedUrl(formState);
  const companyUrl = stripProtocol(companyUrlRaw);
  const hasUrl = companyUrl.length > 0;
  const companyName = narrative?.companyName || deriveCompanyName(formState, companyUrlRaw);

  // Excluded sections (spec 4.7) — detected from structured titles.
  const excludedSections: string[] = [];
  const allSections = contentCards.flatMap(c => contentToStructured(c.content).sections);
  for (const s of allSections) {
    if (isExcludedSectionTitle(s.title)) {
      const label = mapSectionLabel(s.title);
      if (label && !excludedSections.includes(label)) excludedSections.push(label);
    }
  }

  // True count of generated copy proposals in the session (excludes baseline
  // and SEO/FAQ/GEO noise). This is what the cover stamp reports so it never
  // undercounts the work done in Copy Maker (issue #2).
  const generatedProposalCount = contentCards.filter(c => c.id !== ORIGINAL_VERSION_ID && c.type !== GeneratedContentItemType.Original).length;
  // Proposals that have no comparison score. Excluded from the ranking table
  // but surfaced in a note so they are not silently omitted (issue #2).
  const unscoredProposalCount = contentCards.filter(c =>
    c.id !== ORIGINAL_VERSION_ID
    && c.type !== GeneratedContentItemType.Original
    && !scoreMap.has(c.id)
  ).length;
  const versionCount = contentCards.length;

  const narrativeLabels = new Map<string, { displayName: string; roleLine: string }>();
  for (const v of narrative?.versionLabels ?? []) {
    narrativeLabels.set(v.versionId, { displayName: v.displayName, roleLine: v.roleLine });
  }

  const proposalLetters = ['A', 'B', 'C', 'D', 'E'];
  // Sort proposals by score desc so the letter assignment (A, B, C…) agrees
  // with the AI's "Propuesta A/B/C" naming (which follows score order in the
  // input markdown). Without this, the anchor #propA can point at the card
  // the AI labelled "Propuesta C", scrambling the TOC.
  const proposals = contentCards
    .filter(c => c.id !== ORIGINAL_VERSION_ID && c.type !== GeneratedContentItemType.Original)
    .sort((a, b) => (scoreMap.get(b.id) ?? b.score?.overall ?? 0) - (scoreMap.get(a.id) ?? a.score?.overall ?? 0));
  const proposalIndex = new Map<string, number>();
  proposals.forEach((c, i) => proposalIndex.set(c.id, i));

  const baselineCard = contentCards.find(c => c.id === ORIGINAL_VERSION_ID || c.type === GeneratedContentItemType.Original);
  const orderedCards = baselineCard ? [baselineCard, ...proposals] : proposals;

  const versions: ClientReportVersion[] = orderedCards.map((card, idx) => {
    const isBaseline = card.id === ORIGINAL_VERSION_ID || card.type === GeneratedContentItemType.Original;
    const isWinner = card.id === winnerVersionId;
    const score = scoreMap.get(card.id) ?? card.score?.overall ?? 0;
    const deltaPoints = isBaseline ? null : Math.max(0, Math.round(score - baselineScore));
    const deltaPercent = isBaseline || baselineScore <= 0 ? null : Math.round((deltaPoints! / baselineScore) * 100);
    const plain = contentToPlainText(card.content);
    const wcrl = computeWordCountAndReadingLevel(plain);
    const editorial = editorialMap.get(card.id) ?? clamp(Math.round(score * 0.5), 0, 100);
    const conversion = conversionMap.get(card.id) ?? clamp(Math.round(score * 0.5), 0, 100);

    let displayName: string;
    let roleLine: string;
    if (isBaseline) {
      displayName = 'Tu copy actual';
      roleLine = 'Texto publicado en tu sitio · línea base';
    } else {
      const nl = narrativeLabels.get(card.id);
      if (nl) {
        displayName = nl.displayName;
        // The AI's roleLine may contain an invented word count (issue #2).
        // Strip any trailing " · NNN palabras" and append the computed count.
        const angleOnly = nl.roleLine
          .replace(/\s*·\s*\d+\s*palabras\s*$/i, '')
          .replace(/\s*·\s*$/, '')
          .trim();
        roleLine = `${angleOnly} · ${wcrl.wordCount} palabras`;
      } else {
        const pIdx = proposalIndex.get(card.id) ?? 0;
        const letter = proposalLetters[pIdx] ?? String(pIdx + 1);
        displayName = `Propuesta ${letter}`;
        roleLine = `${wcrl.wordCount} palabras · reescritura completa`;
      }
    }

    const shortName = displayName.replace(/^Propuesta [A-Z]\s*·\s*/i, '').trim() || displayName;
    const sectionKicker = isBaseline ? 'Línea base' : (isWinner ? 'Propuesta ganadora' : 'Alternativa');

    const sliced = sliceSections(card.content, CLIENT_REPORT_PREVIEW_PERCENT, displayName, isBaseline);
    const remainingLabels = sliced.remainingLabels;
    const keptPercent = sliced.keptPercent;

    // Every non-baseline version names the missing sections (spec change #3):
    // the winner previously got this treatment, A/C got a generic sentence.
    // Now all proposals list the cut section labels; if nothing was cut, fall
    // back to a complete sentence that still ties to the delivery.
    const paywallLine = isBaseline
      ? ''
      : (remainingLabels.length
          ? `Te falta por ver: ${remainingLabels.join(', ')}. La versión completa incluye las ${numberWord(roadmapItems.length, false) || String(roadmapItems.length)} mejoras ya aplicadas.`
          : `La versión completa de esta propuesta, con las ${numberWord(roadmapItems.length, false) || String(roadmapItems.length)} mejoras ya aplicadas, forma parte de la entrega.`);

    const strengthsHeading = isBaseline ? 'Lo que ya funciona' : (isWinner ? 'Por qué gana' : 'Fortalezas');
    const improvementsHeading = isBaseline
      ? 'Lo que le resta'
      : (isWinner ? `Qué le falta para llegar a ${potential}` : 'Límites');

    const analysis = versionDeepAnalysis?.[card.id];
    const strengths = (analysis?.keyStrengths || analysis?.pros || [])
      .slice(0, 6)
      .map(s => stripMarkdown(s).trim())
      .filter(s => s && !looksLikeZeroValueNumeric(s));
    const improvements = (analysis?.suggestedImprovements || analysis?.cons || [])
      .slice(0, 6)
      .map(i => {
        const t = typeof i === 'object' && i !== null ? (i as SuggestedImprovement).text : String(i);
        return stripMarkdown(t).trim();
      })
      .filter(s => s && !looksLikeZeroValueNumeric(s));

    const rankSubline = isWinner
      ? `★ Ganadora · ${wcrl.wordCount} palabras`
      : (isBaseline ? `línea base · ${wcrl.wordCount} palabras` : `${wcrl.wordCount} palabras`);

    return {
      key: isBaseline ? 'actual' : `prop${proposalLetters[proposalIndex.get(card.id) ?? 0] ?? String(idx)}`,
      displayName,
      roleLine,
      isBaseline,
      isWinner,
      isShownInFull: false,
      isScored: isBaseline || scoreMap.has(card.id),
      score,
      deltaPoints,
      deltaPercent,
      editorialQuality: editorial,
      conversionPotential: conversion,
      wordCount: wcrl.wordCount,
      readingLevelEs: readingLevelEs(wcrl.readingLevel),
      sections: sliced.sections,
      strengths,
      improvements,
      shortName,
      sectionKicker,
      paywallLine,
      keptPercent,
      strengthsHeading,
      improvementsHeading,
      rankSubline,
      sectionNumber: idx + 2,
    };
  });

  // Ranking: sorted by score desc, baseline always last (spec 8.1).
  // Unscored proposals are excluded from the table (they have no comparable
  // score) but kept in `versions` so the full-versions list and the note can
  // surface them (issue #2).
  const versionsByScore: ClientReportVersion[] = [
    ...versions.filter(v => !v.isBaseline && v.isScored).sort((a, b) => b.score - a.score),
    ...versions.filter(v => v.isBaseline),
  ];

  // Cap the proposals developed as full sections (issue #1): winner + next
  // highest-scoring proposals up to MAX_PROPOSALS_SHOWN. The baseline is
  // always shown in full. Assign letters A/B/C to the shown proposals only.
  const shownProposalKeys = new Set(
    versionsByScore
      .filter(v => !v.isBaseline)
      .slice(0, MAX_PROPOSALS_SHOWN)
      .map(v => v.key),
  );
  for (const v of versions) {
    v.isShownInFull = v.isBaseline || shownProposalKeys.has(v.key);
  }

  const originalCard = contentCards.find(c => c.id === ORIGINAL_VERSION_ID || c.type === GeneratedContentItemType.Original);
  const winnerCard = contentCards.find(c => c.id === winnerVersionId);
  const originalHs = headlineAndSub(originalCard?.content);
  const winnerHs = headlineAndSub(winnerCard?.content);
  const headToHead: ClientReportHeadToHead = {
    originalHeadline: originalHs.headline || 'Tu titular actual',
    originalSub: originalHs.sub,
    originalNote: narrative?.headToHead?.originalNote || '',
    winnerHeadline: winnerHs.headline || 'Titular propuesto',
    winnerSub: winnerHs.sub,
    winnerNote: narrative?.headToHead?.winnerNote || '',
  };

  // Findings — AI narrative if present, else fallback from risk flags (spec 4.4, 6).
  let findings: ClientReportFinding[];
  if (narrative?.findings?.length) {
    // Store RAW — renderer sanitizes once.
    findings = narrative.findings.slice(0, 4).map(f => ({
      category: f.category,
      title: f.title.replace(/[.:]$/, ''),
      bodyHtml: f.bodyHtml,
    }));
  } else {
    const winnerRisks = suppressZeroFlags(
      computeRiskFactors(
        contentToPlainText(winnerCard?.content),
        winnerRow?.verificationFlags,
      ),
    );
    const baselineImprovements = (versionDeepAnalysis?.[ORIGINAL_VERSION_ID]?.suggestedImprovements || []).map(i =>
      typeof i === 'object' && i !== null ? (i as SuggestedImprovement).text : String(i),
    );
    findings = buildFallbackFindings(winnerRisks, baselineImprovements);
  }

  // Executive summary — RAW; renderer sanitizes once. Empty if AI failed (spec 6).
  const executiveSummary = narrative?.executiveSummary?.length
    ? narrative.executiveSummary.slice(0, 3)
    : [];

  // Brief — prefer AI-translated briefEs, fall back to raw form fields (spec 6).
  const brief: ClientReportBrief = {
    audience: narrative?.briefEs?.audience || formState.targetAudience || 'No especificado',
    keyMessage: narrative?.briefEs?.keyMessage || formState.keyMessage || 'No especificado',
    cta: narrative?.briefEs?.cta || formState.callToAction || 'No especificado',
    emotion: narrative?.briefEs?.emotion || formState.desiredEmotion || 'No especificado',
    brandValues: narrative?.briefEs?.brandValues || formState.brandValues || 'No especificado',
    toneLine: toneLineFor(formState),
    keywords: (formState.keywords || '').split(',').map(k => k.trim()).filter(Boolean),
    excludedSections,
    // Empty string when nothing was dropped — renderer omits the sentence (spec 4.7).
    excludedSectionsList: excludedSections.length ? excludedSections.join(', ') : '',
  };

  const studio: ClientReportStudio = {
    ...STUDIO,
    nameWithAccentDot: `Sharpen<span>.</span>Studio`,
  };

  const company: ClientReportCompany = {
    name: companyName,
    url: companyUrl,
    hasUrl,
    analyzedAt,
    analyzedAtLabel: formatSpanishDate(analyzedAt),
    analyzedAtTimeLabel: formatSpanishDateTime(analyzedAt),
    language: formState.language === 'Spanish' ? 'español' : (formState.language || 'Español').toLowerCase(),
  };

  const journey: ClientReportJourney = {
    baseline: baselineScore,
    winner: winnerScore,
    potential,
    winnerDeltaPoints,
    winnerDeltaPercent,
    versionCount,
    proposalCount: generatedProposalCount || Math.max(0, versions.length - 1),
  };

  const winnerDisplayName = versions.find(v => v.isWinner)?.displayName || 'La propuesta ganadora';

  return {
    studio,
    company,
    journey,
    executiveSummary,
    findings,
    brief,
    headToHead,
    versions,
    versionsByScore,
    roadmap: roadmapItems,
    previewPercent: CLIENT_REPORT_PREVIEW_PERCENT,
    findingsCountWord: numberWord(findings.length, true),
    roadmapCountWord: numberWord(roadmapItems.length, false),
    winnerDisplayName,
    lastIndex: versions.length + 2,
    generatedProposalCount,
    unscoredProposalCount,
    maxProposalsShown: MAX_PROPOSALS_SHOWN,
  };
}

// ── Filename — date agrees with the cover (spec 4.5, pitfall 11) ─────────────

export function buildClientReportFilename(data: ClientReportData): string {
  const slug = slugifyCompany(data.company.name);
  const d = data.company.analyzedAt ? new Date(data.company.analyzedAt) : new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `Reporte-Copy-${slug}-${ymd}.html`;
}

// ── AI input markdown (spec 6) — zero-flags stripped so the model can't reintroduce them ──

export function buildClientReportInputMarkdown(
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  comparisonResult: ComparisonResult | null | undefined,
  versionDeepAnalysis: Record<string, VersionDeepAnalysis> | null | undefined,
): string {
  const ORIGINAL_VERSION_ID = '__original__';
  const contentCards = (generatedOutputCards ?? []).filter(isCopyVersionCard);
  const hasOriginal = contentCards.some(c => c.id === ORIGINAL_VERSION_ID || c.type === GeneratedContentItemType.Original);
  if (!hasOriginal && formState.originalCopy?.trim()) {
    contentCards.unshift({
      id: ORIGINAL_VERSION_ID,
      type: GeneratedContentItemType.Original,
      content: formState.originalCopy.trim(),
      generatedAt: new Date().toISOString(),
      sourceDisplayName: 'Original Copy',
    });
  }

  let md = '## CONTEXTO DE LA EMPRESA\n\n';
  md += `URL analizada: ${resolveAnalyzedUrl(formState) || '(no proporcionada)'}\n`;
  md += `Público objetivo: ${formState.targetAudience || '(no especificado)'}\n`;
  md += `Mensaje clave: ${formState.keyMessage || '(no especificado)'}\n`;
  md += `Llamada a la acción: ${formState.callToAction || '(no especificada)'}\n`;
  md += `Emoción buscada: ${formState.desiredEmotion || '(no especificada)'}\n`;
  md += `Valores de marca: ${formState.brandValues || '(no especificados)'}\n`;
  md += `Tono: ${formState.tone || '(no especificado)'}\n\n`;

  md += '## COPY ORIGINAL PUBLICADO (valores numéricos en cero ya suprimidos)\n\n';
  md += suppressZeroValuesInText(contentToPlainText(contentCards[0]?.content)) + '\n\n';

  md += '## PROPUESTAS GENERADAS Y SUS PUNTUACIONES\n\n';
  md += 'IMPORTANTE: cada propuesta tiene un "versionId" interno. En tu respuesta JSON, el campo versionLabels[].versionId debe coincidir EXACTAMENTE con ese id.\n\n';
  if (comparisonResult?.rows) {
    for (const row of comparisonResult.rows) {
      const card = contentCards.find(c => c.id === row.versionId);
      const isOriginal = row.versionId === '__original__' || card?.type === GeneratedContentItemType.Original;
      if (isOriginal) continue; // versionLabels only for generated proposals
      md += `### ${row.optionLabel || card?.sourceDisplayName || row.versionId} — ${row.finalScore}/100${row.isWinner ? ' (GANADORA)' : ''}\n`;
      md += `versionId: \`${row.versionId}\`\n\n`;
      if (row.verificationFlags?.length) {
        md += 'Flags de verificación (tras supresión): ' + suppressZeroFlags(row.verificationFlags).join(' | ') + '\n\n';
      }
      if (card) md += suppressZeroValuesInText(contentToPlainText(card.content)) + '\n\n---\n\n';
    }
  }

  md += '## ANÁLISIS PROFUNDO DE LA VERSIÓN GANADORA\n\n';
  const winnerId = comparisonResult?.rows?.find(r => r.isWinner)?.versionId;
  const wa = winnerId ? versionDeepAnalysis?.[winnerId] : undefined;
  if (wa) {
    md += `Resumen: ${wa.summary}\n\n`;
    md += 'Fortalezas:\n' + (wa.keyStrengths || []).map(s => `- ${s}`).join('\n') + '\n\n';
    md += 'Mejoras sugeridas:\n' + (wa.suggestedImprovements || []).map(i => {
      const t = typeof i === 'object' && i !== null ? (i as SuggestedImprovement).text : String(i);
      return `- ${t}`;
    }).join('\n') + '\n\n';
  }

  md += '## RIESGOS DETECTADOS (tras supresión de valores cero)\n\n';
  const winnerCard = contentCards.find(c => c.id === winnerId);
  const risks = suppressZeroFlags(
    computeRiskFactors(
      contentToPlainText(winnerCard?.content),
      comparisonResult?.rows?.find(r => r.isWinner)?.verificationFlags,
    ),
  );
  risks.forEach(r => { md += `- ${r}\n`; });
  md += '\n';

  return md;
}

// ── Internal helpers used above ───────────────────────────────────────────────

function isExcludedSectionTitle(title: string): boolean {
  const t = (title || '').toLowerCase();
  return EXCLUDED_SECTION_HINTS.some(h => t.includes(h));
}

function mapSectionLabel(title: string): string {
  const t = (title || '').trim().toLowerCase();
  if (!t) return '';
  if (SECTION_LABEL_MAP[t]) return SECTION_LABEL_MAP[t];
  for (const key of Object.keys(SECTION_LABEL_MAP)) {
    if (t.includes(key)) return SECTION_LABEL_MAP[key];
  }
  return title.trim();
}
