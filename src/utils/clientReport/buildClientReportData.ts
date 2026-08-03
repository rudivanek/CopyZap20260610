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

const STUDIO = {
  name: 'Sharpen.Studio',
  site: 'sharpen.studio',
  email: 'hola@sharpen.studio',
  ctaPrimaryUrl: 'https://sharpen.studio/agendar',
  ctaSecondaryUrl: 'https://sharpen.studio/contacto',
};

const SECTION_LABEL_MAP: Record<string, string> = {
  hero: 'Encabezado',
  headline: 'Encabezado',
  introduction: 'Introducción',
  introducción: 'Introducción',
  introduccion: 'Introducción',
  intro: 'Introducción',
  features: 'Características',
  características: 'Características',
  caracteristicas: 'Características',
  benefits: 'Beneficios',
  beneficios: 'Beneficios',
  'how it works': 'Cómo funciona',
  'cómo funciona': 'Cómo funciona',
  'como funciona': 'Cómo funciona',
  'how does it work': 'Cómo funciona',
  services: 'Servicios',
  servicios: 'Servicios',
  courses: 'Cursos',
  cursos: 'Cursos',
  portfolio: 'Portafolio',
  portafolio: 'Portafolio',
  'case studies': 'Casos de éxito',
  'case study': 'Casos de éxito',
  'casos de éxito': 'Casos de éxito',
  'casos de exito': 'Casos de éxito',
  testimonials: 'Testimonios',
  testimonios: 'Testimonios',
  cta: 'Cierre',
  'call to action': 'Cierre',
  cierre: 'Cierre',
  conclusion: 'Cierre',
  conclusión: 'Cierre',
  about: 'Nosotros',
  nosotros: 'Nosotros',
  'sobre nosotros': 'Nosotros',
  pricing: 'Precios',
  precios: 'Precios',
  faq: 'Preguntas frecuentes',
  'preguntas frecuentes': 'Preguntas frecuentes',
  footer: 'Pie',
  pie: 'Pie',
};

const EXCLUDED_SECTION_HINTS = [
  'testimoni', 'review', 'cookie', 'consent', 'navigation', 'nav', 'menu',
  'breadcrumb', 'footer', 'pie', 'aviso de cookies', 'política de privacidad',
  'politica de privacidad', 'cotizar proyecto', 'cotizar', 'contact', 'contacto',
];

function trimTrailingPunct(s: string): string {
  let t = s.trim();
  while (t.length > 0) {
    const last = t.charAt(t.length - 1);
    if (last === '.' || last === ':' || last === '*' || last === '-' || last === '#') {
      t = t.slice(0, -1).trim();
    } else {
      break;
    }
  }
  return t;
}

function normalizeSectionLabel(title: string): string {
  const t = trimTrailingPunct((title || '').trim().toLowerCase());
  if (!t) return 'Sección';
  if (SECTION_LABEL_MAP[t]) return SECTION_LABEL_MAP[t];
  for (const key of Object.keys(SECTION_LABEL_MAP)) {
    if (t === key || t.indexOf(key) !== -1) return SECTION_LABEL_MAP[key];
  }
  return trimTrailingPunct((title || '').trim()) || 'Sección';
}

function isExcludedSection(title: string): boolean {
  const t = trimTrailingPunct((title || '').trim().toLowerCase());
  if (!t) return false;
  if (SECTION_LABEL_MAP[t] === 'Pie') return true;
  for (const h of EXCLUDED_SECTION_HINTS) {
    if (t === h || t.indexOf(h) !== -1) return true;
  }
  return false;
}

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
  strengthsHeading: string;
  improvementsHeading: string;
  hasStrengths: boolean;
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
}

export interface ClientReportNarrative {
  companyName: string;
  executiveSummary: string[];
  findings: ClientReportFinding[];
  headToHead: { originalNote: string; winnerNote: string };
  versionLabels: Array<{
    versionId: string;
    displayName: string;
    roleLine: string;
  }>;
}

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

function escapeHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeInlineHtml(html: string): string {
  const escaped = escapeHtml(html);
  const ALLOWED = new Set(['strong', 'b', 'q', 'em']);
  return escaped.replace(
    /&lt;(\/?)(strong|b|q|em)&gt;/gi,
    (_m, slash, tag) => `<${slash}${tag.toLowerCase()}>`,
  );
}

