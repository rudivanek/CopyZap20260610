import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, RefreshCw, Save, RotateCcw, Shield } from 'lucide-react';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useReportTheme } from '../../hooks/useReportTheme';
import { buildReportStyles, DEFAULT_THEME_VARS, type ThemeVars } from '../../utils/exportReportTheme';
import { toast } from 'react-hot-toast';

const COLOR_VARS: { key: keyof ThemeVars; label: string }[] = [
  { key: 'ink', label: 'Ink (primary text)' },
  { key: 'inkSoft', label: 'Ink Soft (body text)' },
  { key: 'muted', label: 'Muted (labels)' },
  { key: 'line', label: 'Line (borders)' },
  { key: 'lineSoft', label: 'Line Soft (subtle borders)' },
  { key: 'paper', label: 'Paper (page background)' },
  { key: 'white', label: 'White (cards)' },
  { key: 'accent', label: 'Accent (primary action)' },
  { key: 'accentSoft', label: 'Accent Soft (action bg)' },
  { key: 'gain', label: 'Gain (positive scores)' },
  { key: 'gainSoft', label: 'Gain Soft (positive bg)' },
  { key: 'warn', label: 'Warn (caution)' },
  { key: 'warnSoft', label: 'Warn Soft (caution bg)' },
];

const SERIF_PRESETS: { label: string; value: string }[] = [
  { label: 'Iowan / Palatino / Georgia (default)', value: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif' },
  { label: 'Georgia', value: 'Georgia,"Times New Roman",serif' },
  { label: 'Times New Roman', value: '"Times New Roman",Times,serif' },
  { label: 'Playfair Display', value: '"Playfair Display",Georgia,serif' },
  { label: 'DM Serif Display', value: '"DM Serif Display",Georgia,serif' },
  { label: 'Lora', value: 'Lora,Georgia,serif' },
  { label: 'Merriweather', value: 'Merriweather,Georgia,serif' },
  { label: 'Cormorant Garamond', value: '"Cormorant Garamond",Georgia,serif' },
];

const SANS_PRESETS: { label: string; value: string }[] = [
  { label: 'System / Inter (default)', value: '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,"Helvetica Neue",Arial,sans-serif' },
  { label: 'Helvetica', value: 'Helvetica,Arial,sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI",Tahoma,Geneva,sans-serif' },
  { label: 'Roboto', value: 'Roboto,Arial,sans-serif' },
  { label: 'Work Sans', value: '"Work Sans",Arial,sans-serif' },
  { label: 'Source Sans 3', value: '"Source Sans 3",Arial,sans-serif' },
  { label: 'Manrope', value: 'Manrope,Arial,sans-serif' },
];

const WEIGHTS: { label: string; value: number }[] = [
  { label: '400 — Regular', value: 400 },
  { label: '500 — Medium', value: 500 },
  { label: '600 — Semibold', value: 600 },
  { label: '700 — Bold', value: 700 },
];

const SIZE_TOKENS: { key: keyof ThemeVars; label: string; min: number; max: number; step: number }[] = [
  { key: 'fsDisplay', label: 'Display (cover h1 max)', min: 32, max: 80, step: 1 },
  { key: 'fsH2', label: 'H2 (section titles max)', min: 22, max: 48, step: 1 },
  { key: 'fsH3', label: 'H3 (card titles)', min: 16, max: 32, step: 1 },
  { key: 'fsHero', label: 'Hero paragraph', min: 16, max: 36, step: 1 },
  { key: 'fsScoreLg', label: 'Score — large', min: 22, max: 56, step: 1 },
  { key: 'fsScoreMd', label: 'Score — medium', min: 16, max: 40, step: 1 },
  { key: 'fsBody', label: 'Body text', min: 12, max: 22, step: 0.5 },
  { key: 'fsLabel', label: 'Label / eyebrow', min: 8, max: 16, step: 0.5 },
  { key: 'fsSmall', label: 'Small (cover stamp)', min: 10, max: 18, step: 1 },
];

const PRESETS: { name: string; vars: Partial<ThemeVars> }[] = [
  { name: 'Warm Paper (current)', vars: DEFAULT_THEME_VARS },
  {
    name: 'Cool Slate',
    vars: {
      ink: '#1A1E27', inkSoft: '#3D4456', muted: '#7A8195', line: '#DCE1E8', lineSoft: '#EAEDF2',
      paper: '#F3F5F8', white: '#FFFFFF', accent: '#2C5EF6', accentSoft: '#E6ECFE',
      gain: '#0E8F6C', gainSoft: '#E1F5EE', warn: '#B4780A', warnSoft: '#FCEFD9',
      serif: 'Georgia,"Times New Roman",serif',
    },
  },
  {
    name: 'Forest & Cream',
    vars: {
      ink: '#1C2318', inkSoft: '#3B4632', muted: '#7B8570', line: '#DCE0CE', lineSoft: '#EAEDE2',
      paper: '#F6F5EC', white: '#FFFDF6', accent: '#7A5C2E', accentSoft: '#EFE6D3',
      gain: '#2F6B3B', gainSoft: '#E5F0E4', warn: '#96631A', warnSoft: '#F6E9D2',
      serif: '"Playfair Display",Georgia,serif',
    },
  },
  {
    name: 'Midnight Blue',
    vars: {
      ink: '#0B1220', inkSoft: '#2C3A52', muted: '#6E7C93', line: '#D9DEE7', lineSoft: '#EBEEF3',
      paper: '#F2F4F8', white: '#FFFFFF', accent: '#C9A227', accentSoft: '#FBF3DA',
      gain: '#146356', gainSoft: '#E1EFEC', warn: '#A8720E', warnSoft: '#FBF0DA',
      serif: '"Times New Roman",Times,serif',
    },
  },
];

function isColorKey(key: keyof ThemeVars): boolean {
  return COLOR_VARS.some((c) => c.key === key);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f0-9]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => v.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function ReportThemeEditor() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { themeVars: savedVars, isLoading, isSaving, error, saveTheme } = useReportTheme();

  const [edited, setEdited] = useState<ThemeVars>(DEFAULT_THEME_VARS);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setEdited(savedVars);
      setDirty(false);
    }
  }, [isLoading, savedVars]);

  const update = useCallback((key: keyof ThemeVars, value: string | number) => {
    setEdited((prev) => {
      const next = { ...prev, [key]: value } as ThemeVars;
      return next;
    });
    setDirty(true);
  }, []);

  const applyPreset = useCallback((vars: Partial<ThemeVars>) => {
    const merged: ThemeVars = { ...DEFAULT_THEME_VARS, ...vars } as ThemeVars;
    setEdited(merged);
    setDirty(true);
  }, []);

  const resetLocal = useCallback(() => {
    setEdited(DEFAULT_THEME_VARS);
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    const result = await saveTheme(edited);
    if (result.success) {
      toast.success('Report theme saved — applied to all future exports');
      setDirty(false);
    } else {
      toast.error(result.error || 'Failed to save theme');
    }
  }, [edited, saveTheme]);

  // Live preview stylesheet, scoped to the preview container via a wrapper class.
  const previewStyles = useMemo(() => {
    const full = buildReportStyles(edited);
    // Scope every selector under .rte-preview so the editor's own Tailwind UI is unaffected.
    return full
      .split('}')
      .map((rule) => {
        const trimmed = rule.trim();
        if (!trimmed || trimmed.startsWith('@')) return trimmed + '}';
        const braceIdx = trimmed.indexOf('{');
        if (braceIdx === -1) return trimmed + '}';
        const selector = trimmed.slice(0, braceIdx).trim();
        const body = trimmed.slice(braceIdx + 1);
        return `.rte-preview ${selector}{${body}}`;
      })
      .join('\n');
  }, [edited]);

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading report theme editor…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Shield className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Admins only</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The report theme editor is restricted to admin accounts.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-8 h-8 text-blue-500" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report Theme Editor</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customize the colors, fonts, and sizes used in every HTML report export.
                Changes apply to all future exports after saving.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetLocal}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm disabled:opacity-50"
                title="Reset local edits to defaults (does not delete the saved theme)"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to defaults
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !dirty}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-1">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p.vars)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {dirty && (
            <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              You have unsaved local edits. Click Save to apply them to future exports.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left panel — controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            {/* Colors */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Colors</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COLOR_VARS.map(({ key, label }) => {
                  const value = String(edited[key]);
                  const rgb = hexToRgb(value);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={rgb ? value : '#000000'}
                        onChange={(e) => update(key, e.target.value)}
                        className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer flex-none"
                        title={label}
                      />
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{label}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => update(key, e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 text-xs font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Fonts */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Fonts</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Serif (headings)</label>
                  <select
                    value={edited.serif}
                    onChange={(e) => update('serif', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {SERIF_PRESETS.map((p) => (
                      <option key={p.label} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sans (body / labels)</label>
                  <select
                    value={edited.sans}
                    onChange={(e) => update('sans', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {SANS_PRESETS.map((p) => (
                      <option key={p.label} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Weights */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Font Weights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Headings</label>
                  <select
                    value={edited.fwHeading}
                    onChange={(e) => update('fwHeading', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {WEIGHTS.map((w) => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Body</label>
                  <select
                    value={edited.fwBody}
                    onChange={(e) => update('fwBody', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {WEIGHTS.map((w) => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Sizes */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sizes</h2>
              <div className="space-y-4">
                {SIZE_TOKENS.map(({ key, label, min, max, step }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
                      <span className="text-xs font-mono text-gray-900 dark:text-white">{String(edited[key])}{key.startsWith('fs') && step < 1 ? '' : 'px'}</span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={Number(edited[key])}
                      onChange={(e) => update(key, Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right panel — live preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Live Preview</h2>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-auto max-h-[80vh]">
              <style>{previewStyles}</style>
              <div className="rte-preview">
                {/* Cover */}
                <div className="cover">
                  <div className="wrap">
                    <div className="brandbar">
                      <div className="logo">Copy<span>Zap</span></div>
                      <div className="powered">Copy Evaluation Report</div>
                    </div>
                    <div className="kicker">Diagnostic · Spanish Client Copy</div>
                    <h1>How your homepage copy actually reads</h1>
                    <div className="stamp">3 de agosto de 2026 · 5 propuestas · Español</div>
                    <div className="journey">
                      <div className="journey-head">Recorrido de mejora</div>
                      <div className="stops">
                        <div className="stop"><div className="num">62</div><div className="lbl">Tu copy actual</div></div>
                        <div className="stop now"><div className="num">78</div><div className="lbl"><b>Propuesta A</b>ganadora</div></div>
                        <div className="stop goal"><div className="num">92<small>/100</small></div><div className="lbl">Potencial</div></div>
                      </div>
                      <div className="rail"><i className="a"></i><i className="b"></i><i className="c"></i></div>
                      <div className="journey-foot">Subida de <b>+16 puntos</b> (+26 %) respecto a tu copy actual.</div>
                    </div>
                  </div>
                </div>

                {/* TOC */}
                <div className="wrap">
                  <section>
                    <p className="eyebrow accent">Tabla de contenidos</p>
                    <div className="toc">
                      <a className="is-win">
                        <span className="idx">01</span>
                        <span className="name">Propuesta A · Enfoque directo <span className="win">Ganadora</span></span>
                        <span className="sc">78<small>/100</small></span>
                      </a>
                      <a>
                        <span className="idx">02</span>
                        <span className="name">Propuesta B · Storytelling</span>
                        <span className="sc">74<small>/100</small></span>
                      </a>
                      <a>
                        <span className="idx">03</span>
                        <span className="name">Propuesta C · Datos y prueba</span>
                        <span className="sc">71<small>/100</small></span>
                      </a>
                    </div>
                  </section>

                  {/* Version card */}
                  <section>
                    <p className="eyebrow accent">Propuesta A · Enfoque directo</p>
                    <div className="version">
                      <div className="v-head">
                        <div className="t">
                          <h3>Propuesta A <span className="win">Ganadora</span></h3>
                          <div className="role">Variante de copy directo con CTA reforzado · 218 palabras</div>
                        </div>
                        <div className="v-scores">
                          <div className="big">78<small>/100</small></div>
                          <div className="gain">+16<small>vs. actual</small></div>
                        </div>
                      </div>
                      <div className="v-body">
                        <div className="sec hero"><p>Lleva tu marca al siguiente nivel sin perder su voz.</p></div>
                        <div className="sec">
                          <div className="sec-lbl">Introducción</div>
                          <p>Diseñamos copy que conecta con tu audiencia y mueve a la acción. Cada palabra está calibrada para convertir visitantes en clientes.</p>
                        </div>
                        <div className="sec">
                          <div className="sec-lbl">Beneficios</div>
                          <ul>
                            <li>Mensajes claros que comunican valor en segundos.</li>
                            <li>Llamadas a la acción que invitan, no presionan.</li>
                          </ul>
                        </div>
                        <div className="split">
                          <div className="pos">
                            <h5>Fortalezas</h5>
                            <ul>
                              <li>Headline concreta con beneficio medible.</li>
                              <li>Estructura escaneable en tres bloques.</li>
                            </ul>
                          </div>
                          <div className="neg">
                            <h5>A mejorar</h5>
                            <ul>
                              <li>Falta prueba social cuantitativa.</li>
                              <li>CTA podría añadir urgencia ligera.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Rankings */}
                  <section>
                    <p className="eyebrow accent">Comparación</p>
                    <div className="rank">
                      <div className="rank-row head">
                        <span className="pos">#</span>
                        <span className="nm">Versión</span>
                        <span className="cell">Calidad editorial</span>
                        <span className="cell">Potencial de conversión</span>
                        <span className="dl">Δ vs. actual</span>
                        <span className="tot">Total</span>
                      </div>
                      <div className="rank-row is-win">
                        <span className="pos">1</span>
                        <span className="nm">Propuesta A<small>Enfoque directo</small></span>
                        <span className="cell">82<small>/100</small></span>
                        <span className="cell">76<small>/100</small></span>
                        <span className="dl">+16<small>+26 %</small></span>
                        <span className="tot">78<small>/100</small></span>
                      </div>
                      <div className="rank-row">
                        <span className="pos">2</span>
                        <span className="nm">Propuesta B<small>Storytelling</small></span>
                        <span className="cell">79<small>/100</small></span>
                        <span className="cell">71<small>/100</small></span>
                        <span className="dl">+12<small>+19 %</small></span>
                        <span className="tot">74<small>/100</small></span>
                      </div>
                      <div className="rank-row base">
                        <span className="pos">—</span>
                        <span className="nm">Tu copy actual<small>Página de inicio</small></span>
                        <span className="cell">64<small>/100</small></span>
                        <span className="cell">58<small>/100</small></span>
                        <span className="dl">—</span>
                        <span className="tot">62<small>/100</small></span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              This preview renders the same key components real exports use. Adjust controls on the left and the preview updates live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
