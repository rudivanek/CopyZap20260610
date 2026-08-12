import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Save, FileText, Code, FileCode, Sparkles, FlaskConical, CheckCircle2, BookmarkPlus, ChevronDown, ChevronRight, Wand2, CreditCard as Edit, Zap, Globe, BookCheck, MapPin, Copy, Check, BookOpen, PanelRight, X, Trash2, RefreshCw, GitMerge, File as FileEdit, FileStack, Rocket, Camera, LayoutDashboard, Loader2, Scale, UserCheck, Drama, Search, Gauge, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserSavedOutputsMeta, getUserCopySessions } from '../../services/supabaseClient';
import { toast } from 'react-hot-toast';

import {
  FormState,
  GeneratedContentItem,
  GeneratedContentItemType,
  GeoGenerateElement,
  User,
  VersionDeepAnalysis,
  ComparisonDeepAnalysisMeta,
  MAX_BOOST_ITERATIONS,
  MAX_BOOST_SCORE_THRESHOLD,
} from '../../types';
import { CATEGORIZED_VOICE_STYLES, getAdminClaudeModel } from '../../constants';
import { ComparisonResult } from '../../services/api/comprehensiveScoring';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useActiveCard } from '../../hooks/useActiveCard';
import {
  formatAsEnhancedMarkdown,
  exportAsFormattedHtml,
  exportLLMEvaluationMarkdown,
  exportLLMEvaluationAudit,
  buildLLMEvaluationMarkdown,
  buildLLMEvaluationAudit,
} from '../../utils/enhancedExports';
import {
  formatSingleGeneratedItemContentAsHTML,
  formatSingleGeneratedItemAsMarkdown,
  markdownToHtml,
} from '../../utils/copyFormatter';
import { stripMarkdown } from '../../utils/markdownUtils';
import { getScoreLabel } from '../../utils/scoreColors';
import ReactDOM from 'react-dom';
import ProcessingModal from '../ProcessingModal';
import SeoGenerationOptionsModal, { SeoGenerationOptions } from '../SeoGenerationOptionsModal';
import HtmlPreviewExportModal from '../HtmlPreviewExportModal';
import { generateSeoMetadata } from '../../services/api/seoGeneration';
import { calculateGeoScore } from '../../services/api/geoScoring';
import { generateContentScores } from '../../services/api/contentScoring';
import { generateGeoContent } from '../../services/api/geoGeneration';
import { calculateTargetWordCount } from '../../services/api/utils';
import { makeApiRequestWithFallback, makeStreamingReportRequest } from '../../services/api/utils';
import { playSuccessSound } from '../../utils/soundEffects';
import evalPrompt from '../../prompts/copyzap-eval-prompt.md?raw';
import comparePrompt from '../../prompts/copyzap-compare-prompt.md?raw';
import clientPrompt from '../../prompts/copyzap-client-prompt.md?raw';
import { generateClientReportNarrative } from '../../utils/clientReport/clientReportNarrative';
import { buildClientReportData, buildClientReportFilename } from '../../utils/clientReport/buildClientReportData';
import { renderClientReport } from '../../utils/clientReport/renderClientReport';
import { auditReportData } from '../../utils/clientReport/auditReportData';
import type { AuditIssue } from '../../utils/clientReport/auditReportData';
import { playReportReadyTone } from '../../utils/clientReport/reportReadyTone';
import ReportProgressModal, { REPORT_STEPS } from './CopyMakerTab/modals/ReportProgressModal';
import ReportAuditModal from './CopyMakerTab/modals/ReportAuditModal';

// ─── Shared docx builder ──────────────────────────────────────────────────────

interface ReportDocxMeta {
  title: string;
  project: string;
  date: string;
  displayLang: string;
  versionCount: number;
  footerText: string;
  filePrefix: string;
  filename: string;
}

async function buildReportDocx(markdown: string, meta: ReportDocxMeta): Promise<Blob> {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, ShadingType,
    AlignmentType, PageOrientation, BorderStyle,
    LevelFormat,
  } = await import('docx');

  const CONTENT_WIDTH = 12960;
  const C_PRIMARY  = '000000';
  const C_MUTED    = '404040';
  const C_HDR_FILL = 'D9D9D9';
  const C_ALT_FILL = 'F2F2F2';
  const C_WHITE    = 'FFFFFF';
  const C_BORDER   = 'BFBFBF';

  const cellBorder = (color = C_BORDER) => ({
    top:    { style: BorderStyle.SINGLE, size: 4, color },
    bottom: { style: BorderStyle.SINGLE, size: 4, color },
    left:   { style: BorderStyle.SINGLE, size: 4, color },
    right:  { style: BorderStyle.SINGLE, size: 4, color },
  });

  const COL_WIDTH_MAP: Record<number, number[]> = {
    6: [2600, 1500, 1700, 1760, 1700, 3700],
    4: [4600, 3000, 3360, 2000],
    3: [4200, 1600, 7160],
  };
  const getColWidths = (colCount: number): number[] => {
    if (COL_WIDTH_MAP[colCount]) return COL_WIDTH_MAP[colCount];
    const base = Math.floor(CONTENT_WIDTH / colCount);
    const widths = Array(colCount).fill(base);
    widths[colCount - 1] = CONTENT_WIDTH - base * (colCount - 1);
    return widths;
  };
  const assertWidths = (widths: number[]) => {
    const sum = widths.reduce((a, b) => a + b, 0);
    if (sum !== CONTENT_WIDTH) {
      console.error(`[docx] Column widths sum to ${sum}, expected ${CONTENT_WIDTH}`, widths);
    }
  };

  const SCAFFOLD_RE = [/12960/i, /column widths sum/i, /Before generating/i, /Verify:/i];
  const isScaffold = (text: string) => SCAFFOLD_RE.some(p => p.test(text));

  const parseInlineRuns = (text: string, opts: { size?: number; color?: string; bold?: boolean } = {}): any[] => {
    const { size = 20, color = C_PRIMARY, bold = false } = opts;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({ text: part.slice(2, -2), bold: true, font: 'Arial', size, color });
      }
      return new TextRun({ text: part, bold, font: 'Arial', size, color });
    });
  };

  const buildDocxTable = (tableLines: string[]): any => {
    const nonSep = tableLines.filter(l => !/^\|[\s:|-]+\|$/.test(l.trim()));
    const rows = nonSep.map(l =>
      l.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
    ).filter(r => r.length > 0);
    if (rows.length === 0) return null;

    const colCount = rows[0].length;
    const WIDE_LAST_4_HEADERS = ['takeaway', 'conclusión', 'conclusion', 'resumen', 'nota', 'note'];
    const lastHeader = rows[0][colCount - 1]?.toLowerCase().trim() ?? '';
    const widths =
      colCount === 4 && WIDE_LAST_4_HEADERS.includes(lastHeader)
        ? [3400, 1700, 1400, 6460]
        : getColWidths(colCount);
    assertWidths(widths);

    const docxRows = rows.map((cells, rowIdx) => {
      const isHeader = rowIdx === 0;
      const isEvenBody = !isHeader && rowIdx % 2 === 0;
      const fillColor = isHeader ? C_HDR_FILL : isEvenBody ? C_ALT_FILL : C_WHITE;
      return new TableRow({
        tableHeader: isHeader,
        cantSplit: true,
        children: cells.map((cell, colIdx) => {
          const w = widths[colIdx] ?? Math.floor(CONTENT_WIDTH / colCount);
          return new TableCell({
            width: { size: w, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: fillColor, color: fillColor },
            borders: cellBorder(),
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: parseInlineRuns(cell, { size: 18, color: C_PRIMARY, bold: isHeader }),
              }),
            ],
          });
        }),
      });
    });

    return new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      layout: 'fixed' as any,
      rows: docxRows,
    });
  };

  // Strip blockquote markers and emoji before any further processing.
  // Preserve → (U+2192) and ★ (U+2605) — both are monochrome.
  const EMOJI_RE = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E0}-\u{1F1FF}]/gu;
  const normalizeDocxLine = (l: string): string => {
    // Strip leading blockquote marker (> or > with space)
    const dequoted = l.replace(/^>\s?/, '');
    // Strip emoji, then collapse any double spaces left behind
    return dequoted.replace(EMOJI_RE, '').replace(/  +/g, ' ');
  };

  const rawLines = markdown.split('\n').map(normalizeDocxLine);
  const lines = rawLines.filter(l => !isScaffold(l));

  type TableSpan = { start: number; end: number };
  const tableSpans: TableSpan[] = [];
  let spanStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const inTable = lines[i].trim().startsWith('|');
    if (inTable && spanStart === -1) spanStart = i;
    if (!inTable && spanStart !== -1) {
      tableSpans.push({ start: spanStart, end: i - 1 });
      spanStart = -1;
    }
  }
  if (spanStart !== -1) tableSpans.push({ start: spanStart, end: lines.length - 1 });

  const inTableLine = new Set<number>();
  tableSpans.forEach(({ start, end }) => {
    for (let i = start; i <= end; i++) inTableLine.add(i);
  });

  const children: any[] = [];
  let idx = 0;
  while (idx < lines.length) {
    const line = lines[idx];

    if (inTableLine.has(idx)) {
      const blockLines: string[] = [];
      while (idx < lines.length && inTableLine.has(idx)) {
        blockLines.push(lines[idx]);
        idx++;
      }
      const tbl = buildDocxTable(blockLines);
      if (tbl) children.push(tbl);
      children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
      continue;
    }

    if (line.startsWith('#### ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_4,
        children: [new TextRun({ text: line.slice(5), bold: true, font: 'Arial', size: 20, color: C_PRIMARY })],
      }));
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: line.slice(4), bold: true, font: 'Arial', size: 21, color: C_PRIMARY })],
      }));
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: line.slice(3), bold: true, font: 'Arial', size: 24, color: C_PRIMARY })],
      }));
    } else if (line.startsWith('# ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: line.slice(2), bold: true, font: 'Arial', size: 32, color: C_PRIMARY })],
      }));
    } else if (/^[-*] /.test(line)) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        children: parseInlineRuns(line.slice(2)),
      }));
    } else if (/^\d+\. /.test(line)) {
      const text = line.replace(/^\d+\. /, '');
      children.push(new Paragraph({
        numbering: { reference: 'report-list', level: 0 },
        children: parseInlineRuns(text),
      }));
    } else if (line.trim() === '---' || line.trim() === '***') {
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER } },
        children: [new TextRun({ text: '' })],
      }));
    } else if (line.trim() === '') {
      children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
    } else {
      children.push(new Paragraph({ children: parseInlineRuns(line) }));
    }

    idx++;
  }

  const headerChildren: any[] = [
    new Paragraph({
      children: [new TextRun({ text: meta.title, bold: true, font: 'Arial', size: 32, color: C_PRIMARY })],
    }),
    new Paragraph({
      children: [new TextRun({ text: meta.project, font: 'Arial', size: 22, color: C_PRIMARY })],
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER } },
      children: [new TextRun({ text: `${meta.date} · ${meta.versionCount} versiones evaluadas · Idioma: ${meta.displayLang}`, font: 'Arial', size: 18, color: C_MUTED })],
    }),
    new Paragraph({ children: [new TextRun({ text: '' })] }),
  ];

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'report-list',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 360 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: {
          options: {
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: meta.footerText,
                  font: 'Arial',
                  size: 16,
                  color: C_MUTED,
                })],
              }),
            ],
          },
        },
      },
      children: [...headerChildren, ...children],
    }],
  });

  return Packer.toBlob(doc);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CopyMakerSidebarProps {
  // Session section
  formState: FormState;
  hasPopulatedFields: boolean;
  onSaveSession?: () => void;
  onSaveTemplate?: () => void;
  onEvaluateInputs?: () => void;
  isEvaluating?: boolean;

  // Output section
  currentUser?: User;
  generatedOutputCards: GeneratedContentItem[];
  originalInputScore?: any;
  onSaveOutput: () => void;
  onViewPrompts: () => void;
  onGenerateFaqSchema: () => void;
  comparisonResult?: ComparisonResult | null;
  versionDeepAnalysis?: Record<string, VersionDeepAnalysis>;
  comparisonDeepAnalysisMeta?: ComparisonDeepAnalysisMeta;
  loadingVersionIds?: Set<string>;

  // Per-card actions
  sortedGeneratedVersions: GeneratedContentItem[];
  onAlternative: (item: GeneratedContentItem) => void;
  onRestyle: (item: GeneratedContentItem, persona: string, instructions?: string) => void;
  onScore: (item: GeneratedContentItem) => void;
  onModify: (item: GeneratedContentItem, instruction: string) => void;
  onDelete: (item: GeneratedContentItem) => void;
  onSaveAsBrandVoice?: (content: string) => void;
  onBoost?: (item: GeneratedContentItem) => void;
  onAddToComparison?: (card: GeneratedContentItem) => void;
  onUpdateCard?: (cardId: string, updates: Partial<GeneratedContentItem>) => void;
  onAddCards?: (items: GeneratedContentItem[], afterCardId?: string) => void;
  onCompareWithGrok?: (isIncremental?: boolean, scoringContext?: import('../../types').ScoringContext) => void;
  onBlendVersions?: () => void;
  isBlending?: boolean;
  onGenerateBestElements?: () => void;
  isGeneratingBestElements?: boolean;
  targetWordCount: number;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2.5 py-1 text-xs font-normal uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      <span>{label}</span>
      {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
    </button>
  );
}