function stripProtocol(url: string): string {
  return (url || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');
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
  if (l === 'easy' || l === 'basic' || l === 'básico') return 'básico';
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

const BRIEF_ES_MAP: Record<string, string> = {
  'businesses and entrepreneurs looking to enhance their brand identity and web presence.':
    'Empresas y emprendedores que buscan reforzar su identidad de marca y su presencia digital.',
  'businesses and entrepreneurs': 'Empresas y emprendedores',
  'no especificado': 'No especificado',
};

function translateToSpanish(text: string | undefined | null): string {
  if (!text) return '';
  const lower = text.trim().toLowerCase();
  if (BRIEF_ES_MAP[lower]) return BRIEF_ES_MAP[lower];
  for (const key of Object.keys(BRIEF_ES_MAP)) {
    if (lower.includes(key)) return BRIEF_ES_MAP[key];
  }
  return text;
}

function deriveAngle(content: GeneratedContentItem['content']): string {
  const list = buildSectionList(content);
  const hero = list[0];
  if (!hero) return '';
  const firstLine = hero.text.split('\n')[0].trim();
  const words = firstLine.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const stop = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'tu', 'your', 'the', 'a', 'an', 'de', 'y', 'or', 'para', 'for', 'with', 'con', 'en', 'in']);
  const meaningful = words.filter(w => w.length > 3 && !stop.has(w.toLowerCase()));
  if (meaningful.length === 0) return '';
  const angle = meaningful.slice(0, 3).join(' ');
  return angle.charAt(0).toUpperCase() + angle.slice(1);
}

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

function firstHeadline(content: GeneratedContentItem['content']): string {
  const list = buildSectionList(content);
  const hero = list[0];
  if (!hero) return '';
  const lines = hero.text.split('\n');
  return lines[0].trim();
}

function firstSubline(content: GeneratedContentItem['content']): string {
  const list = buildSectionList(content);
  if (list.length >= 2) return list[1].text.split('\n')[0].trim();
  if (list.length === 1) {
    const lines = list[0].text.split('\n').filter(l => l.trim());
    return lines.slice(1, 2).join(' ').trim() || lines[0].trim();
  }
  return '';
}

function isShortBareLabel(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const last = trimmed.charAt(trimmed.length - 1);
  if (last === '.' || last === '!' || last === '?' || last === ':' || last === ';') return false;
  const words = trimmed.split(' ').filter(w => w.length > 0);
  if (words.length === 0 || words.length > 4) return false;
  return true;
}

function looksLikeMarker(line: string): boolean {
  if (!isShortBareLabel(line)) return false;
  const lower = trimTrailingPunct(line.toLowerCase());
  return Object.prototype.hasOwnProperty.call(SECTION_LABEL_MAP, lower);
}

function splitOnFences(text: string): string[] {
  let blocks = text.split('\n---\n');
  if (blocks.length < 2) blocks = text.split('---');
  return blocks.map(b => b.trim()).filter(b => b.length > 0);
}

function splitIntoParagraphs(text: string): string[] {
  return text.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
}

function labelBlocks(blocks: string[]): { label: string; text: string }[] {
  const out: { label: string; text: string }[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split('\n');
    const firstLine = lines[0].trim();
    if (looksLikeMarker(firstLine) && lines.length > 1) {
      const rest = lines.slice(1).join('\n').trim();
      if (rest) {
        out.push({ label: normalizeSectionLabel(firstLine), text: rest });
        continue;
      }
    }
    out.push({ label: out.length === 0 ? 'Encabezado' : 'Sección', text: block });
  }
  return out;
}

function splitPlainTextOnMarkers(text: string): { label: string; text: string }[] {
  let blocks = splitOnFences(text);
  if (blocks.length === 1) {
    const labeled = labelBlocks(blocks);
    if (labeled.length > 1) return labeled;
    const paras = splitIntoParagraphs(blocks[0]);
    if (paras.length > 1) return labelBlocks(paras);
  } else {
    return labelBlocks(blocks);
  }
  if (text.length > 400) {
    const paras = splitIntoParagraphs(text);
    if (paras.length > 1) return labelBlocks(paras);
  }
  return [{ label: 'Encabezado', text }];
}