function SidebarBtn({
  onClick,
  disabled,
  title,
  children,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-full flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-normal transition-colors text-left
        ${active
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
          : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
        }
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

// ─── Two-zone layout primitives (Task 1 redesign) ──────────────────────────────

interface ZoneTheme {
  accent: string;
  bg: string;
  border: string;
}

const SESSION_ZONE: ZoneTheme = { accent: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
const VERSION_ZONE: ZoneTheme = { accent: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
const ADMIN_ZONE: ZoneTheme   = { accent: '#ff6b35', bg: '#fff4ed', border: '#ffe4d5' };

function ZoneHeader({ label, theme }: { label: string; theme: ZoneTheme }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 border-b"
      style={{ borderColor: theme.border, background: theme.bg }}
    >
      <span className="inline-block w-1 h-2.5 rounded-sm" style={{ background: theme.accent }} />
      <span
        className="font-semibold uppercase"
        style={{ color: theme.accent, fontSize: '10.5px', letterSpacing: '0.06em' }}
      >
        {label}
      </span>
    </div>
  );
}

// Zone item — matches the new typography: Inter 300 12.5–13px; bumps to 400 +
// white bg + shadow when its dropdown is open.
function ZoneItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
  expanded,
  trailing,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  expanded?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors"
      style={{
        fontWeight: expanded ? 400 : 300,
        fontSize: '12.5px',
        color: disabled ? '#9ca3af' : '#374151',
        background: expanded ? '#ffffff' : 'transparent',
        boxShadow: expanded ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
        border: expanded ? '1px solid #e5e7eb' : '1px solid transparent',
      }}
    >
      <Icon size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
      <span className="flex-1 truncate">{label}</span>
      {trailing}
    </button>
  );
}

// Inline flyout for ≤3-option dropdowns (Save, Score, Copy).
function InlineFlyout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-6 pl-2 border-l border-gray-200 dark:border-gray-700 space-y-px py-0.5">
      {children}
    </div>
  );
}

function FlyoutOption({
  label,
  onClick,
  disabled,
  title,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-full flex items-center px-2 py-0.5 rounded text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ fontSize: '11.5px', fontWeight: 300, color: '#4b5563' }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      {label}
    </button>
  );
}

// ─── Improve Modal ────────────────────────────────────────────────────────────

interface ImproveModalProps {
  copyName: string;
  onApply: (instruction: string) => void;
  onClose: () => void;
}