function buildSectionList(content: GeneratedContentItem['content']): { label: string; text: string }[] {
  const { headline, sections } = contentToStructured(content);
  const all: { label: string; text: string }[] = [];
  if (headline) all.push({ label: 'Encabezado', text: stripMarkdown(headline).trim() });
  for (const s of sections) {
    let text = '';
    if (s.content) text = stripMarkdown(s.content).trim();
    if (s.listItems?.length) text = (text ? text + '\n' : '') + s.listItems.map(i => '• ' + stripMarkdown(i).trim()).join('\n');
    if (!text) continue;
    const hasRealTitle = !!(s.title && s.title !== 'Encabezado');
    if (!hasRealTitle) {
      const sub = splitPlainTextOnMarkers(text);
      all.push(...sub);
      continue;
    }
    if (isExcludedSection(s.title)) continue;
    all.push({ label: normalizeSectionLabel(s.title), text });
  }
  return all.filter(s => s.text && !isExcludedSection(s.label));
}

function sliceSections(
  content: GeneratedContentItem['content'],
  previewPercent: number,
): ClientReportSectionSlice[] {
  let all = buildSectionList(content);
  all = all.filter(s => !isExcludedSection(s.label));
  if (all.length === 0) return [];

  const totalChars = all.reduce((a, s) => a + s.text.length, 0) || 1;
  const target = Math.max(1, Math.round((totalChars * previewPercent) / 100));
  let acc = 0;
  let cutoff = 0;
  for (let i = 0; i < all.length; i++) {
    acc += all[i].text.length;
    cutoff = i + 1;
    if (i >= 1 && acc >= target) break;
  }
  cutoff = Math.max(2, Math.min(cutoff, all.length));
  const visible = all.slice(0, cutoff);
  return visible.map((s, i) => ({
    label: s.label,
    text: s.text,
    isHero: i === 0,
    isFaded: i === visible.length - 1,
  }));
}

function remainingSectionNames(content: GeneratedContentItem['content']): string {
  const all = buildSectionList(content);
  if (all.length === 0) return 'el resto del copy';
  const totalChars = all.reduce((a, s) => a + s.text.length, 0) || 1;
  const target = Math.max(1, Math.round((totalChars * CLIENT_REPORT_PREVIEW_PERCENT) / 100));
  let acc = 0;
  let cutoff = 0;
  for (let i = 0; i < all.length; i++) {
    acc += all[i].text.length;
    cutoff = i + 1;
    if (i >= 1 && acc >= target) break;
  }
  cutoff = Math.max(2, Math.min(cutoff, all.length));
  const remaining = all.slice(cutoff).map(s => s.label);
  return remaining.length ? remaining.join(', ') : 'el resto del copy';
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const tb = b.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const w of tb) if (ta.has(w)) shared++;
  return shared / Math.max(ta.size, tb.size);
}

function looksLikeZeroValueNumeric(text: string): boolean {
  return /(^|[^\d.])(\+\s*0(\.0+)?\s*(%|pts|puntos)?|0(\.0+)?\s*%|0\s*\/\s*\d+)/i.test(text);
}

function suppressZeroFlags(flags: string[]): string[] {
  if (!SUPPRESS_ZERO_VALUE_NUMERIC_FINDINGS) return flags;
  return (flags || []).filter(f => !looksLikeZeroValueNumeric(f));
}