const ImproveModal: React.FC<ImproveModalProps> = ({ copyName, onApply, onClose }) => {
  const [instruction, setInstruction] = useState('');

  const handleApply = () => {
    if (!instruction.trim()) return;
    onApply(instruction.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={e => { e.preventDefault(); onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md mx-4 p-6"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Improve this copy</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">{copyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <textarea
          rows={5}
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder="Describe how to improve this copy…"
          autoFocus
          className="w-full text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500"
        />
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleApply}
            disabled={!instruction.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Change Voice Modal ───────────────────────────────────────────────────────

interface VoiceModalProps {
  copyName: string;
  onApply: (persona: string, instructions?: string) => void;
  onClose: () => void;
}

const VoiceModal: React.FC<VoiceModalProps> = ({ copyName, onApply, onClose }) => {
  const [selectedPersona, setSelectedPersona] = useState('');
  const [voiceInstructions, setVoiceInstructions] = useState('');

  const handleApply = () => {
    if (!selectedPersona) return;
    onApply(selectedPersona, voiceInstructions || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={e => { e.preventDefault(); onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md mx-4 p-6"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Change Voice</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">{copyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <select
          value={selectedPersona}
          onChange={e => setSelectedPersona(e.target.value)}
          className="w-full text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 mb-3"
        >
          <option value="">Select a voice…</option>
          {CATEGORIZED_VOICE_STYLES.map(group => (
            <optgroup key={group.category} label={group.category}>
              {group.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <textarea
          rows={3}
          value={voiceInstructions}
          onChange={e => setVoiceInstructions(e.target.value)}
          placeholder="Optional: additional instructions…"
          className="w-full text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500"
        />
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedPersona}
            className="flex-1 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Per-card sub-sections ────────────────────────────────────────────────────

interface CardActionsProps {
  card: GeneratedContentItem;
  formState: FormState;
  allCards: GeneratedContentItem[];
  comparisonResult?: ComparisonResult | null;
  versionScores?: any;
  onAlternative: () => void;
  onScore: () => void;
  onModify: (item: GeneratedContentItem, instruction: string) => void;
  onRestyle: (item: GeneratedContentItem, persona: string, instructions?: string) => void;
  onSaveAsBrandVoice?: (content: string) => void;
  onBoost?: () => void;
  targetWordCount: number;
  currentUser?: User;
  isBlending?: boolean;
  onUpdateCard?: (cardId: string, updates: Partial<GeneratedContentItem>) => void;
  onAddCards?: (items: GeneratedContentItem[], afterCardId?: string) => void;
}

const CardActions: React.FC<CardActionsProps> = ({
  card,
  formState,
  allCards,
  comparisonResult,
  versionScores,
  onAlternative,
  onScore,
  onModify,
  onRestyle,
  onSaveAsBrandVoice,
  onBoost,
  targetWordCount,
  currentUser,
  isBlending,
  onUpdateCard,
  onAddCards,
}) => {
  // All sub-sections collapsed by default
  const [scoreOpen, setScoreOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  // SEO analysis state — mirrors GeneratedCopyCard exactly
  const [isGeneratingSeoMetadata, setIsGeneratingSeoMetadata] = useState(false);
  const [showSeoProcessingModal, setShowSeoProcessingModal] = useState(false);
  const [showSeoOptionsModal, setShowSeoOptionsModal] = useState(false);
  const seoAbortControllerRef = useRef<AbortController | null>(null);

  // Content score state
  const [isGeneratingContentScore, setIsGeneratingContentScore] = useState(false);
  const [showContentScoreProcessingModal, setShowContentScoreProcessingModal] = useState(false);
  const contentScoreAbortControllerRef = useRef<AbortController | null>(null);

  // GEO score state
  const [isGeneratingGeoScore, setIsGeneratingGeoScore] = useState(false);
  const [showGeoProcessingModal, setShowGeoProcessingModal] = useState(false);
  const geoAbortControllerRef = useRef<AbortController | null>(null);

  // GEO Generate modal state
  const [showGeoGenerateModal, setShowGeoGenerateModal] = useState(false);
  const [isGeneratingGeo, setIsGeneratingGeo] = useState(false);
  const ALL_GEO_ELEMENTS: GeoGenerateElement[] = [
    'tldr', 'faq', 'questionHeadings', 'bulletSummary',
    'authoritySnippets', 'quoteReady', 'localVariations',
  ];
  const GEO_ELEMENT_LABELS: Record<GeoGenerateElement, string> = {
    tldr: 'TL;DR / Answer Box',
    faq: 'FAQ Block',
    questionHeadings: 'Question-Based Headings',
    bulletSummary: 'Bullet Point Summary',
    authoritySnippets: 'Authority Snippets',
    quoteReady: 'Quote-Ready Sentences',
    localVariations: 'Local Signal Variations',
  };
  const [geoSelectedElements, setGeoSelectedElements] = useState<GeoGenerateElement[]>(ALL_GEO_ELEMENTS);
  const [geoTargetRegions, setGeoTargetRegions] = useState('');

  const handleGeoGenerateRun = async () => {
    if (!currentUser) { toast.error('Please log in to use GEO Generate'); return; }
    if (geoSelectedElements.length === 0) { toast.error('Select at least one element'); return; }
    setShowGeoGenerateModal(false);
    setIsGeneratingGeo(true);
    try {
      const items = await generateGeoContent({
        sourceCard: card,
        selectedElements: geoSelectedElements,
        targetRegions: geoTargetRegions.trim() || undefined,
        formState,
        currentUser,
        sessionId: formState.sessionId,
      });
      if (onAddCards) onAddCards(items, card.id);
      toast.success(`${items.length} GEO element${items.length !== 1 ? 's' : ''} generated`);
    } catch (err: any) {
      toast.error('GEO Generate failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setIsGeneratingGeo(false);
    }
  };

  const handleGenerateSeoMetadata = async (options: SeoGenerationOptions) => {
    if (!currentUser) { toast.error('Please log in to generate SEO metadata'); return; }
    setIsGeneratingSeoMetadata(true);
    setShowSeoProcessingModal(true);
    seoAbortControllerRef.current = new AbortController();
    try {
      const customFormState = {
        ...formState,
        numUrlSlugs: options.numUrlSlugs,
        numMetaDescriptions: options.numMetaDescriptions,
        numH1Variants: options.numH1Variants,
        numH2Variants: options.numH2Headings,
        numH3Variants: options.numH3Headings,
        numOgTitles: options.numOgTitles,
        numOgDescriptions: options.numOgDescriptions,
      };
      const metadata = await generateSeoMetadata(card.content, customFormState, currentUser, undefined, formState.sessionId, options);
      if (!seoAbortControllerRef.current?.signal.aborted) {
        if (onUpdateCard) {
          onUpdateCard(card.id, {
            seoMetadata: metadata,
            seoGenerationOptions: {
              urlSlugsEnabled: options.urlSlugsEnabled,
              metaDescriptionsEnabled: options.metaDescriptionsEnabled,
              h1VariantsEnabled: options.h1VariantsEnabled,
              h2HeadingsEnabled: options.h2HeadingsEnabled,
              h3HeadingsEnabled: options.h3HeadingsEnabled,
              ogTitlesEnabled: options.ogTitlesEnabled,
              ogDescriptionsEnabled: options.ogDescriptionsEnabled,
            },
          });
        }
        toast.success('SEO metadata generated successfully');
      }
    } catch (error: any) {
      if (!seoAbortControllerRef.current?.signal.aborted) {
        toast.error('Failed to generate SEO metadata: ' + (error?.message ?? 'Unknown error'));
      }
    } finally {
      setIsGeneratingSeoMetadata(false);
      setShowSeoProcessingModal(false);
      seoAbortControllerRef.current = null;
    }
  };

  const handleSeoOptionsConfirm = (options: SeoGenerationOptions) => {
    setShowSeoOptionsModal(false);
    handleGenerateSeoMetadata(options);
  };

  const handleGenerateContentScore = async () => {
    if (!currentUser) { toast.error('Please log in to generate content score'); return; }
    setIsGeneratingContentScore(true);
    setShowContentScoreProcessingModal(true);
    contentScoreAbortControllerRef.current = new AbortController();
    try {
      const contentScore = await generateContentScores(
        card.content, card.type, formState.model, currentUser,
        undefined, calculateTargetWordCount(formState).target, formState.sessionId, undefined,
      );
      if (!contentScoreAbortControllerRef.current?.signal.aborted) {
        if (onUpdateCard) onUpdateCard(card.id, { score: contentScore });
        toast.success('Content score generated successfully');
      }
    } catch (error: any) {
      if (!contentScoreAbortControllerRef.current?.signal.aborted) {
        toast.error('Failed to generate content score: ' + (error?.message ?? 'Unknown error'));
      }
    } finally {
      setIsGeneratingContentScore(false);
      setShowContentScoreProcessingModal(false);
      contentScoreAbortControllerRef.current = null;
    }
  };

  const handleGenerateGeoScore = async () => {
    if (!currentUser) { toast.error('Please log in to generate GEO score'); return; }
    setIsGeneratingGeoScore(true);
    setShowGeoProcessingModal(true);
    geoAbortControllerRef.current = new AbortController();
    try {
      const geoScore = await calculateGeoScore(card.content, formState, currentUser, undefined, formState.sessionId);
      if (!geoAbortControllerRef.current?.signal.aborted) {
        if (onUpdateCard) onUpdateCard(card.id, { geoScore });
        toast.success('GEO score generated successfully');
      }
    } catch (error: any) {
      if (!geoAbortControllerRef.current?.signal.aborted) {
        toast.error('Failed to generate GEO score: ' + (error?.message ?? 'Unknown error'));
      }
    } finally {
      setIsGeneratingGeoScore(false);
      setShowGeoProcessingModal(false);
      geoAbortControllerRef.current = null;
    }
  };

  const anyAnalysisRunning = isGeneratingSeoMetadata || isGeneratingContentScore || isGeneratingGeoScore;

  // Modals
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const { isAdmin } = useIsAdmin(currentUser);

  // ── contentDetails (same logic as GeneratedCopyCard) ─────────────────────
  const contentDetails = React.useMemo(() => {
    if (card.content === null || card.content === undefined) {
      return { text: '', isHeadlines: false };
    }
    let actual: any = card.content;
    if (typeof card.content === 'object' && card.content !== null && 'content' in card.content) {
      actual = (card.content as any).content;
    }
    if (typeof actual === 'string') {
      return { text: stripMarkdown(actual), isHeadlines: false };
    }
    if (Array.isArray(actual)) {
      return { text: actual.join('\n'), isHeadlines: true };
    }
    if (actual && typeof actual === 'object' && 'headline' in actual && 'sections' in actual) {
      let t = stripMarkdown(actual.headline) + '\n\n';
      (actual.sections || []).forEach((s: any) => {
        if (s?.title) t += stripMarkdown(s.title) + '\n';
        if (s?.content) t += stripMarkdown(s.content) + '\n\n';
      });
      return { text: t, isHeadlines: false };
    }
    return { text: JSON.stringify(actual), isHeadlines: false };
  }, [card.content, card.type]);

  // ── Visibility flags (same as GeneratedCopyCard) ──────────────────────────
  const cardSeoMetadata = card.seoMetadata;
  const cardScore = card.score;
  const cardGeoScore = card.geoScore;

  const showAlternativeButton =
    card.type !== GeneratedContentItemType.SeoMetadata &&
    card.type !== GeneratedContentItemType.Original;

  const showBoostButton =
    card.type !== GeneratedContentItemType.SeoMetadata &&
    card.type !== GeneratedContentItemType.Original &&
    card.type !== GeneratedContentItemType.FaqSchema &&
    !card.comparedContent &&
    !!onBoost;

  const boostBaseName = card.baseName || card.sourceDisplayName || card.type;
  const existingBoostCount = allCards.filter(
    (v) =>
      v.type === GeneratedContentItemType.Boosted &&
      (v.parentOutputId === card.id || (v as any).baseName === boostBaseName),
  ).length;
  const boostLimitReached = existingBoostCount >= MAX_BOOST_ITERATIONS;
  const cardFinalScore = versionScores?.[card.id]?.finalScore;
  const scoreAtMax =
    typeof cardFinalScore === 'number' && cardFinalScore >= MAX_BOOST_SCORE_THRESHOLD * 10;
  const boostDisabled = formState.isLoading || boostLimitReached || scoreAtMax;

  const hasGeoPackage = allCards.some(
    (v) =>
      v.type === GeneratedContentItemType.GeoOptimized &&
      v.sourceDisplayName?.includes(card.sourceDisplayName || ''),
  );

  const isBlendedOutput = !!card.blendInstructions;
  const showSeoButton =
    !cardSeoMetadata &&
    (isBlendedOutput || !formState.generateSeoMetadata || card.analysisMode !== 'batch');
  const showContentScoreButton =
    !cardScore &&
    (isBlendedOutput || !formState.generateScores || card.analysisMode !== 'batch');
  const showGeoScoreButton =
    !cardGeoScore &&
    (isBlendedOutput || !formState.generateGeoScore || card.analysisMode !== 'batch');
  const missingCount = [showContentScoreButton, showGeoScoreButton].filter(Boolean).length;

  // ── Copy handlers (same as GeneratedCopyCard) ─────────────────────────────
  const handleCopy = () => {
    let text = contentDetails.text;
    if (card.comparedContent) {
      const label =
        isAdmin && (card as any).analysisModel
          ? ` (${(card as any).analysisModel === 'gpt-4o' ? 'GPT-4o' : 'DeepSeek'})`
          : '';
      text = `AI Analysis Summary${label}:\n\n${text}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHtml = () => {
    let html = formatSingleGeneratedItemContentAsHTML(card);
    if (card.comparedContent) {
      const modelLabel =
        isAdmin && (card as any).analysisModel
          ? ` (${(card as any).analysisModel === 'gpt-4o' ? 'GPT-4o' : 'DeepSeek'})`
          : '';
      const formatted = markdownToHtml(contentDetails.text);
      html = `<div style="font-family:system-ui,sans-serif;padding:20px"><h3 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 20px 0">AI Analysis Summary${modelLabel}</h3><div>${formatted}</div></div>`;
    }
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleCopyMd = () => {
    const md = formatSingleGeneratedItemAsMarkdown(card, targetWordCount);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const isAnalysisCard =
    card.sourceDisplayName?.includes('Analysis') ||
    card.sourceDisplayName?.includes('Comparison');

  const isGeoCard = [
    GeneratedContentItemType.GeoOptimized,
    GeneratedContentItemType.GeoTldr,
    GeneratedContentItemType.GeoFaqBlock,
    GeneratedContentItemType.GeoQuestionHeadings,
    GeneratedContentItemType.GeoBulletSummary,
    GeneratedContentItemType.GeoAuthoritySnippets,
    GeneratedContentItemType.GeoQuoteReady,
    GeneratedContentItemType.GeoLocalVariations,
  ].includes(card.type);

  const canCreate = !isAnalysisCard && !isGeoCard && card.type !== GeneratedContentItemType.Original;

  return (
    <div className="space-y-px pb-1">
      {/* 1. New Version */}
      {canCreate && showAlternativeButton && (
        <SidebarBtn onClick={onAlternative} title="Create a new version">
          <Wand2 size={10} />
          New Version
        </SidebarBtn>
      )}

      {/* 2. Improve */}
      {canCreate && (
        <SidebarBtn onClick={() => setShowImproveModal(true)} title="Improve this copy">
          <Edit size={10} />
          Improve
        </SidebarBtn>
      )}

      {/* 3. Change Voice */}
      {canCreate && !contentDetails.isHeadlines && (
        <SidebarBtn onClick={() => setShowVoiceModal(true)} title="Apply a different voice style">
          <Sparkles size={10} />
          Change Voice
        </SidebarBtn>
      )}

      {/* 4. Boost */}
      {canCreate && showBoostButton && (
        <SidebarBtn
          onClick={onBoost!}
          disabled={boostDisabled}
          title={
            boostLimitReached
              ? `Max ${MAX_BOOST_ITERATIONS} boosts reached`
              : scoreAtMax
              ? 'Score already at max'
              : 'Generate a performance-optimized version'
          }
        >
          <Zap size={10} />
          Enhance
        </SidebarBtn>
      )}

      {/* 5. Generate SEO Metadata */}
      {!isGeoCard && showSeoButton && (
        <SidebarBtn onClick={() => setShowSeoOptionsModal(true)} disabled={anyAnalysisRunning} title="Generate SEO metadata">
          <Globe size={10} />
          {isGeneratingSeoMetadata ? 'Generating…' : 'SEO Metadata'}
        </SidebarBtn>
      )}

      {/* 6. Generate GEO Elements */}
      {!isGeoCard && !hasGeoPackage && (
        <SidebarBtn onClick={() => setShowGeoGenerateModal(true)} disabled={anyAnalysisRunning || isGeneratingGeo} title="Generate GEO content elements">
          <Globe size={10} />
          {isGeneratingGeo ? 'Generating…' : 'GEO Generate'}
        </SidebarBtn>
      )}

      {/* 7. Score — inline dropdown (not a section header) */}
      {(showContentScoreButton || showGeoScoreButton) && (
        missingCount >= 2 ? (
          <>
            <ZoneItem
              icon={Gauge}
              label="Score"
              onClick={() => setScoreOpen(o => !o)}
              expanded={scoreOpen}
              title="Choose scoring scope"
              trailing={<ChevronDown size={10} className={scoreOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />}
            />
            {scoreOpen && (
              <InlineFlyout>
                <FlyoutOption
                  label="Content + GEO"
                  onClick={async () => {
                    if (showContentScoreButton) await handleGenerateContentScore();
                    if (showGeoScoreButton) await handleGenerateGeoScore();
                  }}
                  disabled={anyAnalysisRunning}
                />
                {showContentScoreButton && (
                  <FlyoutOption label="Content only" onClick={handleGenerateContentScore} disabled={anyAnalysisRunning} />
                )}
                {showGeoScoreButton && (
                  <FlyoutOption label="GEO only" onClick={handleGenerateGeoScore} disabled={anyAnalysisRunning} />
                )}
              </InlineFlyout>
            )}
          </>
        ) : showContentScoreButton ? (
          <SidebarBtn onClick={handleGenerateContentScore} disabled={anyAnalysisRunning} title="Generate content score">
            <Gauge size={10} />
            {isGeneratingContentScore ? 'Scoring…' : 'Score'}
          </SidebarBtn>
        ) : showGeoScoreButton ? (
          <SidebarBtn onClick={handleGenerateGeoScore} disabled={anyAnalysisRunning} title="Generate GEO score">
            <Gauge size={10} />
            {isGeneratingGeoScore ? 'Scoring…' : 'GEO Score'}
          </SidebarBtn>
        ) : null
      )}

      {/* 8. Copy — inline dropdown (not a section header) */}
      <ZoneItem
        icon={Copy}
        label={copied ? 'Copied!' : 'Copy'}
        onClick={() => setCopyOpen(o => !o)}
        expanded={copyOpen}
        title="Choose copy format"
        trailing={copied ? <Check size={10} className="text-gray-500 dark:text-gray-400" /> : <ChevronDown size={10} className={copyOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />}
      />
      {copyOpen && (
        <InlineFlyout>
          <FlyoutOption label="Plain text" onClick={handleCopy} />
          <FlyoutOption label="HTML" onClick={handleCopyHtml} />
          <FlyoutOption label="Markdown" onClick={handleCopyMd} />
        </InlineFlyout>
      )}

      {/* Save as Brand Voice — preserved (not in the 8-item spec; removing would be a behavior change) */}
      {onSaveAsBrandVoice && (
        <SidebarBtn onClick={() => onSaveAsBrandVoice(contentDetails.text)} title="Save as Brand Voice profile">
          <BookOpen size={10} />
          Save as Brand Voice
        </SidebarBtn>
      )}

      {/* ── Modals / portals (all preserved unchanged) ────────────────────────── */}
      {showSeoOptionsModal && ReactDOM.createPortal(
        <SeoGenerationOptionsModal
          isOpen={showSeoOptionsModal}
          onClose={() => setShowSeoOptionsModal(false)}
          onConfirm={handleSeoOptionsConfirm}
        />,
        document.body
      )}
      {showSeoProcessingModal && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={showSeoProcessingModal}
          message="Generating SEO Metadata"
          onCancel={() => { seoAbortControllerRef.current?.abort(); }}
        />,
        document.body
      )}

      {/* GEO Generate modal */}
      {showGeoGenerateModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">GEO Generate</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                {card.sourceDisplayName || card.type}
              </p>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select the GEO elements to generate from this card's content.
              </p>
              <div className="space-y-2">
                {ALL_GEO_ELEMENTS.map(el => (
                  <label key={el} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={geoSelectedElements.includes(el)}
                      onChange={e => {
                        setGeoSelectedElements(prev =>
                          e.target.checked ? [...prev, el] : prev.filter(x => x !== el)
                        );
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {GEO_ELEMENT_LABELS[el]}
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Countries or Regions
                </label>
                <input
                  type="text"
                  value={geoTargetRegions}
                  onChange={e => setGeoTargetRegions(e.target.value)}
                  placeholder="e.g. México, LATAM, Barcelona"
                  className="w-full text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <button
                type="button"
                onClick={handleGeoGenerateRun}
                disabled={geoSelectedElements.length === 0}
                className="flex-1 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => setShowGeoGenerateModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isGeneratingGeo && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={isGeneratingGeo}
          message="Generating GEO content…"
          onCancel={() => {}}
        />,
        document.body
      )}


      {showContentScoreProcessingModal && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={showContentScoreProcessingModal}
          message="Generating Content Score"
          onCancel={() => { contentScoreAbortControllerRef.current?.abort(); }}
        />,
        document.body
      )}
      {showGeoProcessingModal && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={showGeoProcessingModal}
          message="Generating GEO Score"
          onCancel={() => { geoAbortControllerRef.current?.abort(); }}
        />,
        document.body
      )}
      {showImproveModal && ReactDOM.createPortal(
        <ImproveModal
          copyName={card.sourceDisplayName || card.type}
          onApply={(instruction) => onModify(card, instruction)}
          onClose={() => setShowImproveModal(false)}
        />,
        document.body
      )}
      {showVoiceModal && ReactDOM.createPortal(
        <VoiceModal
          copyName={card.sourceDisplayName || card.type}
          onApply={(persona, instructions) => onRestyle(card, persona, instructions)}
          onClose={() => setShowVoiceModal(false)}
        />,
        document.body
      )}


    </div>
  );
};

// ─── Shared nav helpers ───────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface RecentNavItem { id: string; label: string; date: string; }

const LazyNavDropdown: React.FC<{
  label: string;
  loadItems: () => Promise<RecentNavItem[]>;
  onSelect: (item: RecentNavItem) => void;
}> = ({ label, loadItems, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RecentNavItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (next && items === null) {
      setLoading(true);
      try { setItems(await loadItems()); } finally { setLoading(false); }
    }
  }, [open, items, loadItems]);

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-1.5 py-1 rounded text-left transition-colors"
        style={{ paddingLeft: '22px', color: '#9ca3af' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f97316'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
      >
        <ChevronRight size={9} style={{ flexShrink: 0, transition: 'transform 150ms', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }} />
        <span style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
      </button>
      {open && (
        <div style={{ paddingLeft: '34px' }} className="pb-0.5">
          {loading ? (
            <div className="flex items-center gap-1.5 py-1">
              <Loader2 size={9} className="animate-spin text-gray-400" />
              <span style={{ fontSize: '9px', color: '#9ca3af' }}>Loading…</span>
            </div>
          ) : items && items.length > 0 ? (
            items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setOpen(false); onSelect(item); }}
                className="w-full text-left py-0.5 rounded transition-colors"
                style={{ color: '#9ca3af' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f97316'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
              >
                <div style={{ fontSize: '9px', fontWeight: 500 }} className="truncate leading-tight">{item.label}</div>
                <div style={{ fontSize: '8px', color: '#6b7280' }}>{item.date}</div>
              </button>
            ))
          ) : (
            <p style={{ fontSize: '9px', color: '#6b7280' }} className="py-0.5 italic">
              {label === 'Recent Projects' ? 'No saved projects yet' : 'No sessions yet'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main sidebar ──────────────────────────────────────────────────────────────

const CopyMakerSidebar: React.FC<CopyMakerSidebarProps> = ({
  formState,
  hasPopulatedFields,
  onSaveSession,
  onSaveTemplate,
  onEvaluateInputs,
  isEvaluating = false,
  currentUser,
  generatedOutputCards,
  originalInputScore,
  onSaveOutput,
  onViewPrompts,
  onGenerateFaqSchema,
  comparisonResult,
  versionDeepAnalysis,
  comparisonDeepAnalysisMeta,
  loadingVersionIds,
  sortedGeneratedVersions,
  onAlternative,
  onRestyle,
  onScore,
  onModify,
  onDelete,
  onSaveAsBrandVoice,
  onBoost,
  onAddToComparison,
  onUpdateCard,
  onAddCards,
  onCompareWithGrok,
  onBlendVersions,
  isBlending,
  onGenerateBestElements,
  isGeneratingBestElements,
  targetWordCount,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  // Two-zone redesign: per-zone dropdown state. Legacy section-collapse state removed.
  const [saveOpen, setSaveOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [combineOpen, setCombineOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rescoringCardIds, setRescoringCardIds] = useState<Set<string>>(new Set());

  const SIDEBAR_WIDTH_KEY = 'copyzap_sidebar_width';
  const MIN_WIDTH = 160;
  const MAX_WIDTH = 400;
  const DEFAULT_WIDTH = 224;

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      if (saved) {
        const n = parseInt(saved, 10);
        if (!isNaN(n) && n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
      }
    } catch { /* ignore */ }
    return DEFAULT_WIDTH;
  });

  const isDragging = useRef(false);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = (ev: MouseEvent) => {
      isDragging.current = false;
      const finalWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX));
      setSidebarWidth(finalWidth);
      try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(finalWidth)); } catch { /* ignore */ }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);


  // Each card group starts collapsed
  const [cardGroupOpen, setCardGroupOpen] = useState<Record<string, boolean>>({});

  const cardIds = sortedGeneratedVersions
    .filter(card => card.type !== GeneratedContentItemType.GeoOptimized)
    .map(card => card.id);

  const activeCardId = useActiveCard(cardIds);

  useEffect(() => {
    if (activeCardId) {
      setCardGroupOpen(() => {
        const next: Record<string, boolean> = {};
        cardIds.forEach(id => {
          next[id] = id === activeCardId;
        });
        return next;
      });
    }
  }, [activeCardId]);

  const { isAdmin } = useIsAdmin(currentUser);

  const loadRecentProjects = useCallback(async (): Promise<RecentNavItem[]> => {
    if (!currentUser?.id) return [];
    // Recent Projects shows 10. The metadata query excludes the heavy JSONB
    // columns, so ten rows cost about the same as five.
    const { data } = await getUserSavedOutputsMeta(currentUser.id, 10);
    if (!data) return [];
    return (data as any[]).map((o: any) => ({
      id: o.id,
      label: o.title || 'Untitled',
      date: relativeTime(o.created_at),
    }));
  }, [currentUser?.id]);

  const loadRecentSessions = useCallback(async (): Promise<RecentNavItem[]> => {
    if (!currentUser?.id) return [];
    const { data } = await getUserCopySessions(currentUser.id, 5);
    if (!data) return [];
    return (data as any[])
      .filter((s: any) => s.scope_key === 'copy-maker' || !s.scope_key)
      .slice(0, 5)
      .map((s: any) => ({
        id: s.id,
        label: s.session_name || s.name || 'Untitled session',
        date: relativeTime(s.created_at),
      }));
  }, [currentUser?.id]);

  const hasContent =
    (generatedOutputCards && generatedOutputCards.length > 0) || !!originalInputScore;

  // ── Export handlers ───────────────────────────────────────────────────────
  const handleCopyAllMarkdown = () => {
    try {
      const md = formatAsEnhancedMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
      );
      navigator.clipboard.writeText(md);
      toast.success('Content copied as Markdown!');
    } catch {
      toast.error('Failed to copy content as Markdown');
    }
  };

  const handleExportToHtml = () => {
    try {
      exportAsFormattedHtml(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
        loadingVersionIds,
      );
      toast.success('Content exported as formatted HTML!');
    } catch {
      toast.error('Failed to export content as HTML');
    }
  };

  const handleOpenHtmlPreviewModal = () => {
    setShowHtmlPreviewModal(true);
  };

  const handleConfirmHtmlPreviewExport = (percent: number) => {
    setShowHtmlPreviewModal(false);
    try {
      exportAsFormattedHtml(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
        loadingVersionIds,
        percent,
      );
      toast.success(`Content exported as HTML preview (${percent}%)!`);
    } catch {
      toast.error('Failed to export content as HTML preview');
    }
  };

  const [isGeneratingHtmlPreview2, setIsGeneratingHtmlPreview2] = useState(false);
  // Report export UI state. The progress modal blocks the app while an AI call
  // is in flight; the audit modal collects the operator's decision afterwards.
  const [reportStep, setReportStep] = useState(0);
  const [reportCancelling, setReportCancelling] = useState(false);
  const [auditIssues, setAuditIssues] = useState<AuditIssue[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  // Set when Cancel is pressed. An AI request already in flight cannot be
  // recalled, so the flow checks this at each step boundary and stops before
  // doing anything further — no file is written and no tone plays.
  const reportCancelledRef = useRef(false);
  // Resolves the promise the export flow awaits while the audit modal is open.
  const auditDecisionRef = useRef<((proceed: boolean) => void) | null>(null);

  const canExportHtmlPreview2 = Boolean(
    comparisonResult?.rows?.length && generatedOutputCards.length,
  );

  /** Resolved by the audit modal buttons. */
  const askAuditDecision = (issues: AuditIssue[]) =>
    new Promise<boolean>(resolve => {
      auditDecisionRef.current = resolve;
      setAuditIssues(issues);
      setAuditOpen(true);
    });

  const closeAuditModal = (proceed: boolean) => {
    setAuditOpen(false);
    const resolve = auditDecisionRef.current;
    auditDecisionRef.current = null;
    resolve?.(proceed);
  };

  const handleExportHtmlPreview2 = async () => {
    if (!canExportHtmlPreview2 || isGeneratingHtmlPreview2) return;
    reportCancelledRef.current = false;
    setReportCancelling(false);
    setReportStep(0);
    setIsGeneratingHtmlPreview2(true);
    // Returns true when the operator cancelled, so each step can bail out.
    const cancelled = () => reportCancelledRef.current;
    try {
      // 1 ── narrative (the slow part: one AI call, up to ~60s)
      const narrative = await generateClientReportNarrative(
        formState,
        generatedOutputCards,
        comparisonResult,
        versionDeepAnalysis,
      );
      if (cancelled()) return;

      // 2 ── build
      setReportStep(1);
      const data = buildClientReportData(
        formState,
        generatedOutputCards,
        originalInputScore,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
        narrative,
      );
      if (cancelled()) return;

      // 3 ── audit. Every defect found in the August review shipped behind a
      // green success toast: an AI sub-call failed, the pipeline continued, and
      // a polished-looking report reached the client. This inspects the
      // finished data and names what is wrong BEFORE the download.
      //
      // It only reads — it never fixes, omits or blocks. The operator decides.
      setReportStep(2);
      const issues = auditReportData(data, data.sourceText);
      if (cancelled()) return;

      // The work is done at this point — whether or not a file gets written.
      // The tone marks the end of the wait, so it must also fire when the run
      // stops at the audit modal: that is precisely when the operator has
      // looked away and needs calling back.
      playReportReadyTone();

      if (issues.length) {
        console.warn('[clientReport] pre-export audit', issues);
        // Hide the progress modal while the decision is pending, otherwise two
        // dialogs stack on top of each other.
        setIsGeneratingHtmlPreview2(false);
        const proceed = await askAuditDecision(issues);
        if (!proceed) {
          toast('Export cancelled. Fix the items above and export again.', { icon: '🛑', duration: 8000 });
          return;
        }
        setIsGeneratingHtmlPreview2(true);
      }

      // 4 ── render + download
      setReportStep(3);
      const html = renderClientReport(data);
      const filename = buildClientReportFilename(data);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (issues.length) {
        toast(
          `Report exported WITH ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} — review it before sending.`,
          { icon: '⚠️', duration: 12000 },
        );
      } else {
        toast.success('Copy report exported');
      }
    } catch (err: any) {
      if (!reportCancelledRef.current) {
        toast.error('Could not export the report: ' + (err?.message ?? 'unknown error'));
      }
    } finally {
      setIsGeneratingHtmlPreview2(false);
      setReportCancelling(false);
      setReportStep(0);
    }
  };

  const handleCancelReport = () => {
    reportCancelledRef.current = true;
    setReportCancelling(true);
    toast('Cancelling… it will stop as soon as the current step finishes.', { icon: '🛑', duration: 6000 });
  };

  const handleExportLLMEval = () => {
    try {
      exportLLMEvaluationMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
      );
      toast.success('LLM Evaluation file exported!');
    } catch {
      toast.error('Failed to export LLM evaluation file');
    }
  };

  const handleExportLLMAudit = () => {
    try {
      exportLLMEvaluationAudit(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
      );
      toast.success('LLM Evaluation Audit file exported!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to export audit file';
      toast.error(msg, { duration: msg.includes('complete evaluation data') ? 6000 : 4000 });
    }
  };

  // ── Evaluation Report state ───────────────────────────────────────────────
  const SCAFFOLD_PATTERNS = [/12960/i, /column widths sum/i, /Before generating/i, /Verify:/i];
  const filterScaffoldingLines = (html: string): string =>
    html.split('\n').filter(line => !SCAFFOLD_PATTERNS.some(p => p.test(line))).join('\n');
  const [isGeneratingEvalReport, setIsGeneratingEvalReport] = useState(false);
  const [evalReportMarkdown, setEvalReportMarkdown] = useState<string | null>(null);
  const [evalReportFilename, setEvalReportFilename] = useState<string>('');
  const [showEvalPreview, setShowEvalPreview] = useState(false);
  const [showHtmlPreviewModal, setShowHtmlPreviewModal] = useState(false);

  const [isGeneratingCompareReport, setIsGeneratingCompareReport] = useState(false);
  const [compareReportMarkdown, setCompareReportMarkdown] = useState<string | null>(null);
  const [compareReportFilename, setCompareReportFilename] = useState<string>('');
  const [showComparePreview, setShowComparePreview] = useState(false);

  const [isGeneratingClientReport, setIsGeneratingClientReport] = useState(false);
  const [clientReportMarkdown, setClientReportMarkdown] = useState<string | null>(null);
  const [clientReportFilename, setClientReportFilename] = useState<string>('');
  const [showClientPreview, setShowClientPreview] = useState(false);
  const [includeInternalSection, setIncludeInternalSection] = useState(false);

  const handleGenerateEvalReport = async () => {
    setIsGeneratingEvalReport(true);
    try {
      const { markdown: evalContent, filename: evalFilename } = buildLLMEvaluationMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
      );

      const language = formState.language;
      const languageDirective = language
        ? `IMPORTANT: Write the entire report in ${language}. Every heading, table header, and sentence must be in ${language}.\n\n`
        : '';
      const llmInput = languageDirective + evalPrompt + '\n\n' + evalContent;

      const reportMarkdown = await makeStreamingReportRequest(
        getAdminClaudeModel(),
        [{ role: 'user', content: llmInput }],
        0.4,
        8000,
        'generate_report',
        formState.sessionId,
      );

      setEvalReportMarkdown(reportMarkdown);
      setEvalReportFilename(evalFilename.replace(/\.md$/, ''));
      setShowEvalPreview(true);
      playSuccessSound();
    } catch (err: any) {
      toast.error('Evaluation Report failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setIsGeneratingEvalReport(false);
    }
  };

  const handleDownloadEvalMd = () => {
    if (!evalReportMarkdown) return;
    const blob = new Blob([evalReportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CLAUDE-${evalReportFilename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportEvalDocx = async () => {
    if (!evalReportMarkdown) return;
    try {
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const projectName = formState.projectDescription?.slice(0, 60)?.trim() || 'CopyZap Session';
      const lang = formState.language || 'English';
      const NATIVE_LANG: Record<string, string> = {
        English: 'English', Spanish: 'Español', French: 'Français',
        German: 'Deutsch', Italian: 'Italiano', Portuguese: 'Português',
        Dutch: 'Nederlands', Polish: 'Polski', Russian: 'Русский',
        Japanese: '日本語', Chinese: '中文', Korean: '한국어',
        Arabic: 'العربية', Hindi: 'हिन्दी',
      };
      const displayLang = NATIVE_LANG[lang] ?? lang;
      const blob = await buildReportDocx(evalReportMarkdown, {
        title: 'Reporte de Evaluación — CopyZap vs. Claude',
        project: projectName,
        date: today,
        displayLang,
        versionCount: generatedOutputCards.length,
        footerText: `${projectName} · ${today} · Generated by CopyZap + Claude`,
        filePrefix: 'CLAUDE',
        filename: `CLAUDE-${evalReportFilename}.docx`,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CLAUDE-${evalReportFilename}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Word document downloaded');
    } catch (err: any) {
      toast.error('Word export failed: ' + (err?.message ?? 'Unknown error'));
    }
  };

  const handleGenerateCompareReport = async () => {
    setIsGeneratingCompareReport(true);
    try {
      const { markdown: auditContent, filename: auditFilename } = buildLLMEvaluationAudit(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
      );

      const language = formState.language;
      const languageDirective = language
        ? `IMPORTANT: Write the entire report in ${language}. Every heading, table header, and sentence must be in ${language}.\n\n`
        : '';
      const llmInput = languageDirective + comparePrompt + '\n\n' + auditContent;

      const reportMarkdown = await makeStreamingReportRequest(
        getAdminClaudeModel(),
        [{ role: 'user', content: llmInput }],
        0.4,
        8000,
        'generate_report',
        formState.sessionId,
      );

      setCompareReportMarkdown(reportMarkdown);
      setCompareReportFilename(auditFilename.replace(/\.md$/, ''));
      setShowComparePreview(true);
      playSuccessSound();
    } catch (err: any) {
      toast.error('Compare Report failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setIsGeneratingCompareReport(false);
    }
  };

  const handleDownloadCompareMd = () => {
    if (!compareReportMarkdown) return;
    const blob = new Blob([compareReportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CLAUDE-REPORT-${compareReportFilename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCompareDocx = async () => {
    if (!compareReportMarkdown) return;
    try {
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const projectName = formState.projectDescription?.slice(0, 60)?.trim() || 'CopyZap Session';
      const lang = formState.language || 'English';
      const NATIVE_LANG: Record<string, string> = {
        English: 'English', Spanish: 'Español', French: 'Français',
        German: 'Deutsch', Italian: 'Italiano', Portuguese: 'Português',
        Dutch: 'Nederlands', Polish: 'Polski', Russian: 'Русский',
        Japanese: '日本語', Chinese: '中文', Korean: '한국어',
        Arabic: 'العربية', Hindi: 'हिन्दी',
      };
      const displayLang = NATIVE_LANG[lang] ?? lang;
      const blob = await buildReportDocx(compareReportMarkdown, {
        title: 'Compare Report — CopyZap vs. Claude',
        project: projectName,
        date: today,
        displayLang,
        versionCount: generatedOutputCards.length,
        footerText: `${projectName} · ${today} · Generated by CopyZap + Claude`,
        filePrefix: 'CLAUDE-REPORT',
        filename: `CLAUDE-REPORT-${compareReportFilename}.docx`,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CLAUDE-REPORT-${compareReportFilename}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Word document downloaded');
    } catch (err: any) {
      toast.error('Word export failed: ' + (err?.message ?? 'Unknown error'));
    }
  };

  const stripInternalSection = (md: string): string => {
    const match = md.match(/^#{1,6}\s*(PARTE|PART)\s*2\b/im);
    if (!match || match.index === undefined) return md;
    return md.slice(0, match.index).trimEnd();
  };

  const handleGenerateClientReport = async () => {
    setIsGeneratingClientReport(true);
    try {
      const { markdown: auditContent, filename: auditFilename } = buildLLMEvaluationAudit(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        comparisonResult,
        versionDeepAnalysis,
        comparisonDeepAnalysisMeta,
      );

      const language = formState.language;
      const languageDirective = language
        ? `IMPORTANT: Write the entire report in ${language}. Every heading, table header, and sentence must be in ${language}.\n\n`
        : '';
      const llmInput = languageDirective + clientPrompt + '\n\n' + auditContent;

      const reportMarkdown = await makeStreamingReportRequest(
        getAdminClaudeModel(),
        [{ role: 'user', content: llmInput }],
        0.4,
        8000,
        'generate_report',
        formState.sessionId,
      );

      setClientReportMarkdown(reportMarkdown);
      setClientReportFilename(auditFilename.replace(/\.md$/, ''));
      setIncludeInternalSection(false);
      setShowClientPreview(true);
      playSuccessSound();
    } catch (err: any) {
      toast.error('Client Report failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setIsGeneratingClientReport(false);
    }
  };

  const handleDownloadClientMd = () => {
    if (!clientReportMarkdown) return;
    const content = includeInternalSection ? clientReportMarkdown : stripInternalSection(clientReportMarkdown);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CopyZap-CLIENT-REPORT-${clientReportFilename.replace(/^llm-/i, 'LLM-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportClientDocx = async () => {
    if (!clientReportMarkdown) return;
    try {
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const projectName = formState.projectDescription?.slice(0, 60)?.trim() || 'CopyZap Session';
      const lang = formState.language || 'English';
      const NATIVE_LANG: Record<string, string> = {
        English: 'English', Spanish: 'Español', French: 'Français', Portuguese: 'Português',
        German: 'Deutsch', Italian: 'Italiano', Dutch: 'Nederlands', Arabic: 'العربية', Hindi: 'हिन्दी',
      };
      const displayLang = NATIVE_LANG[lang] ?? lang;
      const content = includeInternalSection ? clientReportMarkdown : stripInternalSection(clientReportMarkdown);
      const blob = await buildReportDocx(content, {
        title: 'Client Report — CopyZap',
        project: projectName,
        date: today,
        displayLang,
        versionCount: generatedOutputCards.length,
        footerText: `${projectName} · ${today} · Generated by CopyZap + Claude`,
        filePrefix: 'CopyZap-CLIENT-REPORT',
        filename: `CopyZap-CLIENT-REPORT-${clientReportFilename.replace(/^llm-/i, 'LLM-')}.docx`,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CopyZap-CLIENT-REPORT-${clientReportFilename.replace(/^llm-/i, 'LLM-')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Word document downloaded');
    } catch (err: any) {
      toast.error('Word export failed: ' + (err?.message ?? 'Unknown error'));
    }
  };

  const toggleCardGroup = (id: string) =>
    setCardGroupOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  // Default is collapsed: only open when explicitly set to true
  const isCardGroupOpen = (id: string) => cardGroupOpen[id] === true;

  // ── Sidebar Scoring Helpers ────────────────────────────────────────────────

  // Create a wrapper for per-card rescoring that updates the rescoringCardIds state
  const createRescoringHandler = (cardId: string) => {
    return async () => {
      if (!currentUser) { toast.error('Please log in to rescore'); return; }
      setRescoringCardIds(prev => new Set([...prev, cardId]));
      try {
        const card = sortedGeneratedVersions.find(c => c.id === cardId);
        if (!card) return;
        const contentScore = await generateContentScores(
          card.content, card.type, formState.model, currentUser,
          undefined, calculateTargetWordCount(formState).target, formState.sessionId, undefined,
        );
        if (onUpdateCard) {
          onUpdateCard(card.id, { score: contentScore });
          toast.success('Score updated');
        }
      } catch (error: any) {
        toast.error('Failed to rescore: ' + (error?.message ?? 'Unknown error'));
      } finally {
        setRescoringCardIds(prev => {
          const next = new Set(prev);
          next.delete(cardId);
          return next;
        });
      }
    };
  };

  // Count unscored cards
  const unscorledCount = sortedGeneratedVersions.filter(
    c => c.type !== GeneratedContentItemType.GeoOptimized && !c.score
  ).length;

  const scorableVersions = sortedGeneratedVersions.filter(
    c => c.type !== GeneratedContentItemType.GeoOptimized
  );
  const allVersionsScored = !!comparisonResult;

  // Score all unscored cards
  const handleScoreAllMissing = () => {
    if (!onCompareWithGrok) {
      toast.error('Scoring not available');
      return;
    }
    onCompareWithGrok(false);
  };

  // ── Collapsed state ───────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="sticky top-0 h-screen flex-shrink-0 flex flex-col items-center pt-3 w-8 border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-black">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Open sidebar"
          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <PanelRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="sticky top-0 h-screen flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-black relative"
      style={{ width: sidebarWidth, userSelect: isDragging.current ? 'none' : undefined }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-20 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      />
      {/* Header — fixed, does not scroll */}
      <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-black z-10">
        <span className="text-xs font-normal uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Actions
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Collapse sidebar"
          className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <PanelRight size={11} />
        </button>
      </div>

      {/* Scrollable content — takes remaining height */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin' }}>

        {/* ── Navigate section (unchanged) ─────────────────────────── */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="px-2.5 pt-2 pb-1">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>
              Navigate
            </span>
          </div>
          <div className="space-y-0 px-1.5">
            {([
              { label: 'Copy Maker', path: '/copy-maker', Icon: FileEdit, adminOnly: false },
              { label: 'Start Hub', path: null, Icon: Rocket, adminOnly: false },
              { label: 'Copy Snap', path: '/copy-snap', Icon: Camera, adminOnly: true },
              { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard, adminOnly: false },
            ] as { label: string; path: string | null; Icon: React.ElementType; adminOnly: boolean }[])
              .filter(item => !item.adminOnly || isAdmin)
              .map(({ label, path, Icon }) => {
              const isActive = path ? location.pathname === path : false;
              const isDashboard = label === 'Dashboard';
              return (
                <div key={label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!path) {
                        window.dispatchEvent(new CustomEvent('forceOpenStartHub'));
                      } else {
                        navigate(path);
                      }
                    }}
                    className="w-full flex items-center gap-2 py-1.5 px-2 rounded text-xs font-medium transition-colors text-left"
                    style={isActive ? {
                      borderLeft: '2px solid #f97316',
                      paddingLeft: '6px',
                      color: '#f97316',
                      background: 'rgba(249,115,22,0.07)',
                    } : {
                      borderLeft: '2px solid transparent',
                      paddingLeft: '6px',
                      color: '#6b7280',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.06)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <Icon size={11} style={{ flexShrink: 0 }} />
                    {label}
                  </button>
                  {isDashboard && (
                    <div className="space-y-0 mt-0.5">
                      <LazyNavDropdown
                        label="Recent Projects"
                        loadItems={loadRecentProjects}
                        onSelect={item => navigate(`/copy-maker?savedOutputId=${item.id}`)}
                      />
                      <LazyNavDropdown
                        label="Recent Sessions"
                        loadItems={loadRecentSessions}
                        onSelect={item => navigate(`/copy-maker?sessionId=${item.id}`)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── SESSION ZONE (purple) — acts on the whole session ─────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {hasPopulatedFields && (
          <div
            className="border-b"
            style={{ borderColor: SESSION_ZONE.border, background: SESSION_ZONE.bg }}
          >
            <ZoneHeader label="Session" theme={SESSION_ZONE} />
            <div className="space-y-px px-1.5 py-1.5">
              {/* 1. Evaluate Inputs */}
              {onEvaluateInputs && (
                <ZoneItem
                  icon={CheckCircle2}
                  label="Evaluate Inputs"
                  onClick={onEvaluateInputs}
                  disabled={isEvaluating}
                  title="Evaluate Inputs"
                />
              )}

              {/* 2. Save — dropdown replacing 3 buttons */}
              {(onSaveSession || onSaveTemplate || onSaveOutput) && (
                <>
                  <ZoneItem
                    icon={Download}
                    label="Save"
                    onClick={() => setSaveOpen(o => !o)}
                    expanded={saveOpen}
                    title="Save session, template, or output"
                    trailing={<ChevronDown size={10} className={saveOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />}
                  />
                  {saveOpen && (
                    <InlineFlyout>
                      {onSaveSession && (
                        <FlyoutOption label="Session" onClick={onSaveSession} />
                      )}
                      {onSaveTemplate && (
                        <FlyoutOption label="Template" onClick={onSaveTemplate} />
                      )}
                      {onSaveOutput && (
                        <FlyoutOption
                          label="Output"
                          onClick={onSaveOutput}
                          disabled={!generatedOutputCards || generatedOutputCards.length === 0}
                        />
                      )}
                    </InlineFlyout>
                  )}
                </>
              )}

              {/* 3. Score all — same gating/label logic as before */}
              {unscorledCount >= 2 && (
                <ZoneItem
                  icon={BookCheck}
                  label={rescoringCardIds.size > 0 ? 'Scoring…' : allVersionsScored ? `Re-score all (${scorableVersions.length})` : `Score all (${scorableVersions.length})`}
                  onClick={handleScoreAllMissing}
                  disabled={rescoringCardIds.size > 0}
                  title={allVersionsScored ? `Re-score all ${scorableVersions.length} outputs` : `Score all ${unscorledCount} unscored outputs`}
                />
              )}

              {/* 4. Combine versions — dropdown (blend rewrite + best-elements compile) */}
              {(onBlendVersions || onGenerateBestElements) && (
                <>
                  <ZoneItem
                    icon={GitMerge}
                    label={isBlending ? 'Blending…' : isGeneratingBestElements ? 'Compiling…' : 'Combine versions'}
                    onClick={() => setCombineOpen(o => !o)}
                    disabled={!comparisonResult || isBlending || isGeneratingBestElements}
                    expanded={combineOpen}
                    title={!comparisonResult ? 'Score your copies first' : 'Combine your versions into one'}
                    trailing={<ChevronDown size={10} className={combineOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />}
                  />
                  {combineOpen && (
                    <InlineFlyout>
                      {onBlendVersions && (
                        <FlyoutOption
                          label="Write a fresh version"
                          onClick={() => onBlendVersions()}
                          disabled={isBlending}
                          title="The AI rewrites all versions into one. Wording may change."
                        />
                      )}
                      {onGenerateBestElements && (
                        <FlyoutOption
                          label="Keep the best parts as they are"
                          onClick={onGenerateBestElements}
                          disabled={sortedGeneratedVersions.length < 2 || isGeneratingBestElements}
                          title="Takes the strongest section from each version, word for word."
                        />
                      )}
                    </InlineFlyout>
                  )}
                </>
              )}

              {/* 5. Reports — side panel (regular + admin items) */}
              {hasContent && (
                <ZoneItem
                  icon={FileStack}
                  label="Reports"
                  onClick={() => setReportsOpen(o => !o)}
                  expanded={reportsOpen}
                  title="Copy and export reports"
                  trailing={<ChevronDown size={10} className={reportsOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />}
                />
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── THIS VERSION ZONE (blue) — acts on the selected card ──── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {sortedGeneratedVersions.length > 0 && (
          <div
            className="border-b"
            style={{ borderColor: VERSION_ZONE.border, background: VERSION_ZONE.bg }}
          >
            <ZoneHeader label="This version" theme={VERSION_ZONE} />
            <div className="space-y-px px-1.5 py-1.5">
              {/* Per-card selector list (collapsible groups, same engine) */}
              {sortedGeneratedVersions
                .filter(card => card.type !== GeneratedContentItemType.GeoOptimized)
                .map((card) => {
                  const groupOpen = isCardGroupOpen(card.id);
                  const isActiveCard = card.id === activeCardId;
                  return (
                    <div
                      key={card.id}
                      className="border rounded overflow-hidden"
                      style={{ borderColor: isActiveCard ? VERSION_ZONE.accent : '#e5e7eb' }}
                    >
                      {confirmDeleteId === card.id ? (
                        <div className="flex items-center justify-between w-full px-2 py-1">
                          <span className="text-xs text-red-500">Delete this output?</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(card);
                                setConfirmDeleteId(null);
                              }}
                              className="text-xs px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleCardGroup(card.id)}
                          className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium transition-colors text-left"
                          style={isActiveCard ? {
                            background: 'rgba(47,111,214,0.08)',
                            color: VERSION_ZONE.accent,
                            borderLeft: '2px solid ' + VERSION_ZONE.accent,
                            paddingLeft: '6px',
                          } : {
                            color: '#6b7280',
                            background: 'transparent',
                            borderLeft: '2px solid transparent',
                            paddingLeft: '6px',
                          }}
                        >
                          <span className="truncate pr-1">
                            {card.sourceDisplayName || card.type}
                            {card.score && (
                              <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                                {card.score.overall}/100
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {card.score && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  createRescoringHandler(card.id)();
                                }}
                                disabled={rescoringCardIds.has(card.id)}
                                title="Rescore this output"
                                className="p-0.5 rounded text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 disabled:opacity-40 transition-colors"
                              >
                                <RefreshCw size={9} className={rescoringCardIds.has(card.id) ? 'animate-spin' : ''} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(card.id);
                              }}
                              title="Delete this output"
                              className="p-0.5 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={9} />
                            </button>
                            {groupOpen ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                          </div>
                        </button>
                      )}

                      {groupOpen && (
                        <div className="px-1.5 pt-0.5 bg-white dark:bg-black">
                          <CardActions
                            card={card}
                            formState={formState}
                            allCards={sortedGeneratedVersions}
                            comparisonResult={comparisonResult}
                            versionScores={formState.copyResult?.versionScores}
                            onAlternative={() => onAlternative(card)}
                            onScore={() => onScore(card)}
                            onModify={onModify}
                            onRestyle={onRestyle}
                            onSaveAsBrandVoice={onSaveAsBrandVoice}
                            onBoost={onBoost ? () => onBoost(card) : undefined}
                            targetWordCount={targetWordCount}
                            currentUser={currentUser}
                            isBlending={isBlending}
                            onUpdateCard={onUpdateCard}
                            onAddCards={onAddCards}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── REPORTS SIDE PANEL (4+ options → panel) ────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      {reportsOpen && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-start justify-end"
          onClick={() => setReportsOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 shadow-2xl w-80 max-w-[90vw] h-full overflow-y-auto border-l border-gray-200 dark:border-gray-700 animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideInRight 0.18s ease-out' }}
          >
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            {/* Panel header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Reports</span>
              <button
                type="button"
                onClick={() => setReportsOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Regular user items */}
            <div className="p-2 space-y-px">
              <FlyoutOption label="Copy as Markdown" onClick={() => { handleCopyAllMarkdown(); setReportsOpen(false); }} disabled={!hasContent} />
              <FlyoutOption label="Export as HTML file" onClick={() => { handleExportToHtml(); setReportsOpen(false); }} disabled={!hasContent} />
            </div>

            {/* Admin-only section (amber) */}
            {isAdmin && (
              <>
                <div
                  className="mx-2 mt-1 mb-1 px-2 py-1 rounded border border-dashed"
                  style={{ borderColor: ADMIN_ZONE.border, background: ADMIN_ZONE.bg }}
                >
                  <span
                    className="font-semibold uppercase"
                    style={{ color: ADMIN_ZONE.accent, fontSize: '9.5px', letterSpacing: '0.06em' }}
                  >
                    Admin-only
                  </span>
                </div>
                <div className="px-2 pb-2 space-y-px">
                  <FlyoutOption
                    label="Export HTML (Preview)"
                    onClick={() => { handleOpenHtmlPreviewModal(); setReportsOpen(false); }}
                    disabled={!hasContent}
                  />
                  <FlyoutOption
                    label="Export HTML (Preview) 2 — Spanish client report"
                    onClick={() => { handleExportHtmlPreview2(); setReportsOpen(false); }}
                    disabled={!hasContent || !canExportHtmlPreview2 || isGeneratingHtmlPreview2}
                  />
                  <FlyoutOption
                    label="LLM Eval Export"
                    onClick={() => { handleExportLLMEval(); setReportsOpen(false); }}
                    disabled={!hasContent}
                  />
                  <FlyoutOption
                    label="LLM Audit Export"
                    onClick={() => { handleExportLLMAudit(); setReportsOpen(false); }}
                    disabled={!hasContent || !comparisonResult}
                  />
                  <FlyoutOption
                    label="Evaluation Report"
                    onClick={() => { handleGenerateEvalReport(); setReportsOpen(false); }}
                    disabled={!hasContent || !comparisonResult || sortedGeneratedVersions.length < 2 || isGeneratingEvalReport}
                  />
                  <FlyoutOption
                    label="Compare Report"
                    onClick={() => { handleGenerateCompareReport(); setReportsOpen(false); }}
                    disabled={!hasContent || !comparisonResult || sortedGeneratedVersions.length < 2 || isGeneratingCompareReport}
                  />
                  <FlyoutOption
                    label="Client Report"
                    onClick={() => { handleGenerateClientReport(); setReportsOpen(false); }}
                    disabled={!hasContent || !comparisonResult || sortedGeneratedVersions.length < 2 || isGeneratingClientReport}
                  />
                  <FlyoutOption
                    label="View Prompts"
                    onClick={() => { onViewPrompts(); setReportsOpen(false); }}
                  />
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Best Elements generation modal (kept; section removed per Task 5) */}
      {isGeneratingBestElements && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={isGeneratingBestElements}
          message="Analyzing Best Elements…"
          onCancel={() => {}}
        />,
        document.body
      )}
      {isGeneratingEvalReport && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={isGeneratingEvalReport}
          message="Generating Evaluation Report…"
          onCancel={() => {}}
        />,
        document.body
      )}
      {showHtmlPreviewModal && ReactDOM.createPortal(
        <HtmlPreviewExportModal
          isOpen={showHtmlPreviewModal}
          onClose={() => setShowHtmlPreviewModal(false)}
          onConfirm={handleConfirmHtmlPreviewExport}
        />,
        document.body
      )}
      {showEvalPreview && evalReportMarkdown && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#000000' }}>Evaluation Report</h2>
                <p className="text-xs mt-0.5" style={{ color: '#404040' }}>AI-powered copy critique vs. CopyZap scores</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEvalPreview(false)}
                className="p-1 transition-colors"
                style={{ color: '#404040' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
              <style>{`
                .eval-report-preview { font-family: Arial, system-ui, sans-serif; font-size: 13px; line-height: 1.65; color: #000000; background: #ffffff; padding: 24px; }
                .eval-report-preview h1, .eval-report-preview h2, .eval-report-preview h3, .eval-report-preview h4 { color: #000000; font-weight: bold; margin: 1.2em 0 0.4em; }
                .eval-report-preview h1 { font-size: 18px; }
                .eval-report-preview h2 { font-size: 15px; }
                .eval-report-preview h3 { font-size: 13px; }
                .eval-report-preview p { margin: 0.5em 0; color: #000000; }
                .eval-report-preview a { color: #000000; text-decoration: underline; }
                .eval-report-preview strong, .eval-report-preview b { color: #000000; font-weight: bold; }
                .eval-report-preview em, .eval-report-preview i { color: #000000; }
                .eval-report-preview ul, .eval-report-preview ol { margin: 0.5em 0 0.5em 1.5em; color: #000000; }
                .eval-report-preview li { margin: 0.25em 0; color: #000000; }
                .eval-report-preview table { width: 100%; border-collapse: collapse; margin: 1em 0; }
                .eval-report-preview th { background: #D9D9D9; color: #000000; font-weight: bold; padding: 6px 10px; border: 1px solid #BFBFBF; text-align: left; }
                .eval-report-preview td { border: 1px solid #BFBFBF; padding: 6px 10px; color: #000000; background: #ffffff; }
                .eval-report-preview tr:nth-child(even) td { background: #F2F2F2; }
                .eval-report-preview hr { border: none; border-top: 1px solid #BFBFBF; margin: 1em 0; }
                .eval-report-preview code, .eval-report-preview pre { color: #000000; background: #F2F2F2; border: 1px solid #BFBFBF; border-radius: 3px; padding: 1px 4px; font-family: Arial, system-ui, sans-serif; }
              `}</style>
              <div
                className="eval-report-preview"
                dangerouslySetInnerHTML={{ __html: filterScaffoldingLines(markdownToHtml(evalReportMarkdown)) }}
              />
            </div>
            <div className="flex gap-3 px-5 py-3 border-t flex-shrink-0" style={{ borderColor: '#BFBFBF', backgroundColor: '#ffffff' }}>
              <button
                type="button"
                onClick={handleDownloadEvalMd}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
              >
                <FileText size={12} />
                Download .md
              </button>
              <button
                type="button"
                onClick={handleExportEvalDocx}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                style={{ backgroundColor: '#404040', color: '#ffffff' }}
              >
                <FileCode size={12} />
                Output as Word file?
              </button>
              <button
                type="button"
                onClick={() => setShowEvalPreview(false)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                style={{ border: '1px solid #BFBFBF', color: '#404040', backgroundColor: '#ffffff' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isGeneratingCompareReport && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={isGeneratingCompareReport}
          message="Generating Compare Report…"
          onCancel={() => {}}
        />,
        document.body
      )}
      {showComparePreview && compareReportMarkdown && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#000000' }}>Compare Report</h2>
                <p className="text-xs mt-0.5" style={{ color: '#404040' }}>Absolute score breakdown and divergence analysis</p>
              </div>
              <button
                type="button"
                onClick={() => setShowComparePreview(false)}
                className="p-1 transition-colors"
                style={{ color: '#404040' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
              <style>{`
                .compare-report-preview { font-family: Arial, system-ui, sans-serif; font-size: 13px; line-height: 1.65; color: #000000; background: #ffffff; padding: 24px; }
                .compare-report-preview h1, .compare-report-preview h2, .compare-report-preview h3, .compare-report-preview h4 { color: #000000; font-weight: bold; margin: 1.2em 0 0.4em; }
                .compare-report-preview h1 { font-size: 18px; }
                .compare-report-preview h2 { font-size: 15px; }
                .compare-report-preview h3 { font-size: 13px; }
                .compare-report-preview p { margin: 0.5em 0; color: #000000; }
                .compare-report-preview a { color: #000000; text-decoration: underline; }
                .compare-report-preview strong, .compare-report-preview b { color: #000000; font-weight: bold; }
                .compare-report-preview em, .compare-report-preview i { color: #000000; }
                .compare-report-preview ul, .compare-report-preview ol { margin: 0.5em 0 0.5em 1.5em; color: #000000; }
                .compare-report-preview li { margin: 0.25em 0; color: #000000; }
                .compare-report-preview table { width: 100%; border-collapse: collapse; margin: 1em 0; }
                .compare-report-preview th { background: #D9D9D9; color: #000000; font-weight: bold; padding: 6px 10px; border: 1px solid #BFBFBF; text-align: left; }
                .compare-report-preview td { border: 1px solid #BFBFBF; padding: 6px 10px; color: #000000; background: #ffffff; }
                .compare-report-preview tr:nth-child(even) td { background: #F2F2F2; }
                .compare-report-preview hr { border: none; border-top: 1px solid #BFBFBF; margin: 1em 0; }
                .compare-report-preview code, .compare-report-preview pre { color: #000000; background: #F2F2F2; border: 1px solid #BFBFBF; border-radius: 3px; padding: 1px 4px; font-family: Arial, system-ui, sans-serif; }
              `}</style>
              <div
                className="compare-report-preview"
                dangerouslySetInnerHTML={{ __html: filterScaffoldingLines(markdownToHtml(compareReportMarkdown)) }}
              />
            </div>
            <div className="flex gap-3 px-5 py-3 border-t flex-shrink-0" style={{ borderColor: '#BFBFBF', backgroundColor: '#ffffff' }}>
              <button
                type="button"
                onClick={handleDownloadCompareMd}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
              >
                <FileText size={12} />
                Download .md
              </button>
              <button
                type="button"
                onClick={handleExportCompareDocx}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                style={{ backgroundColor: '#404040', color: '#ffffff' }}
              >
                <FileCode size={12} />
                Output as Word file?
              </button>
              <button
                type="button"
                onClick={() => setShowComparePreview(false)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                style={{ border: '1px solid #BFBFBF', color: '#404040', backgroundColor: '#ffffff' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isGeneratingClientReport && ReactDOM.createPortal(
        <ProcessingModal
          isOpen={isGeneratingClientReport}
          message="Generating Client Report…"
          onCancel={() => {}}
        />,
        document.body
      )}
      {showClientPreview && clientReportMarkdown && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#000000' }}>Client Report</h2>
                <p className="text-xs mt-0.5" style={{ color: '#404040' }}>Client-ready evaluation with scores, validation, and improvements</p>
              </div>
              <button
                type="button"
                onClick={() => setShowClientPreview(false)}
                className="p-1 transition-colors"
                style={{ color: '#404040' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ backgroundColor: '#fafafa' }}>
              <div
                className="compare-report-preview"
                dangerouslySetInnerHTML={{ __html: filterScaffoldingLines(markdownToHtml(
                  includeInternalSection ? clientReportMarkdown : stripInternalSection(clientReportMarkdown)
                )) }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-t flex-shrink-0" style={{ borderColor: '#BFBFBF', backgroundColor: '#ffffff' }}>
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: '#404040' }}>
                <input
                  type="checkbox"
                  checked={includeInternalSection}
                  onChange={(e) => setIncludeInternalSection(e.target.checked)}
                  className="rounded"
                />
                Incluir análisis interno (Parte 2)
              </label>
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={handleDownloadClientMd}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  style={{ backgroundColor: '#000000', color: '#ffffff' }}
                >
                  <FileText size={12} />
                  Download .md
                </button>
                <button
                  type="button"
                  onClick={handleExportClientDocx}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  style={{ backgroundColor: '#404040', color: '#ffffff' }}
                >
                  <FileCode size={12} />
                  Output as Word file?
                </button>
                <button
                  type="button"
                  onClick={() => setShowClientPreview(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  style={{ border: '1px solid #BFBFBF', color: '#404040', backgroundColor: '#ffffff' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      <ReportProgressModal
        isOpen={isGeneratingHtmlPreview2}
        currentStep={reportStep}
        isCancelling={reportCancelling}
        onCancel={handleCancelReport}
      />

      <ReportAuditModal
        isOpen={auditOpen}
        issues={auditIssues}
        onExportAnyway={() => closeAuditModal(true)}
        onCancel={() => closeAuditModal(false)}
      />
    </aside>
  );
};

export default CopyMakerSidebar;