function deriveCompanyName(formState: FormState, fallbackFromCopy?: string): string {
  const fromProject = formState.projectDescription?.trim();
  if (fromProject && !/https?:\/\//i.test(fromProject) && fromProject.length < 80) return fromProject;
  const url = formState.competitorUrls?.[0] || '';
  if (url) {
    const host = stripProtocol(url).split('/')[0].replace(/^www\./, '');
    const root = host.split('.').slice(-2, -1)[0];
    if (root) return root.charAt(0).toUpperCase() + root.slice(1);
  }
  if (fallbackFromCopy && fallbackFromCopy.trim()) return fallbackFromCopy.trim().slice(0, 60);
  return formState.businessDescription?.trim().slice(0, 60) || 'Tu empresa';
}

function buildFallbackFindings(
  risks: string[],
  improvements: string[],
): ClientReportFinding[] {
  const out: ClientReportFinding[] = [];
  const seen = new Set<string>();
  const push = (category: string, title: string, bodyHtml: string) => {
    const key = title.toLowerCase();
    if (seen.has(key) || looksLikeZeroValueNumeric(title + ' ' + bodyHtml)) return;
    seen.add(key);
    out.push({ category, title, bodyHtml: sanitizeInlineHtml(bodyHtml) });
  };
  for (const r of risks.slice(0, 4)) {
    const t = r.length > 70 ? r.slice(0, 67).trim() + '…' : r;
    push('Credibilidad', t.replace(/[.:]$/, ''), r);
  }
  for (const imp of improvements.slice(0, 4)) {
    const t = imp.length > 70 ? imp.slice(0, 67).trim() + '…' : imp;
    push('Conversión', t.replace(/[.:]$/, ''), imp);
  }
  while (out.length < 4 && out.length > 0) out.push({ ...out[out.length - 1] });
  return out.slice(0, 4);
}

function roadmapFromAnalysis(
  analysis: VersionDeepAnalysis | undefined,
  winnerScore: number,
): { items: ClientReportRoadmapItem[]; projected: number | null } {
  if (!analysis?.suggestedImprovements?.length) return { items: [], projected: null };
  const items: ClientReportRoadmapItem[] = [];
  let sum = 0;
  let projected: number | null = null;
  for (const imp of analysis.suggestedImprovements) {
    const obj = typeof imp === 'object' && imp !== null ? (imp as SuggestedImprovement) : { text: String(imp) };
    const text = obj.text || '';
    if (!text) continue;
    const pts = Math.max(1, Math.min(5, obj.points_delta ?? 2));
    if (obj.projected_score != null) projected = obj.projected_score;
    sum += pts;
    const title = text.split(/[.:]/)[0].trim() || text.trim();
    const body = text.slice(title.length).replace(/^[:.]\s*/, '').trim() || text.trim();
    items.push({
      points: pts,
      titleHtml: sanitizeInlineHtml(`<strong>${title}</strong>`),
      bodyHtml: sanitizeInlineHtml(body),
    });
  }
  return { items, projected: projected != null ? Math.min(100, projected) : null };
}

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
  const contentCards = (generatedOutputCards ?? []).filter(card =>
    !card.sourceDisplayName?.includes('Analysis') && !card.sourceDisplayName?.includes('Comparison'),
  );
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

  const scoreMap = new Map<string, number>();
  const editorialMap = new Map<string, number>();
  const conversionMap = new Map<string, number>();
  if (comparisonResult?.rows) {
    for (const row of comparisonResult.rows) {
      if (row.versionId && row.finalScore != null) scoreMap.set(row.versionId, row.finalScore);
      const abs = contentCards.find(c => c.id === row.versionId)?.absoluteScore;
      if (abs) {
        editorialMap.set(row.versionId, Math.round((abs.clarity + abs.structure) / 0.5));
        conversionMap.set(row.versionId, Math.round((abs.persuasion + abs.audience_fit) / 0.5));
      }
    }
  }

  const winnerRow = comparisonResult?.rows?.find(r => r.isWinner);
  const winnerVersionId = winnerRow?.versionId || comparisonResult?.winnerVersionId || '';
  const baselineRow = comparisonResult?.rows?.find(r => r.versionId === ORIGINAL_VERSION_ID) || comparisonResult?.rows?.find(r => (r as any).isBaseline);
  const baselineScore = baselineRow?.finalScore ?? scoreMap.get(ORIGINAL_VERSION_ID) ?? 0;
  const winnerScore = winnerRow?.finalScore ?? (winnerVersionId ? scoreMap.get(winnerVersionId) ?? 0 : 0);

  const winnerAnalysis = winnerVersionId ? versionDeepAnalysis?.[winnerVersionId] : undefined;
  const { items: roadmapItems, projected } = roadmapFromAnalysis(winnerAnalysis, winnerScore);
  const roadmapSum = roadmapItems.reduce((a, i) => a + i.points, 0);
  const potential = projected != null ? projected : Math.min(100, winnerScore + roadmapSum);

  const winnerDeltaPoints = Math.max(0, Math.round(winnerScore - baselineScore));
  const winnerDeltaPercent = baselineScore > 0 ? Math.round((winnerDeltaPoints / baselineScore) * 100) : 0;

  const analyzedAt = comparisonDeepAnalysisMeta?.evaluatedAt || formState.originalCopyEnteredAt || new Date().toISOString();
  const companyUrl =
    formState.competitorUrls?.[0] ||
    formState.businessDescription?.match(/https?:\/\/[^\s)]+/i)?.[0] ||
    formState.projectDescription?.match(/https?:\/\/[^\s)]+/i)?.[0] ||
    '';
  const companyName = narrative?.companyName || deriveCompanyName(formState, firstHeadline(contentCards[0]?.content));

  const excludedSections: string[] = [];
  const seenExcluded = new Set<string>();
  const allSections = contentCards.flatMap(c => contentToStructured(c.content).sections);
  for (const s of allSections) {
    if (s.title && isExcludedSection(s.title)) {
      const label = normalizeSectionLabel(s.title);
      if (!seenExcluded.has(label)) { seenExcluded.add(label); excludedSections.push(label); }
    }
  }
  for (const card of contentCards) {
    const list = buildSectionList(card.content);
    for (const sec of list) {
      if (isExcludedSection(sec.label)) {
        if (!seenExcluded.has(sec.label)) { seenExcluded.add(sec.label); excludedSections.push(sec.label); }
      }
    }
  }

  const proposalCount = contentCards.filter(c => c.id !== ORIGINAL_VERSION_ID && c.type !== GeneratedContentItemType.Original).length;
  const versionCount = contentCards.length;

  const narrativeLabels = new Map<string, { displayName: string; roleLine: string }>();
  for (const v of narrative?.versionLabels ?? []) {
    narrativeLabels.set(v.versionId, { displayName: v.displayName, roleLine: v.roleLine });
  }

  const proposalLetters = ['A', 'B', 'C', 'D', 'E'];
  const proposals = contentCards.filter(c => c.id !== ORIGINAL_VERSION_ID && c.type !== GeneratedContentItemType.Original);
  const proposalIndex = new Map<string, number>();
  proposals.forEach((c, i) => proposalIndex.set(c.id, i));

  const versions: ClientReportVersion[] = contentCards.map((card, idx) => {
    const isBaseline = card.id === ORIGINAL_VERSION_ID || card.type === GeneratedContentItemType.Original;
    const isWinner = card.id === winnerVersionId;
    const score = scoreMap.get(card.id) ?? card.score?.overall ?? 0;
    const deltaPoints = isBaseline ? null : Math.max(0, Math.round(score - baselineScore));
    const deltaPercent = isBaseline || baselineScore <= 0 ? null : Math.round((deltaPoints! / baselineScore) * 100);
    )
    )
    const plain = contentToPlainText(card.content);
    const wcrl = computeWordCountAndReadingLevel(plain);
    const editorial = editorialMap.get(card.id) ?? Math.round(score * 0.5);
    const conversion = conversionMap.get(card.id) ?? Math.round(score * 0.5);

    let displayName: string;
    let roleLine: string;
    if (isBaseline) {
      displayName = 'Tu copy actual';
      roleLine = 'Texto publicado en tu sitio · línea base';
    } else {
      const nl = narrativeLabels.get(card.id);
      if (nl && nl.displayName && nl.roleLine) {
        displayName = nl.displayName;
        roleLine = nl.roleLine;
      } else {
        const pIdx = proposalIndex.get(card.id) ?? 0;
        const letter = proposalLetters[pIdx] ?? String(pIdx + 1);
        const angle = deriveAngle(card.content);
        displayName = angle ? `Propuesta ${letter} · ${angle}` : `Propuesta ${letter}`;
        roleLine = `${wcrl.wordCount} palabras · reescritura completa`;
      }
    }

    const shortName = displayName.replace(/^Propuesta [A-Z]\s*·\s*/i, '').trim() || displayName;
    const sectionKicker = isBaseline ? 'Línea base' : (isWinner ? 'Propuesta ganadora' : 'Alternativa');
    const paywallLine = isWinner
      ? `Te falta por ver: ${remainingSectionNames(card.content)}. La versión completa incluye las ${roadmapItems.length || 6} mejoras ya aplicadas.`
      : `Esta es una de las ${proposalCount || 3} propuestas que generamos para tu copy; aquí ves solo el ${CLIENT_REPORT_PREVIEW_PERCENT} %, y el resto queda reservado para la entrega completa.`;
    const strengthsHeading = isBaseline ? 'Lo que ya funciona' : (isWinner ? 'Por qué gana' : 'Fortalezas');
    const improvementsHeading = isBaseline ? 'Lo que le resta' : (isWinner ? `Qué le falta para llegar a ${potential}` : 'Límites');

    const analysis = versionDeepAnalysis?.[card.id];
    let strengths = (analysis?.keyStrengths || analysis?.pros || []).slice(0, 6).map(s => stripMarkdown(s).trim()).filter(Boolean);
    let improvements = (analysis?.suggestedImprovements || analysis?.cons || []).slice(0, 6).map(i => {
      const t = typeof i === 'object' && i !== null ? (i as SuggestedImprovement).text : String(i);
      return stripMarkdown(t).trim();
    }).filter(Boolean);
    if (!isBaseline && strengths.length === 0 && improvements.length === 0) {
      strengths = ['Mantiene la promesa central de la marca y la estructura general del sitio.'];
      improvements = ['El detalle completo del análisis se entrega junto con la versión completa del copy.'];
    }

    const rankSubline = isWinner
      ? `★ Ganadora · ${wcrl.wordCount} palabras`
      : (isBaseline ? `línea base · ${wcrl.wordCount} palabras` : `${wcrl.wordCount} palabras`);

    return {
      key: isBaseline ? 'actual' : `prop${proposalLetters[proposalIndex.get(card.id) ?? 0] ?? String(idx)}`,
      displayName,
      roleLine,
      isBaseline,
      isWinner,
      score,
      deltaPoints,
      deltaPercent,
      editorialQuality: editorial,
      conversionPotential: conversion,
      wordCount: wcrl.wordCount,
      readingLevelEs: readingLevelEs(wcrl.readingLevel),
      sections: sliceSections(card.content, CLIENT_REPORT_PREVIEW_PERCENT),
      strengths,
      improvements,
      shortName,
      sectionKicker,
      paywallLine,
      strengthsHeading,
      improvementsHeading,
      hasStrengths: strengths.length > 0 || improvements.length > 0,
      rankSubline,
      sectionNumber: idx + 2,
    };
  });

  const versionsByScore = [...versions].sort((a, b) => b.score - a.score);
  versionsByScore.forEach((v, i) => {
    (v as any).__rank = i + 1;
  });

  const originalCard = contentCards.find(c => c.id === ORIGINAL_VERSION_ID || c.type === GeneratedContentItemType.Original);
  const winnerCard = contentCards.find(c => c.id === winnerVersionId);
  const headToHead: ClientReportHeadToHead = {
    originalHeadline: firstHeadline(originalCard?.content) || 'Tu titular actual',
    originalSub: firstSubline(originalCard?.content),
    originalNote: narrative?.headToHead?.originalNote || 'El titular actual es correcto pero no genera un gancho emocional en los primeros segundos.',
    winnerHeadline: firstHeadline(winnerCard?.content) || 'Titular propuesto',
    winnerSub: firstSubline(winnerCard?.content),
    winnerNote: narrative?.headToHead?.winnerNote || 'El titular propuesto abre con la promesa concreta y la prueba que la sostiene, en el orden que retiene la atención.',
  };

  let findings: ClientReportFinding[];
  if (narrative?.findings?.length) {
    findings = narrative.findings.slice(0, 4).map(f => ({
      category: f.category,
      title: f.title.replace(/[.:]$/, ''),
      bodyHtml: sanitizeInlineHtml(f.bodyHtml),
    }));
  } else {
    const winnerRisks = suppressZeroFlags(computeRiskFactors(contentToPlainText(winnerCard?.content), winnerRow?.verificationFlags));
    const baselineImprovements = (versionDeepAnalysis?.[ORIGINAL_VERSION_ID]?.suggestedImprovements || []).map(i =>
      typeof i === 'object' && i !== null ? (i as SuggestedImprovement).text : String(i),
    );
    findings = buildFallbackFindings(winnerRisks, baselineImprovements);
  }

  const executiveSummary = narrative?.executiveSummary?.length
    ? narrative.executiveSummary.slice(0, 3).map(s => sanitizeInlineHtml(s))
    : [];

  const brief: ClientReportBrief = {
    audience: translateToSpanish(formState.targetAudience) || 'No especificado',
    keyMessage: translateToSpanish(formState.keyMessage) || 'No especificado',
    cta: translateToSpanish(formState.callToAction) || 'No especificado',
    emotion: translateToSpanish(formState.desiredEmotion) || 'No especificado',
    brandValues: translateToSpanish(formState.brandValues) || 'No especificado',
    toneLine: toneLineFor(formState),
    keywords: (formState.keywords || '').split(',').map(k => k.trim()).filter(Boolean),
    excludedSections,
    excludedSectionsList: excludedSections.length ? excludedSections.join(', ') : 'ninguna',
  };

  const studio: ClientReportStudio = {
    ...STUDIO,
    nameWithAccentDot: `Sharpen<span>.</span>Studio`,
  };

  const company: ClientReportCompany = {
    name: companyName,
    url: stripProtocol(companyUrl),
    analyzedAt,
    analyzedAtLabel: formatSpanishDate(analyzedAt),
    analyzedAtTimeLabel: formatSpanishDateTime(analyzedAt),
    language: formState.language === 'Spanish' ? 'español' : (formState.language || 'Español').toLowerCase(),
  };
  if (!company.url && formState.originalCopy) {
    const m = formState.originalCopy.match(/https?:\/\/[^\s)"']+/i);
    if (m) company.url = stripProtocol(m[0]);
  }

  const journey: ClientReportJourney = {
    baseline: baselineScore,
    winner: winnerScore,
    potential,
    winnerDeltaPoints,
    winnerDeltaPercent,
    versionCount,
    proposalCount: proposalCount || versions.length - 1,
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
  };
}

export function buildClientReportFilename(data: ClientReportData): string {
  const slug = slugifyCompany(data.company.name);
  const d = data.company.analyzedAt ? new Date(data.company.analyzedAt) : new Date();
  const valid = !isNaN(d.getTime());
  const ymd = valid
    ? `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    : `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;
  return `Reporte-Copy-${slug}-${ymd}.html`;
}

export function buildClientReportInputMarkdown(
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  comparisonResult: ComparisonResult | null | undefined,
  versionDeepAnalysis: Record<string, VersionDeepAnalysis> | null | undefined,
): string {
  const ORIGINAL_VERSION_ID = '__original__';
  const contentCards = (generatedOutputCards ?? []).filter(card =>
    !card.sourceDisplayName?.includes('Analysis') && !card.sourceDisplayName?.includes('Comparison'),
  );
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
  md += `URL analizada: ${formState.competitorUrls?.[0] || '(no proporcionada)'}\n`;
  md += `Público objetivo: ${formState.targetAudience || '(no especificado)'}\n`;
  md += `Mensaje clave: ${formState.keyMessage || '(no especificado)'}\n`;
  md += `Llamada a la acción: ${formState.callToAction || '(no especificada)'}\n`;
  md += `Emoción buscada: ${formState.desiredEmotion || '(no especificada)'}\n`;
  md += `Valores de marca: ${formState.brandValues || '(no especificados)'}\n`;
  md += `Tono: ${formState.tone || '(no especificado)'}\n\n`;

  md += '## COPY ORIGINAL PUBLICADO\n\n';
  md += contentToPlainText(contentCards[0]?.content) + '\n\n';

  md += '## PROPUESTAS GENERADAS Y SUS PUNTUACIONES\n\n';
  if (comparisonResult?.rows) {
    for (const row of comparisonResult.rows) {
      const card = contentCards.find(c => c.id === row.versionId);
      md += `### ${row.optionLabel || card?.sourceDisplayName || row.versionId} — ${row.finalScore}/100${row.isWinner ? ' (GANADORA)' : ''}\n\n`;
      if (row.verificationFlags?.length) {
        md += 'Flags de verificación: ' + suppressZeroFlags(row.verificationFlags).join(' | ') + '\n\n';
      }
      if (card) md += contentToPlainText(card.content) + '\n\n---\n\n';
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
  const risks = suppressZeroFlags(computeRiskFactors(contentToPlainText(winnerCard?.content), comparisonResult?.rows?.find(r => r.isWinner)?.verificationFlags));
  risks.forEach(r => { md += `- ${r}\n`; });
  md += '\n';

  return md;
}
