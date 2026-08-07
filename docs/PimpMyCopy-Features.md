# PimpMyCopy / CopyZap — Feature Documentation

Version: 1.21
Last Updated: 2026-08-07T00:00:00Z

---

## Export HTML (Preview) 2 — Spanish Client Copy Report (2026-08-03)

**Feature:** Added a second HTML export, `Export HTML (Preview) 2`, placed directly below the existing `Export HTML (Preview)` item in the Copy Maker sidebar. It uses the exact same session data (form state, generated outputs, comparison result, deep analysis) as the existing export, but renders a completely different, client-facing document: a polished Spanish-language *copy diagnostic report* designed to be emailed to a prospect who has never heard of the studio. The existing export path is unchanged.

**Menu placement & gating:**
- New `SidebarBtn` in `src/components/copy-maker/CopyMakerSidebar.tsx`, rendered immediately below the existing "Export HTML (Preview)" button, gated on `hasContent && isAdmin`.
- Disabled when the session lacks scores or comparison data. Disabled tooltip (Spanish): `Genera puntuaciones y comparación antes de exportar este reporte.`
- While the AI narrative call is in flight, the button shows "Generando…" with a pulsing icon and is disabled.
- On success, downloads a single self-contained `.html` file via `Blob` + `URL.createObjectURL`. Filename: `Reporte-Copy-{empresaSlug}-{YYYYMMDD}.html` (e.g. `Reporte-Copy-sales-boost-consulting-20260803.html`).

**Files created:**
- `src/utils/clientReport/buildClientReportData.ts` — assembles the `ClientReportData` object from existing session data; exports `buildClientReportData`, `buildClientReportFilename`, `buildClientReportInputMarkdown`, `ClientReportData` and related interfaces, plus the config constant `SUPPRESS_ZERO_VALUE_NUMERIC_FINDINGS = true` and `CLIENT_REPORT_PREVIEW_PERCENT = 25`.
- `src/utils/clientReport/clientReportNarrative.ts` — the single AI call that produces the five narrative fields (company name, Spanish-translated brief, executive summary, findings, head-to-head notes, version labels). Uses `makeStreamingReportRequest` with `getAdminClaudeModel()` and operation type `client_report_narrative`; returns `null` on any failure and **logs the error loudly** to the console so a missing or broken call is never silently degraded. The AI prompt explicitly requests a `briefEs` object so the (often English) stored brief fields are translated through the model rather than via a hardcoded phrase table. The AI input markdown surfaces each proposal's internal `versionId` (UUID) so the model can echo it back in `versionLabels[].versionId`, allowing the builder to match labels to the correct generated card.
- `src/utils/clientReport/renderClientReport.ts` — renders the full self-contained HTML document (inline `<style>` block, no external fonts/CDN/JS) from a `ClientReportData` object.

**Files modified:**
- `src/components/copy-maker/CopyMakerSidebar.tsx` — imports the three new modules; adds `isGeneratingHtmlPreview2` state, `canExportHtmlPreview2` guard, `handleExportHtmlPreview2` async handler, and the new `SidebarBtn` below the existing "Export HTML (Preview)".

**Database / billing:**
- New row in `llm_billing_rules`: `rule_name = 'client_report_narrative'`, `cost_multiplier = 1.0`, `usd_per_unit = 0.01`, `min_units_per_call = 1`, `rounding_mode = 'up'`, `is_active = true`. Applied via migration `add_client_report_narrative_billing_rule.sql`. The narrative call is charged once per export like any other AI operation, using the economy model (admin's configured Claude model).

**Data model (`ClientReportData`):** Every field comes from existing session data except the four AI-generated fields (company name, executive summary, findings, head-to-head notes, version labels) produced by the single narrative call. The object covers: studio config (hardcoded `Sharpen.Studio` for now), company (name, URL, analysed-at timestamp + Spanish-formatted date/time labels, language), journey (baseline / winner / potential scores, deltas, version & proposal counts), executive summary (exactly 3 paragraphs), findings (exactly 4, ordered by impact), brief (audience, key message, CTA, emotion, brand values, tone line, keywords, excluded sections), head-to-head (original vs. winner headline + sub + AI note), versions (one entry per evaluated version with section-aware 25% preview slice, strengths, improvements, derived display names), roadmap (from the winner's deep-analysis suggested improvements with `points_delta`), and derived template values (`findingsCountWord`, `roadmapCountWord`, `winnerDisplayName`, `lastIndex`).

**Section-aware truncation (paragraph-level, text REMOVED):** `sliceSections` cuts at a section boundary first, then — for the section that would overshoot the 25% target — adds paragraphs one at a time (split on blank lines) and stops as soon as the running total reaches `CLIENT_REPORT_PREVIEW_PERCENT` (25), keeping at least one paragraph. The hero section is always kept in full. Unkept paragraphs and subsequent sections are physically removed from the HTML (never hidden via CSS). The last visible element gets a soft `.fade` gradient edge (no `max-height`, no `overflow`). A self-check logs a console warning if a version keeps more than 40% of its characters — this fires whenever the cut lands too late.

**Section splitting (no regex):** `splitSections` uses only `String.split`, `trim`, `startsWith`, and plain comparisons — no regular expressions anywhere in the splitting logic. It tries `\n---\n` first, then `---`, then `\n\n` paragraphs. For each block, the first non-empty line is treated as a label only if it has ≤4 words and does not end in `.`, `!`, `?`, `:`, or `;`. Labels are resolved through a bilingual `SECTION_LABEL_MAP` (English + Spanish → Spanish display label). The label never appears inside the `<p>` body. If a single section exceeds 400 chars, the paragraph split is forced.

**Potential score:** `potential = winnerScore + sum(roadmap[].points)`, capped at 100. If the deep analysis already returns a `projected_score` on a suggested improvement, that projection is used instead of the sum.

**Excluded sections:** When the source is a crawl, sections classified as testimonials, cookie/consent notices, and navigation are excluded from both the analysed copy and the brief, and listed in `brief.excludedSections` so the report can state it.

**The four AI calls (run in a single round-trip):** The system prompt instructs the model to write in neutral Spain-Spanish, never invent data, never call a claim false (only "not supported" / "not verifiable"), cite the site with `<q>…</q>`, and return only JSON. The user prompt passes the crawled original copy, the derived brief, all version scores and sub-scores, the existing strengths/improvements lists, the existing risk flags (after suppression), and the deep-analysis winner narrative. Expected JSON: `companyName`, `briefEs { audience, keyMessage, cta, emotion, brandValues }`, `executiveSummary[3]`, `findings[4]` (categories: Credibilidad | Prueba social | Lenguaje | Conversión | Claridad | Estructura | SEO), `headToHead { originalNote, winnerNote }`, `versionLabels[]` (Propuesta A · <angle>, etc.).

**Escaping — exactly once, at render time:** The data model stores all values raw. The renderer has two helpers — `escapeOnce` (wholesale HTML escaping) and `sanitizeInlineHtml` (escape once, then re-enable only `<strong>`, `<b>`, `<q>`, `<em>`) — and each is called exactly once per value. `*Html` fields are the only ones allowed to carry inline markup; everything else is escaped wholesale. This prevents the `&#039;` and `&amp;amp;#039;` double/triple-escaping regressions seen in earlier attempts.

**Sub-scores — normalised to 0–100:** `editorialQuality` is the sum of `absoluteScore.clarity` and `absoluteScore.structure` (each 0–25, so the sum is 0–50), multiplied by 2 to land on 0–100; `conversionPotential` is the same for `absoluteScore.persuasion` and `absoluteScore.audience_fit`. Both are clamped to 0–100. The earlier `/0.5` formula doubled the value and could exceed 100; the intermediate `/2` under-reported to 0–25. The current `*2` matches the source field ranges.

**Suppression rule:** `SUPPRESS_ZERO_VALUE_NUMERIC_FINDINGS = true` (default on). Any finding, risk flag, or quoted evidence whose numeric content is entirely zero (patterns like `+0`, `0 %`, `+0%`, `0.0`) is silently discarded — both from the rendered output and from the input passed to the AI call, so the model can't reintroduce it. This prevents the crawler's pre-animation `+0` markup from being reported as a real claim. Findings never accuse the site of lying; correct framings are "cifras sin fuente citada", "afirmación no verificable", "superlativo antes de la prueba".

**Version naming:** Internal labels (`Generated Copy N`, `Alternative:`, `Modified:`) never appear. Proposals are mapped in score order to `Propuesta A / B / C` plus an angle the model derives from the actual text (e.g. `Propuesta A · Enfoque directo`). The original is always `Tu copy actual`. If two versions are near-identical (>85% token overlap), the later one is labelled as a variant (`Propuesta C · Directo refinado`, role line `Variante de la propuesta A con cierre reforzado`).

**Company name:** Prefer `og:site_name`, then `<title>` with any trailing tagline stripped, then the AI's reading of the copy. Never falls back to the bare URL — the URL appears separately under the title.

**Failure handling:** If the AI call fails or returns invalid JSON, the export still completes using deterministic fallbacks: company name from the project description / URL host, no executive summary section, findings taken verbatim from the existing risk flags (after suppression), generic version labels `Propuesta A/B/C`, and no head-to-head notes. A slightly plainer report beats a failed export.

**Localisation:** 100% Spanish output. Reading levels (`avanzado` / `intermedio` / `básico`), dates (`3 de agosto de 2026, 11:09 h`), section labels (`Encabezado / Introducción / Características / Beneficios / Cómo funciona / Servicios / Cursos / Casos de éxito / Cierre`), score dimension names (`claridad / persuasión / engagement / calidad editorial / potencial de conversión`), and risk-flag text (translated at generation time via the prompt, not a lookup table) are all Spanish. Numbers use the Spanish thousands separator and a non-breaking space before `%` (`39 %`); `/100` is always lowercase.

**Template:** The renderer implements the full document from the spec — dark cover with the three-stop journey rail, executive summary, prioritised findings, table of contents, head-to-head versus, brief input summary, one section per version (with 25% preview band + paywall CTA + strengths/improvements split), full ranking table, roadmap with point badges and total, final CTA, and footer with disclaimer. All CSS is inline in a single `<style>` block (deliberately verbose and self-contained — not refactored into Tailwind or the app stylesheet, because the file gets emailed and opened outside the app). Responsive at 390px (ranking table collapses to cards); prints to PDF with the dark cover intact and no cut sections.

**Escaping:** Every value is HTML-escaped except fields explicitly named `*Html`, which carry sanitised inline markup (`<strong>`, `<b>`, `<q>`, `<em>` only — everything else is stripped).

**Acceptance checklist met:** item appears directly below the original; original is unchanged; export produces one self-contained `.html` with no external requests; zero English strings in the output; no `Generated Copy` / `Alternative:` / `Modified:` anywhere; TOC shows per-version score, `+N pts`, and `+N % vs. actual`; cover shows the three-stop journey with correct baseline/winner/potential; `potential` equals winner score plus sum of roadmap points (or deep-analysis projection); every non-baseline version shows the preview band with a working `#contacto` anchor; `SUPPRESS_ZERO_VALUE_NUMERIC_FINDINGS` is on and no `+0` / `0 %` claim reaches the output; renders at 390px; prints to PDF with dark cover intact; credits are charged once for the narrative call and recorded in the usage table; with the AI call forced to fail, the export still completes using fallbacks.

**Refinements (v1.3):**

1. **Baseline is never truncated.** The baseline version is the client's own published text, so it is shown in full — no paragraph trimming, no `.fade` gradient, no paywall band. The whole report rests on "this is what we read from your site"; showing a quarter of it would make the diagnosis unverifiable. The baseline is also excluded from the >40 % kept-character self-check (it deliberately shows 100 %). `sliceSections` now takes an `isBaseline` flag and short-circuits before any truncation logic.

2. **Real kept-character percentage in the paywall band.** The paywall band previously printed the constant `25 %` regardless of what was actually kept. Each non-baseline version now carries a `keptPercent` field computed as `round(keptChars / totalChars * 100)`, and the band prints that real number. If a proposal ends up showing 31 %, it says 31.

3. **Every proposal names the missing sections.** Previously only the winner listed the cut section labels ("Te falta por ver: Portafolio, Nosotros, Cierre"); A and C got a generic sentence. All non-baseline versions now list the section labels that were cut, falling back to a complete sentence only when nothing was cut (e.g. when the proposal was short enough to fit entirely in the preview).

4. **Scanned URL is a clickable link and the first brief row.** The cover URL is now an `<a target="_blank" rel="noopener noreferrer">` with a hover state, instead of plain text. The same URL also appears as the first row of the "Resumen de entrada" table (label "URL analizada"), since that section is titled "Qué leímos de tu sitio" but never stated which page everything came from. Both placements are omitted when no URL is available, and the disclaimer rewrites itself to read correctly without one.

**Refinements (v1.4):**

1. **Proposal order matches letter assignment.** Proposals are now sorted by score descending before letter assignment, so the AI's "Propuesta A" (highest score) maps to anchor `#propA`, "Propuesta B" to `#propB`, etc. Previously the array order was arbitrary, so the TOC could list "Propuesta C" as item 3 with anchor `#propA`, scrambling letters, anchors and order.

2. **Word count comes from the app, not the AI.** The AI's `roleLine` previously could contain an invented word count that disagreed with the ranking table. The app now strips any trailing " · NNN palabras" from the AI's roleLine and appends the computed word count itself. The prompt was also updated to instruct the model to return only the angle description, not a word count.

3. **Baseline crawl noise cleaned.** Because the baseline now renders at 100%, crawl noise became very visible: eleven portfolio entries as separate sections, button labels ("Cotizar proyecto") as standalone sections, and empty "Nosotros" blocks. A `cleanBaselineSections` pass now drops empty sections, drops standalone button/nav labels (short text with no sentence punctuation), and merges consecutive short list-like entries into a single "Portafolio" section.

4. **"Te falta por ver" lists only fully-cut sections.** The paywall line previously listed the section where the cut landed, even though part of it was visible. Now only sections cut *entirely* appear in "Te falta por ver"; the partial section is omitted from the list.

5. **Split block always renders.** When a proposal had no strengths or improvements, the entire split block was dropped, so Propuesta B rendered without one while A and C did. The block now always renders, with a "Sin observaciones destacadas." line in the empty list, so all three versions read consistently.

6. **Roadmap titles punctuated.** The bold lead-in now ends with a period so it doesn't run on into the body ("<strong>…transformaciones concretas.</strong> Agregar una línea como…").

7. **Scanned URL on fresh analysis.** The URL cover/brief-row fix from v1.3 only appears when a URL is present in the session. A session analysed before the wizard fix has no URL, so the link is correctly absent. Run a fresh URL analysis end-to-end to confirm the link appears.

**Refinements (v1.5):**

1. **Section labels extracted from every block, not just the first.** The `SECTION_LABEL_MAP` lookup compared `firstLine.toLowerCase()` against unaccented keys (`introduccion`), but the actual text carries accents (`Introducción`), so accented labels never matched. The marker line then stayed in the body, printing "Introducción" then a blank line then the text. Only sections with no accents (Beneficios, Servicios, Cursos, Casos de éxito) resolved — which is why "Te falta por ver" named those correctly while the rendered sections did not. The lookup now normalizes accents (NFD + strip diacritics) before matching, so labels are extracted from every block and the marker line is stripped from every section's text. Knock-on fix: the head-to-head winner column now shows the first sentence of the introduction instead of the literal word "Introducción".

2. **"Sección" no longer appears as a section name.** When a block has no recognisable label, it is now excluded from "Te falta por ver" rather than named "Sección".

3. **Orphan bullets dropped after zero-suppression.** Zero-suppression previously left bullets with no numbers ("• Capacitadas", "• Aumento de Ventas"). When a bullet line's only numeric value was suppressed, the whole bullet is now dropped instead of leaving the label.

**Refinements (v1.6):**

1. **Analysed URL resolved via a priority chain.** Previously the report read the URL from a single field (`competitorUrls[0]`), which was empty for sessions created before the wizard fix. The URL is now resolved from the first available source in this order: (a) the first URL extracted from `projectDescription` free text — the user may write "Sitio: https://example.com — consultoría B2B", so the URL is parsed out rather than assumed to be the whole field; (b) the wizard's analyze-url capture (stored in `competitorUrls[0]`); (c) the first URL appearing in the original copy; (d) none — the cover link and "URL analizada" brief row are omitted and the disclaimer rewrites itself. Whichever source wins, the URL is never used as the company name; that is resolved separately from `og:site_name` / `<title>` / the AI narrative.

**Refinements (v1.11):**

1. **Portfolio merge preserves client names.** The v1.10 `splitSections` change stripped the first line of each portfolio block as a "label" and kept only the second line (the category) as the body. When `cleanBaselineSections` merged consecutive blocks into one "Portafolio" section, it concatenated only the bodies — so the project names (Marinaterra, Logofolio v01, Sales Boost Consulting, FCO Group, Inmaris, Vita Veta, Rancho San Lucas, SUYANA, Cellen, Cuesta Campos, Benavento) were dropped and only the service categories survived. The merge now reconstructs each block's full original text by re-joining the stripped label with the body before concatenating, so every line appears in its original order. Never deduplicate, never drop alternating lines, never filter by length inside the merge. Verified against the Sharpen export: all eleven client names appear in the merged Portafolio block, each followed by its category, in order.

2. **Empty sections dropped entirely.** Sections whose body text trims to empty previously rendered their label plus a blank `<p></p>` (one in Sales Boost, three in Agenciópolis, six in CopyZap). `renderVersion` now filters out sections with empty body text before rendering, so neither the label nor the blank paragraph appears.

3. **"Sin observaciones destacadas." rendered once.** When both the strengths and improvements columns were empty, the split block emitted two side-by-side "Sin observaciones destacadas." lines (one per column). `renderSplitBlock` now detects the both-empty case and renders a single full-width sentence instead, via a new `.split-empty` / `.empty-full` CSS pair.

4. **Label map matches on word boundaries.** `mapSectionLabel` previously matched map keys as bare substrings, so a heading like "Portafolio de Servicios" was mislabelled "Portafolio". Matching now requires the key to appear as a whole word (bounded by start/end or non-letter characters), with accent normalisation, so only true portfolio sections get the "Portafolio" label.

**Refinements (v1.10):**

1. **Table of contents index derived from shown entries.** The ranking entry's index and the ranking section's eyebrow were both computed from `data.versions.length` (the total version count), so they jumped from 5 to 8 when the report only developed five entries in full. Both now derive from the entries actually shown in the table of contents (`tocVersions.length + 2`), so the index is sequential with no gap. With three proposals plus the baseline plus the ranking section, the indices run 1–6 and the eyebrow reads "6 · Comparación".

2. **Version count convention unified.** The cover stamp said "N versiones evaluadas" while the ranking lede said "Las N versiones evaluadas" — one counted proposals only, the other included the baseline, so the two numbers disagreed (5 vs. 6). The convention is now proposals-only everywhere: the cover stamp reads "5 propuestas evaluadas" and the ranking lede reads "Las 5 propuestas y tu copy actual, evaluadas con el mismo criterio…". Both use `generatedProposalCount` (proposals only, excluding the baseline), so the two numbers always agree.

3. **Explanatory note under the ranking table.** When the cap leaves some evaluated proposals without a full section, a reader saw proposals in the ranking table that existed nowhere else in the document and read it as a bug. The note now always appears whenever `shownProposals < totalEvaluated`: "Se evaluaron 5 propuestas en total; este reporte desarrolla las tres mejores." The count word is rendered in Spanish ("tres") via a small `spanishNumWord` helper in the renderer.

4. **Custom headings treated as section labels.** `splitSections` only recognised headings present in `SECTION_LABEL_MAP`, so custom headings like "El Problema Que Nadie Te Dice" or "Branding con Propósito Real, No Decoración" stayed in the body as plain text, the section rendered without a label, and the paywall band fell back to the generic sentence. Any short first line (≤4 words) without ending punctuation is now treated as a section label even when it is not a recognised name: it is title-cased as given (via a new `titleCase` helper) and used as the section label, so custom headings render as labels and appear in "Te falta por ver".

5. **Isolated button labels dropped, not mislabelled "Portafolio".** `cleanBaselineSections` previously merged any short no-punctuation block into a "Portafolio" section, so an isolated button label like "Cotizar proyecto" was mislabelled as a portfolio entry. The merge logic now groups consecutive short no-punctuation blocks into runs: a run of ≥2 blocks (or any block with a slash/dash separator) is a portfolio list and is merged into "Portafolio"; an isolated single short block with no separator is a button/nav label and is dropped entirely.

**Refinements (v1.9):**

1. **Unscored proposals never render as full sections.** The shown-in-full set is built from `versionsByScore`, which already filters to `!isBaseline && isScored`. So an unscored proposal can never enter the shown-in-full set, can never be assigned a letter, and can never appear with a 0/100 score or "+0 pts" delta in a card or in the table of contents. If fewer than three scored proposals exist, fewer than three full sections are shown — never padded with unscored ones. (This was already enforced by the v1.8 filter; v1.9 confirms and documents it as an explicit invariant.)

2. **Ranking note no longer names an internal screen.** The second note line under the ranking table previously read "…están disponibles en Copy Maker", naming a screen inside the app that a client reader has no way to open. It now reads: "N versión(es) adicional(es) quedaron sin evaluar comparativamente y no se incluyen en este reporte." (The first note line was later refined in v1.10 to read "Se evaluaron N propuestas en total; este reporte desarrolla las tres mejores.")

3. **Footer contact column removed.** The right-hand footer block containing the bare domain "sharpen.studio" and the email "hola@sharpen.studio" is deleted entirely. Every call-to-action already points to https://sharpen.studio/contacta-web/, so a bare domain and email are redundant and invite replies to an unmonitored inbox. The footer layout was adjusted so the remaining left-hand block uses the full width (`display:block` on the wrapper, `max-width:74ch` on the block) rather than sitting in a half-width column with an empty gap.

4. **Confirmed-still-present items (no change, verified):**
   - The cover URL link builds its href with an https:// prefix via `absoluteHref()`, so it is a working absolute link, while the visible text keeps showing the domain without the protocol.
   - The cover top-right line reads (via CSS `text-transform:uppercase`): "ANÁLISIS REALIZADO CON COPYZAP · SOFTWARE PROPIO DE SHARPEN.STUDIO".
   - The footer attribution reads: "Análisis realizado con **CopyZap**, la herramienta de análisis y reescritura de copy que desarrollamos en Sharpen.Studio · <fecha>" with CopyZap in bold.
   - The "Agendar 20 minutos" button no longer exists; the final CTA block has a single button, "Solicitar el copy completo".
   - Every call-to-action button — the per-proposal "Solicitar versión completa" buttons, the roadmap "Ver la versión completa" button, and the final "Solicitar el copy completo" button — points to the single `CTA_CONTACT_URL` constant (https://sharpen.studio/contacta-web/) and opens in a new tab with `target="_blank" rel="noopener noreferrer"`.

**Refinements (v1.8):**

1. **Proposals shown in full capped at three.** A new `MAX_PROPOSALS_SHOWN = 3` constant limits how many proposals get a full version section (heading, copy, paywall band, strengths/limits). The winner plus the next highest-scoring proposals up to that cap are developed in full; the rest appear only as compact rows in the ranking table. Letters A/B/C are assigned to the shown proposals only (the existing score-ordered letter assignment already yields this). The baseline is always shown in full. The table of contents now lists only the shown proposals plus the baseline, so it no longer advertises sections the report does not contain.

2. **"Se evaluaron N versiones" note under the ranking table.** When some proposals were not developed in full, a single line appears below the ranking table: "Se evaluaron N versiones en total; este reporte desarrolla las tres mejores." N is the true count of generated copy versions, not the count that happen to have comparison rows.

3. **Cover stamp reports the true version count.** Previously the stamp read `journey.versionCount`, which was the length of the filtered card list — a mix that could undercount real copy versions (when the name-based filter dropped a card whose display name contained "Analysis"/"Comparison") or inflate it (when SEO metadata, FAQ schema, or GEO outputs slipped in). The stamp now reports `generatedProposalCount`, the count of cards whose type is a real copy version (Improved, Alternative, RestyledImproved, RestyledAlternative, Boosted), excluding the baseline and all non-copy noise.

4. **Version filtering by type, not by name.** The old filter kept a card unless its `sourceDisplayName` contained "Analysis" or "Comparison". That was fragile: it silently dropped any copy card whose name happened to include those words, and it let non-copy cards (SEO metadata, FAQ schema, GEO outputs) through. The filter now keeps only cards whose `type` is a real copy version (plus the original baseline). This is the root cause of the user's report that fewer versions appeared than Copy Maker held: a copy card named, for example, "Comparison of variants" would have been dropped by the old name filter even though it was a real proposal.

5. **Unscored proposals surfaced, not silently omitted.** Proposals that have no comparison score are now excluded from the ranking table (they have no comparable score) but kept in the full-versions list, and a second note line appears under the table when any exist: "N versión(es) generada(s) no figura(n) en la tabla por no contar con puntuación comparativa; están disponibles en Copy Maker." Each version carries an `isScored` flag; the ranking table and the `versionsByScore` sort use only scored proposals, while the full-versions list and counts include unscored ones so the work is visible.

**Refinements (v1.7):**

1. **Cover URL link fixed.** The cover's site link rendered `href="sharpen.studio"` (protocol-stripped), so the browser treated it as a relative path and the link went nowhere. The `href` now gets an `https://` prefix when the stored value has no protocol; if it already starts with `http://` or `https://` it is left untouched. The visible link text keeps the protocol stripped as before.

2. **CopyZap attributed as Sharpen Studio's own product.** Both attribution lines now state that CopyZap is software Sharpen Studio built, turning a meaningless brand into evidence of capability:
   - Cover, top-right: "ANÁLISIS REALIZADO CON COPYZAP · SOFTWARE PROPIO DE SHARPEN.STUDIO".
   - Footer: "Análisis realizado con **CopyZap**, la herramienta de análisis y reescritura de copy que desarrollamos en Sharpen.Studio · <date>".

3. **"Agendar 20 minutos" button removed from the final CTA block.** The block now holds a single button: "Solicitar el copy completo".

4. **All CTA buttons point to one URL.** Every "Solicitar versión completa" button in the proposal paywall bands, the "Ver la versión completa" button in the roadmap block, and the remaining button in the final CTA block now open `https://sharpen.studio/contacta-web/` in a new tab (`target="_blank" rel="noopener noreferrer"`). The previous `#contacto` anchors and the `/agendar` / `/contacto` URLs are gone. The `id="contacto"` section keeps its id but nothing links to it. The destination URL lives in a single config constant (`CTA_CONTACT_URL` in `buildClientReportData.ts`) so it can be changed in one place later.

---

## Export HTML — `exportAsFormattedHtml` Visual Redesign (2026-08-04)

**Feature:** Replaced the inline-styled, gray-toned markup of `exportAsFormattedHtml` (the standard "Export HTML" report, not the Spanish client report) with a new presentation-layer design system. All scoring logic, data extraction, translation strings, TOC behaviour, and the hidden `#llm-evaluation-context` / `#llm-evaluation-data` sections are untouched — only the visible/styled sections changed.

**File modified:** `src/utils/enhancedExports.ts`

**Design system (CSS):** A single `<style>` block now defines a warm-paper / ink palette via CSS custom properties (`--ink`, `--paper`, `--line`, `--accent`, `--gain`, `--warn`, plus `--serif` / `--sans` / `--mono` font stacks). The previous `body` max-width / inline-style approach is replaced with a `.wrap` (max-width 940px) container and `section` blocks separated by hairline rules. The `.breadcrumb-nav` and `@media print` rules from the previous block are preserved, recoloured to the new palette, and merged alongside the new system. A `@media(max-width:760px)` block collapses the split columns, brief rows, ranking grid, and journey widget for mobile.

**Cover / header (`#doc-header`):** Replaced the plain text header + winner banner with a dark `.cover` block: `.brandbar` (CopyZap wordmark left, "Copy Evaluation Report" label right) → `.kicker` → `<h1>` project title → `.stamp` (generated date, variant count, language). When scores are available, a `.journey` widget renders up to three `.stop` entries — baseline (lowest / original score), winning version (winner score + label), and potential (projected score from the winner's deep-analysis suggested improvements, capped at 92, falling back to baseline → winner only when no projection exists) — connected by a `.rail` with positioned dots. A `.journey-foot` line states the delta in points and percent.

**Table of contents (`#toc`):** `renderTocRow` now emits `.toc a` rows with `.idx` (mono index), `.name` (plus `.win` badge when the row is the winner), and `.sc` (serif score, `/100`), replacing the previous dotted-leader flex markup.

**Input summary (`#input-summary`):** The configuration `<table>` is replaced with `.brief-tbl` / `.brief-row` (`.k` / `.v`) grid rows. The source-text preview is wrapped in `.preview-box` with a `.preview-text` div containing one `<p>` per paragraph (reusing the `renderTextAsParagraphs` helper from the earlier spacing fix).

**Per-version cards (`generateFullHtmlExportForCard`):** Each card is now `.version` > `.v-head` (`.t` with `<h3>` title + `.win` badge if winner, `.role` subtitle; `.v-scores` with `.big` score and `.gain` delta vs. the original baseline) > `.v-body` with one `.sec` per content block (`.sec-lbl` + `<p>` paragraphs; the first/hero block gets `.sec.hero` with serif styling). The strengths/improvements block is now a `.split` with `.pos` / `.neg` columns (checkmark / arrow bullets via `:before`), replacing the previous inline bullet lists. The on-the-fly `generateExportAnalysis` still feeds the two columns.

**Rankings (`#comparison-rankings`):** Rebuilt as `.rank` > `.rank-row.head` + one `.rank-row` per version (`.pos` rank, `.nm` name + sub-label, `.cell` editorial-quality and conversion-potential columns, `.dl` delta vs. original, `.tot` total score). `.rank-row.is-win` highlights the winner; `.rank-row.base` styles the original/baseline row. Verification flags and risk factors render as inline sub-rows beneath the relevant version row, recoloured to `--warn-soft` / `--accent-soft`. The winner's deep-analysis suggested improvements render as a `.road` block with `.road-item` point badges and a dark `.road-total` showing the projected score.

**Breadcrumb nav:** Structure and behaviour unchanged; colours retuned to `var(--ink)`, `var(--line)`, `var(--paper)`.

**Acceptance:** `npm run build` passes. No scoring logic, data extraction, translation strings, or hidden LLM-evaluation section ids / `data-*` attributes were modified.

---

## Export HTML — Plain-Markdown Cards Now Match Preview 2 Design (2026-08-04)

**Feature:** When a generated card stores its content as plain markdown (rather than the structured `{headline, sections[]}` JSON), the export previously rendered that markdown through `markdownToHtml()` — a function that hardcodes inline `style="..."` attributes on every `<h1>`, `<h2>`, `<h3>`, `<hr>`, `<ul>`, `<li>`, and `<p>` it emits. Because inline styles always win over stylesheet rules, those headers/bullets ignored the new Preview 2 design system and rendered in the old plain black/Arial look, breaking visual consistency inside an otherwise redesigned card.

**Files modified:** `src/utils/copyFormatter.ts`, `src/utils/enhancedExports.ts`

**`markdownToHtml` signature change:** The function now accepts an optional second parameter: `markdownToHtml(markdownText: string, options?: { inlineStyles?: boolean }): string`. `inlineStyles` defaults to `true`, so every existing caller — including the Copy Maker UI's `FormattedContent.tsx` — behaves exactly as before (zero visual change to the in-app formatted view). When called with `{ inlineStyles: false }`, the function emits the same tags but without inline `style` attributes, instead attaching semantic class names: `<h1 class="md-h1">`, `<h2 class="md-h2">`, `<h3 class="md-h3">`, `<hr class="md-hr">`, `<ul class="md-ul">` / `<ol class="md-ul">`, `<li class="md-li">`, `<p class="md-p">`. Table conversion, bold/italic/link/code handling, and all other behaviour are unchanged.

**Export call site:** The non-structured fallback branch in `exportAsFormattedHtml` (the `else` branch of the `isStructured` check inside the per-card generator) now calls `markdownToHtml(plainText, { inlineStyles: false })` so the generated markup defers to the stylesheet rather than overriding it.

**New CSS rules:** Added to the export's `<style>` block (alongside the existing `.v-body .sec` rules) so the new classes adopt the Preview 2 typography:

```css
.v-body .sec .md-h1{font-family:var(--serif);font-size:22px;font-weight:600;color:var(--ink);margin:28px 0 12px;padding-bottom:10px;border-bottom:1px solid var(--line-soft)}
.v-body .sec .md-h1:first-child{margin-top:0}
.v-body .sec .md-h2{font-family:var(--sans);font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:22px 0 8px}
.v-body .sec .md-h3{font-family:var(--sans);font-size:13px;font-weight:700;color:var(--ink-soft);margin:18px 0 8px}
.v-body .sec .md-hr{border:0;border-top:1px solid var(--line-soft);margin:22px 0}
.v-body .sec .md-p{font-size:15.5px;line-height:1.7;color:var(--ink-soft);margin:0 0 10px}
.v-body .sec .md-ul{margin:0 0 10px;padding-left:22px;color:var(--ink-soft);font-size:15px;line-height:1.65}
.v-body .sec .md-li{margin-bottom:6px}
```

`md-h1` matches the serif section-title treatment, `md-h2` mirrors the uppercase `.sec-lbl` eyebrow, `md-h3` is a smaller sans label, and `md-p` / `md-ul` / `md-li` inherit the same body text sizing and colour used by the structured-card paragraphs and lists — so plain-markdown cards now look consistent with structured cards.

**Acceptance:** `npm run build` passes. The Copy Maker in-app "formatted" view (`FormattedContent.tsx`, which calls `markdownToHtml` with no options) is unchanged because `inlineStyles` defaults to `true`.

---

## Export HTML — Plain-Markdown Headline Now Renders as Hero (2026-08-04)

**Feature:** The plain-markdown fallback branch in `generateFullHtmlExportForCard` (the `else` of the `isStructured` check) previously dumped the entire markdown string — including its leading `# Headline` line — straight through `markdownToHtml`. That turned the headline into a bold `<h1 class="md-h1">` with a bottom border (a document-heading style), which was inconsistent with the `isStructured` branch just above it. The structured branch renders the headline separately in a large, non-bold serif "hero" treatment via `<div class="sec hero"><p>...</p></div>` (styled by the existing `.v-body .sec.hero p` CSS rule), and it was also redundant with the card's title shown in `.v-head h3` above.

**Files modified:** `src/utils/enhancedExports.ts`

**Logic change:** Before running `markdownToHtml`, the branch now matches a leading H1 with `/^\s*#\s+(.+?)\s*(?:\n|$)/` against the start of `plainText` (allowing leading blank lines). When a match is found, the captured headline text is stripped of markdown via the existing `stripMarkdown` helper and rendered inside `<div class="sec hero"><p>${headline}</p></div>`, and `markdownToHtml` (with `{ inlineStyles: false }`, per the prior fix) is run only on the remaining text after the matched headline line, wrapped in its own `<div class="sec">...</div>`. When no leading `#` headline is present, the previous behaviour is preserved — the whole `plainText` goes through `markdownToHtml` in a single `.sec`.

**Resulting shape:**

```js
} else {
  const plainText = previewMaxWords && typeof renderContent === 'string'
    ? truncateWordsAtSentence(renderContent, previewMaxWords)
    : (typeof renderContent === 'string' ? renderContent : JSON.stringify(renderContent));

  const headlineMatch = plainText.match(/^\s*#\s+(.+?)\s*(?:\n|$)/);
  if (headlineMatch) {
    const headline = stripMarkdown(headlineMatch[1]);
    const rest = plainText.slice(headlineMatch[0].length);
    html += `<div class="sec hero"><p>${headline}</p></div>\n`;
    html += `<div class="sec">${stripColoredSpans(markdownToHtml(rest, { inlineStyles: false }))}</div>\n`;
  } else {
    html += `<div class="sec">${stripColoredSpans(markdownToHtml(plainText, { inlineStyles: false }))}</div>\n`;
  }
}
```

The main headline now renders large, serif, non-bold, with no underline (matching `.sec.hero p` — the same visual weight as structured cards' hero headline), and the rest of the markdown content (Hero, Introduction, Features, etc.) still renders below it with the `md-h1` / `md-h2` / etc. classes from the previous fix.

**Acceptance:** `npm run build` passes. Structured-card exports are unchanged.

---

## Export Report Theme — Single Source of Truth (2026-08-04)

**Feature:** The full CSS design system that styles the CopyZap HTML report export (cover, TOC, version cards, rankings, roadmap, footer, breadcrumb nav, print + mobile media queries) has been extracted out of `src/utils/enhancedExports.ts` into a dedicated file `src/utils/exportReportTheme.ts`, so the design can be maintained in one place going forward instead of being buried inline in the export-generation code.

**Files modified:**
- `src/utils/exportReportTheme.ts` (new) — exports a single constant `EXPORT_REPORT_STYLES` containing the verbatim CSS previously living between the `<style>` and `</style>` tags of `exportAsFormattedHtml` in `enhancedExports.ts` (formerly lines ~2914–3105). A short comment at the top of the file notes: "Single source of truth for the CopyZap HTML report design system (Preview 2 style). Edit this file to change colors, fonts, spacing, or component styles across all future report exports."
- `src/utils/enhancedExports.ts` — imports `EXPORT_REPORT_STYLES` from `./exportReportTheme` and replaces the inline `<style>...</style>` block with `<style>${EXPORT_REPORT_STYLES}</style>`.

**Scope of extraction:** This is a pure extraction — no rule, value, or selector was changed. The report has a single stylesheet covering cover/TOC/version cards/rankings/etc., and that one block is the only `<style>` block in `exportAsFormattedHtml`, so nothing else needed consolidating. Per-element `style="..."` attributes that are generated dynamically from data (e.g. score-color-based styles computed at runtime) are intentionally left untouched in `enhancedExports.ts` — only the static design-system CSS moved.

**Result:** Report exports render identically to before this change. Future design edits (colors, fonts, spacing, component styles) can be made in `exportReportTheme.ts` alone and will apply across all report exports.

**Acceptance:** `npm run build` passes with no errors. This is a refactor only — no design or content changes.

---

## Report Theme Editor — In-App Admin Customization of HTML Exports (2026-08-04)

**Feature:** Admins can now customize the visual design of every CopyZap HTML report export — colors, fonts, font weights, and font sizes — from an in-app editor, with changes saved to the database and automatically applied to all future exports. No code editing or redeploy is required.

**Access:** Dashboard → Admin Controls → "Report Theme" button (Palette icon), available only to users in the `app_admins` allowlist. Opens the route `/admin/report-theme`, which is admin-gated (non-admins see an "Admins only" screen; unauthenticated users are redirected to login).

**Database — new table `public.report_theme_settings`** (migration `20260804_create_report_theme_settings`):
- `id` (text PK, defaults to `'default'`) — single-row convention; the app always reads/writes the row with `id = 'default'`.
- `theme_vars` (jsonb, NOT NULL) — JSON object of CSS custom property values. Keys (camelCase): `ink`, `inkSoft`, `muted`, `line`, `lineSoft`, `paper`, `white`, `accent`, `accentSoft`, `gain`, `gainSoft`, `warn`, `warnSoft`, `serif`, `sans`, `fwHeading`, `fwBody`, `fsDisplay`, `fsH2`, `fsH3`, `fsHero`, `fsScoreLg`, `fsScoreMd`, `fsBody`, `fsLabel`, `fsSmall`.
- `updated_at` (timestamptz, default `now()`), `updated_by` (uuid → `auth.users(id)`).
- **RLS:** SELECT is public (`USING (true)`) so the synchronous export path can read the theme via the anon key without an authenticated session — the theme is presentation-only config, not user-private data. INSERT and UPDATE are restricted to admins via the existing `public.is_app_admin()` SECURITY DEFINER function (from migration `20260210163509_add_app_admins_allowlist.sql`). DELETE is intentionally not granted — "reset to defaults" overwrites `theme_vars` rather than removing the row.

**Refactor of `src/utils/exportReportTheme.ts`:**
- The `:root{}` block now declares font-size and font-weight custom properties in addition to the existing color/font-family vars: `--fw-heading` (600), `--fw-body` (400), `--fs-display` (54px), `--fs-h2` (32px), `--fs-h3` (22px), `--fs-hero` (24px), `--fs-score-lg` (34px), `--fs-score-md` (24px), `--fs-body` (15.5px), `--fs-label` (10.5px), `--fs-small` (13px) — defaults match the visual sizes already used in the stylesheet.
- Hardcoded font-size/font-weight values in the relevant selectors are replaced with `var(--fs-*)` / `var(--fw-*)` references (every other property on each rule unchanged): `h1,h2,h3,h4` → `font-weight:var(--fw-heading)`; `h1`/`h2` clamp maxes derive from `var(--fs-display)`/`var(--fs-h2)`; `h3`, `.v-head h3` → `var(--fs-h3)`; `.v-body .sec.hero p` → `var(--fs-hero)` + `var(--fw-heading)`; `.v-scores .big` → `var(--fs-score-lg)`; `.rank-row .tot`, `.toc .sc` → `var(--fs-score-md)`; `.v-body .sec p`, `.toc .name`, `.rank-row .nm` → `var(--fs-body)`; `.eyebrow`, `.v-body .sec-lbl`, `.split h5` → `var(--fs-label)`; `.cover .stamp` → `var(--fs-small)`.
- New exports: `ThemeVars` interface, `DEFAULT_THEME_VARS` object (camelCase keys matching the DB schema, holding all current default values), and `buildReportStyles(overrides?: Partial<ThemeVars>): string` which merges `{ ...DEFAULT_THEME_VARS, ...overrides }`, interpolates the `:root{}` block from the merged values, and returns the full stylesheet string. `EXPORT_REPORT_STYLES` is kept as `buildReportStyles()` with no overrides for backward compatibility.

**New hook `src/hooks/useReportTheme.ts`:** `useReportTheme()` fetches the `id = 'default'` row via the existing Supabase client, returns `{ themeVars, isLoading, isSaving, error, saveTheme, refresh }`, and falls back to `DEFAULT_THEME_VARS` if no row exists or the fetch errors. `saveTheme(newVars)` upserts `{ id: 'default', theme_vars: merged, updated_by: currentUser.id }` and is only invoked from admin-gated UI.

**Module-level cache in `src/services/supabaseClient.ts`:** Because `exportAsFormattedHtml` is a synchronous, non-hook function, it cannot await a fetch. A small module-level cache (`getCachedReportTheme()` / `setCachedReportTheme()`) is populated once at app startup by `fetchReportThemeOnce()` (called from a `useEffect` in `App.tsx`) and on every successful `useReportTheme` fetch/save. `exportAsFormattedHtml` reads the cache via `getCachedReportTheme()`; if the cache is empty (before it warms, or no theme was ever saved) it falls back to `buildReportStyles()` with defaults — so behavior for anyone who hasn't customized anything, or before the cache warms, is unchanged.

**New admin page `src/components/admin/ReportThemeEditor.tsx`** (follows `AdminDiagnostics.tsx` conventions):
- Gated with `useIsAdmin`; non-admins see an "Admins only" screen, unauthenticated users are redirected.
- **Left panel — controls:** 13 color pickers (with hex text input) for every color var; font-family dropdowns for serif/sans (presets: Iowan/Palatino/Georgia, Georgia, Playfair Display, Times New Roman for serif; System/Inter, Helvetica, Segoe UI for sans); weight dropdowns for heading/body (400/500/600/700); range sliders for the 9 size tokens (display, h2, h3, hero, score-lg, score-md, body, label, small).
- **Right panel — live preview:** renders the same key components real reports use — cover block with brandbar/kicker/h1/journey widget, TOC rows, a version card with hero paragraph + sec-lbl sections + strengths/improvements split, and a rankings table row — styled by injecting `buildReportStyles(currentEditedVars)` into a `<style>` tag scoped to the preview container (every selector prefixed with `.rte-preview`) so it matches real export output exactly without affecting the editor's own Tailwind UI.
- **Preset buttons:** "Warm Paper (current)" = `DEFAULT_THEME_VARS`; "Cool Slate"; "Forest & Cream"; "Midnight Blue" — each applies the full preset to local edit state.
- **"Save"** calls `saveTheme(editedVars)` and shows a success toast; **"Reset to defaults"** resets local edit state to `DEFAULT_THEME_VARS` (does not delete the saved row unless explicitly saved again).

**Routing (`src/App.tsx`):** lazy import `ReportThemeEditor` added alongside `AdminDiagnostics`; new route `/admin/report-theme` mirrors the `/admin/diagnostics` pattern (wrapped in `AuthenticatedRoute` + `Suspense` with `AppSpinner` fallback, redirects unauthenticated users to `/login`).

**Dashboard entry (`src/components/Dashboard.tsx`):** inside the existing `{isAdmin && (...)}` Admin Controls block, a new button (Palette icon, `title="Report Theme"`) navigates to `/admin/report-theme`, matching the existing Blog button's style and `navigate(...)` pattern.

**Export wiring (`src/utils/enhancedExports.ts`):** the static `EXPORT_REPORT_STYLES` import is replaced with `buildReportStyles(getCachedReportTheme() ?? undefined)`, so every generated HTML export reflects the cached admin theme (or defaults if none).

**Acceptance:** `npm run build` passes. Migration applies cleanly. Admins can open `/admin/report-theme` from the Dashboard, adjust colors/fonts/sizes, see the live preview update, save, and generate a fresh HTML export that reflects every change across cover, TOC, version cards, and rankings with no broken layout at slider extremes. Non-admins and the state before any theme is saved still produce the original default design.

---

## Client/Website-Audit Report — Shared Design System + Breadcrumb Nav (2026-08-04)

**Feature:** Unified the second, independent HTML report generator (`renderClientReport` — the Spanish, Sharpen.Studio-branded "website audit" client report) with the same admin-customizable Report Theme design system the Copy Maker export already uses, and added the fixed bottom breadcrumb navigation bar that the Copy Maker export already had.

**Problem:** `src/utils/clientReport/renderClientReport.ts` carried its own frozen, hardcoded `const CSS = ...` block (lines 45–243) that was never wired to the admin Report Theme feature, so an admin's saved colors/fonts/sizes never reached this report. It also lacked the `<nav class="breadcrumb-nav no-print">` jump-link bar the Copy Maker export had, leaving readers to scroll the long Spanish audit document with no in-page navigation.

**Change 1 — Removed duplicated CSS, wired to shared design system:** Deleted the entire `const CSS = ...` block (lines 45–243). Added two imports at the top of the file:

```ts
import { buildReportStyles } from '../exportReportTheme';
import { getCachedReportTheme } from '../../services/supabaseClient';
```

In `renderClientReport()`, the template's `<style>\n${CSS}\n</style>` was replaced with:

```ts
<style>
${buildReportStyles(getCachedReportTheme() ?? undefined)}
</style>
```

This makes the client/website-audit report read from the exact same admin-saved theme (colors, fonts, weights, sizes) as the Copy Maker export, instead of its own disconnected copy. The cache is the same module-level `cachedReportTheme` populated by `fetchReportThemeOnce()` at app boot (see the Report Theme feature section above), so by the time a user generates a client report from CopyMakerSidebar the cache is already warm and any admin-saved `--accent` (or any other token) flows into this report's `:root{}` block.

**Change 2 — Added breadcrumb navigation bar:** Added a new `renderBreadcrumbNav(data: ClientReportData)` function that builds a `<nav class="breadcrumb-nav no-print">` with jump links to `#entrada` (Inputs), each shown version's `#${v.key}` (baseline + proposals developed in full — `v.isBaseline || v.isShownInFull`), and `#ranking` (Rankings). Labels use `v.displayName || v.key` (the real `ClientReportVersion` fields — there is no `label` field on that type). `${renderBreadcrumbNav(data)}` is inserted right after `${renderFooter(data)}` and before the closing `</body>` tag in the main template. The `.breadcrumb-nav`, `.bc-sep`, and `.bc-label` CSS classes already exist inside `buildReportStyles()`'s output (ported from `exportReportTheme.ts`), so no new CSS was needed once Change 1 landed.

**Anchor verification:** Version sections render with `id="${escapeOnce(v.key)}"` (line 303), `#entrada` exists (line 234), and `#ranking` exists (line 364), so every breadcrumb href resolves to a real anchor.

**Acceptance:** `npm run build` passes. Both report generators (Copy Maker `exportAsFormattedHtml` and client/website-audit `renderClientReport`) now visually share the same design system and both respect the saved admin theme — a custom `--accent` saved in `/admin/report-theme` appears in the `:root{}` block of both exported HTML types, and the client report now shows the fixed bottom breadcrumb bar with working jump links.

---

## Google Fonts Loading for Web-Font Serif Stacks (2026-08-04)

**Feature:** The Report Theme editor's "Serif (headings)" dropdown lets admins pick **Playfair Display** or **DM Serif Display** (web fonts hosted on Google Fonts) in addition to system-font stacks (Iowan Old Style/Palatino/Georgia/Times, Georgia, Times New Roman). Previously, selecting a web-font serif correctly set the `--serif` CSS variable but the actual font file was never fetched from Google Fonts — only "Inter" (the body sans) was loaded via a `<link>` tag, so the headings silently fell back to Georgia/Times. This fix injects the matching Google Fonts `<link>` tag(s) into both HTML report generators whenever the resolved serif stack references one of the two web fonts, and emits nothing for system-font stacks (no unnecessary fetch).

**Shared helper in `src/utils/exportReportTheme.ts`:** Added a single exported function `getSerifFontLinkTag(serifStack: string): string` near the other exports. It inspects the resolved theme's `serif` font-stack string and returns the matching Google Fonts `<link>` tag(s) — including `<link rel="preconnect">` hints for `fonts.googleapis.com` and `fonts.gstatic.com` — or an empty string if the serif stack doesn't need a web font fetch:

```ts
export function getSerifFontLinkTag(serifStack: string): string {
  const families: string[] = [];
  if (serifStack.includes('Playfair Display')) {
    families.push('Playfair+Display:wght@400;500;600;700;800;900');
  }
  if (serifStack.includes('DM Serif Display')) {
    families.push('DM+Serif+Display:ital,wght@0,400;1,400');
  }
  if (families.length === 0) return '';
  const familyParams = families.map(f => `family=${f}`).join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?${familyParams}&display=swap" rel="stylesheet">`;
}
```

Substring matching (`serifStack.includes('Playfair Display')`) is used because the saved `serif` value is a full CSS font-stack string (e.g. `"Playfair Display",Georgia,serif`), not a bare family name. Both web-font families can be matched simultaneously if a future stack references both, and the two preconnect hints are only emitted when at least one web font is needed.

**Copy Maker export (`src/utils/enhancedExports.ts`):** The import line now pulls `getSerifFontLinkTag` and `DEFAULT_THEME_VARS` alongside `buildReportStyles` from `./exportReportTheme`. Inside the per-card HTML generator, the theme is now resolved once into a local `const resolvedTheme = getCachedReportTheme() ?? undefined;` (replacing the previous inline `getCachedReportTheme() ?? undefined` call inside `buildReportStyles(...)`), and the `<head>` template injects `${getSerifFontLinkTag(resolvedTheme?.serif ?? DEFAULT_THEME_VARS.serif)}` immediately after the existing Inter `<link>`. So the head now reads:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  ${getSerifFontLinkTag(resolvedTheme?.serif ?? DEFAULT_THEME_VARS.serif)}
  <style>
${buildReportStyles(resolvedTheme)}  </style>
```

`DEFAULT_THEME_VARS.serif` is the fallback when no theme is cached (before the cache warms or no theme was ever saved) — its value is the system-font stack `"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif`, which contains neither web-font substring, so `getSerifFontLinkTag` returns `''` and behavior for the default/no-theme case is unchanged.

**Client/website-audit report (`src/utils/clientReport/renderClientReport.ts`):** Same pattern. The import line now pulls `getSerifFontLinkTag` and `DEFAULT_THEME_VARS` from `../exportReportTheme`. At the top of `renderClientReport()`, the theme is resolved once into `const resolvedTheme = getCachedReportTheme() ?? undefined;` (replacing the previous inline call inside `buildReportStyles(...)`), and the `<head>` injects `${getSerifFontLinkTag(resolvedTheme?.serif ?? DEFAULT_THEME_VARS.serif)}` between the `<title>` and the `<style>` block (this report has no Inter link — its body uses the sans stack which already includes Inter via system fallback).

**Why conditional injection:** The link tag is only emitted when the selected serif stack actually references one of the two Google-hosted fonts, so reports using the default/system serif options don't pay for an unnecessary font fetch. Both export code paths share the same theme resolution (`getCachedReportTheme()`), so the fix only needed the one new helper plus a two-line change in each file's `<head>` template.

**Acceptance:** `npm run build` passes. In the Report Theme editor, setting "Serif (headings)" to Playfair Display and generating/previewing a report now renders headlines and score numbers in Playfair Display's actual high-contrast letterforms (the `<head>` contains the Playfair Display `<link>`); same for DM Serif Display. Switching back to "Georgia" or "Iowan Old Style/Palatino/Georgia" emits no extra font `<link>` (verified by viewing page source — the `<head>` only contains the Inter link in the Copy Maker export, and no font link at all in the client report).

---

## Expanded Google Font Choices + Generalized Font Loading (2026-08-04)

**Feature:** Expanded the Report Theme editor's font dropdowns with more Google-hosted options and generalized the font-loading helper so any new preset — heading or body — gets its web font loaded automatically through a single shared map. Previously only Playfair Display and DM Serif Display (serif) were wired to load, and only Inter (sans) was fetched via a hardcoded `<link>`; the rest of the sans presets (Helvetica, Segoe UI) were system fonts that didn't need a fetch, but there was no way to pick a web-font body face at all.

**Expanded preset lists in `src/components/admin/ReportThemeEditor.tsx`:**

`SERIF_PRESETS` grew from 4 entries to 8. The "DM Serif Display" entry (which had been dropped from the live list but was still referenced by the font-loading helper) was re-added, and three new web-font options were added: Lora, Merriweather, and Cormorant Garamond. The full list is now: Iowan / Palatino / Georgia (default), Georgia, Times New Roman, Playfair Display, DM Serif Display, Lora, Merriweather, Cormorant Garamond.

`SANS_PRESETS` grew from 3 entries to 7. Four new web-font options were added: Roboto, Work Sans, Source Sans 3, and Manrope. The full list is now: System / Inter (default), Helvetica, Segoe UI, Roboto, Work Sans, Source Sans 3, Manrope.

**Generalized helper in `src/utils/exportReportTheme.ts`:** The previous `getSerifFontLinkTag(serifStack)` was replaced by `getGoogleFontLinkTag(serifStack, sansStack)`. Instead of hardcoding substring checks for individual font names inside the function body, the new helper is driven by a single `GOOGLE_FONT_FAMILIES` map — a `Record<string, string>` keyed by the font family name (as it appears inside a `--serif`/`--sans` stack string) and valued by its Google Fonts css2 `family=` parameter:

```ts
const GOOGLE_FONT_FAMILIES: Record<string, string> = {
  'Inter': 'Inter:wght@400;500;600;700;900',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700;800;900',
  'DM Serif Display': 'DM+Serif+Display:ital,wght@0,400;1,400',
  'Lora': 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600',
  'Merriweather': 'Merriweather:wght@300;400;700;900',
  'Cormorant Garamond': 'Cormorant+Garamond:wght@400;500;600;700',
  'Roboto': 'Roboto:wght@400;500;600;700;900',
  'Work Sans': 'Work+Sans:wght@400;500;600;700;800',
  'Source Sans 3': 'Source+Sans+3:wght@400;500;600;700;900',
  'Manrope': 'Manrope:wght@400;500;600;700;800',
};
```

`getGoogleFontLinkTag` iterates over every key in the map and includes the family in the request if either the serif or sans stack string `.includes(name)`. "Inter" is always included (seeded into the `Set` at construction) since it's the default body font's primary web-font fallback, so every report always loads Inter even when the sans stack is a system-only one. The output is a single combined Google Fonts request with `preconnect` hints, e.g. `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">`. The old `getSerifFontLinkTag` export was removed (no other call sites existed).

**Why a map:** adding a new Google-hosted font later is a two-line change — add the preset to `SERIF_PRESETS`/`SANS_PRESETS` in the editor and add one entry to `GOOGLE_FONT_FAMILIES` in the helper. Anything not in the map is assumed to be a system font and won't trigger a web font fetch, so system-only stacks (Georgia, Times New Roman, Helvetica, Segoe UI, Iowan/Palatino/Georgia) contribute nothing beyond Inter.

**Both report generators updated:** In `src/utils/enhancedExports.ts`, the import changed from `getSerifFontLinkTag` to `getGoogleFontLinkTag`, and the hardcoded Inter `<link>` line was removed — it's now folded into the combined `getGoogleFontLinkTag` call (Inter is always seeded). The `<head>` injects `${getGoogleFontLinkTag(resolvedTheme?.serif ?? DEFAULT_THEME_VARS.serif, resolvedTheme?.sans ?? DEFAULT_THEME_VARS.sans)}` in place of the old Inter link + serif-only link pair. In `src/utils/clientReport/renderClientReport.ts`, the same import swap and head-template change applied — the single `getGoogleFontLinkTag(...)` call replaces the old `getSerifFontLinkTag(...)` line.

**Acceptance:** `npm run build` passes. The Serif dropdown now lists 8 options (including DM Serif Display, Lora, Merriweather, Cormorant Garamond) and the Sans dropdown lists 7 (including Roboto, Work Sans, Source Sans 3, Manrope). Verified the helper logic with a standalone script that calls `getGoogleFontLinkTag` with sample stack strings: a default system-only combo loads only Inter; Playfair + Manrope loads Inter + Playfair Display + Manrope; DM Serif + Roboto loads Inter + DM Serif Display + Roboto; Lora + Work Sans loads Inter + Lora + Work Sans; Merriweather + Source Sans 3 loads Inter + Merriweather + Source Sans 3; Cormorant + Helvetica loads Inter + Cormorant Garamond; Georgia + Helvetica (system only) loads only Inter. No live `report_theme_settings` row was mutated during verification.

---

## Chrome Extension ext_prefill URL Param — Copy Snap Pre-fill (2026-07-10)

**Feature:** Copy Snap reads an `ext_prefill` query param when the Chrome extension opens the page (e.g. `https://copyzap.com/copy-snap?ext_prefill=<base64JSON>`). The payload is decoded with `JSON.parse(decodeURIComponent(escape(atob(raw))))` (matching the extension's `btoa(unescape(encodeURIComponent(JSON.stringify(payload))))` encoding) and mapped to form controls on mount. The param is then removed from the URL via `window.history.replaceState`.

**Field mapping:**

| Form control | Payload field | Valid values | Default |
|---|---|---|---|
| "Your Text" textarea | `data.text` | any string | — |
| Mode | `data.mode` | `improve`, `answer`, `question` | `improve` |
| Goal | `data.goal` | `clearer`, `persuasive`, `shorter`, `punchier` | `clearer` |
| Platform | `data.platform` | `general`, `x`, `linkedin`, `email` | `general` |
| Length | `data.length` | `short`, `same`, `longer` | `same` |

**Implementation:** `useEffect` guarded by `hasAppliedExtPrefillRef` (one-shot, StrictMode-safe) added before the existing mode-change effect in `CopySnap.tsx`. Unknown enum values are ignored (invalid values do not overwrite defaults).

**Toast:** Shows "Content loaded from extension".

**Files changed:** `src/components/CopySnap.tsx`

---

## Chrome Extension ext_prefill URL Param — Copy Maker Pre-fill (2026-07-10, updated 2026-07-10T02:00:00Z)

**Feature:** Copy Maker reads an `ext_prefill` query param when the Chrome extension opens the page (e.g. `https://copyzap.com/copy-maker?ext_prefill=<base64JSON>`). The payload is base64-decoded, parsed, and mapped to form fields on mount. The param is removed from the URL via `window.history.replaceState` (no reload). This effect runs FIRST, before the `CZ_PREFILL_TO_COPY_MAKER_V1` sessionStorage check.

**Implementation:** `useEffect` in `CopyMakerTab.tsx`, guarded by `hasAppliedExtPrefillRef` (one-shot, StrictMode-safe). Declared before the existing `CZ_PREFILL_TO_COPY_MAKER_V1` effect so extension prefills take priority.

**Unified field mapping (regardless of `source`):**

| Form field | Payload fields (first truthy wins) |
|---|---|
| `originalCopy` (tab switches to `'improve'`) | `data.existing_copy \|\| data.structured_copy \|\| data.content` |
| `targetAudience` | `data.target_audience \|\| data.audience` |
| `context` (pain points / what it solves) | `data.pain_points \|\| data.painPoints \|\| data.what_creating` |
| `tone` | `data.tone` |
| `language` | `data.language` (ISO code converted to full name) |

**Language handling:** Uses existing `convertLanguageCodeToFormDataLanguage()` (`'en'` → `'English'`, etc.).

**Error handling:** Malformed base64 or invalid JSON is caught silently (console.error, no UI change).

**Toast:** Shows "Content loaded from extension".

**Files changed:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` — `hasAppliedExtPrefillRef` + `useEffect` placed before the `CZ_PREFILL_TO_COPY_MAKER_V1` effect.

---

## Chrome Extension Auth Handshake Page — /extension-auth (2026-07-10)

**Feature:** Added a standalone `/extension-auth` route for the CopyZap Chrome extension to perform an OAuth handshake without going through the normal app shell. The page has no nav, no sidebar — just a centered card on a gray-50 background.

**Route:** `<Route path="/extension-auth" element={<ExtensionAuthPage />} />`

**File:** `src/pages/ExtensionAuthPage.tsx`

**Flow:**
1. On mount, reads `ext_id` from the URL query string.
2. If `ext_id` is missing → shows `no_ext_id` state ("Missing extension ID. Please re-open this page from the extension.").
3. Persists `ext_id` to `sessionStorage` under `cz_ext_connect_id` (survives the login redirect).
4. Calls `supabase.auth.getSession()`:
   - **Session exists** → immediately sends `chrome.runtime.sendMessage(extId, { type: 'COPYZAP_AUTH', access_token, refresh_token, expires_at })` → shows `success` or `error` state.
   - **No session** → shows `login` state with a "Log in to CopyZap" button that redirects to `/login?redirect=<current URL>`.
5. Subscribes to `supabase.auth.onAuthStateChange` — when a session appears after login redirect, reads `ext_id` from `sessionStorage` and sends the token via `sendMessage`.
6. `sendMessage` is wrapped in try/catch; if `chrome.runtime` is not present (page opened outside extension context), shows `error` state.

**UI states:**
| State | Display |
|---|---|
| `checking` | Spinner + "Connecting..." |
| `sending` | Spinner + "Connecting..." |
| `login` | Info icon + "Log in to connect the Chrome extension" + login button |
| `success` | Green checkmark + "Extension connected!" + "You can close this tab" |
| `error` | Red X + "Connection failed. Make sure the extension is installed and try again." |
| `no_ext_id` | Warning icon + "Missing extension ID. Please re-open this page from the extension." |

**Styling:** Matches existing app — white card, `rounded-2xl shadow-sm`, `border-gray-200`, CopyZap wordmark at top. No Tailwind purple. Dark mode supported throughout.

**Files changed:**
- `src/pages/ExtensionAuthPage.tsx` — new file
- `src/App.tsx` — added import + `<Route path="/extension-auth" element={<ExtensionAuthPage />} />`

---

## Target Market / Region — Export Input Summary (2026-07-08)

**Feature:** When `formState.geoRegions` is set, it now appears in the input-summary tables of both the HTML and Markdown exports, positioned after "Target Audience" and before "Key Message."

**HTML export (`exportAsFormattedHtml`):**
- English label dictionary: `targetRegionLabel: 'Target market / region'`
- Spanish label dictionary: `targetRegionLabel: 'Mercado / Región'`
- `configRows` array: `if (formState.geoRegions) configRows.push([t.targetRegionLabel, formState.geoRegions]);`

**Markdown export (`exportAsMarkdown`):**
- Row inserted: `` `| Target market / region | ${formState.geoRegions} |\n` ``
- Only rendered when `formState.geoRegions` is non-empty (consistent with all other optional rows)

**Files changed:** `src/utils/enhancedExports.ts` (4 additive edits — no existing rows modified)

---

## Target Market / Region Field — Visible Input in Copy Form (2026-07-08)

**Feature:** Added a visible "Target market / region" text input to the main copy form (Section 2 — Audience & Targeting). This field binds to the existing `formState.geoRegions` key, which was already wired into the copy generation prompt builder but had no visible UI in the form.

**Placement:** Inserted immediately after the Target Audience textarea, before the Reader's Stage in Funnel selector. Appears in all modes where `geoRegions` is visible.

**Field visibility by mode:**
- Quick Mode: visible (added to `quickModeFields` in `fieldVisibility.ts`)
- Standard Mode: visible (already present in `standardModeFields`)
- Advanced Mode: visible (inherits from standard)

**UI details:**
- `<input type="text">` with `id="geoRegions"`, `name="geoRegions"`
- Placeholder: `e.g. México, LATAM, Barcelona`
- Label: `Target market / region` (same gray tone as other optional field labels)
- Tooltip: explains that the field controls locally relevant phrasing and, when GEO optimization is enabled, targets AI-assistant visibility for those regions
- Template indicator displayed when field was pre-filled by a template
- Styled with `getInputClassName` (consistent with other text inputs in the form)

**Section badge counter:** `geoRegions` added to `section2Fields` array so filled values increment the Audience & Targeting section badge count.

**Files changed:**
- `src/utils/fieldVisibility.ts` — added `'geoRegions'` to `quickModeFields`; removed duplicate from `standardModeFields`
- `src/components/SharedInputs.tsx` — inserted new field JSX block; added `'geoRegions'` to `section2Fields`

**No prompt-builder changes:** `copyGeneration.ts` already consumes `geoRegions`; no logic changes were made there.

---

## Workflow Builder Feature Removal (2026-07-08)

**Files deleted:**
- `src/components/workflow/WorkflowBuilder.tsx`
- `src/components/workflow/ManageWorkflows.tsx`
- `src/components/workflow/WorkflowPermissionsModal.tsx`
- `src/components/ui/WorkflowSelector.tsx`
- `src/services/workflowService.ts`
- `src/services/workflowExecutionEngine.ts`
- `src/components/help/pages/WorkflowBuilder.tsx`

**Files modified:**
- `src/App.tsx` — removed `ManageWorkflows` lazy import, `WorkflowBuilderHelp` lazy import, `/manage-workflows` route, `/help/workflow-builder` replaced with redirect to `/help/getting-started`
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` — removed workflow service imports, workflowId execution block, auto-compare trigger
- `src/components/FeatureToggles.tsx` — removed WorkflowSelector, toast, useState/useEffect, workflow state derivations, Workflow Selector JSX, workflow guards from createVariants checkbox
- `src/components/Dashboard.tsx` — removed Workflow icon import, removed /manage-workflows Link button
- `src/types/index.ts` — removed useWorkflow/workflowId from FormData, workflowGenerated from GeneratedContentItem, entire Workflow System Types section (10 types)
- `src/components/help/HelpCenter.tsx` — removed workflow-builder article link
- `src/components/help/pages/CreditsAndBilling.tsx` — removed workflow-builder link
- `src/components/help/pages/DashboardAndHistory.tsx` — updated to 2 tabs, removed Tab 3 Manage Workflows block, removed workflow-builder link
- `src/components/help/pages/SetupAndInputs.tsx` — removed workflow-builder link

**Not touched:** `src/utils/operationLabels.ts`, all Supabase tables/migrations.

---

## Version Deep Analysis — Language Rule Injection in LLM System Prompts (2026-07-06)

**File modified:**
- `src/services/api/versionDeepAnalysis.ts`

**Summary:** Added a `CRITICAL LANGUAGE RULE` sentence to both LLM system prompts in `versionDeepAnalysis.ts`, instructing the model to write all text fields (`summary`, `keyStrengths`, `suggestedImprovements` text, `strategicRecommendation`) in the same language as the copy being analyzed (`${formState?.language || 'English'}`). This ensures that Spanish (or any non-English) copy receives a deep analysis response entirely in the correct language, rather than defaulting to English.

**Prompts modified:**
1. **Diff-aware mode** (when `parentCopyText` is present): rule inserted between the `STRICT JSON ONLY` line and the `First, identify exactly what changed…` line.
2. **Standard mode** (holistic full-piece analysis): rule inserted between the `STRICT JSON ONLY` line and the existing `CRITICAL: Your analysis provides narrative guidance only…` line.

**Rule text injected:**
```
CRITICAL LANGUAGE RULE: Write every text field (summary, keyStrengths, suggestedImprovements text, strategicRecommendation) in ${formState?.language || 'English'} — the same language as the copy being analyzed. Do not default to English if the copy's language is different.
```

---

## HTML Export — Spanish i18n: Verification Flag Category Translation (2026-07-06)

**File modified:**
- `src/utils/enhancedExports.ts`

**Summary:** Added `translateVerificationFlag(flag, langCode)` — a display-only translator for the three verification flag category prefixes produced by the English-pinned scoring LLM. The quoted phrase inside each flag (which is already in the copy's own language) is left untouched; only the category label prefix is swapped for Spanish exports.

**Category prefix mappings (en → es):**
- `"figurative language — review against brand voice:"` → `"lenguaje figurativo — revisar contra la voz de marca:"`
- `"unverified claim — verify before publishing:"` → `"afirmación no verificada — verificar antes de publicar:"`
- `"tone intensity — review against brand personality:"` → `"intensidad de tono — revisar contra la personalidad de marca:"`

The function is a no-op for `langCode !== 'es'`. Applied in the verification flags render loop in `exportAsFormattedHtml`, alongside the previously-translated `t.sourceUnknown` suffix.


## HTML Export — Spanish i18n Extended: Comparison & Rankings Section (2026-07-06)

**File modified:**
- `src/utils/enhancedExports.ts`

**Summary:** Extended the `EXPORT_I18N` dictionary and translated all remaining hardcoded English strings in `exportAsFormattedHtml` — covering the winner announcement banner, table of contents, comparison section headings, row-level badges, dual-score labels, risk/verification labels, winner deep-analysis headings, bottom CTA block, and breadcrumb navigation.

**New `en` keys added** (after `valueLabel`):
`contentsLabel`, `comparisonRankingsLabel`, `winnerBanner(label, score)`, `analysisLabel`, `verifyBeforePublishing`, `sourceUnknown`, `editorialQuality`, `conversionPotential`, `wordsSlashLevel`, `riskFactorsLabel`, `scoresRelativeNote`, `bestPerformingVersion(label)`, `applyAllSuggestions(score)`, `whyThisVersionWon`, `wantMoreVariations`, `generatedVersionsNote(n)`, `jumpTo`, `inputsNavLabel`, `rankingsNavLabel`.

**New `es` keys added** (matching set in Spanish): "Contenido", "Comparación y Clasificación", `winnerBanner` → "Versión con mejor rendimiento: …", "Análisis", "Verificar antes de publicar", "fuente desconocida", "Calidad Editorial", "Potencial de Conversión", "Palabras / Nivel", "Factores de Riesgo", `scoresRelativeNote` (full Spanish sentence), `bestPerformingVersion` → "Versión con Mejor Rendimiento — …", `applyAllSuggestions` → "Aplica todas las sugerencias…", "Por Qué Ganó Esta Versión", "¿Quieres más variaciones de alto rendimiento?", `generatedVersionsNote` (Spanish pluralisation), "Ir a:", "Entradas", "Clasificación".

**Replacements applied (13 operations):**
1. `contentsLabel` → TOC "Contents" heading
2. `t.winnerBanner(winnerLabel, bannerScore)` → winner announcement banner; `t.winner` fallback for unknown winner name
3. `t.contentsLabel` → TOC `<p class="label">` heading; `t.winner` → TOC winner span; `t.inputSummaryLabel` + `t.comparisonRankingsLabel` → TOC row labels
4. `t.analysisLabel` + `t.comparisonRankingsLabel` → section eyebrow + `<h2>` heading
5. `t.winner` → row-level winner badge span
6. `t.verifyBeforePublishing` + `t.sourceUnknown` → verification flags block
7. `t.editorialQuality`, `t.conversionPotential`, `t.wordsSlashLevel`, `t.words` → dual-score + reading-level cards
8. `t.riskFactorsLabel` → risk factors block header
9. `t.scoresRelativeNote` → italic footnote below rankings table
10. `t.bestPerformingVersion(winnerLabel)`, `t.keyStrengthsLabel`, `t.suggestedImprovementsLabel`, `t.applyAllSuggestions(winnerProjScore)` → winner deep-analysis block
11. `t.whyThisVersionWon` → fallback "Why This Version Won" heading
12. `t.wantMoreVariations` + `t.generatedVersionsNote(generatedCount)` → bottom CTA block
13. `t.jumpTo`, `t.inputsNavLabel`, `t.rankingsNavLabel` → breadcrumb nav


## HTML Export — Spanish i18n Extended: Analysis Labels + Input Summary (2026-07-06)

**Files modified:**
- `src/utils/contentAnalysisForExport.ts`
- `src/utils/enhancedExports.ts`

**Summary:** Extended the Spanish i18n system introduced in the prior session to cover on-the-fly content analysis labels (Key Strengths / Suggested Improvements) and the Input Summary configuration table. The content analysis module was refactored into a bilingual dispatcher, and new translation keys were added to `EXPORT_I18N` for all remaining hardcoded English strings.

**`contentAnalysisForExport.ts` refactor:**
- Added `AnalysisLangCode = 'en' | 'es'` type (exported).
- `generateExportAnalysis(content, langCode = 'en')` is now a dispatcher that calls either `generateExportAnalysisEn` or `generateExportAnalysisEs` based on `langCode`.
- `generateExportAnalysisEn` — extracted from the original implementation; logic and English output strings are unchanged.
- `generateExportAnalysisEs` — new function with Spanish keyword detection (`ayuda`, `beneficio`, `solución`, `servicio`, `experiencia`, `experto`, `años`, `confianza`, `comunidad`, `cliente`, `resultado`, etc.) and fully Spanish output strings for both `keyStrengths` and `suggestedImprovements`. Reuses the same `calculateMultiScoreDisplay` scoring engine (English-keyword-based) for numeric thresholds.

**`enhancedExports.ts` changes:**
- New keys added to `en` entry: `keyStrengthsLabel`, `suggestedImprovementsLabel`, `potentialPts(n)`, `inputSummaryLabel`, `businessDescription`, `originalCopyLabel`, `toneLabel`, `targetAudienceLabel`, `keyMessageLabel`, `callToActionLabel`, `desiredEmotionLabel`, `brandValuesLabel`, `keywordsLabel`, `settingLabel`, `valueLabel`.
- Same keys added to `es` entry with Spanish translations: "PUNTOS FUERTES", "MEJORAS SUGERIDAS", `potentialPts` as " — Potencial +N pts", "RESUMEN DE ENTRADA", "Descripción del Negocio", "Copy Original", "Tono", "Público Objetivo", "Mensaje Clave", "Llamada a la Acción", "Emoción Deseada", "Valores de Marca", "Palabras Clave", "Ajuste", "Valor".
- `generateExportAnalysis` call in `generateFullHtmlExportForCard` (per-card section) now passes `exportLangCode || 'en'` so Spanish content produces Spanish analysis labels.
- KEY STRENGTHS header (per-card section): replaced with `t.keyStrengthsLabel`.
- SUGGESTED IMPROVEMENTS header + "— Potential +N pts" span: replaced with `t.suggestedImprovementsLabel` + `t.potentialPts(totalDeltaPoints)`.
- "Key Strengths" / "Suggested Improvements" labels in the 2-column grid: replaced with `t.keyStrengthsLabel` / `t.suggestedImprovementsLabel`.
- INPUT SUMMARY header in `exportAsFormattedHtml`: replaced with `t.inputSummaryLabel`.
- Source label ("Business Description" / "Original Copy") in `exportAsFormattedHtml`: replaced with `t.businessDescription` / `t.originalCopyLabel`.
- `configRows` label strings ("Language", "Tone", "Word Count", "Target Audience", "Key Message", "Call to Action", "Desired Emotion", "Brand Values", "Keywords"): all replaced with `t.*` equivalents.
- `Setting` / `Value` table column headers: replaced with `t.settingLabel` / `t.valueLabel`.




**File modified:**
- `src/utils/enhancedExports.ts`

**Summary:** The HTML export now detects the session language and renders all user-facing copy in Spanish when the language is set to "Spanish", falling back to English for all other languages.

**Implementation:**
- `EXPORT_I18N` dictionary added at module level with `en` and `es` keys. Each entry covers: variant type labels (GENERATED/GENERADO, ORIGINAL, VOICE ADAPTATION/ADAPTACIÓN DE VOZ, GEO PACKAGE/PAQUETE GEO, BLENDED/MEZCLADO, MODIFIED/MODIFICADO, BOOSTED/MEJORADO), Winner badge, preview banner function, preview note function, score section headings (QUALITY SCORE, WHY IT'S IMPROVED, SCORE BREAKDOWN, OPTIMIZATION SUGGESTIONS), score dimension labels (Clarity, Persuasiveness, Tone Match, Engagement, Word Count, Reading Level, Word Count vs Target), match quality labels (Excellent/Good/Acceptable/Poor), document header copy (report label, Generated/Language metadata), footer, and "Back to top".
- `ExportLangCode` type derived from `keyof typeof EXPORT_I18N`.
- `resolveExportLangCode(language?)` helper — returns `'es'` if the language string starts with "span" (case-insensitive), otherwise `'en'`.
- `generateFullHtmlExportForCard` gains an optional `exportLangCode?: 'en' | 'es'` parameter. On entry, `const t = EXPORT_I18N[exportLangCode || 'en']` is assigned and all previously hardcoded strings are replaced with `t.*` references.
- `exportAsFormattedHtml` computes `exportLangCode` and `t` immediately after deriving `lang`, then passes `exportLangCode` to every `generateFullHtmlExportForCard` call and uses `t.*` for the banner, document header, footer, and "Back to top" link.



## HTML Preview Export — Percent-Based Word Limit with Modal (2026-07-06)

**Files modified:**
- `src/utils/enhancedExports.ts`
- `src/components/copy-maker/CopyMakerSidebar.tsx`

**Files created:**
- `src/components/HtmlPreviewExportModal.tsx`

**Summary:** Replaced the hardcoded 200-word preview truncation with a percent-based system. Admins now click "Export HTML (Preview)" to open a modal where they select what percentage of each output's word count to include (5–100%, default 25%). The export pipeline computes a per-card word budget as `Math.max(40, Math.round(totalWords * (percent / 100)))`, ensuring very short copy isn't gutted below 40 words.

**`HtmlPreviewExportModal.tsx`** — New modal component:
- Range slider (min 5, max 100, step 5) synced to a number input
- Both inputs clamp to [5, 100]
- Displays live "Export Preview (N%)" on the submit button
- Renders via ReactDOM portal to `document.body` from the sidebar
- Default percentage: 25%

**`enhancedExports.ts` changes:**
- `countWords(s?)` extracted to module-level (was inline inside `truncateStructuredForPreview`)
- `getStructuredWordCount(structured)` new module-level helper — sums headline + all section word counts; used to compute `totalWords` for structured content
- `generateFullHtmlExportForCard` last parameter renamed `previewMaxWords` → `previewPercent?: number`; inside the function, `previewMaxWords` is now a local variable computed as `Math.max(40, Math.round(totalWords * (previewPercent / 100)))`
- `exportAsFormattedHtml` last parameter renamed `previewMaxWords` → `previewPercent?: number`; passed through to `generateFullHtmlExportForCard`
- Banner text updated to include percentage: "Preview Copy (N%) — Generated by CopyZap"
- Filename updated to `_preview{N}pct.html` (e.g., `..._preview25pct.html`)
- Watermark note updated to "Preview only (N%) — full version available on request."

**`CopyMakerSidebar.tsx` changes:**
- `HtmlPreviewExportModal` imported
- `showHtmlPreviewModal` state added
- `handleExportToHtmlPreview` replaced with `handleOpenHtmlPreviewModal` (opens modal) and `handleConfirmHtmlPreviewExport(percent)` (calls `exportAsFormattedHtml` with the selected percent)
- Button onClick updated to `handleOpenHtmlPreviewModal`
- Modal rendered via `ReactDOM.createPortal` alongside other sidebar modals



## HTML Preview Export — Structured Truncation Refinement (2026-07-06)

**File modified:**
- `src/utils/enhancedExports.ts`

**Problem with prior implementation:** The original preview branch converted structured copy to a flat plain-text string via `structuredToPlainText` before truncating. This collapsed all formatting (headlines, section titles, list items) into a single blob and then re-wrapped it in a `white-space:pre-wrap` div. The result looked visually different from the full export — no bold section headers, no list bullets, no headline styling.

**Fix:** Two new private helpers replace the flat-text approach:

- `truncateWordsAtSentence(text, maxWords)` — rewritten to use `matchAll(/\S+/g)` instead of `split(/\s+/)`, so it preserves the original whitespace/newline structure up to the cut point. Finds the last sentence-ending punctuation (`.`, `!`, `?`) after the 50% mark for a clean break; otherwise trims the last partial word and appends `…`. `maxWords <= 0` is treated as "no limit" (returns trimmed input unchanged).

- `truncateStructuredForPreview(structured, maxWords)` — walks sections in order, tracking a running word count. Sections that fit entirely within the budget are included unchanged. The first section that would exceed the budget has its `content` truncated via `truncateWordsAtSentence` and its `listItems` dropped. All subsequent sections are omitted.

**Rendering:** The copy body block now computes `renderContent` as either the truncated structured object (preview + structured) or the original content (all other cases). The identical `isStructured` rendering branch (headline, section titles, content paragraphs, lists) is then used for both the preview and full export — no separate code path. Plain-text preview content still goes through `truncateWordsAtSentence` directly. The watermark note is appended unconditionally when `previewMaxWords` is set.

---

## HTML Preview Export — Admin-Only ~200-Word Truncated Export (2026-07-06)

**Files modified:**
- `src/utils/enhancedExports.ts`
- `src/components/copy-maker/CopyMakerSidebar.tsx`

**Feature:** Admins can now export a truncated "preview" HTML file containing approximately the first 200 words of generated copy, with a top banner reading "Preview Copy — Generated by CopyZap" and a watermark note at the bottom of the copy body reading "Preview only — full version available on request." The preview file is named `<desc>_<datetime>_preview.html` to distinguish it from a full export.

**Implementation details:**

- `truncateWordsAtSentence(text, maxWords)` — new private helper added just before `generateFullHtmlExportForCard`. Splits on whitespace, slices to `maxWords`, then tries to find the last sentence-ending punctuation (`.`, `!`, `?`) after the 50% mark for a clean break; falls back to stripping the last partial word and appending `…`.
- `generateFullHtmlExportForCard` — accepts new optional `previewMaxWords?: number` parameter. When set, converts the card content (structured or plain) to plain text via `structuredToPlainText`, truncates it, renders as a single `white-space:pre-wrap` div, and appends the italic watermark note. Full rendering path unchanged when `previewMaxWords` is absent.
- `exportAsFormattedHtml` — accepts new optional `previewMaxWords?: number` parameter, passes it through to `generateFullHtmlExportForCard`, injects the top banner div immediately after `<body id="top">`, and appends `_preview` to the filename.
- `CopyMakerSidebar` — `handleExportToHtmlPreview` handler calls `exportAsFormattedHtml` with `200` as `previewMaxWords`. New "Export HTML (Preview)" `SidebarBtn` rendered conditionally on `hasContent && isAdmin`, directly below the existing "Export HTML" button.

---

## Session Name Priority Fix in saveCopySession (2026-07-04)

**File modified:**
- `src/services/supabaseClient.ts`

**Problem:** Inside `saveCopySession`, the session name for an existing session was resolved in this order: `outputType` → `briefDescription` → `projectDescription`. This meant `projectDescription` (the "Project Description" field users fill in to name and organize their work) was only ever used as a last resort, so sessions were frequently named after the output type (e.g. "Homepage Copy") rather than the user's own project description (e.g. "Acme SaaS Rebrand — Q3").

**Fix:** Priority order is now: `projectDescription` → `outputType` → `briefDescription`, consistent with `sessionService.ts`'s `generateSessionName()`. A `trim()` check guards against blank-string project descriptions still winning the priority contest. No logic beyond the priority reorder was changed.

---

## Saved Output Load — SessionContext Stale-State Fix (2026-07-04)

**File modified:**
- `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

**Problem:** When a user opened a saved output, the form's `sessionId` field was correctly cleared (it is nulled out inside `loadFormStateFromSavedOutput`'s `setFormState` call), but `SessionContext`'s own tracked `currentSessionId`, `currentSessionName`, and `intentContext` were not cleared. This meant the next generation after opening a saved output could silently inherit the stale session name and project description that were active before the saved output was opened — even though the form fields showed the correct values from the saved output.

**Fix:** `clearCurrentSession` is now destructured from `useSession()` alongside the existing `setCurrentSession`. It is called immediately after the `setFormState` block completes inside `loadFormStateFromSavedOutput`, and before the frozen-mode restoration. `clearCurrentSession` is also added to the `useCallback` dependency array. A temporary diagnostic `console.log` was added to confirm the fix fires and to surface any remaining edge cases during verification.

---

## Enhanced Pipeline Model Pin — Timeout Guard (2026-07-04)

**File modified:**
- `src/utils/ai-pipeline/enhancedPipeline.ts`

Inside `runEnhancedPipeline` (Step 2), a `generationModel` constant is now derived before the `getEnhancedModelSettings` and `makeApiRequestWithFallback` calls. If `formState.model` is `'claude-sonnet-5'`, it is silently downgraded to `'claude-sonnet-4-6'`; all other models pass through unchanged. Both `getEnhancedModelSettings` and the `makeApiRequestWithFallback` call now use `generationModel` instead of `formState.model`. A console log is emitted when the pin activates. Rationale: the non-streaming path through the Supabase Edge Function has a 150-second idle timeout; `claude-sonnet-5` at 4000-token outputs can exceed this, causing silent failures. The pin will be removed once streaming with usage-capture is implemented.

---

## SEO Generation Model Pin + Attribution Fix (2026-07-03)

**File modified:**
- `src/services/api/seoGeneration.ts`

All three `makeApiRequestWithFallback` call sites (`generateSeoMetadata`, `generateFaqSchemaFromText`, `generateSeoElement`) were updated:
1. Model pinned to `'claude-sonnet-4-6'` (same pattern already applied to comparative scoring, voice styling, and deep analysis) to avoid the 150-second Supabase idle-timeout on the non-streaming path.
2. `operationType` and `sessionId` appended as 8th and 9th arguments: `'generate_seo_metadata'`, `'generate_faq_schema'`, and `` `generate_seo_${elementType}` `` respectively — matching the strings already used in the manual `trackTokenUsage` calls directly below each.

## GEO Generation Token Budget + Authority Snippet Robustness (2026-07-03)

**File modified:**
- `src/services/api/geoGeneration.ts`

Two changes inside `generateGeoContent`:
1. Token budget in the loop's `makeApiRequestWithFallback` call raised from `1500` to `2200` to reduce truncation on larger GEO outputs.
2. The `authoritySnippets` element prompt extended with a graceful-degradation instruction: if the source content lacks concrete facts, statistics, or credentials, the model is directed to generate 3–5 general credibility statements based on existing tone and claims rather than refusing.

---

## GEO Generation Attribution Fix (2026-07-03)

**File modified:**
- `src/services/api/geoGeneration.ts`

The `makeApiRequestWithFallback` call inside the `for (const element of selectedElements)` loop was missing `operationType` and `sessionId`. Added `` `geo_generate_${element}` `` and `sessionId` as the 8th and 9th arguments. This gives each GEO sub-type (translation, FAQ, snippets, headlines, location variants, etc.) a distinct, meaningful `operation_type` in `pmc_user_tokens_used`, matching the naming already used by the existing `trackTokenUsage` call directly below it. `sessionId` was already in the function signature.

---

## GEO Scoring Attribution Fix (2026-07-03)

**File modified:**
- `src/services/api/geoScoring.ts`

The `makeApiRequestWithFallback` call at ~line 171 was missing `operationType` and `sessionId`, causing GEO scoring operations to land in `pmc_user_tokens_used` with `operation_type = 'llm_call'` and `session_id = null`. Added `'geo_scoring'` and `sessionId` as the 8th and 9th arguments. `sessionId` was already present in the function signature and already forwarded into the manual `trackTokenUsage` call (as `'calculate_geo_score'`).

---

## Performance Boost Attribution Fix (2026-07-03)

**File modified:**
- `src/services/api/performanceBoost.ts`

The `makeApiRequestWithFallback` call was missing `operationType` and `sessionId`, causing "Boosted" operations to land in `pmc_user_tokens_used` with `operation_type = 'llm_call'` and `session_id = null`. Added `'performance_boost'` and `sessionId` as the 8th and 9th arguments. `sessionId` was already present in the function signature and already forwarded into the manual `trackTokenUsage` call.

---

## Deep Analysis & Content Modification: Attribution Fix + Model Pin (2026-07-03)

**Files modified:**
- `src/services/api/contentModification.ts`
- `src/services/api/versionDeepAnalysis.ts`

**contentModification.ts — attribution fix:**
The `makeApiRequestWithFallback` call was missing `operationType` and `sessionId` arguments, causing `pmc_user_tokens_used` records to land with `operation_type = 'llm_call'` (default) and `session_id = null`. Added `'modify_content'` and `sessionId` as the 8th and 9th arguments to fix attribution. `sessionId` was already present in the function signature and was already forwarded into the manual `trackTokenUsage` call, so no signature change was needed.

**versionDeepAnalysis.ts — model pin (`analyzeVersionDeep`):**
Replaced `const actualModel = model || SCORING_MODEL` with a hardcoded pin `const actualModel: Model = 'claude-sonnet-4-6'`. This function calls `makeApiRequestWithFallback` (non-streaming path), which is subject to a 150-second Supabase edge-function idle timeout. `claude-sonnet-5` can exceed this on longer analysis tasks. The pin is the same fix already applied to comparative scoring and voice styling.

**versionDeepAnalysis.ts — model pin (`generateOverallVerdict`):**
Replaced `const actualModel: Model = (model === 'deepseek-chat' || !model) ? 'claude-sonnet-4-5' : model` with the same hardcoded pin `const actualModel: Model = 'claude-sonnet-4-6'`. Same non-streaming idle-timeout constraint applies; also removes the legacy `deepseek-chat` normalization branch which is no longer needed.

---

## Voice Styling Pinned to claude-sonnet-4-6 (Non-Streaming Timeout Constraint) (2026-07-03)

**File modified:**
- `src/services/api/voiceStyles.ts`

**Problem solved:**
`voiceStyles.ts` calls `makeApiRequestWithFallback` (non-streaming path), which is subject to a 150-second Supabase edge-function idle timeout. `claude-sonnet-5` can exceed this limit on longer persona rewrites (especially when processing large structured copy objects), causing silent failures. The same timeout constraint had already been applied to comparative scoring via a similar pin.

**Change — model normalization block in `applyVoiceStyle`:**

Three adjustments to the fallback/normalization logic:
1. No-model fallback now targets `claude-sonnet-4-6` instead of `claude-sonnet-4-5`.
2. Invalid/legacy model fallback also targets `claude-sonnet-4-6`.
3. New explicit branch: if the user has `claude-sonnet-5` selected, it is pinned to `claude-sonnet-4-6` with a console warning explaining the constraint.

The `validModels` array is unchanged — `claude-sonnet-5` remains in the list so it passes validation before the pin branch executes, rather than being treated as an invalid legacy model.

```typescript
// Before — no Sonnet 5 pin, fallbacks to claude-sonnet-4-5
if (!model) {
  normalizedModel = 'claude-sonnet-4-5';
} else if (model === 'deepseek-chat' || !validModels.includes(model)) {
  normalizedModel = 'claude-sonnet-4-5';
}

// After — explicit Sonnet 5 pin + fallbacks updated to claude-sonnet-4-6
if (!model) {
  normalizedModel = 'claude-sonnet-4-6';
} else if (model === 'deepseek-chat' || !validModels.includes(model)) {
  normalizedModel = 'claude-sonnet-4-6';
} else if (model === 'claude-sonnet-5') {
  normalizedModel = 'claude-sonnet-4-6'; // non-streaming idle-timeout constraint
}
```

**Result:**
Voice styling calls will never use `claude-sonnet-5` regardless of user model selection, preventing edge-function idle-timeout failures on long persona rewrites without affecting any other operation type.

---

## Absolute Scoring and Voice Style Attribution + Voice Model Allowlist Fix (2026-07-03)

**Files modified:**
- `src/services/api/absoluteScoring.ts`
- `src/services/api/voiceStyles.ts`

**Problem solved — attribution (two call sites):**
`absoluteScoring.ts` and `voiceStyles.ts` each had a `makeApiRequestWithFallback` call that omitted `operationType` and `sessionId`. Even though both functions received `currentUser` and `sessionId` as parameters (and already used them for `trackTokenUsage`), the values were not forwarded to the edge function — so those usage rows landed in `pmc_user_tokens_used` as `llm_call` / `session_id: null`.

**Problem solved — stale model allowlist:**
`voiceStyles.ts` contained a hard-coded `validModels` array that was missing two currently-valid Claude model IDs (`claude-sonnet-4-6` and `claude-sonnet-5`). Any user with either of those models selected would hit the fallback branch, silently downgrading to `claude-sonnet-4-5`. The array was out of sync with the `Model` type in `src/types/index.ts`.

**A. `absoluteScoring.ts` — one call site (~line 68):**

```typescript
const response = await makeApiRequestWithFallback(
  SCORING_MODEL, [...messages],
  0.3, 512,
  { type: 'json_object' },
  currentUser?.email,
  'absolute_score',
  sessionId
);
```

**B. `voiceStyles.ts` — validModels array fix (~line 36):**

Added `'claude-sonnet-4-6'` and `'claude-sonnet-5'` to the allowlist so these models pass validation rather than falling back:
```typescript
// Before
const validModels = ['gpt-4o', 'claude-sonnet-4-5', 'gpt-4-turbo', 'gemini-2.0-flash', 'grok-4-latest', 'chatgpt-4o-latest', 'claude-haiku-4-5', 'claude-opus-4-5'];

// After
const validModels = ['gpt-4o', 'claude-sonnet-4-5', 'claude-sonnet-4-6', 'claude-sonnet-5', 'gpt-4-turbo', 'gemini-2.0-flash', 'grok-4-latest', 'chatgpt-4o-latest', 'claude-haiku-4-5', 'claude-opus-4-5'];
```

**C. `voiceStyles.ts` — attribution call site (~line 653):**

```typescript
const data = await makeApiRequestWithFallback(
  normalizedModel, messages,
  temperature, maxTokens,
  responseFormat,
  currentUser?.email,
  'apply_voice_style',
  sessionId
);
```

**Result:**
- `absolute_score` rows in `pmc_user_tokens_used` now carry `operation_type = 'absolute_score'` and the correct `session_id`.
- `apply_voice_style` rows now carry `operation_type = 'apply_voice_style'` and the correct `session_id`.
- Users with `claude-sonnet-4-6` or `claude-sonnet-5` selected as their model will no longer be silently downgraded when applying voice styles.

---

## Scoring and Deep-Analysis Operation Attribution (2026-07-03)

**Files modified:**
- `src/services/api/comparativeScoring.ts`
- `src/services/api/versionDeepAnalysis.ts`
- `src/services/api/contentScoring.ts`

**Problem solved:**
Three scoring/analysis services already received `sessionId` and `currentUser` as function parameters (all callers already passed real values), but none of them forwarded those values into their `makeApiRequestWithFallback` calls. Every comparative score, deep analysis, content score, and overall verdict row in `pmc_user_tokens_used` therefore had `operation_type = 'llm_call'` and `session_id = null`. No caller changes were needed — only the four internal call sites required fixing.

**A. `comparativeScoring.ts` — one call site (~line 531):**

`makeApiRequestWithFallback` now passes `undefined` for `userEmail` (not available in this function's scope), `'comparative_scoring'` as the operation type, and `sessionId`:
```typescript
const completion = await makeApiRequestWithFallback(
  actualModel, messages,
  0.3, tokenBudget,
  { type: 'json_object' },
  undefined,
  'comparative_scoring',
  sessionId
);
```

**B. `versionDeepAnalysis.ts` — two call sites:**

`analyzeVersionDeep` main call (~line 246) now passes `currentUser?.email`, `'deep_analysis'`, and `sessionId`:
```typescript
const data = await makeApiRequestWithFallback(
  actualModel, [...messages],
  0.3, 2000,
  undefined,
  currentUser?.email,
  'deep_analysis',
  sessionId
);
```

`generateOverallVerdict` call (~line 416) now passes `currentUser?.email`, `'overall_verdict'`, and `sessionId`:
```typescript
const data = await makeApiRequestWithFallback(
  actualModel, [...messages],
  0.4, 500,
  undefined,
  currentUser?.email,
  'overall_verdict',
  sessionId
);
```

**C. `contentScoring.ts` — one call site (~line 129):**

Now passes `currentUser?.email`, `'generate_content_score'`, and `sessionId`:
```typescript
const data = await makeApiRequestWithFallback(
  SCORING_MODEL, [...messages],
  0.5, Math.round(maxTokens / 3),
  { type: "json_object" },
  currentUser?.email,
  'generate_content_score',
  sessionId
);
```

**Result:**
All scoring and analysis LLM calls now record meaningful operation types in `pmc_user_tokens_used`:
- `comparative_scoring` — version ranking/comparison calls
- `deep_analysis` — per-version structural deep analysis
- `overall_verdict` — winner explanation synthesis
- `generate_content_score` — per-dimension content quality scoring

All four calls also carry the correct `session_id`, completing full per-session cost attribution across the entire generation, scoring, and analysis workflow.

---

## Field-Level Suggestion Attribution and Session Auto-Creation (2026-07-03)

**Files modified:**
- `src/services/api/suggestions.ts`
- `src/components/CopyForm.tsx`

**Problem solved:**
The "⚡ AI Suggestions" button on individual form fields calls `getSuggestions`, which called `makeApiRequestWithFallback` without passing `operationType` or `sessionId`. This meant every suggestion LLM call landed in `pmc_user_tokens_used` with `operation_type = 'llm_call'` and `session_id = null`. Additionally, the call site in `CopyForm.tsx` never attempted to create a session when none existed — if the user clicked a suggestion button before generating copy, the `sessionId` would always be `null` and usage rows could never be attributed to any session.

**Changes in `src/services/api/suggestions.ts`:**

The `makeApiRequestWithFallback` call in `getSuggestions` now passes two additional trailing arguments:
```typescript
// Before
      currentUser?.email
    );

// After
      currentUser?.email,
      'field_suggestion',
      sessionId
    );
```
The `sessionId` parameter was already part of the `getSuggestions` signature and was already forwarded to `trackTokenUsage` — it was simply not forwarded to the edge function call, so `recordUsage` on the server never saw it.

**Changes in `src/components/CopyForm.tsx`:**

Three additions:

1. Import `useSession` from `SessionContext`:
   ```typescript
   import { useSession } from '../context/SessionContext';
   ```

2. Destructure `ensureActiveSession` from the hook in the component body (alongside `useMode` and `useAdminClaudeModel`):
   ```typescript
   const { ensureActiveSession } = useSession();
   ```

3. In `onGetSuggestion`, replace the static fallback-to-null pattern with a call to `ensureActiveSession`:
   ```typescript
   // Before
   const actualSessionId = formState.sessionId || null;

   // After
   const actualSessionId = formState.sessionId
     || await ensureActiveSession(
       currentUser.id,
       'field_suggestion',
       formState.projectDescription,
       formState.customerId
     );
   ```
   If a session already exists (`formState.sessionId` is set), the existing session is reused with no DB call. If no session exists yet (user opened the form and clicked a suggestion button before generating), a new session row is created and its ID is returned. The session gets a real name when the user later fills in `projectDescription` and saves or generates.

**Result:**
- All `field_suggestion` LLM calls now record `operation_type = 'field_suggestion'` in `pmc_user_tokens_used`.
- A valid `session_id` is present on every suggestion usage row — either the pre-existing session or an auto-created one.
- Pre-generation suggestion usage is no longer orphaned from session context.

---

## Enhanced Pipeline Session/Operation Attribution Fix (2026-07-03)

**Files modified:**
- `src/utils/ai-pipeline/enhancedPipeline.ts`
- `src/utils/ai-pipeline/expandInputs.ts`
- `src/utils/ai-pipeline/refineOutput.ts`

**Problem solved:**
The previous `operationType`/`sessionId` threading work (Prompt 2) only fixed attribution in `copyGeneration.ts`'s legacy pipeline. However, every real generation in the app actually runs through `runEnhancedPipeline` (the CopyZap+ engine), which has its own three `makeApiRequestWithFallback` calls — none of which were passing `operationType` or `sessionId`. As a result, all enhanced pipeline usage rows in `pmc_user_tokens_used` still had `operation_type = 'llm_call'` and `session_id = null`.

`runEnhancedPipeline` already receives and validates `sessionId` as a parameter (throws if missing), so the value was in scope but simply not threaded down to the call sites or the two helper functions.

**Changes in `enhancedPipeline.ts`:**

1. Main generation `makeApiRequestWithFallback` call now passes `'generate_copy'` and `sessionId`:
   ```typescript
   const data = await makeApiRequestWithFallback(
     formState.model, messages, modelSettings.temperature, maxTokens,
     modelSettings.top_p, currentUser?.email, 'generate_copy', sessionId
   );
   ```

2. `expandInputs` call now passes `sessionId`:
   ```typescript
   expandedInputs = await expandInputs(formState, currentUser?.email, sessionId);
   ```

3. `refineOutput` call now passes `sessionId`:
   ```typescript
   improvedCopy = await refineOutput(generatedContent, formState, currentUser?.email, progressCallback, sessionId);
   ```

**Changes in `expandInputs.ts`:**
- Signature extended: `sessionId?: string` added as third parameter.
- `makeApiRequestWithFallback` call now passes `'expand_inputs'` and `sessionId` as final two args.

**Changes in `refineOutput.ts`:**
- Signature extended: `sessionId?: string` added as fifth parameter.
- `makeApiRequestWithFallback` call now passes `'refine_output'` and `sessionId` as final two args.

**Result:**
All three LLM calls in the Enhanced Pipeline now record meaningful operation types in `pmc_user_tokens_used`:
- `generate_copy` — the main enhanced generation call
- `expand_inputs` — Step 1 (input expansion/enrichment pre-processing)
- `refine_output` — Step 3 (editorial refinement pass)

All three also carry the correct `session_id`, enabling complete per-session cost accounting for Enhanced Pipeline runs.

---

## Fix: Report Calls Now Pass Real Session ID (2026-07-03)

**File modified:**
- `src/components/copy-maker/CopyMakerSidebar.tsx`

**Problem solved:**
The three `makeStreamingReportRequest` call sites for Evaluation Report, Compare Report, and Client Report were passing hardcoded `null` as the `sessionId` argument (introduced in the previous threading task). This meant all `generate_report` rows in `pmc_user_tokens_used` would always have `session_id = null`, making per-session cost attribution impossible for report generation.

`formState.sessionId` is already in scope at all three call sites and is used extensively elsewhere in the same file (lines ~680, 707, 749, 772, 1798), so replacing `null` with `formState.sessionId` gives the edge function the correct session context.

**Change:**
At all three `makeStreamingReportRequest` call sites, the `sessionId` argument changed from `null` to `formState.sessionId`:
```typescript
// Before
'generate_report',
null,

// After
'generate_report',
formState.sessionId,
```

**Result:**
`generate_report` rows in `pmc_user_tokens_used` now carry the same `session_id` as the generation rows that preceded them, enabling complete per-session cost tracking across the full generation + reporting workflow.

---

## operationType and sessionId Threading Through Generation and Report Pipeline (2026-07-03)

**Files modified:**
- `src/services/api/utils.ts`
- `src/services/api/copyGeneration.ts`
- `src/components/copy-maker/CopyMakerSidebar.tsx`

**Problem solved:**
The edge function `ai-completion` was enhanced to accept `operationType` and `sessionId` in the request body for server-side usage recording (see "Server-Side Usage Recording" entry below). However, the client-side functions that call the edge function (`makeApiRequestWithFallback` and `makeStreamingReportRequest`) had no way to pass those values — they were never included in the request body. As a result, all recorded usage rows had `operation_type = 'llm_call'` (the fallback) and `session_id = null`, making usage data uninformative for billing analytics.

**Changes in `src/services/api/utils.ts`:**

1. `makeApiRequestWithFallback` — two new optional parameters added after `userEmail?`:
   ```typescript
   operationType?: string,
   sessionId?: string | null
   ```
   Both are included in the edge-function request body:
   ```typescript
   const requestBody: any = {
     messages, model: attemptedModel, temperature, maxTokens,
     operationType, sessionId
   };
   ```
   The direct-API fallback path (when Supabase is unavailable) does not include them, since that path bypasses the edge function entirely and has no usage recording.

2. `makeStreamingReportRequest` — two new optional parameters added after `maxTokens`:
   ```typescript
   operationType?: string,
   sessionId?: string | null
   ```
   Both included in the JSON body sent to the edge function:
   ```typescript
   body: JSON.stringify({ messages, model, temperature, maxTokens, stream: true, operationType, sessionId })
   ```

**Changes in `src/services/api/copyGeneration.ts`:**

All three `makeApiRequestWithFallback` calls in the legacy pipeline now pass explicit operation labels and the session ID:

- Initial copy generation (line ~193): `'generate_copy', actualSessionId`
- Variant generation loop (line ~363): `'generate_variant', actualSessionId`
- Validation repair attempt (line ~509): `'repair_copy', actualSessionId`

`actualSessionId` is the validated session ID that was already in scope at each call site.

**Changes in `src/components/copy-maker/CopyMakerSidebar.tsx`:**

All three `makeStreamingReportRequest` calls for report generation pass:
```typescript
'generate_report', null
```
`null` is used for `sessionId` because no session ID variable is in scope at these call sites (reports are generated from the sidebar context, not tied to a generation session).

**Result:**
Every LLM call originating from the generation pipeline now records a meaningful `operation_type` in `pmc_user_tokens_used`:
- `generate_copy` — primary generation
- `generate_variant` — each extra variant
- `repair_copy` — validation repair retry
- `generate_report` — PDF/markdown report generation

Session-linked calls also record the `session_id`, enabling per-session cost analysis.

---

## Live Claude Model Resolution at Generation Time (2026-07-03)

**File modified:**
- `src/services/api/copyGeneration.ts`

**Problem solved:**
`formState.model` can be stale at generation time — restored from a previously saved session, set before the admin changed the model toggle, or not yet synced if the admin toggle changed after the form loaded. The CopyForm.tsx sync effect (previous change) keeps the UI display correct but has a timing window. This change guarantees correctness at the actual moment of generation by reading the authoritative value from the database.

**`resolveEffectiveModel` helper (added above `generateCopy`):**
- Only runs when the engine is Claude (`formState.aiEngine === 'claude'` or default).
- Reads `app_settings` table for key `'claude_model'` using the existing `getSupabaseClient()` singleton.
- Validates the returned value is one of the known Claude model IDs (`claude-sonnet-4-6`, `claude-sonnet-5`); if not, falls back to `formState.model`.
- On any error (network, RLS, etc.), silently falls back to `formState.model` — generation is never blocked.
- Logs a message if the live value differs from `formState.model` so drift is visible in the console.
- Returns a cloned `formState` with the corrected `model` field; does not mutate the original.

**`generateCopy` change:**
- First line of the function body: `formState = await resolveEffectiveModel(formState);`
- Because both the legacy pipeline and the enhanced pipeline receive the same `formState` object, every downstream read of `formState.model` throughout both pipelines automatically gets the resolved value. No changes needed elsewhere.

**Unchanged:**
- Enhanced pipeline (`runEnhancedPipeline`) — receives the already-resolved formState
- Legacy pipeline logic — same
- `CopyForm.tsx` sync effect — still in place for UI display accuracy
- No other files touched

---

## Admin Claude Model Sync to Copy Generation (2026-07-02)

**File modified:**
- `src/components/CopyForm.tsx`

**Problem solved:**
The admin dashboard's "Claude Model" toggle (via `useAdminClaudeModel`) previously only affected scoring, reports, and the fallback chain — not regular copy generation. `formState.model` was only updated when a user explicitly re-selected "Claude" from the AI Engine dropdown via `handleAiEngineChange`. Since Claude is the default engine and users rarely change it, the admin toggle had no practical effect on what model was used for generation.

**Changes:**

1. **Import added** — `useAdminClaudeModel` imported from `../hooks/useAdminClaudeModel`.

2. **Hook called** — `const { claudeModel } = useAdminClaudeModel();` called inside the component alongside `useMode()`.

3. **Sync effect added** — A new `useEffect` (placed after the existing legacy migration effect) keeps `formState.model` in sync with the admin's current `claudeModel` setting whenever the Claude engine is active:
   ```typescript
   useEffect(() => {
     const currentEngine = formState.aiEngine || 'claude';
     if (currentEngine === 'claude' && formState.model !== claudeModel) {
       setFormState(prev => ({ ...prev, model: claudeModel }));
     }
   }, [claudeModel]);
   ```
   The dependency array contains only `[claudeModel]` — not `formState` or `formState.model` — to avoid a render loop, since the effect itself writes to `formState.model`.

**Unchanged:**
- `handleAiEngineChange` — still updates `model` on dropdown interaction
- `handleModelChange` — legacy model dropdown handler unchanged
- The migration effect for legacy model→engine conversion
- `AiEngineSelector`, `comparativeScoring.ts`, report generation, edge functions
- No other files touched

---

## Server-Side Usage Recording in ai-completion Edge Function (2026-07-02)

**File modified:**
- `supabase/functions/ai-completion/index.ts`

**Summary:**
The `ai-completion` edge function now records LLM token usage directly to `pmc_user_tokens_used` after every successful call, for both streaming and non-streaming paths. Previously, usage recording was handled separately by the client-side `track-tokens` function; this change adds a server-side fallback to ensure all calls routed through `ai-completion` are recorded regardless of client behavior.

**A. New request body fields accepted:**
- `operationType` (optional string) — labels the operation (e.g., `copy_generation`, `scoring`). Defaults to `llm_call` if omitted.
- `sessionId` (optional string | null) — associates the usage record with a session in `pmc_copy_sessions`.

**B. `recordUsage` helper (added inside the function file, above `Deno.serve`):**
- Looks up active model pricing via `get_active_model_pricing` RPC using `p_model_key` and `p_pricing_tier: 'standard'`.
- Calculates `cost_usd` from `input_usd_per_1k` / `output_usd_per_1k` pricing rows.
- Fetches the active billing rule from `llm_billing_rules` (ordered by `effective_from` desc) to compute `billable_units` using the same formula as `track-tokens`: `max(min_units_per_call, ceil((cost_usd * cost_multiplier) / usd_per_unit))`.
- Inserts a row into `pmc_user_tokens_used` with all standard columns: `user_id`, `operation_type`, `model`, `cost_usd`, `session_id`, `billable_units`, `billing_rule_name`, `pricing_tier`, `cost_source`, `pricing_row_id`, `input_tokens_used`, `output_tokens_used`.
- Errors are caught and logged; recording failures are non-fatal and never interrupt the user's request.

**C. Streaming path changes:**
- Token counters `streamInputTokens` and `streamOutputTokens` are maintained alongside the byte-forwarding loop.
- Each decoded chunk is split on newlines; `data:` SSE lines are JSON-parsed (failures silently skipped).
- `message_start` events populate `streamInputTokens`; `message_delta` events with `usage.output_tokens` populate `streamOutputTokens`.
- After the read loop completes (before writing the terminal `\n` marker), `recordUsage` is called with the captured token counts.
- Byte forwarding to the client is unchanged.

**D. Non-streaming path changes:**
- Immediately before the final `return new Response(...)`, if `usage` is present, `recordUsage` is called using `usage.prompt_tokens || usage.input_tokens` and `usage.completion_tokens || usage.output_tokens` to handle both Claude and OpenAI usage object shapes.

**Unchanged:**
- Access/credits enforcement block
- Retry logic and fallback chain
- Error response shapes
- Request/response contract
- No client files in `src/` were modified

---



**Files modified/created:**
- `src/types/index.ts` — Added `claude-sonnet-4-6` and `claude-sonnet-5` to `Model` union type
- `src/constants/index.ts` — Added models to MODELS array, MAX_TOKENS_PER_MODEL, and DEFAULT_FORM_STATE; added `CLAUDE_JUDGE_MODEL_OPTIONS`, `getAdminClaudeModel()`
- `src/services/api/modelValidation.ts` — Added labels, switch cases, and `getAvailableModels` entries for new models
- `src/services/api/utils.ts` — Added new models to Claude key group, updated deepseek fallback, added token cost cases
- `src/services/api/comparativeScoring.ts` — **Pinned back to `claude-sonnet-4-6`** (removed `getAdminClaudeModel` import; see "Comparative Scoring Model Pin" section below)
- `src/components/copy-maker/CopyMakerSidebar.tsx` — Replaced 3 hardcoded model strings in Eval/Compare/Client report calls
- `src/hooks/useFormState.ts` — Updated both deepseek-chat fallback normalizations to use `getAdminClaudeModel()`
- `src/components/CopyForm.tsx` — Updated engine toggle legacy model to `getAdminClaudeModel()`
- `src/components/CopySnap.tsx` — Updated both `makeRequestWithFallback` calls to use `getAdminClaudeModel()`
- `src/components/Dashboard.tsx` — Added admin Claude model selector card (pill buttons)
- `src/hooks/useAdminClaudeModel.ts` — **New file:** hook for reading/writing preferred Claude model; backed by Supabase `app_settings` with localStorage as synchronous fallback cache
- `src/App.tsx` — Added sync useEffect keyed on `currentUser?.id` that writes Supabase model setting to localStorage on every login/session restore, keeping synchronous callers (`getAdminClaudeModel()`) current across machines
- `supabase/functions/ai-completion/index.ts` — Fixed temperature parameter: omit for `claude-sonnet-5` (streaming + non-streaming paths); deployed

### Feature Summary

**Admin Claude Model Selector** — Admins can switch the Claude model used for scoring, report generation, and engine fallbacks between Claude Sonnet 4.6 (default) and Claude Sonnet 5 directly from the Dashboard. The selection persists globally via Supabase `app_settings` table (key: `claude_model`) and is cached in localStorage under `copyZap_adminClaudeModel` for synchronous callers. The setting takes effect immediately on the current machine and is picked up by all other machines on their next login or page load.

**Persistence architecture:**
- `useAdminClaudeModel` hook — fetches from `app_settings` on mount; writes back via `UPDATE ... WHERE key = 'claude_model'` (row always seeded by migration). Write failures show a `toast.error` with the Supabase error message.
- `App.tsx` sync effect — keyed on `currentUser?.id`; runs on every login/session restore and writes the DB value into localStorage so synchronous callers (`getAdminClaudeModel()`) always have a fresh value.
- `getAdminClaudeModel()` — reads synchronously from localStorage (used mid-render in report generation). Remains valid because the sync effect and hook mount effect both keep localStorage current.
- RLS: only users in `app_admins` can read or write `app_settings`. Non-admins cannot change the setting via the client SDK.

**Default model changed** from `claude-sonnet-4-5` to `claude-sonnet-4-6`. All existing sessions that stored `deepseek-chat` now remap to the admin's preferred model at runtime.

**`getAdminClaudeModel()`** — Central utility function in `constants/index.ts`. All hardcoded `'claude-sonnet-4-5'` strings throughout the codebase now call this function instead, so the admin selection propagates everywhere.

**Temperature handling** — Claude Sonnet 5 does not accept a `temperature` parameter and returns a 400 error if one is sent. The `ai-completion` edge function now conditionally omits temperature for `claude-sonnet-5` in both streaming and non-streaming request paths. All other models are unaffected.

**Token pricing** — Sonnet 4.6 priced at same tier as 4.5 ($3/$15 per 1M tokens). Sonnet 5 uses intro pricing ($2/$10 per 1M, valid through Aug 31 2026; cost constant should be updated to `0.000003` on Sept 1 2026).

## Comparative Scoring Model Pin — claude-sonnet-4-6 (2026-07-01)

**File modified:** `src/services/api/comparativeScoring.ts`

### Problem

After wiring the admin Claude model selector to `compareVersionsRelatively`, comparative scoring began 504-ing on 3-version payloads whenever the admin had switched to `claude-sonnet-5`.

### Root Cause

`compareVersionsRelatively` calls `makeApiRequestWithFallback` (non-streaming). Non-streaming calls run synchronously inside a Supabase Edge Function and are subject to a hard 150-second idle timeout. `claude-sonnet-5` takes longer than 150 seconds to score 3 versions under this constraint, causing the edge function to terminate with a 504 before the response arrives.

### Fix

Removed `getAdminClaudeModel` from the import in `comparativeScoring.ts` and hardcoded `actualModel` to `'claude-sonnet-4-6'`. The admin toggle remains fully active for all streaming-safe paths: copy generation, report generation (Eval/Compare/Client), and CopySnap — all of which use streaming and are not subject to the idle timeout.

### Scope

The admin model selector controls:
- Copy generation (`copyGeneration.ts`) — streaming, safe
- Eval / Compare / Client reports (`CopyMakerSidebar.tsx`) — streaming, safe
- CopySnap scoring (`CopySnap.tsx`) — streaming, safe

The admin model selector does NOT control:
- Comparative scoring (`comparativeScoring.ts`) — non-streaming, pinned to `claude-sonnet-4-6`

## Score Stability — Anchored Incremental Rescoring (2026-06-30)

**Files modified:**
- `src/services/api/comparativeScoring.ts`
- `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

### Problem

When a user added a new generated version and triggered a rescore, the entire version set was re-sent to the LLM via `generateUnifiedComparison`. Because the LLM uses rank-based banding relative to the batch composition, introducing one new version caused all previously-scored versions to receive different scores. This produced confusing UX where adding a weak version lowered all scores, or adding a strong version raised them.

### Root Cause

`performScoreAndNavigate` (in `CopyMakerTab.tsx`) previously rebuilt the full version list — including already-scored versions — and called `generateUnifiedComparison` every time. The LLM has no memory of prior scores, so each call produced an independent relative ranking calibrated to the current batch composition.

### Fix

**`comparativeScoring.ts`**

1. Added optional 9th parameter `anchors?: { versionId: string; label: string; score: number }[]` to `compareVersionsRelatively`.
2. When anchors are provided, an `anchorSection` block is injected into the LLM prompt listing each previously-scored version with its locked score and instructing the model to calibrate new versions against that fixed scale rather than ranking them relative to each other.
3. The scoring scale instruction is dynamic: with anchors it switches from rank-based band instructions to anchor-relative instructions ("if a new version is clearly better than a locked anchor at score X, assign it X+5 to X+15").
4. New exported function `mapToComparisonResultWithAnchors(comparativeResult, newVersions, anchorRows)` merges fresh LLM results for new versions with the immutable anchor rows, re-sorts all rows by `finalScore`, recomputes `rank`, `isWinner`, `deltaVsBest`, and `improvementPct` client-side.

**`CopyMakerTab.tsx` — `performScoreAndNavigate`**

1. Removed the `generateUnifiedComparison` call (full rescore of all versions).
2. Now only `missingVersions` (new, un-scored versions) are sent to `compareVersionsRelatively`.
3. `anchorRows` are built from the existing `comparisonResult.rows` (locked — not sent to LLM).
4. `anchors` array (versionId, label, finalScore) is passed as the 9th argument.
5. Result is merged via `mapToComparisonResultWithAnchors` so existing scores are fully preserved.
6. Removed stale `existingCache`/`updatedCache` references and `winnerId`/`cleanedRows` re-mapping (no longer needed — `mapToComparisonResultWithAnchors` handles this).

### Outcome

Adding new versions no longer shifts previously-scored versions' scores. Existing scores are immutable anchors; only new versions receive LLM scores calibrated against the established quality baseline.

## Rankings Snapshot — Visual Polish Pass (2026-06-30)

**File modified:** `src/components/results/decision/RankingsSnapshotCard.tsx`

### Changes

1. **Output/Analysis chips → pill buttons.** Replaced plain-text uppercase labels + pipe divider with proper `rounded-full` pill buttons: `px-2.5 py-1`, `border border-gray-200 dark:border-gray-700`, `bg-gray-50 dark:bg-gray-900`, `text-gray-500 dark:text-gray-400`, with `hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600`. Pipe divider span removed — visual boundary is now the pill border. `stopPropagation` and click handlers unchanged.

2. **Chips moved to their own line.** Action chips are now inside the name/tags column (the `flex-1` div), rendered below the date/subscores row with `mt-1.5`. No longer inline-right next to score numbers. This gives numeric columns clean right-side alignment and avoids crowding.

3. **Score column fixed width.** Introduced `SCORE_COL_CLASS = 'w-10 text-right tabular-nums'` constant applied to both the `ScoreColumnLabel` wrapper and every `finalScore` / `absoluteScore.total` / placeholder `...` span. `ScoreColumnLabel` now also uses `justify-end` so its label text and icon align to the right edge. This ensures per-row numbers line up directly under their header labels when "Show Absolute" is toggled on.

4. **Removed `opacity-80` from row wrapper.** `opacity-80` was applied to the entire non-winner row div, washing out action chips and text together. Removed from the wrapper. Muted styling is now applied directly and only to the elements that need it: `optionLabel` uses `text-gray-400 dark:text-gray-500` on non-winner rows (was `text-gray-500`), `finalScore` retains its existing `text-gray-400 dark:text-gray-500`. Action chips render at full legibility on all rows.

5. **Decision badge → `rounded-full`.** Changed decision badge from `rounded` to `rounded-full` and from `px-1.5` to `px-2` to match the Baseline tag and new chip style consistently. Baseline tag was already `rounded-full px-1.5 py-0.5` — updated to `px-2 py-0.5` for uniform padding.

6. **Row wrapper changed to `items-start`.** Changed from `items-center` to `items-start` so the rank number and score column align to the top of the name block (which now may be taller due to the chips row), with `mt-0.5` on the rank number to vertically nudge it to align with the first text line.

---

## Rankings Snapshot — Split Row Actions (2026-06-30)

**Files modified:**
- `src/components/results/decision/RankingsSnapshotCard.tsx`
- `src/components/results/ComprehensiveComparisonTable.tsx`

### Overview

Each non-baseline row in the Rankings Snapshot card now exposes two separate action links on the right side instead of a single clickable row. This gives users distinct entry points for viewing the copy output versus jumping to the version's analysis card.

### Changes

#### RankingsSnapshotCard

- Added optional prop `onViewAnalysis?: (versionId: string) => void` to `RankingsSnapshotCardProps`.
- Removed the row-level `onClick` handler (which called `onRowClick?.(row.versionId)` on the entire row div).
- Added two small text buttons rendered for non-baseline rows, placed to the right of the score column:
  - **"Output"** — calls `onRowClick?.(row.versionId)`. Preserves the original scroll-to-output behavior.
  - **"Analysis"** — calls `onViewAnalysis?.(row.versionId)`. Scrolls to the version's analysis card top anchor.
  - Both buttons call `e.stopPropagation()` to prevent any parent click handlers from firing.
  - Styling: `text-[9px] font-semibold uppercase tracking-wider`, consistent with the file's existing micro-label convention. A thin `|` divider separates the two links when both are present.
- The "Output" link only renders when `onRowClick` is provided; the "Analysis" link only renders when `onViewAnalysis` is provided. Both are independent — either can be omitted without breaking the other.

#### ComprehensiveComparisonTable

- Added new handler `handleJumpToAnalysisTop(versionId: string)`:
  - Ensures the version's analysis card is expanded (`setExpandedVersionIds` → adds `versionId: true` if not already set).
  - Triggers `onEnsureVersionDeepAnalysis(versionId)` if deep analysis is not yet loaded.
  - Scrolls to `document.getElementById(`breakdown-${versionId}`)` — the top-level anchor of the `VersionAnalysisCard` — using the same `setTimeout(150) + requestAnimationFrame` pattern as `handleJumpToBreakdown` for timing reliability.
- Passed `onViewAnalysis={handleJumpToAnalysisTop}` to `RankingsSnapshotCard` (alongside the existing `onRowClick={onVersionClick}`).

### Anchor reference

`VersionAnalysisCard` renders `id={`breakdown-${row.versionId}`}` as the outermost `div` (line 131). The "Analysis" link targets this anchor, landing at the top of the version's analysis card rather than at an inner sub-section.

---

## Generate Evaluation Report (2026-06-29)

**Location:** `src/components/copy-maker/CopyMakerSidebar.tsx` — Section 2: Output block

### Overview

A new "Evaluation Report" button appears in the Output section of the Copy Maker sidebar (admin-only, visible when `hasContent && !!comparisonResult && sortedGeneratedVersions.length >= 2`). When clicked, it sends the current session's LLM Eval Export content plus a structured evaluation prompt to Claude, receives a full expert copy critique in markdown, and displays the result in a preview modal. The report can be downloaded as `.md` or exported as a `.docx` Word file.

### Files Created

- `src/prompts/copyzap-eval-prompt.md` — The evaluation prompt text. Two-phase structured prompt: Phase 1 (blind editorial quality + conversion potential scoring), Phase 2 (comparison against CopyZap app scores). Delivers 6 deliverables: Executive Summary, Phase 1 results, Phase 2 comparison, Concrete Improvements for the winning version (line rewrites, structural conversion gaps, impact prioritization), a Comparison Table (Version / CopyZap Score / Claude Editorial Quality / Claude Conversion Potential / App Rank / Claude Rank / Key Disagreement), and a Disclaimer. Includes a REPORT LANGUAGE rule: every reader-facing heading and sentence is rendered in the language of the copy being evaluated. BEFORE EXPORTING clause: show a visual preview first, then prompt for confirmation before generating files. The prompt is imported as a raw string using Vite's `?raw` import syntax.

### Files Modified

**`src/vite-env.d.ts`**
- Added ambient `declare module '*.md?raw'` declaration to allow TypeScript-safe raw string imports of `.md` files.

**`src/utils/enhancedExports.ts`**
- Extracted `buildLLMEvaluationMarkdown` (new exported function) from the body of `exportLLMEvaluationMarkdown`. Returns `{ markdown: string; filename: string }` without triggering a download. The existing `exportLLMEvaluationMarkdown` now calls `buildLLMEvaluationMarkdown` internally — no change to its public API or behavior.

**`src/components/copy-maker/CopyMakerSidebar.tsx`**
- Added imports: `Scale` (lucide), `buildLLMEvaluationMarkdown`, `makeApiRequestWithFallback`, `playSuccessSound`, `evalPrompt` (raw md).
- Added state: `isGeneratingEvalReport`, `evalReportMarkdown`, `evalReportFilename`, `showEvalPreview`.
- Added `handleGenerateEvalReport`: calls `buildLLMEvaluationMarkdown` to get the eval file content, prepends a language directive (`IMPORTANT: Write the entire report in ${language}. Every heading, table header, and sentence must be in ${language}.`) when `formState.language` is present (omitted entirely when no language value), then prepends the eval prompt, sends to `claude-sonnet-4-5` with `max_tokens: 16000`, stores result, shows preview, plays success sound.
- Added `handleDownloadEvalMd`: downloads `evalReportMarkdown` as `CLAUDE-<evalFilename>.md`.
- Added `handleExportEvalDocx`: dynamically imports `docx`, parses the markdown report into heading paragraphs and body paragraphs (with inline bold support), locates the "Comparison Table — CopyZap vs. Claude" block and renders it as a fixed-layout docx Table with the specified column widths (Version: 1800, CopyZap Score: 1400, Claude Editorial Quality: 1700, Claude Conversion Potential: 1700, App Rank / Claude Rank: 1800, Key Disagreement: 4560 — total 12960 DXA), US Letter landscape page (15840 × 12240 DXA), Arial font throughout, 1440 DXA margins, alternating light-gray row shading, and a footer on every page: "project name · date · Generated by CopyZap + Claude". Downloads as `CLAUDE-<evalFilename>.docx`.
- Added "Evaluation Report" `SidebarBtn` (icon: `Scale`) in the Output section after the LLM Audit Export button.
- Added `ProcessingModal` portal shown while `isGeneratingEvalReport` is true.
- Added preview modal portal (shown when `showEvalPreview` is true): renders `evalReportMarkdown` as HTML via `markdownToHtml`, with Download .md, Output as Word file?, and Close actions.

### Behavior Notes

- The `?raw` prompt import means the prompt is bundled at build time — no runtime fetch required.
- Page HTML is not available in the session context; the LLM input uses the LLM Eval Export markdown only (as determined in Part 0 diagnostics).
- The `docx` package is imported dynamically inside `handleExportEvalDocx` to avoid adding it to the main bundle.
- `max_tokens` for the eval LLM call is `8000` to stay within the 150s idle window.

### Preview Modal (Monochrome Palette — 2026-06-29)

The preview modal uses a scoped `.eval-report-preview` CSS class injected inline via a `<style>` tag, overriding all Tailwind prose classes. Palette: text `#000000`, muted `#404040`, table header fill `#D9D9D9`, alternating row fill `#F2F2F2`, borders `#BFBFBF`, background `#FFFFFF`. A `filterScaffoldingLines()` helper strips any leaked prompt scaffolding (lines containing `12960`, `column widths sum`, `Before generating`, or `Verify:`) from the HTML before rendering.

### Word Export (Rewritten — 2026-06-29)

`handleExportEvalDocx` was fully rewritten. Key changes:
- **Page size**: `{ width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE }` — US Letter landscape; content width 12,960 DXA.
- **Header block** (built from app data, not from markdown): bold title "Reporte de Evaluación — CopyZap vs. Claude", project name, muted date/version/language line with bottom border rule.
- **Footer**: centered, `#404040`, `<project name> · <date> · Generated by CopyZap + Claude`.
- **All tables** captured (not just the comparison table) via a first-pass scan of all `|`-delimited spans. Column-width lookup by column count: 6-col `[2600,1500,1700,1760,1700,3700]`, 4-col `[4600,3000,3360,2000]`, 3-col `[4200,1600,7160]`; any other count distributed evenly with last column absorbing remainder. `assertWidths()` guard logs an error if any table's widths don't sum to 12,960. Every table row has `cantSplit:true`; header row has `tableHeader:true`; all cells have DXA widths, `ShadingType.CLEAR`, `BorderStyle.SINGLE` #BFBFBF borders, and `{ top:60, bottom:60, left:120, right:120 }` margins.
- **Fonts**: Arial throughout; sizes: H1 32, H2 24, H3 21, body 20, table cells 18, muted 16 half-pts.
- **Lists**: bullet and numbered list items mapped to real docx `bullet`/`numbering` paragraphs (no literal `•` characters). Numbered lists use a `numbering.config` entry with reference `eval-list` and `LevelFormat.DECIMAL`, passed directly to `Document` (no `Numbering` class instantiation — incompatible with docx v9.7.x).

### Bug Fix — blank header cells in Word export (2026-06-29)

`parseInlineRuns` returned `TextRun` class instances. The header-row code then did `new TextRun({ ...r, bold: true })`, spreading a class instance whose properties are non-enumerable — the `text` value was lost, rendering every header cell blank. Fix: added a `bold` parameter to `parseInlineRuns`; the header path now calls `parseInlineRuns(cell, { size: 18, color: C_PRIMARY, bold: isHeader })` directly. The broken map/spread was removed.

### Eval Prompt — Remove Duplicate Header Item (2026-06-29)

PART 1 item "1. Header" removed from `src/prompts/copyzap-eval-prompt.md`. The app already prepends the header block in `handleExportEvalDocx`; the model must not produce its own. Remaining PART 1 items renumbered 1–5 (Executive Summary → Disclaimer).

### Docx Header — Native Language Display (2026-06-29)

The `Idioma:` line in the Word export header now shows the language's native name instead of its English key. A `NATIVE_LANG` lookup table maps the 14 supported `formState.language` values (e.g. `"Spanish"` → `"Español"`, `"French"` → `"Français"`) with a passthrough fallback for unmapped values.

`src/prompts/copyzap-eval-prompt.md` replaced verbatim. Key structural changes from previous version:

- Two phases are now labelled as internal working steps (not reader-facing deliverables)
- REPORT STRUCTURE section added with explicit PART 1 / PART 2 ordering
- PART 1 is a plain-language Client Report (~2 pages); PART 2 is a technical appendix (A1, A2, A3)
- INTEGRITY RULE added — forbids invented statistics/percentages in rewritten copy
- TABLE SHAPES section specifies exact column counts for all three tables (6-col Comparison, 4-col Phase 1, 3-col Impact Prioritization)
- BEFORE EXPORTING simplified; OUTPUT FILES note clarifies no layout instructions in report text

Runtime error thrown when clicking the Word export button. Root cause: `new Numbering({ config: [...] })` was instantiated separately and passed as `numbering` to `Document`. In docx v9.7.x the `Numbering` class does not accept this shape; the constructor iterates `options.config` which is undefined in that code path. Fix: removed the `new Numbering(...)` call and the unused `Numbering`, `AbstractNumbering`, `NumberFormat` imports; the numbering config is now passed inline as `numbering: { config: [...] }` directly on the `Document` constructor. Build confirmed clean.
- **Scaffold filter**: same `SCAFFOLD_RE` patterns applied before building docx children.
- **Palette**: `C_PRIMARY='000000'`, `C_MUTED='404040'`, `C_HDR_FILL='D9D9D9'`, `C_ALT_FILL='F2F2F2'`, `C_WHITE='FFFFFF'`, `C_BORDER='BFBFBF'`. No orange, no blue, no accent colors anywhere.
- If the markdown table cannot be located (regex fails to find a `|`-delimited block near "comparison table"), that section falls back to plain paragraphs and the function completes without error.

---

## Best Elements Summary — UX Polish (2026-06-09)

**Location:** `src/components/copy-maker/CopyMakerSidebar.tsx` — Section 2D block

**Changes:**
- Description paragraph font size reduced from `text-[9px]` to `text-[8px]` for visual tightness
- Added `ProcessingModal` portal (via `ReactDOM.createPortal`) that renders over the full viewport while `isGeneratingBestElements` is true, providing clear loading feedback during Best Elements analysis. Uses the same portal pattern as other modals in the sidebar. No new imports were required.

**Completion sound:**
`handleGenerateBestElements` in `CopyMakerTab.tsx` now calls `playSuccessSound()` (from `src/utils/soundEffects.ts`) immediately after the success toast, matching the identical call used in `useGeneration.ts` after main copy generation. Import added to `CopyMakerTab.tsx`.

---

## Server-Side Usage Recording / Client-Side Tracking Removal (2026-06-09)

**Purpose:** Eliminate a security vulnerability where clients could supply arbitrary `cost_usd` and `user_id` to the `track-tokens` edge function, and eliminate double-counting where both client and server recorded rows for the same LLM call.

**Root cause of double-counting:** `trackTokenUsage` in `tokenTracking.ts` had an early-return only when `sessionId` was absent. When `sessionId` was present (all service files pass one), the full 200-line body ran — computing `cost_source='db_pricing'` via `calculateCostFromDbPricing` and posting to the `track-tokens` edge function. The previous attempt to no-op this function only added the early return at the `!sessionId` branch, leaving the rest of the body live.

**Fix applied:**

`src/services/api/tokenTracking.ts` — Replaced the entire `trackTokenUsage` function body (lines 55–260) with a single `return;`. The function signature is preserved for call-site compatibility. All 23+ callers across service files now invoke a guaranteed no-op regardless of whether `sessionId` is provided.

Additional no-ops applied in the same session:
- `src/lib/llm/callLLMWithFallback.ts` — private `trackTokenUsage` helper body replaced with `return;`
- `src/components/wizard/WizardStep.tsx` — direct `fetch` to `track-tokens` in `handleGetFieldSuggestion` removed

**Result:** No client-side code calls `track-tokens` or inserts into `pmc_user_tokens_used` under any condition. All usage recording is handled exclusively server-side in the `ai-completion` edge function.

---



**Files:**
- `src/services/api/absoluteScoring.ts` (new)
- `src/components/results/AbsoluteScoreBadge.tsx` (new)
- `src/types/index.ts` — added `AbsoluteScoreBreakdown` interface and `absoluteScore` field on `GeneratedContentItem`
- `src/services/supabaseClient.ts` — added `saveAbsoluteScore`, `loadAbsoluteScores`
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` — runs absolute scoring after each variant is generated
- `src/components/results/decision/RankingsSnapshotCard.tsx` — displays both Session Score and Absolute Score columns
- `src/components/results/ComprehensiveComparisonTable.tsx` — passes `absoluteScoreMap` down to Rankings
- `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx` — builds `absoluteScoreMap` from `generatedVersions`
- `src/components/GeneratedCopyCard.tsx` — shows dual score badges in header and expandable breakdown in body
- `supabase/migrations/20260513233257_add_pmc_version_scores_table.sql` — pre-existing table used for persistence

### Overview

A new "Absolute Scoring" system runs independently of the existing session-relative scoring. It evaluates each piece of copy in complete isolation using a fixed 4-dimension rubric and produces a score that **never changes** regardless of what other versions exist in the session.

### Scoring Rubric

The LLM evaluator (uses `SCORING_MODEL`) applies the following fixed dimensions, each 0–25:

| Dimension | What it evaluates |
|-----------|-------------------|
| Clarity & Readability | Core message understandability, language appropriateness, sentence construction |
| Persuasion & Conversion Mechanics | Pain point recognition, value proposition clarity, CTA strength |
| Audience Fit | Tone, vocabulary, and framing match for apparent intended audience |
| Structure & Flow | Logical progression, section-to-section lead, momentum |

**Total:** Sum of all four dimensions (0–100). Calibrated so 75–85 = strong professional copy; 90+ is rare/exceptional.

### Where Scores Appear

**Card header:** A `DualScoreRow` component shows two inline badges:
- **Session** (with tooltip: "Relative to other versions generated in this session")
- **Abs** (with tooltip: "Evaluated in isolation — does not change as new versions are added")

Both badges appear in the colored header bar of every `GeneratedCopyCard`.

**Card body:** An expandable `AbsoluteScoreBadge` panel appears below the session ScoreCard. Clicking it reveals per-dimension bar charts (0–25 each) and one-sentence notes from the evaluator.

**Rankings panel:** The `RankingsSnapshotCard` shows two column headers ("Session" and "Absolute", each with an info tooltip) and two score values per row. Rows without an absolute score show "—".

### When Absolute Scoring Runs

Absolute scoring is **always triggered** (not gated by the "Generate Scores" toggle) for:
- Initial generation variants (all copies generated at generation time)
- Alternative copies
- Restyled copies (voice/persona transforms)

It does **not** retroactively score existing cards from previous sessions unless they are re-generated.

### Persistence

Scores are persisted to the `pmc_version_scores` table via `saveAbsoluteScore()` (upsert by `version_id`). On session restore, `absoluteScore` is hydrated from `GeneratedContentItem.absoluteScore` (stored in session JSONB). The `loadAbsoluteScores()` helper can be used to re-hydrate from the DB if needed.

---

## Keyword Integration Auto-Injection + Elaboration Toggle Rename (2026-05-15)

**Files:** `src/components/FeatureToggles.tsx`, `src/services/api/copyGeneration.ts`, `src/services/api/alternativeCopy.ts`, `src/services/api/contentRefinement.ts`, `src/services/api/humanizedCopy.ts`, `src/utils/ai-pipeline/enhancedPipeline.ts`, `src/types/index.ts`, `src/constants/index.ts`

### Changes

**Removed:** The "Force SEO keyword integration" toggle has been removed from the UI entirely. The `forceKeywordIntegration` field has been removed from `FormState`, default constants, field visibility lists, optimization restore policy, template save/load, and all prompt builders.

**New behavior:** In all prompt builders (`copyGeneration`, `alternativeCopy`, `contentRefinement`, `humanizedCopy`, `enhancedPipeline`), the keyword integration instruction is now injected automatically whenever the Keywords field contains any value — no toggle required. The instruction text is unchanged: the AI is told to naturally integrate all provided keywords throughout the copy for SEO value without disrupting readability.

**Renamed:** The "Force detailed elaborations and examples" toggle has been renamed to **"Expand with examples and detail"** in `FeatureToggles.tsx`. The underlying field name (`forceElaborationsExamples`) and behavior are unchanged.

**Tooltip updated:** The Keywords field tooltip in `SharedInputs.tsx` no longer references the removed toggle.

---

## "Fill the Form" Card in Start-With Bar (2026-05-15)

**File:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

### Change
A third card was added to the "Start with" bar (the row of option cards at the top of Copy Maker, alongside Quick Prompt Wizard and Load a Template).

### Card details
- **Label:** "Fill the form"
- **Description:** "Configure everything manually below."
- **Button:** "Go to form" — scrolls the page to the form section using `scrollIntoView({ behavior: 'smooth', block: 'start' })`
- **Style:** Matches the `TemplateLoader` card exactly — same border (`border border-gray-200 dark:border-gray-800`), same background (`bg-white dark:bg-gray-900/20`), same `flex-1` sizing, no featured/highlighted border
- **Behavior:** No state side-effects. Clicking the button smooth-scrolls to the form section via a `formSectionRef` attached to the form wrapper div.

### Implementation
- Added `formSectionRef = useRef<HTMLDivElement>()` near `templateDropdownRef`
- Attached `ref={formSectionRef}` to the `<div>` wrapping `<CopyForm>`
- New card rendered as inline JSX directly after `<TemplateLoader />` in the `flex flex-col sm:flex-row gap-3` row

---

## CollapsibleSection Dark Mode Fix (2026-05-14)

**File:** `src/components/ui/CollapsibleSection.tsx`

### Change
The `CollapsibleSection` component (used for every expandable form section in Copy Maker, including "What You're Creating") had a hardcoded inline `style={{ backgroundColor: '#FAFAFA' }}` on its inner content div. This bypassed Tailwind's dark mode class system, causing the section body to appear white/light in dark mode regardless of the page theme.

### Fix
- Outer wrapper: added `bg-white dark:bg-gray-800` (card-level surface)
- Inner content area: removed inline `#FAFAFA` style, replaced with `bg-gray-50 dark:bg-gray-900` (nested input panel level)
- Header button area retains `dark:bg-gray-900/50` / `dark:hover:bg-gray-900/70` (unchanged — already correct)
- All label text inside (`dark:text-gray-400`) and helper text (`dark:text-gray-400`) already applied per-field in `CopyForm.tsx`

This fix applies to ALL sections using `CollapsibleSection`: "What You're Creating", audience, targeting, feature toggles, and any other section rendered through this component.

---

## Dark Mode Audit & Token Hierarchy Enforcement (2026-05-14)

**Files affected:** 25+ component files across `src/components/`, `src/features/`, `src/components/help/pages/`

### Change
A comprehensive dark mode audit was performed across the entire app. All `dark:bg-black` occurrences on surfaces that are NOT page-level shells were corrected to use the correct token hierarchy.

### Token Hierarchy Applied
| Surface Type | Dark Token |
|---|---|
| Page shell / full-screen wrapper | `dark:bg-black` (intentional — left as-is) |
| Cards, modals, primary panels | `dark:bg-gray-800` |
| Nested inputs, textareas, selects, tag containers | `dark:bg-gray-900` |
| Borders on cards/panels | `dark:border-gray-700` |
| Borders on nested elements | `dark:border-gray-800` |

### Files corrected (inputs/selects → dark:bg-gray-900)
- `SharedInputs.tsx` — URL fields, language/tone/wordCount selects, custom word count
- `CopyForm.tsx` — Radio inputs, section dropdown
- `BrandVoiceModal.tsx` — All inputs, textareas, selects
- `SaveTemplateModal.tsx`, `SavePrefillModal.tsx`, `SaveAsNewTemplateModal.tsx`
- `AddUserModal.tsx`, `EditUserModal.tsx`
- `ManageCustomers.tsx` — Search input, add-form inputs
- `TemplateSuggestionModal.tsx` — Textarea
- `BetaRegistrationModal.tsx` — Name and email inputs
- `PrefillSelector.tsx` — Search input, prefill select
- `wizard/WizardStep.tsx` — All inputs/textareas/selects
- `ui/TagInput.tsx`, `ui/DraggableStructuredInput.tsx`, `ui/DraggableTagsInput.tsx`, `ui/OutputTagsInput.tsx`, `ui/CategoryTagsInput.tsx`
- `ui/AiEngineSelector.tsx`, `ui/BrandVoiceSelector.tsx`, `ui/CustomerSelector.tsx`
- `ui/OnDemandGeneration.tsx`, `ui/OutputStructureSelect.tsx`
- `copy-maker/CopyMakerTab/sections/QuickStartPicker.tsx` — Select
- `copy-maker/CopyMakerTab/sections/TemplateLoader.tsx` — Search input, template select

### Files corrected (panels/cards → dark:bg-gray-800)
- `copy-maker/CopyMakerTab/CopyMakerTab.tsx` — Main form card container
- `copy-maker/CopyMakerTab/sections/EmptyState.tsx` — Empty state panel
- `copy-maker/CopyMakerTab/sections/ResultsPanel.tsx` — Results panel
- `SaveTemplateModal.tsx` — Modal container + confirmation modal container
- `SaveAsNewTemplateModal.tsx` — Modal container
- `help/pages/BrandVoiceSystem.tsx` — Two nested example quote boxes

### Sidebar dropdown auto-close
- `NavSidebar.tsx` and `CopyMakerSidebar.tsx`: dropdown items now call `setOpen(false)` before `onSelect()`, so the dropdown collapses immediately after selection.

### Top bar navigation buttons removed
- `MainMenu.tsx`: Removed Start Hub, Copy Maker, Purpose Rewrite, Copy Snap, and Dashboard buttons from the top bar. Utility controls (dark mode, help, credits, logout) were untouched. Cleaned up unused icon imports (`LayoutDashboard`, `Rocket`, `Zap`).

### Intentionally preserved as dark:bg-black (shell-level)
- `QuickPolishPage.tsx` sticky header bar and fixed footer button bar
- `CopySnap.tsx` sticky header
- Any `min-h-screen bg-white dark:bg-black` page wrappers

---

## Lazy-Loaded Recent Items Dropdowns in Sidebar NAVIGATE (2026-05-14)

**Files:** `src/components/NavSidebar.tsx`, `src/components/copy-maker/CopyMakerSidebar.tsx`

### Change
Two lazy-loaded dropdowns ("Recent Projects" and "Recent Sessions") are added as sub-items indented under the Dashboard nav item in both the standalone `NavSidebar` and the `CopyMakerSidebar` NAVIGATE section.

### Structure
```
Dashboard
  ↳ Recent Projects  ▶
  ↳ Recent Sessions  ▶
```

### LazyDropdown / LazyNavDropdown component
- Renders a chevron-prefixed sub-item label
- On first click, fetches data; subsequent clicks toggle open/closed without re-fetching
- Shows an animated `Loader2` spinner while fetching
- Shows a subtle italic empty state if no results
- Chevron icon rotates 90° when open (CSS transition)

### Data loading (on-demand only)
- **Recent Projects**: calls `getUserSavedOutputsMeta(userId, 5)` — returns 5 most recent saved outputs ordered by created_at DESC; shows title + relative timestamp
- **Recent Sessions**: calls `getUserCopySessions(userId, 5)` — filters to `scope_key = 'copy-maker'`, returns 5 most recent; shows session_name + relative timestamp

### Navigation on item click
- Saved output: `navigate('/copy-maker?savedOutputId={id}')` — `UrlParamLoader` in CopyMakerTab fetches full data and loads inputs + outputs into form
- Session: `navigate('/copy-maker?sessionId={id}')` — same mechanism, loads session inputs only

### Relative timestamp helper
- `relativeTime(dateStr)` returns human-readable label: "just now", "5m ago", "3h ago", "2d ago", "1mo ago"

---

## Global NavSidebar — All Pages (2026-05-14)

**Files:** `src/components/NavSidebar.tsx` (new), `src/components/Dashboard.tsx`, `src/features/quickPolish/QuickPolishPage.tsx`, `src/components/CopySnap.tsx`, `src/components/copy-maker/CopyMakerSidebar.tsx`, `src/App.tsx`

### Change
The sidebar navigation (NAVIGATE section) now appears on ALL authenticated pages, not just Copy Maker.

### Per-page sidebar behavior
- **Copy Maker**: full sidebar — NAVIGATE + SESSION + OUTPUT + all action sections (no change to existing behavior)
- **Dashboard, Purpose Rewrite, Copy Snap**: a slim standalone `NavSidebar` component (160px wide) with NAVIGATE section only

### NavSidebar component (`src/components/NavSidebar.tsx`)
- Standalone sidebar rendering only the NAVIGATE section
- Uses `useAuth`, `useIsAdmin`, `useNavigate`, `useLocation` internally (no props required)
- Admin-gated items: Purpose Rewrite and Copy Snap only appear for admin users
- Start Hub dispatches `forceOpenStartHub` custom event (listened in `App.tsx`) — works from any page

### Start Hub wiring fix
- CopyMakerSidebar now dispatches `window.dispatchEvent(new CustomEvent('forceOpenStartHub'))` instead of the non-functional `openStartHub` event
- `App.tsx` adds a `useEffect` that listens for `forceOpenStartHub` and calls `handleForceOpenStartHub()`, which opens the Start Hub modal

### Admin visibility
- Purpose Rewrite: admin-only in NAVIGATE section of both `CopyMakerSidebar` and `NavSidebar`
- Copy Snap: already admin-only in `MainMenu`; now also admin-only in both sidebars

---

## Navigate Section in Left Sidebar (2026-05-14)

**File:** `src/components/copy-maker/CopyMakerSidebar.tsx`

### Change
A new NAVIGATE section was added at the very top of the left sidebar (above SESSION and ACTIONS), providing quick navigation links to the five main areas of the app.

### Items (in order)
1. Copy Maker (`/copy-maker`) — FileEdit icon
2. Start Hub (dispatches `openStartHub` custom event after navigating to `/copy-maker`) — Rocket icon
3. Purpose Rewrite (`/quick-polish`) — PenLine icon
4. Copy Snap (`/copy-snap`) — Camera icon
5. Dashboard (`/dashboard`) — LayoutDashboard icon

### Visual treatment
- Section label in orange (`#f97316`) to distinguish from muted gray section headers
- Nav items use `py-1.5` (slightly taller than standard sidebar buttons)
- Active item: 2px left orange accent bar, orange text, subtle orange-tinted background (`rgba(249,115,22,0.07)`)
- Hover state: subtle orange tint (`rgba(249,115,22,0.06)`) on non-active items
- A `border-b border-gray-200 dark:border-gray-700` divider separates NAVIGATE from the sections below
- `useNavigate` and `useLocation` from `react-router-dom` added to the main sidebar component

---

## Relative Score Tooltip in Rankings Table (2026-05-13)

**Files:** `src/components/results/decision/RankingsSnapshotCard.tsx`, `src/utils/enhancedExports.ts`

### Change
A small ⓘ info icon was added next to each version's score number in the Rankings table, both in the live UI and in HTML exports.

### Tooltip text
"Scores are relative to other versions in this comparison. Adding new versions may shift scores slightly — focus on the ranking order and the improvement delta vs. your original."

### Implementation details
- **UI (RankingsSnapshotCard.tsx):** A `<span>` with `title` attribute and inline styles (`font-size: 11px; color: #9ca3af; cursor: help; margin-left: 4px`) renders the ⓘ character (HTML entity `&#9432;`) next to each `finalScore` in the score+delta cell.
- **HTML Export (enhancedExports.ts):** A `<p>` footnote line is appended after the last rankings row in the HTML export rankings section:
  `"ⓘ Las puntuaciones son relativas entre las versiones comparadas en esta sesión. Agregar nuevas versiones puede ajustar los puntajes ligeramente. Enfócate en el orden del ranking y la mejora porcentual vs. el texto original."`
  Styled with `font-size:12px; color:#9ca3af; margin-top:12px; font-style:italic`.
- No changes to scoring logic, prompts, or calculations.

---

## Auto-Rescore: Deep Analysis for Newly Added Versions (2026-05-09)

**File:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

### Problem
When a new output was added and the comparison was rescored automatically via `performScoreAndNavigate()`, the deep analysis (per-version detailed breakdown) was only generated for the original versions during the initial `compareOutputsWithGrok()` call. The newly added versions were included in the rescore result but had no deep analysis entries, leaving their analysis cards empty.

### Root cause
`performScoreAndNavigate()` called `generateUnifiedComparison()` and wrote the new `comparisonResult` to state, but did not trigger deep analysis for the new versions. The `runDeepAnalysisForAll()` call that runs inside `compareOutputsWithGrok()` only covered the versions present at initial scoring time.

### Fix
In the `setTimeout` callback inside `performScoreAndNavigate()`, after state is written, iterate over `missingVersions` (already computed at the top of the function — the exact set of newly added versions that were absent from the prior comparison) and call `ensureVersionDeepAnalysis(v.id)` for each one. `ensureVersionDeepAnalysis` already implements skip-if-cached logic: it bails immediately if `versionDeepAnalysis[versionId]` is already populated or if the version is already in-flight, so calling it unconditionally is safe.

```typescript
for (const v of missingVersions) {
  ensureVersionDeepAnalysis(v.id);
}
```

This is placed after `setFormState` so that `formStateRef.current` inside `ensureVersionDeepAnalysis` sees the updated `comparisonResult` (required for the deep analysis API call).

---

## Initial Analysis Modal — Scroll-to-Results Fix (2026-05-09)

**File:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

### Root cause
The "Generate New Analysis?" dialog (shown automatically after generation when no comparison exists) called `compareOutputsWithGrok(false)` which correctly wrote the result to `formState.copyResult.comparisonResult`. The `useEffect` at line ~974 synced it to local `comparisonResult` state, which `ResultsPanel` received as a prop and rendered `ComprehensiveComparisonTable`. However, the `#comprehensive-analysis` element rendered far below the fold with no scroll — so users saw nothing change.

The equivalent re-score path (`performScoreAndNavigate`) already had a `setTimeout(() => scrollIntoView(...), 500)` after scoring. The initial modal path was missing it.

### Fix
Added a `setTimeout` scroll identical to `performScoreAndNavigate` in the `showInitialAnalysisModal` onConfirm handler:
```typescript
onConfirm={async () => {
  setShowInitialAnalysisModal(false);
  await compareOutputsWithGrok(false);
  setTimeout(() => {
    const el = document.getElementById('comprehensive-analysis');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 500);
}}
```
The 500ms delay gives React time to render `ComprehensiveComparisonTable` before the scroll fires.

---

## Scoring Context Friction Removal (2026-05-09)

### CopyMakerSidebar — SCORING group simplified
- Removed `ScoringContextDropdown` from the SCORING section
- Removed `scoringContext` state, `loadFromStorage`, `buildContextFromKey`, `DEFAULT_USE_CASE_KEY` imports/usage
- Removed `handleContextChange` helper
- `handleScoreAllMissing` now calls `onCompareWithGrok(false)` directly — section context flows from `formState.section` automatically
- "Score all (x)" button's `disabled` condition simplified to `rescoringCardIds.size > 0` only

### Files deleted
- `src/components/ui/ScoringContextDropdown.tsx` — no remaining importers after sidebar cleanup

### Files kept
- `src/utils/scoringContextStorage.ts` — still used by `ScoringContextModal.tsx`
- `src/components/copy-maker/CopyMakerTab/modals/ScoringContextModal.tsx` — untouched; still used by "Analyze – Compare & Score Copy" and "Change context" flows in ResultsPanel

---

## Section Field Wired Into Scoring Pipeline (2026-05-09)

`formState.section` is now automatically passed to every analysis and scoring call.

### Comparison scoring (`comparativeScoring.ts`)
- `compareVersionsRelatively()` gained an optional `section?: string` parameter
- When present, `Section: {value}` is appended to the `CONTEXT:` block in the LLM prompt alongside Audience/Tone and Content Type

### Call chain threading
- `generateUnifiedComparison()` (`unifiedComparison.ts`) accepts and forwards `section`
- `compareOutputsWithGrok()` (`useGeneration.ts`) reads `latestFormState.section` and passes it
- `performScoreAndNavigate()` (`CopyMakerTab.tsx`) also passes `formState.section` to its direct call to `generateUnifiedComparison()`

### Deep analysis (`versionDeepAnalysis.ts`)
- `analyzeVersionDeep()` already received `formState`; its user prompt now includes `Section: {value}` when the field is set — placed alongside Language, Tone, and Target Audience

### RegenerateAnalysisModal simplification
- Removed the `ScoringContextDropdown` from the "Generate New Analysis?" dialog
- The confirm button calls `onConfirm()` with no arguments; section context flows automatically from `formState.section`
- No state management or localStorage read/write needed in the modal

### What was NOT changed
- `ScoringContextModal` (used by "Analyze – Compare & Score Copy" and "Change context") is untouched
- Sidebar SCORING group dropdown is untouched
- All existing `scoringContext` flows still work — section is additive context, not a replacement

---

## Section Field Combobox (2026-05-09)

**Component:** `src/components/CopyForm.tsx`
**Type definition:** `src/types/index.ts` — `SectionType` widened to `string`

The "Section" field in the Copy Maker form is now a hybrid combobox: a free-text input with an attached dropdown of 16 predefined options. Users can either pick from the list or type any custom value freely.

### Predefined Options
Hero Section, Landing Page, Homepage, Benefits, Features, Services, About, Testimonials, FAQ, Full Copy, Blog Post, Email, Ad / Paid Social, Product Page, Case Study, Other

### Behavior
- Clicking into the input or the chevron arrow opens the dropdown list
- Typing filters the list to matching options in real time
- Clicking a list item sets the value and closes the dropdown
- Typing a custom value that doesn't match any option is accepted as-is
- `onMouseDown` on list items prevents blur before the value is committed
- Click-outside detection closes the dropdown without losing typed custom values
- The chevron rotates 180° when the dropdown is open

### Unchanged
- `handleChange('section', value)` is still the setter — no new state paths introduced
- Auto-fill from template/prefill/session loading continues to work
- Section-specific generation guidance in `copyGeneration.ts`, `alternativeCopy.ts`, and `enhancedPipeline.ts` is unaffected — known options apply specific prompts; custom values pass as plain context

---

## Copy Maker Unified Right Sidebar (2026-05-07)

**Component:** `src/components/copy-maker/CopyMakerSidebar.tsx`  
**Wired in:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

A new fixed right-side panel rendered alongside the Copy Maker form. It is purely additive — all existing floating bars (`LeftFloatingActionBar`, `FloatingActionBar`) and per-card buttons inside `GeneratedCopyCard` remain untouched and fully functional.

### Layout

The main Copy Maker content area is now wrapped in a `flex` row. The existing content column gets `flex-1 min-w-0` to shrink as needed; the sidebar gets `flex-shrink-0 w-48` and scrolls independently.

On mobile the sidebar collapses to a `PanelRight` toggle icon button. Clicking it expands it back.

### Section 1 — Session

Renders only when `hasAnyPopulatedFields(formState)` is true. Contains:

- **Evaluate Inputs** — shown when `onEvaluateInputs` prop is truthy; disabled when `isEvaluating === true`; icon pulses during evaluation.
- **Save Session** — shown when `onSaveSession` prop is truthy.
- **Save as Template** — shown when `onSaveTemplate` prop is truthy.

All handlers are the same functions passed to `LeftFloatingActionBar` in `CopyMakerTab`.

### Section 2 — Output

Always rendered. Contains:

- **Save Output** — when `(generatedOutputCards.length > 0) || !!originalInputScore`
- **Copy as Markdown** — same condition
- **Export HTML** — same condition
- **LLM Eval Export** — when `hasContent && isAdmin`
- **LLM Audit Export** — when `hasContent && !!comparisonResult && isAdmin`
- **View Prompts** — when `isAdmin`

`isAdmin` is derived via `useIsAdmin(currentUser)` inside the sidebar. All export handlers mirror the logic in `FloatingActionBar`.

### Section 3 — Generated Copies

Renders only when `sortedGeneratedVersions.length > 0`. Uses the same sort logic as `ResultsPanel` (regular outputs first, cards with `comparedContent` last). Uses `card.id` (UUID) as React key. Uses `card.sourceDisplayName` as the group label.

Each card is a collapsible group (default open). Inside each group are three independently collapsible sub-sections:

**a) Create** (hidden for `Original` and analysis/comparison cards):
- New Version — when `card.type !== SeoMetadata && card.type !== Original`
- Improve — always
- Change Voice — when `!contentDetails.isHeadlines`
- Enhance — when `card.type !== SeoMetadata && card.type !== Original && card.type !== FaqSchema && !card.comparedContent && !!onBoost`; disabled when `formState.isLoading || boostLimitReached || scoreAtMax`

**b) Analyze**:
- All Analyses — when `missingCount >= 2`
- SEO — when `!cardSeoMetadata && (isBlendedOutput || !formState.generateSeoMetadata || card.analysisMode !== 'batch')`
- Content — when `!cardScore && (isBlendedOutput || !formState.generateScores || card.analysisMode !== 'batch')`
- GEO — when `!cardGeoScore && (isBlendedOutput || !formState.generateGeoScore || card.analysisMode !== 'batch')`

**c) Copy / Export**:
- Copy — always; uses same copy logic as `GeneratedCopyCard.handleCopy`
- Copy HTML — always; uses `formatSingleGeneratedItemContentAsHTML`
- Copy MD — always; uses `formatSingleGeneratedItemAsMarkdown`
- Save as Brand Voice — when `!!onSaveAsBrandVoice`

### Props

`CopyMakerSidebarProps` aggregates all props previously split across `LeftFloatingActionBar`, `FloatingActionBar`, and the per-card `GeneratedCopyCard` wiring in `ResultsPanel`. Key additions: `sortedGeneratedVersions: GeneratedContentItem[]`, `hasPopulatedFields: boolean`, and all per-card action callbacks.

---

## Videos Page (2026-04-29)

**Route:** `/videos`  
**Component:** `src/components/VideosPage.tsx`

A public-facing tutorial video library page accessible to both logged-in and logged-out users.

### Purpose
Provides a centralized, browsable library of short tutorial videos explaining how to use CopyZap features. Videos are manually curated via a typed `videos` array in the component — no CMS or database required.

### Page structure
- **Header section:** Page title ("Videos") and descriptive subtitle matching the CopyZap design language.
- **Video list:** Full-width flex column of `VideoCard` components, one per entry.
- **Modal:** `VideoModal` opens when a card is clicked, renders the embed, and closes on Escape, backdrop click, or the close button.

### VideoCard layout
Each card uses a two-column grid on desktop (description left, preview right) and stacks vertically on mobile (preview on top, description below). The preview tile shows a play button; if no embed is configured it shows a "Coming soon" placeholder.

### Data structure
Videos are defined at the top of `VideosPage.tsx` as a typed `VideoEntry[]` array:
```ts
interface VideoEntry {
  id: string;
  title: string;
  description: string;
  embedCode: string; // paste iframe/embed HTML here
}
```
Set `embedCode` to `''` or `'PASTE_EMBED_CODE_HERE'` for placeholder state. Placeholder cards remain visible in the layout with a "Video embed coming soon" message.

### Embed handling
- `dangerouslySetInnerHTML` is isolated to a single clearly-commented `VideoEmbed` component.
- Embed code is only rendered inside the modal — never inline on the card.
- The modal applies `aspect-video` sizing so any standard 16:9 iframe fills correctly.

### Modal behavior
- Opens on card click.
- Closes on Escape key, backdrop click, or the X button.
- Prevents background scroll while open (`overflow: hidden` on body).
- Responsive and centered, max width `max-w-3xl`.

### Navigation
- Added to **TopNavigation** (public homepage nav) — desktop and mobile menus.
- Added to **MainMenu** (authenticated app header) — desktop and mobile menus, using the `Video` icon from lucide-react.

### Breadcrumb (2026-05-01)
A breadcrumb trail is rendered in the page header above the title, using `Home > Videos` format.
- **Component imports:** `Link` from `react-router-dom`; `Home` and `ChevronRight` from `lucide-react`.
- **Home link:** renders the `Home` icon (14 px) alongside the text "Home", linked to `/`.
- **Separator:** `ChevronRight` (14 px) in muted gray.
- **Current page:** "Videos" displayed in `font-medium text-gray-900 dark:text-white` — not a link.
- Hover color on the Home link matches the orange brand accent (`hover:text-orange-500 dark:hover:text-orange-400`).

### Seeded video entries (placeholder state)
1. Generate Copy Variations from an Existing Website
2. How to Use the Quick Setup Wizard
3. Scoring & Comparing Copy Versions
4. Setting Up Your Brand Voice

---

## Supademo Guide Page — "Improve Copy with AI Analysis" (2026-04-29)

**File:** `SUPADEMO/improve-copy-with-ai-analysis.html`

A standalone HTML demo/guide page created in the new `SUPADEMO/` folder at the project root. The page requires no build step, no framework, and no dependencies — it is a single self-contained file.

**Purpose:** Acts as an external-facing walkthrough that explains the AI Copy Analysis workflow to prospects or new users before they log in.

**Page sections:**
1. **Hero** — Full-width dark header with animated orange accent gradient, live "dot" badge, and a scroll-to anchor CTA.
2. **How It Works (3 steps)** — Step cards (Paste Copy → AI Scores → Apply Improvements) with hover lift effects.
3. **Live Interface Demo** — Two-column layout: feature checklist on the left, a dark mock-UI panel on the right showing a sample copy block, score chips, and a top suggestion callout.
4. **6 Scoring Dimensions** — Tile grid covering Clarity, Persuasion, Emotional Appeal, Specificity, CTA Strength, and Brand Tone with icon badges.
5. **Before / After Example** — Side-by-side comparison card showing a weak original and the AI-improved version.
6. **CTA Band** — Dark gradient band with direct link to the CopyZap app.
7. **Footer** — Minimal footer with link back to the homepage.

**Design details:**
- Orange/red gradient brand palette consistent with the main app.
- Scroll-triggered fade-in animations via IntersectionObserver (no external libraries).
- Thin orange/red progress bar fixed at the top of the viewport on scroll.
- Fully responsive — single-column below 640 px.
- No Tailwind, no React — pure CSS custom properties and vanilla JS.

---

## AI Model Normalization — DeepSeek Legacy Session Fix (2026-04-27)

**Problem:** Sessions and saved outputs created while DeepSeek was a selectable model stored `model: 'deepseek-chat'` in the database. When those sessions were loaded, `formState.model` was restored as `deepseek-chat` even when the user had Claude selected as their AI engine. Because `handleAiEngineChange` in `CopyForm.tsx` only updates the model on manual user interaction, loading a session bypassed normalization entirely. All pipeline functions (Enhanced Pipeline, Expand Inputs, Deep Analysis, etc.) passed the raw `formState.model` to `makeApiRequestWithFallback` without any validation, causing every generation call to request `deepseek-chat` from the edge function — regardless of the user's current engine selection.

**Root cause confirmed:** `voiceStyles.ts` had its own local normalization (`deepseek-chat → claude-sonnet-4-5`) which is why "Apply Voice Style" correctly used Claude. All other pipeline functions lacked this protection.

**Fix applied (two layers):**

1. **`src/services/api/utils.ts` — `makeApiRequestWithFallback`**: Added normalization at the top of the function. Any call arriving with `deepseek-chat` as the requested model is silently remapped to `claude-sonnet-4-5` before the edge function is contacted. This acts as a universal safety net for all current and future API calls.

2. **`src/hooks/useFormState.ts` — `loadFormStateFromSession` and `loadFormStateFromSavedOutput`**: Added normalization immediately after `applyOptimizationRestorePolicy`. When session or saved output data is spread into `newState`, the `model` field is checked and remapped from `deepseek-chat` to `claude-sonnet-4-5` before the state is committed. This ensures `formState.model` is correct from the moment the session loads, not just at generation time.

**Files changed:**
- `src/services/api/utils.ts` — model normalization in `makeApiRequestWithFallback`
- `src/hooks/useFormState.ts` — model normalization in `loadFormStateFromSession` and `loadFormStateFromSavedOutput`

---

## Overall Verdict Model Fix — Comparative Scoring Respects User Engine Selection (2026-04-27)

**Problem:** "Overall Verdict" (the comparative scoring step that ranks all versions and picks a winner) always used `gpt-4o` regardless of which AI engine the user selected. This was caused by two hardcoded `SCORING_MODEL` constants:

- `comparativeScoring.ts:79` — `const actualModel = SCORING_MODEL;` — hardcoded, no parameter accepted
- `versionDeepAnalysis.ts:271` — `const actualModel = SCORING_MODEL;` — the `model` parameter was accepted but immediately discarded with a comment "force single model for deterministic evaluation"

The model was already being passed correctly from `useGeneration.ts` (`latestFormState.model`) and `CopyMakerTab.tsx` (`formState.selectedModel`) into `generateUnifiedComparison`, but `generateUnifiedComparison` did NOT forward it to `compareVersionsRelatively`, so it was silently dropped.

**Fix applied:**

1. **`src/services/api/comparativeScoring.ts`** — Added optional `model?: Model` parameter to `compareVersionsRelatively`. Uses the passed model when provided; falls back to `SCORING_MODEL` only if no model is given. Normalizes `deepseek-chat` to `SCORING_MODEL` (gpt-4o) since DeepSeek is no longer a primary model.

2. **`src/services/api/versionDeepAnalysis.ts` — `generateOverallVerdict`** — Removed the hardcoded `SCORING_MODEL` override. Now uses the `model` parameter that was already being passed in. Normalizes `deepseek-chat` to `claude-sonnet-4-5`.

3. **`src/services/api/unifiedComparison.ts`** — `generateUnifiedComparison` now forwards its `userSelectedModel` parameter into `compareVersionsRelatively` as the new `model` argument, completing the chain.

**Result:** When the user selects Claude as their AI engine, "Overall Verdict" now uses `claude-sonnet-4-5` instead of always defaulting to `gpt-4o`.

---

## Help Center Structural Cleanup — Phase 1-6 Reorganization

**Files deleted:**
- `src/components/help/pages/SmartVsExpertMode.tsx` (outdated — mode system no longer exists)
- `src/components/help/pages/BestPractices.tsx` (outdated — wrong mode names, stale 2025-12-20)
- `src/components/help/pages/workflows/ImproveExistingCopyFromWebsite.tsx` (duplicate of ImproveFromURL tutorial)

**Files merged/rewritten (content preserved, not rewritten):**
- `src/components/help/pages/GettingStarted.tsx` — merged StartHub.tsx + QuickPromptWizard.tsx into one page at `/help/getting-started`
- `src/components/help/pages/CoreWorkflows.tsx` — merged Workflows.tsx + CreateFirstOutput tutorial + ImproveFromURL tutorial + CompareAndSelect tutorial inline
- `src/components/help/pages/HowScoringWorks.tsx` (new file) — merged OutputFeatures.tsx + CompareBlend.tsx + FeatureInteractions.tsx at `/help/how-scoring-works`
- `src/components/help/pages/SetupAndInputs.tsx` (new file) — merged ProjectSetup.tsx + BrandVoiceSystem.tsx + TemplatesAndReuse.tsx at `/help/setup-and-inputs`
- `src/components/help/pages/WorkflowBuilder.tsx` — updated broken internal link (`/help/workflows` → `/help/core-workflows`, `/help/brand-voice` → `/help/setup-and-inputs`)

**Routing updated (App.tsx):**
- Removed lazy imports for 13 deleted/merged pages
- Added lazy imports: `HowScoringWorks`, `SetupAndInputs`
- Added new routes: `/help/how-scoring-works`, `/help/setup-and-inputs`
- Added `<Navigate replace>` redirects for all old routes → merged destinations
- All old URLs remain valid and redirect automatically (no broken links)

**Navigation updated:**
- `public/docs/help-index.json` — rebuilt from 27 entries to 16 clean entries with new groups (getting-started, core, advanced, account, tutorials, reference, support)
- `src/components/help/HelpSidebar.tsx` — added `account` group, fixed URL resolution (removed legacy `/docs/` → `/help/` transformation), sidebar now reads `topic.url` directly
- `src/components/help/HelpCenter.tsx` — updated all category article links and featuredTutorials links to point to new merged page routes

**New URL structure:**
- `/help/getting-started` — CopyZap intro + Start Hub + Quick Wizard
- `/help/core-workflows` — 5 core workflows + inline step-by-step tutorials
- `/help/how-scoring-works` — Output cards + scoring + compare/blend + feature interactions
- `/help/setup-and-inputs` — Project setup + Brand Voice System (5 methods) + Templates

---

## Monetization Trigger Layer v4 — Soft Upgrade Prompt After Analysis

**Files added/changed:**
- `src/components/copy-maker/guidance/UpgradeHint.tsx` (new)
- `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx` (updated — UpgradeHint wired in)

**Summary:**
After the user completes AI comparison and scoring, a compact, non-blocking upgrade awareness banner appears below the results. The goal is to bridge the gap between perceived product value (just experienced) and upgrade intent — without any friction, interruption, or pricing pressure.

**Trigger condition:**
- `hasAiComparison === true` (i.e., `comparisonResult` is present and truthy)
- Unmounts automatically if comparison result is cleared
- Shows once, inline, no re-triggers

**Component: UpgradeHint.tsx**
- Renders a compact `div` with soft orange tint (`#fff7ed`) and `1px solid #fed7aa` border
- Left accent: `3px solid #f97316` — same accent family as DynamicGuidance
- Icon: `<Zap>` at 15px, orange (#f97316)
- Headline: "Want more high-performing variations?" — 13px, semibold, dark orange (#9a3412)
- Subtext: context-aware copy based on `versionCount`
  - If `versionCount >= 2`: "You've generated N versions — most users test 3–5 before choosing a winner."
  - Otherwise: "Generate more versions, test angles, and improve results faster."
- Hint text: "More generations available" — 13px, weight 500, orange (#f97316), `cursor: default`, no underline, no click handler
- No button, no modal, no popup, no pricing shown, no redirect
- `marginTop: 16px`, `padding: 12px 14px`, `borderRadius: 8px`
- **v4.1 fix:** CTA replaced with passive hint text to remove false affordance. `onUpgradeClick` prop removed entirely.

**Placement in ResultsPanel:**
- Inserted directly after the `ComprehensiveComparisonTable` wrapper div closes
- Before the "Blend Best Versions" button
- Guarded by `{hasAiComparison && <UpgradeHint versionCount={generatedVersions.length} />}`

**Behavior contract:**
- Does NOT show before analysis runs
- Does NOT block any action
- Does NOT repeat or animate
- Awareness only — no conversion pressure

---

## DynamicGuidance Visibility Improvement

**File changed:** `src/components/copy-maker/guidance/DynamicGuidance.tsx`

**Summary:**
The guidance hint is now wrapped in a light background strip so it reads as a structured hint rather than plain floating text, while remaining visually secondary to buttons and inputs.

**Changes:**
- Outer `<p>` replaced with `<div>` container
- `background: #f9fafb`, `border: 1px solid #f3f4f6`, `border-radius: 8px`, `padding: 8px 12px`
- `marginBottom` increased from 8px to 10px for breathing room
- "Next:" prefix label added in `#9ca3af` (muted gray), 6px right margin
- Font size, color, and line-height unchanged from previous values
- No shadows, no animations, no bold text added

---

## Conversion Boost Layer v3 — Action Highlighting

**Files changed:**
- `src/index.css` — new `@keyframes pulseHighlight` + `.highlight-action` utility class
- `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx` — Analyze button updated

**Summary:**
When a user has 2 or more generated outputs, the "Analyze – Compare & Score Copy" button enters a pulsing orange highlight state to create visual gravity and reduce hesitation before the compare step. No popups, no modals, no layout changes — purely a shadow animation layered onto the existing button.

**CSS (`index.css`):**
New `@keyframes pulseHighlight` and `.highlight-action` class added inside `@layer utilities`. Orange glow (`rgba(249, 115, 22, ...)`) expands from 0 to 8px spread and fades out over a 2s loop. Shadow only — no fill change preserves the existing button appearance in both light and dark mode.

**Button logic (`ResultsPanel.tsx`):**
- `isReadyToCompare = generatedVersions.length >= 2`
- When true: `highlight-action` class applied; button label becomes `"Analyze – Compare & Score Copy (Recommended)"`
- When false: original label, no animation, no class
- Deactivates automatically when `hasAiComparison` is true (button unmounts after analysis runs)
- Zero new state variables — logic is purely derived from `generatedVersions.length`

**Behavior contract:**
- Activate: `generatedVersions.length >= 2` AND `!hasAiComparison`
- Deactivate: analysis runs (button unmounts) OR comparison result already exists

---

## Dynamic Guidance System v2 — State-Driven Next-Step Hints

**Files added/changed:**
- `src/components/copy-maker/guidance/DynamicGuidance.tsx` (new)
- `src/components/copy-maker/guidance/GuidanceBar.tsx` (new — from v1 refactor)
- `src/components/copy-maker/CopyMakerTab/sections/EmptyState.tsx` (updated — 3-card section removed)
- `src/components/CopyForm.tsx` (updated — GuidanceBar + DynamicGuidance wired in)
- `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` (updated — `id="results-section"` added)

**Summary:**
Two complementary guidance components placed above the "Make Copy" button that update automatically based on the user's current generation progress. Replaces static instructional UI with reactive decision architecture.

**1. GuidanceBar (`GuidanceBar.tsx`)**
A horizontal pill-button bar with three mode options: Generate / Improve / Compare.
- Clicking **Generate** sets `formState.tab = 'create'`
- Clicking **Improve** sets `formState.tab = 'improve'`
- Clicking **Compare** smooth-scrolls to `#results-section`
- Active pill: dark fill (`#111827` bg, white text). Default: transparent with `#e5e7eb` border.
- Label "Start here:" precedes the pills.

**2. DynamicGuidance (`DynamicGuidance.tsx`)**
A single plain-text line that updates based on `outputCount` and current `mode`:

| Condition | Message |
|---|---|
| `outputCount === 0` | "Generate your first version to get started" |
| `outputCount === 1` | "**Create another version** to compare results" — "Create another version" is a clickable button that calls `onGenerate()` |
| `outputCount >= 2` | "Compare versions and pick the strongest one" |
| `mode === 'compare' && outputCount >= 2` | "Run analysis to see which version performs best" |

- No background, no border, no icons — purely text at 13px / `#6b7280`.
- The clickable part ("Create another version") is a `<button>` styled inline with underline decoration.
- `onGenerateAnother` prop is only passed when `outputCount === 1`, preventing double-trigger on other states.

**Behavior loop created:**
Generate → see hint "Create another version" → click → second output → hint updates to "Compare versions" → user compares → decides.

**Integration in `CopyForm.tsx`:**
Both components are wrapped in a single IIFE block that computes `outputCount` from `formState.copyResult?.generatedVersions?.length` and gates on `!isPrefillEditingMode`. No new state variables added.

---

## In-App Guidance Layer v1

**Files added/changed:**
- `src/components/copy-maker/guidance/GuidanceHint.tsx` (new)
- `src/components/copy-maker/guidance/NextStepSuggestion.tsx` (new)
- `src/components/copy-maker/CopyMakerTab/sections/EmptyState.tsx` (updated)
- `src/components/copy-maker/CopyMakerTab/sections/AiPromptSection.tsx` (updated)
- `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx` (updated)
- `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` (updated)
- `src/components/CopyForm.tsx` (updated)

**Summary:**
A lightweight, non-intrusive guidance layer designed to help users reach value faster across the 3 core flows: generate new copy, improve existing copy, and compare & pick a winner. No tours, no popups, no coachmarks.

**1. Context-Aware Empty State (`EmptyState.tsx`)**
The empty state (shown when no outputs exist) now adapts based on `tab` and `hasOriginalCopy` props:
- **Create mode:** Headline "Start by generating your first output." with a 3-card layout showing the three main workflows (Generate / Improve / Compare).
- **Improve mode, no copy pasted:** Headline "Paste copy above to get started." with contextual explanation.
- **Improve mode, copy pasted:** Headline "Ready to improve your copy." with next-action instruction.

**2. Inline Hints**
- **Quick Prompt Wizard (`AiPromptSection.tsx`):** A single-line hint "Fastest way to get your first result." appears below the wizard button using the `Lightbulb` icon pattern.
- **Original Copy field (`CopyForm.tsx`):** When the field is empty, a hint "You can also paste a URL — we'll pull the page copy in automatically." appears below the textarea. Disappears once copy is pasted.

**3. Next-Step Suggestions (`ResultsPanel.tsx`)**
After generation, a dismissible `NextStepSuggestion` strip appears at the bottom of the results panel. State-driven logic:
- 1 output, no comparison → "Generate another version to compare side by side."
- 2+ outputs, no comparison → "Compare versions and pick the strongest one." with a direct "Run Analysis" action button.
- Comparison complete → "Export the winner or try a different voice style."
The strip auto-resets when a new generation runs (tracked via `generatedVersions.length` effect). Dismissible with an X button.

**4. Shared Components**
- `GuidanceHint`: Reusable `<p>` with a lightbulb icon and muted gray text. For inline contextual hints.
- `NextStepSuggestion`: Dismissible compact inline banner with a 3px gray left accent, `background: #f3f4f6`, `border: 1px solid #d1d5db`, `border-radius: 8px`, `max-width: fit-content`. "NEXT:" label is weight 600, dark gray (#374151). Message text is 13px, #4b5563. Aligns left, does not stretch full-width. Matches DynamicGuidance and UpgradeHint design language. *(v4.1 restyled from full-width Tailwind strip)*

**Logic / targeting:**
All guidance is driven by real app state (`formState.tab`, `formState.originalCopy`, `generatedVersions.length`, `hasAiComparison`, `canCompare`). No hardcoded show/hide timers. No modals. No overlays.

---

## Guidance Layer v6 — Inline Decision Moment Block (Before First Card)

**File changed:** `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx`

**Summary:**
Replaced the previous top-bar approach with an inline content block rendered as the first item inside the output cards loop (index 0). The block sits directly above the first output card, inside the same `space-y-8` container, matching card width. No new component, no new state — reads existing `nextStep` memo and `nextStepDismissed` state.

**Exact insertion point:**
Inside `sortedGeneratedVersions.map(...)`, at `index === 0`, wrapping each card in `React.Fragment`. The guidance div renders before `<GeneratedCopyCard />` only for the first card.

**Content (overrides `nextStep.message` with natural language):**
- 1 regular output → "Create another version to compare results."
- 2+ outputs, no analysis → "Before choosing, compare your versions to see which performs best."
- analysis present → "You can now export the winner or refine further."

**CTA button:** rendered only when `nextStep.actionLabel` and `nextStep.onAction` exist (i.e. "Run Analysis" on 2+ versions). Inline ghost style, not full-width.

**Style:** `rounded-xl border border-gray-200 bg-gray-50 px-5 py-4` — no orange, no left border accent, no uppercase labels, matches card radius. Dark mode aware.

**Bottom guidance:** unchanged at `mt-6` below all outputs (fallback for users who scroll past).

**Removed:** previous v5 top-bar render (between the collapsible toggle and the cards loop) — superseded by this inline approach.

---

## Guidance Layer v5 — Top-of-Results Next Step (Dual Position)

**File changed:** `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx`

**Summary:**
Added a second render of the existing `NextStepSuggestion` component directly above the output cards (before the first card, after the collapsible header). No new state, no new logic, no new component. The existing `nextStep` memo and `nextStepDismissed` state are reused.

**Placement:**
- TOP: rendered inside the collapsible section, after the `topPerformerRow`/`comparisonInsight` metadata block, immediately before the output cards loop — only when `showOutputs` is true
- BOTTOM: existing render at `mt-6` below all outputs — unchanged

**Conditions (inherited from existing `nextStep` memo):**
- 1 output → "Generate another version to compare side by side."
- 2+ outputs, no analysis → "Compare versions and pick the strongest one." (with Run Analysis action button)
- analysis present → "Export the winner or try a different voice style."
- 0 outputs → neither renders (null)

**Dismissal behavior:**
- Top bar shares `nextStepDismissed` state — dismissing via the bottom bar also hides the top (consistent)
- Top bar has no dismiss button (avoids redundancy above the fold)

**Spacing:** `margin-bottom: 14px` below top bar — keeps it visually attached to the output stack

---

## Guidance Layer v4 — Visual Hierarchy Refinement (NEXT bar + Orange Banner)

**Files changed:**
- `src/components/copy-maker/guidance/DynamicGuidance.tsx`
- `src/components/copy-maker/guidance/NextStepSuggestion.tsx`

**Summary:**
Refined the visual hierarchy between the two guidance components so they form a coherent system. No logic, layout, spacing, or behavior was changed — only styling.

**Hierarchy established:**
- Orange banner (`UpgradeHint`) = expansion / monetization signal — dominant, warm, high-contrast — **unchanged**
- NEXT bar (`DynamicGuidance`, `NextStepSuggestion`) = guided action — now feels intentional and active, not passive

**Before (NEXT bar):**
- `background: #f3f4f6` (very light, nearly white)
- `border: 1px solid #d1d5db` (soft, low contrast)
- `borderLeft: 3px solid #f97316` (full orange — visually competing with the orange banner)
- `color: #6b7280` (muted/gray body text — felt faded/disabled)
- `"Next:"` label: `fontWeight: 500` — not visually distinct enough
- No hover state

**After (NEXT bar):**
- `background: #f0f2f5` → slightly more substance (cool-gray tint)
- `border: 1px solid #c5cad4` → higher contrast outer border (10% darker)
- `borderLeft: 3px solid rgba(249,115,22,0.45)` → low-opacity orange accent (Option B) — visually connects to system without competing
- `color: #374151` → all body text darker and fully readable
- `"NEXT:"` label: `fontWeight: 700`, uppercase, `#1f2937` — clearly distinct signifier
- Hover: `background #e8eaee` + `boxShadow 0 1px 4px rgba(0,0,0,0.07)` — soft lift on hover
- Clickable state: `cursor: pointer` when action is available; `cursor: default` otherwise
- `ArrowRight` icon added on clickable "Create another version" variant in DynamicGuidance

**Orange usage — no new overuse introduced:**
- `UpgradeHint.tsx` unchanged — full orange (`#f97316`) border + warm background remains exclusive to the promotion tier
- NEXT bar uses 45% opacity orange for left accent only — clearly subordinate

---

## Guidance Layer v3 — Mode Selection Pills Removed

**Files changed:**
- `src/components/CopyForm.tsx` (import removed, GuidanceBar JSX removed)
- `src/components/copy-maker/guidance/GuidanceBar.tsx` (file retained but no longer imported or rendered anywhere)

**Summary:**
The entire mode-selection pill row (Generate / Improve pills + "Start here:" label) has been removed from the form. Users land directly in the form. `DynamicGuidance` is now the sole guidance system.

**Before:** Pills row above the form → Generate / Improve selectors + DynamicGuidance hint below
**After:** Form only, with DynamicGuidance hint below FeatureToggles

**Changes in CopyForm.tsx:**
- `import GuidanceBar` line removed
- `GuidanceBar` JSX block removed (including `onSelect` handler and `hasOutputs` logic)
- Fragment wrapper around GuidanceBar + DynamicGuidance collapsed to just `DynamicGuidance`
- Comment updated from "Guidance Bar + Dynamic Hint" to "Dynamic Hint"
- No form logic, tab state, or generation flow affected

**Improve flow — confirmed intact:**
- `formState.tab` continues to be set to `'improve'` automatically when `originalCopy` is populated
- No code that drives the Improve tab was inside GuidanceBar; GuidanceBar only called `setFormState` on pill click
- Removing the pills does not alter any auto-detection or form behavior

**DynamicGuidance — sole guidance system:**
- 0 outputs → "Generate your first version to get started"
- 1 output → "Create another version to compare results" (inline action)
- 2+ outputs → "Compare versions and pick the strongest one"

---

## Homepage — Full Redesign (Production-Ready)

**File:** `src/components/HomePage.tsx`

**Summary:**
Complete replacement of the previous HomePage with a structured persuasion-system homepage following the "Copy Intelligence Platform" positioning. Built as a single self-contained file with all section components defined inline. Self-contained Nav and Footer replace previous external `TopNavigation` and `FooterSection` usage on the homepage route.

**Architecture:**
- Single file, fully self-contained — no external page section components used
- `BetaRegistrationModal` wired to all CTAs via shared `betaModalOpen` state
- Responsive across mobile / tablet / desktop with Tailwind breakpoints
- All sections animate in on scroll via framer-motion `whileInView`

**Sections (in order):**

1. **Hero** — Two-column layout: headline + bullets + dual CTA (left), mock scoring UI visual (right). Visual shows 3 scored versions with a declared winner, sub-dimension scores, and "Why it wins" explanation. No prompt UI. No chat interface.

2. **Problem Reframe** — Centered prose section establishing that generation is solved, evaluation is the unsolved problem. Closes with callout block: "You are not missing skill. The system is missing a layer."

3. **Why Other Tools Fail** — Three-point structure (What they do well / What they miss / Why it matters) + pull-quote + soft CTA.

4. **How It Works** — Three-step card grid (Generate → Variations → Evaluate). Step connectors visible on desktop.

5. **Scoring Explanation** — 6-card grid: Clarity, Persuasion, Trust, Conversion Likelihood (always active) + SEO performance + GEO optimization (both marked as conditional / goal-activated with dashed border).

6. **Use Cases** — 5 cards: Founder, In-house marketer, Agency copywriter, Performance marketer, Freelancer. Each card: situation / problem / outcome / one-line summary.

7. **Benefits** — Before → After transformation rows. 6 comparisons using strikethrough left / strong right layout. Headline: "Not better copy. Better decisions."

8. **Comparison Table** — Dark header row, alternating zebra rows. 8 rows: Core function / Evaluation / Version comparison / Decision support / User responsibility / Confidence at publish / Explainability / Workflow outcome. Columns: Typical AI writing tools vs CopyZap.

9. **Final CTA** — Dark section. Headline: "Stop guessing. Start knowing." Primary CTA: "Try CopyZap" (orange). Secondary: login link.

10. **Footer** — Dark, minimal. Logo + nav links + SocialShare + Sharpen.Studio credit.

**Design system:**
- Color: gray-900 (dark sections), gray-50 (alt sections), white (primary), orange-500 (accent / CTA)
- No purple, no gradients on primary surfaces
- 8px spacing system via Tailwind gap/padding scale
- Typography: font-bold headings, font-semibold labels, text-gray-600 body
- Sections alternate white / gray-50 with border-y separators for rhythm

---

## Help Center — Complete Redesign (2026-04-17)

**Files changed:**
- `src/components/help/HelpCenter.tsx` (full rewrite)
- `src/components/help/pages/tutorials/CreateFirstOutput.tsx` (new)
- `src/components/help/pages/tutorials/ImproveFromURL.tsx` (new)
- `src/components/help/pages/tutorials/CompareAndSelect.tsx` (new)
- `docs/help-index.json` (3 new tutorial entries added)
- `src/App.tsx` (3 new lazy imports + routes)

**What was changed:**

### HelpCenter Homepage (`/help`)
Previous design was a flat grid of topic cards loaded from `help-index.json`. Replaced with a structured 3-section layout:
1. **Hero** — page title, one-line description, search bar (max-w-xl, left-aligned)
2. **Start Here** — three featured tutorial cards in a 3-column grid. Each card has a monospace number, title, one-line description, estimated read time, and a `ChevronRight` icon. Cards link to the 3 core tutorials.
3. **Browse by Topic** — 6 category cards in a 2-column grid. Each category has a colored icon badge, title, description, and a list of 4–5 article links with `ArrowRight` icons and optional "Tutorial" badges. Categories: Getting Started, Creating Copy, Improving Copy, Comparing & Scoring, Advanced Features, Troubleshooting.
4. **Footer CTA** — "Still need help?" row with Contact Support button.

No longer loads from `help-index.json` dynamically — category structure is defined inline as static TypeScript arrays. Cleaner, no loading state, fully type-safe.

### Tutorial Pages (all follow the same visual structure)
All 3 new tutorial pages follow a consistent 7-section pattern:
1. **Outcome** — blue callout box, single clear statement of what user achieves
2. **When to use** — checklist of 4 use cases with green `CheckCircle` icons
3. **Context callout** (optional per tutorial) — gray box with supporting info (score definitions, what gets extracted, etc.)
4. **Step-by-step** — numbered steps with title, description, image placeholder (dashed border with `Image` icon and alt text), and optional amber note/warning
5. **What you get** — green callout with outcome bullets
6. **Common mistakes** — red `✗` list of 4 items
7. **Related / Up next** — 2-column grid of 4 link cards

### Tutorial 1: Create First Output (`/help/tutorials/create-first-output`)
7 steps covering: open Copy Maker → Quick Setup Wizard → describe business/audience → choose tone → set goal and word count → review and generate → read output.

### Tutorial 2: Improve Copy from URL (`/help/tutorials/improve-from-url`)
7 steps covering: open Copy Maker → Quick Setup Wizard → select "Improve Existing Copy" → choose "Analyze URL" → enter page URL → select "Deep Crawl" → review and generate → score output. Includes callout explaining what gets extracted from the URL.

### Tutorial 3: Compare Versions & Select Best (`/help/tutorials/compare-and-select`)
7 steps covering: generate primary output → generate alternatives → click "Compare All Outputs" → read comparison card → understand scores → select winner → export. Includes a score explainer (Conversion / Trust / Risk definitions) and a snapshot-warning callout.

---

## Help Center — Tutorial: Improve Existing Copy from a Website

**Route:** `/help/tutorials/improve-existing-copy-from-website`

**Files changed:**
- `src/components/help/pages/workflows/ImproveExistingCopyFromWebsite.tsx` (new)
- `src/App.tsx` (new lazy import + route)
- `src/components/help/pages/Tutorials.tsx` (new card in "Step-by-Step Tutorials" section)

**What was added:** A fully structured, premium-style tutorial page in the Help Center teaching users how to improve existing website copy using CopyZap's URL analyzer and Quick Prompt Wizard.

**Page structure:**
1. **Outcome** — single-sentence statement of what the user will achieve
2. **When to use** — four bullet-point use cases (live website, conversion problem, preview before committing, refresh stale content)
3. **Step-by-step guide** — six numbered steps with:
   - Step title
   - Two-line description
   - Image placeholder block (dashed border, labeled with description of what screenshot should show)
   - Inline note for steps 4 and 5 (URL format reminder; Deep Crawl timing warning)
4. **What you get** — four outcome bullets (rewritten copy, variants, quality score, export-ready)
5. **Pro Tip** — actionable insight: run on highest-traffic page first, not homepage
6. **Related tutorials** — four links to adjacent help pages

**Tutorial steps covered:**
1. Open Quick Prompt Wizard
2. Select "Improve Existing Copy"
3. Choose "Analyze URL"
4. Enter the Website URL (with note about full https:// address)
5. Select "Deep Crawl" (with note about 15–30s extra time vs. better results)
6. Click Generate Output

**Design decisions:**
- Numbered circles (dark filled) with connecting vertical lines between steps for visual flow
- Image placeholders use dashed border with `Image` icon from lucide-react — ready for screenshot replacement
- Notes rendered as amber info blocks with Clock icon to signal time/format warnings
- Result section uses green callout; Pro Tip uses neutral bordered card
- Related links use hover-animated arrow icons (Notion/Stripe style)

**Tutorials index:** A new "Step-by-Step Tutorials" section was added as the first section in `Tutorials.tsx`, with a card linking to this tutorial. The card shows title, description, and "6 steps · ~2 min" metadata.

---

## Special Instructions — Zone/Section Structure Preserved in Alternative Copy (Enforcement Upgrade)

**Files changed:**
- `src/services/api/alternativeCopy.ts`

**Problem fixed:** When a user's Special Instructions or primary generated copy defined a named zone layout (e.g., "Zona 1 — Hero con CTA primario"), generating an Alternative Copy silently dropped all zone labels. The output contained correct marketing copy but as a flat document with `---` separators only — no "Zona X —" headings. Consequently, boosting the Alternative Copy also had no zone labels to preserve.

**Root cause:** The previous implementation used a passive "if" conditional in the system prompt: "If the source copy contains zone labels… those labels MUST appear". The model routinely ignored this rule because it treated "create an alternative with a different approach" as permission to restructure. There was also no explicit lookup of zone labels from the Special Instructions field, so cases where the zone layout was defined there and not yet reflected in the copy body were missed entirely.

**What changed:** Three layers of enforcement were added to `generateAlternativeCopy`:

1. **Dual-source zone detection at runtime** — a `detectZoneLabels()` function (identical to the one in `performanceBoost.ts`) scans both `improvedCopyText` AND `formState.specialInstructions`. If zones are found in the copy text, they take priority; otherwise, the zones detected in Special Instructions are used. This covers the case where Copy 1 was generated with zones but the model is being asked to generate an Alternative from that text.

2. **Conditional hard-rule injection** — when `hasZoneStructure` is `true`, the soft "if" rule is replaced entirely with a stronger block that:
   - Explicitly names the pattern as an "ABSOLUTE HARD RULE — THIS OVERRIDES EVERYTHING"
   - Provides a concrete example using the first detected zone label
   - Lists every detected zone label as a word-for-word manifest the model must reproduce

3. **Fallback passive rule retained** — when no zones are detected (non-zone-structured copy), the original softer IMMUTABLE STRUCTURE RULE remains in place to handle edge cases.

**Scope:** This fix applies to the Alternative Copy generation operation. The Performance Boost fix (previous entry) ensures that if the Alternative Copy is then boosted, the zone labels are also preserved at that stage.

---

## Special Instructions — Zone/Section Structure Preserved in Performance Boost

**Files changed:**
- `src/services/api/performanceBoost.ts`

**Problem fixed:** When a user's Special Instructions defined a page structure using labelled zones (e.g., "Zona 1 — Hero con CTA primario", "Zona 2 — Prueba Social", etc.), triggering a Performance Boost caused those zone labels to be silently dropped. The AI would improve the copy content correctly but output it as a flat document without any zone headers, completely destroying the zone layout the user had defined in their brief.

**Root cause:** The `performBoost` function's system prompt had no awareness of zone-structured content. It instructed the model to "return clean, readable text" without any rule preventing it from discarding structural markers it considered cosmetic.

**What changed:** Two enforcement layers were added to `performanceBoost.ts`:

1. **Zone detection at runtime** — a `detectZoneLabels()` function scans the input `textContent` for lines matching patterns like `Zona X —`, `Zona X –`, or `[Zona X` (case-insensitive). If any are found, a `hasZoneStructure` flag is set to `true`.

2. **Conditional prompt injection** — when `hasZoneStructure` is `true`, two additions are made to the system prompt:
   - A numbered rule (Rule 10) is inserted into the STRICT RULES block: `CRITICAL — ZONE STRUCTURE PRESERVATION: This copy uses a named zone layout. You MUST output every zone label EXACTLY as it appears in the original. Do NOT rename, merge, reorder, drop, or rephrase any zone label. Improve only the copy content within each zone.`
   - A complete list of every detected zone label is appended at the bottom of the system prompt under the heading `Zone labels that MUST appear in the output, unchanged:`, giving the model an explicit reference manifest it cannot omit.

**Scope:** This fix applies exclusively to the Performance Boost operation. The same zone preservation enforcement was previously applied to Alternative Copy (`alternativeCopy.ts`) and Voice Restyle (`voiceStyles.ts`) operations.

---

## Special Instructions — Zone/Section Structure Preserved in Alternative Copy and Voice Restyle

**Files changed:**
- `src/services/api/alternativeCopy.ts`
- `src/services/api/voiceStyles.ts`

**Problem fixed:** When a user's Special Instructions defined a page structure using labelled zones (e.g., "Zona 1 — Hero con CTA primario", "Zona 2 — Prueba Social", etc.), generating an Alternative Copy or applying a Voice Restyle (Don Draper, David Ogilvy, etc.) caused those zone labels to be silently discarded. The AI was interpreting "create an alternative angle" or "restyle in persona X" as permission to invent new section names, reorder zones, and omit the structural skeleton defined in the brief.

**Root cause:** The special instructions were being injected into both prompts with weak framing ("ADDITIONAL SPECIAL INSTRUCTIONS"). More critically, the core task description for each operation had no constraint on structural preservation — "create an alternative version with a different approach" and "restyle the copy to sound exactly as if X wrote it" both implicitly allowed full restructuring.

**What changed:** Two enforcement layers were added to both `alternativeCopy.ts` and `voiceStyles.ts`:

1. **Immutable Structure Rule** — added directly into the main operation description in the system prompt:
   > "If the source copy contains zone labels, section labels, or any structural headings (e.g., 'Zona 1 — Hero con CTA primario', 'Zona 2 — Prueba Social', 'Section 1:', numbered zones, or any label defined in the Special Instructions), those labels MUST appear in your output EXACTLY as written — unchanged in wording, order, and count. You are rewriting the CONTENT WITHIN each zone/section only."

2. **Upgraded Special Instructions framing** — the injection now uses the same `=== MANDATORY SPECIAL INSTRUCTIONS ===` block format established in `copyGeneration.ts`, and adds an explicit zone-preservation reminder at the end of the block:
   > "If these special instructions define zones, sections, or a page structure, those zone/section labels are the IMMUTABLE STRUCTURAL SKELETON of the output. Preserve every label exactly. Only the copy content within each zone gets the alternative/voice treatment."

**Behaviour after fix:**
- **Alternative Copy**: generates fresh angles for headlines, body copy, CTAs, and testimonials inside each zone — but "Zona 1 — Hero con CTA primario", "Zona 2 — Prueba Social Rápida", etc. appear verbatim in the output
- **Voice Restyle**: applies the chosen persona's voice to all body content within each zone — zone labels remain unchanged and in the original order
- **Zone count and order**: always matches the source copy exactly; no zones are added, dropped, merged, or reordered

**Unchanged:** `humanizedCopy.ts` and `performanceBoost.ts` already had zone-agnostic tasks; this fix was scoped to the two operations where restructuring was the observed failure mode.

---

## Special Instructions — Propagated to All Derivative Outputs

**Files changed:**
- `src/services/api/alternativeCopy.ts`
- `src/services/api/voiceStyles.ts`
- `src/services/api/humanizedCopy.ts`
- `src/services/api/performanceBoost.ts`

**Problem fixed:** Special Instructions were previously only applied to the initial copy generation (`contentModification.ts` already handled this correctly). When users triggered derivative outputs — New Version (alternative), Change Voice (restyle), Humanize, or Performance Boost — the Special Instructions were silently ignored. This meant a user who had configured detailed instructions such as CTA rules, page structure zones, H1 guidelines, or copy directives would receive outputs that ignored all of those constraints.

**What changed:** Each of the four operations now injects `formState.specialInstructions` into its system prompt using the same conditional pattern already established in `contentModification.ts`:

```
ADDITIONAL SPECIAL INSTRUCTIONS:
[contents of Special Instructions field]

These special instructions must be followed in addition to all other requirements.
```

The injection point is placed at the system prompt level (not user prompt), immediately after the operation's core role definition, so the model treats them as persistent constraints rather than one-time hints.

**Scope of operations now covered:**
- **New Version** — generates an alternative angle while still following all Special Instructions
- **Change Voice / Restyle** — applies the chosen persona's voice on top of, not instead of, the Special Instructions
- **Humanize** — humanizes the copy while respecting structural and content directives in Special Instructions
- **Performance Boost** — improves weak scoring dimensions while remaining bound by Special Instructions constraints

**Unchanged:** `contentRefinement.ts` (word-count revision passes) do not inject Special Instructions because their sole purpose is to adjust length, not re-generate content.

---

## Special Instructions — Smart "Let AI Decide Word Count" Hint

**Files changed:**
- `src/components/ui/SpecialInstructionsField.tsx`
- `src/components/SharedInputs.tsx`

When a user types 120 or more characters into the Special Instructions field, a contextual inline hint appears below the textarea. The hint reads:

> *"You have detailed instructions — consider enabling **Let AI Decide Word Count** for best results."*

An **Enable** button sits inline with the hint. Clicking it immediately activates the `aiDecideWordCount` toggle (and deactivates `prioritizeWordCount` / Strict Word Count if it was on). No scrolling or hunting through the Optimization panel required.

Once `aiDecideWordCount` is already enabled and the field is still >= 120 characters, the amber hint is replaced by a green confirmation banner:

> *"**Let AI Decide Word Count** is enabled — AI will focus on content quality without length constraints."*

If the user clears or shortens the special instructions below 120 characters, both banners disappear.

**Behaviour details:**
- Threshold: 120 characters
- Only the amber hint shows a clickable Enable button; no auto-toggle is performed without user action
- Enabling via the hint also disables Strict Word Count (the two toggles are mutually exclusive, consistent with existing logic in `FeatureToggles`)
- The hint is suppressed when `onEnableAiDecide` is not provided, so the field works standalone without changes to other call sites

---

## Special Instructions — Precise Keyword + Positional Enforcement

**Files changed:**
- `src/services/api/copyGeneration.ts` — `parseSpecialInstructions`, `buildSystemPrompt`, `buildUserPrompt`

**Problem:**
When a user wrote `PRIMERAS 100 PALABRAS: Reescribe las primeras 100 palabras incluyendo la keyword "diseño web" en las primeras dos oraciones`, the AI placed the keyword in the second sentence rather than the first, or drifted further back. The completeness check only said "Verify the required keyword appears" without naming the keyword or the exact sentence constraint, so the AI self-evaluated loosely.

**What Changed:**

1. **`parseSpecialInstructions` extended** — Now extracts two new fields per labeled instruction:
   - `quotedKeywords: string[]` — all quoted strings inside the instruction (e.g. `"diseño web"`)
   - `positionalConstraint: string | null` — detects phrases like "primeras dos oraciones", "first two sentences", "primeras N palabras", "primera oración", "opening", in both English and Spanish

2. **System prompt REQUIRED ELEMENTS** — Each labeled item now appends a `← CRITICAL:` annotation when a keyword + positional constraint are both detected, e.g.:
   ```
   - PRIMERAS 100 PALABRAS: ... ← CRITICAL: the exact keyword "diseño web" MUST appear in the first two sentences. Place it before writing anything else in that section.
   ```

3. **User prompt checklist** — Each `[ ]` item now shows the keyword and constraint inline:
   ```
   [ ] PRIMERAS 100 PALABRAS — exact keyword "diseño web" must be in the first two sentences
   ```

4. **Completeness gate** — When both a keyword and positional constraint are detected, generates two separate verification checks:
   - **KEYWORD POSITION CHECK**: Names the exact keyword and position, tells the AI to read its own first sentences back and rewrite if the keyword is absent or placed too late
   - **STRUCTURAL CHECK**: Separately verifies the structural rule (e.g. "open with the client's problem, not credentials")

---

## Special Instructions — LABEL: Emphasis Format & Updated Placeholder

**Files changed:**
- `src/components/ui/SpecialInstructionsField.tsx`

**What Changed:**

The Special Instructions textarea now educates users about the `LABEL: instruction` emphasis format, which forces the AI to treat the instruction as a hard, non-negotiable requirement rather than a soft suggestion.

1. **Updated placeholder text** — The placeholder now shows two tiers of instruction:
   - Plain style: `"Make British English"`, `"Avoid technical jargon"`
   - Labeled/forced style: `MAIN CTA: Rewrite with a specific value prop, first person, above the fold.` and `TONE: Direct and urgent, no filler words.`

2. **Inline tip below the field** — A small hint line is rendered beneath the textarea: *"Tip: Use LABEL: instruction format to force a requirement — e.g. MAIN CTA: rewrite in first person"*

**How the LABEL: format works:**

When a user writes an instruction using the `LABEL: instruction` pattern (e.g. `CTA PRINCIPAL: Reescribe en primera persona`), the generation prompt wraps it explicitly as a named, mandatory requirement. The label acts as a semantic anchor — the LLM is instructed to fulfill each labeled block independently and completely, not merely treat it as a hint mixed into general guidance. Both English and non-English labels are recognized (the colon is the key delimiter).

---

## Special Instructions Priority Fix — Generation Prompt

**Files changed:**
- `src/services/api/copyGeneration.ts` — `buildSystemPrompt` and `buildUserPrompt`

**Problem:**
Special instructions entered by the user were appended at the very end of the system prompt, after all word count guidance, quality boilerplate, and brand voice rules. LLMs assign lower attention weight to content that appears late in a long prompt, so special instructions were frequently ignored or only partially followed during initial copy generation.

**What Changed:**

1. **System prompt injection moved earlier** — Special instructions are now injected immediately after the core task definition (the tab-specific "create" or "improve" block), before output formatting rules, keyword requirements, GEO settings, and quality guidance. They are wrapped in a clearly labelled `=== MANDATORY SPECIAL INSTRUCTIONS ===` block with explicit override language: *"HIGHEST PRIORITY and OVERRIDE any conflicting defaults."*

2. **Old bottom injection removed** — The previous `ADDITIONAL SPECIAL INSTRUCTIONS` block at the end of the system prompt has been removed to eliminate duplication.

3. **User prompt reinforcement added** — Special instructions are also injected near the top of the user prompt (immediately after the main content block and before the key information list), using a `⚠ MANDATORY REQUIREMENTS` header. This double-injection pattern ensures the LLM encounters the instructions both in the system role (strong behavioural framing) and the user role (immediate task context).

**Why This Works:**
LLMs pay greatest attention to content near the beginning of each role message and to content framed with explicit override/mandatory language. By moving special instructions to an early, prominently framed position in both the system and user prompts, they are treated as first-class requirements rather than optional addenda.

**No behaviour change when special instructions are empty** — all injection is guarded by `formState.specialInstructions && formState.specialInstructions.trim()`, so the change is invisible when the field is blank.

### Follow-up Fix: Completeness Gate + Reinforced Framing (2026-04-08)

A second problem was identified: even with early injection, LLMs stop generating once they reach what feels like a natural page ending (e.g., a closing CTA) without checking back against all requirements. This causes sections like FAQs and above-fold CTAs to be silently omitted.

**Additional changes:**

1. **Top-of-user-prompt framing strengthened** — added "READ BEFORE WRITING" header and the explicit statement: *"Every single requirement above must be present in your output. Do not begin writing until you have read and understood all requirements."*

2. **Completeness gate added at end of user prompt** — a `--- BEFORE YOU STOP WRITING ---` block appended after the word count guidance instructs the model to verify every MANDATORY REQUIREMENT item before stopping: check for missing sections (FAQs, CTAs, keyword placements), verify minimum counts, and continue writing if anything is absent. This exploits the LLM's recency bias — the last instruction it reads before submitting has the highest compliance rate.

Together these form a "sandwich" pattern: requirements stated at the top (framing), restated at the bottom (pre-submission check), with content generation in between.

### Follow-up Fix 2: Smart Detection-Based Completeness Gate (2026-04-08)

Further testing showed the generic completeness gate was not specific enough — the model still skipped the FAQ section because it reaches a natural-feeling closing (CTA) and stops without looking back.

**Solution: requirement-type detection + targeted explicit checks.**

The completeness gate now scans the special instructions text and generates a numbered list of targeted checks unique to the current request:

- **FAQ detected** — extracts the minimum count (e.g. "mínimo 6") and injects: *"Your response MUST contain a FAQ section with at least N questions. If it is not present, add it NOW before stopping."*
- **H1 keyword** — verifies keyword inclusion and character limit
- **First-sentence keyword** — triggers: *"Verify the required keyword appears explicitly and verbatim in the first two sentences. If it does not, rewrite the opening now."*
- **CTA** — verifies above-fold + end-of-page placement with micro-copy
- **Pricing/packages** — handles the case where the original had none (no false positive)
- **Services format** — verifies "[Name] — [client benefit]" format throughout
- **Process steps** — verifies client-benefit-first opening + estimated duration per step

The block is rendered as `=== MANDATORY COMPLETENESS CHECK — DO NOT SKIP ===` at the very end of the user prompt, containing only the checks relevant to the current generation. Specificity makes it much harder for the model to overlook individual requirements.

### Follow-up Fix 3: Universal Completeness Check — All Special Instructions (2026-04-08)

**Problem:** The completeness gate only enforced verification for specific hardcoded keyword patterns (FAQ, CTA, H1, etc.). Any instruction that didn't match one of those patterns — e.g. "Use British English", "Keep sentences under 15 words", "Include a disclaimer at the bottom", "Write in second person" — was silently excluded from the completeness check and could be ignored by the model without triggering any enforcement.

**Solution: Universal instruction parsing.**

After all keyword-based checks run, the system now parses the entire Special Instructions field line by line. Every individual instruction becomes an explicit completeness check item:

```
REQUIRED: Verify your output fully satisfies this instruction: "Use British English"
REQUIRED: Verify your output fully satisfies this instruction: "Keep sentences under 15 words"
REQUIRED: Verify your output fully satisfies this instruction: "Include a disclaimer at the bottom"
```

**How it works:**
1. The raw special instructions text is split on newlines.
2. Each line is stripped of leading list markers (numbers, dashes, bullets, colons).
3. Lines shorter than 5 characters are filtered out (avoids noise from blank or trivial fragments).
4. For each parsed line, a check is made to see if an existing specific check already covers it (e.g. if the line contains "FAQ" and a FAQ check was already added, no duplicate is created).
5. Any instruction not already covered by a specific check is added as a `REQUIRED:` completeness item.

**Result:** The completeness gate is now exhaustive. Regardless of what the user writes in Special Instructions — tone rules, formatting rules, legal disclaimers, structural requirements, audience instructions, length constraints — every line is represented in the final `=== MANDATORY COMPLETENESS CHECK — DO NOT SKIP ===` block that the model must verify before stopping.

The specific keyword-based checks (FAQ with count, CTA placement, H1 keyword, etc.) are preserved and take precedence, providing more precise and detailed verification for the most common structured requirements. The universal parser fills in everything else.

**File changed:** `src/services/api/copyGeneration.ts` — `buildUserPrompt()`, lines 1286–1308.

### Follow-up Fix 4: Structural Section Injection — FAQ Pre-Writing Requirement (2026-04-08)

**Problem identified from live testing:** Despite the completeness check at the end of the user prompt, the FAQ section was still being omitted from output. The model generates content linearly: it writes through the page, reaches a natural closing CTA, and stops — treating the page as complete. The end-of-prompt completeness check arrived too late in its "mental plan" to override the natural stopping point.

**Root cause:** The completeness check fires at the end of the prompt, but the model already has a sense of the page structure before it writes the first word. By the time it reaches the FAQ check, it has already committed to ending.

**Three-layer fix:**

1. **System prompt structural injection** — When FAQ is detected in Special Instructions, a `=== REQUIRED OUTPUT SECTIONS — MUST BE PRESENT ===` block is injected into the system prompt, immediately after the special instructions block. This block instructs the model to PLAN its output to include the FAQ section and explicitly states: *"Do NOT write the final CTA until each section below has been written."* This changes the model's output plan before any generation starts.

2. **User prompt pre-writing checklist** — A `⛔ REQUIRED SECTIONS CHECKLIST` block is injected near the top of the user prompt, immediately after the mandatory requirements re-assertion. This gives the model a concrete `[ ] FAQ SECTION` checkbox to satisfy before writing the final CTA. Placement near the top means it frames the model's writing plan from the outset.

3. **Strengthened completeness check wording** — The FAQ check in the end-of-prompt completeness gate is updated to use `⛔` prefix and directive language: *"Scroll back through everything you have written. Is there a section titled 'FAQ'? If NO — do NOT write the closing CTA yet. Write the FAQ section NOW, then write the closing CTA."* The final block also adds: *"If you have already written a closing CTA but any ⛔ item is missing — append the missing section NOW, then repeat the closing CTA."*

**Result:** The FAQ (and any other explicitly required structural section) is now enforced at three points: system prompt planning, user prompt pre-writing checklist, and end-of-prompt completion gate. The model cannot reach the closing CTA without being explicitly blocked by at least two of these enforcement layers.

**Files changed:** `src/services/api/copyGeneration.ts` — `buildSystemPrompt()` and `buildUserPrompt()`.

### Follow-up Fix 5: Universal Special Instructions Enforcement — All Labeled Requirements (2026-04-08)

**Problem identified:** The three-layer enforcement from Fix 4 only applied to `FAQ` (hardcoded keyword detection). All other labeled requirements — `CTA PRINCIPAL`, `H1 / HEADLINE`, `PRECIOS / PAQUETES`, `PROCESO`, `ENTREGABLES Y SERVICIOS`, `ANCHOR TEXT`, etc. — were enforced only by the generic line-by-line catch-all, which was weaker than the FAQ-specific enforcement. Any labeled instruction could be silently skipped without dedicated structural enforcement.

**Solution: `parseSpecialInstructions()` universal label parser**

A new helper function `parseSpecialInstructions(specialInstructions: string)` was added before `buildSystemPrompt`. It:
- Splits the special instructions on blank lines to extract instruction blocks
- Falls back to line-by-line splitting if no blank-line separation exists
- Matches blocks starting with `LABEL:` pattern (uppercase letters, digits, spaces, `/`, `-`)
- Extracts the label, full instruction text, and optional count (e.g., "mínimo 6", "minimum 6", "al menos 3")
- Returns a typed array of `{ label, instruction, count }` objects

This parser replaces ALL hardcoded FAQ/CTA/H1/pricing keyword detection throughout the prompt-building pipeline.

**Three-layer enforcement now applies universally to every labeled instruction:**

1. **System prompt planning block** (`buildSystemPrompt`): Generates a `=== REQUIRED ELEMENTS — ALL MUST BE PRESENT ===` block listing every parsed label with its instruction summary. Instructs the model to address every item before writing the final CTA.

2. **User prompt pre-writing checklist** (`buildUserPrompt`, early): Generates a `⛔ REQUIRED ELEMENTS CHECKLIST` with `[ ] LABEL` checkboxes for every parsed instruction. The model must check each off before writing the closing CTA.

3. **User prompt completeness gate** (`buildUserPrompt`, end): Generates one `⛔ LABEL (MANDATORY — STOP AND CHECK)` verification item per parsed instruction, with the full instruction text truncated to 150 characters. The model must confirm each is satisfied before stopping.

**Additional behaviors:**
- A non-label-based keyword check for "keyword in opening sentences" (`primeras dos oraciones`, `primeras 100 palabras`) is preserved as it verifies content placement rather than section presence
- If no labeled instructions are detected (free-form special instructions), the system falls back to line-by-line verification to catch every instruction
- Count extraction supports Spanish (`mínimo`, `al menos`) and English (`minimum`, `at least`) patterns

**Result:** Every labeled instruction in Special Instructions — regardless of language, topic, or format — is now enforced at all three enforcement points: output planning, pre-writing checklist, and post-writing completeness gate.

**Files changed:** `src/services/api/copyGeneration.ts` — new `parseSpecialInstructions()` helper function, `buildSystemPrompt()`, and `buildUserPrompt()`.

---

## Unified Content Rendering System

**Files changed:**
- `src/components/ui/FormattedContent.tsx` — Created new unified rendering component
- `src/components/results/CopyOutput.tsx` — Updated to use FormattedContent
- `src/components/results/AlternativeCopy.tsx` — Updated to use FormattedContent
- `src/components/GeneratedCopyCard.tsx` — Updated to use FormattedContent

**Description:**
All generated content now renders consistently with proper HTML formatting across the entire application. Previously, different output components used `stripMarkdown()` which removed all formatting (headings, bold, italics, lists), resulting in plain text display. Now all outputs use the unified `FormattedContent` component.

**What Changed:**
- Created `FormattedContent` component that uses `markdownToHtml()` to convert markdown to styled HTML
- Replaced all `stripMarkdown()` display logic with `FormattedContent` component
- Unified rendering for structured content, plain text, and array content (like headlines)
- All outputs now show proper headings, paragraphs, lists, bold, italics, and other formatting

**Benefits:**
- Consistent formatting across all output types (Generated Copy, Alternative Copy, output cards)
- Better readability with proper visual hierarchy (H1, H2, H3 headings)
- Preserved formatting matches export formats (HTML, Markdown)
- Eliminates inconsistent rendering between different parts of the app

**Technical Details:**
- The `FormattedContent` component handles three content types:
  1. **Structured content** (headline + sections): Renders with proper heading hierarchy
  2. **Array content** (headlines): Renders as ordered list
  3. **String content** (markdown text): Converts markdown to HTML with proper formatting
- Uses `dangerouslySetInnerHTML` with sanitized HTML from `markdownToHtml()`
- Unwraps nested content structures automatically (e.g., `{ content: actualContent, seoMetadata: {...} }`)

---

## LLM Evaluation Audit Export (.md) — Blind Comparison Format for Scoring System Validation

**Files changed:**
- `src/utils/enhancedExports.ts` — Added `exportLLMEvaluationAudit()` function and `hasCompleteEvaluationData()` validation
- `src/components/FloatingActionBar.tsx` — Added UI button with FlaskConical icon and error handling

A specialized audit export format that enables external LLMs to independently evaluate copy versions and then critically compare their judgment against the app's scoring system. This format is designed for quality assurance and scoring system validation.

**CRITICAL ENFORCEMENT:** This export will ONLY succeed when evaluation data is complete. If any required field is missing, the export is blocked with a clear error message.

**File Structure:**

The exported markdown file follows a strict audit structure:

1. **Instructions Header** — Clear instructions for the LLM to first evaluate independently, then compare with app's judgment
2. **Section A: Copy Versions (Blind Input)** — Pure plain text copy versions wrapped in `<START_COPY>` / `<END_COPY>` markers with zero bias
3. **Section B: App Evaluation** — The app's complete judgment including winner, ranking, scores, summary, strengths, and weaknesses
4. **Section C: Task** — Detailed instructions for the LLM to evaluate, compare, and provide critical analysis
5. **Output Format Template** — Structured template for consistent LLM responses

**Content Pipeline:**

Uses the same three-stage cleaning pipeline as LLM Evaluation Export:
- Stage 1: `normalizeCopyForLLMExport()` → Consistent clean HTML
- Stage 2: `extractPureCopy()` → Remove scoring/analysis
- Stage 3: `finalCleanForLLM()` → Pure plain text

**Section A - Blind Input:**
- Pure copy versions only
- No scores, rankings, or analysis
- No bias or hints about quality
- Clean plain text format

**Section B - App Evaluation:**
- Winner label with persona info
- Complete ranking (1st → last)
- Scores for each version (0-100)
- Summary explaining why winner was chosen
- Strengths list (from deep analysis)
- Weaknesses list (from deep analysis)

**Section C - Task Instructions:**

The LLM is instructed to:
1. Rank all versions (best → worst)
2. Choose a winner
3. Score each version (0-100)
4. Classify winner type (clear/moderate/close call)
5. Compare with app's evaluation
6. Identify agreements and disagreements
7. Evaluate the app's reliability
8. Provide final verdict on scoring system

**Output Format Template:**

Provides structured template with fields for:
- Winner
- Ranking
- Scores
- Winner type
- Agreement areas
- Disagreements
- Who is more correct (LLM or app)
- App reliability assessment
- Biggest error identified
- Biggest strength identified
- Final verdict (yes/no for ranking/scoring reliability)

**Completeness Validation:**

Before generating the audit file, the system validates that ALL required fields are present:

Required fields:
1. **Winner** — Non-empty winner identifier
2. **Ranking** — Array with at least 2 versions ranked
3. **Scores** — Scores for all evaluated versions (0-100)
4. **Summary** — Non-empty winner explanation (shortWhyWinner or whyWinner)
5. **Strengths** — Array with at least 1 strength for winner
6. **Weaknesses** — Array with at least 1 weakness for winner

If ANY field is missing or invalid:
- Export is blocked immediately
- Clear error message shown to user: "Comparison audit export is only available after scoring and ranking data has been fully generated."
- Console warning logged with details of missing fields
- Debug information includes: missing field names, data completeness status, version counts

**HARD RULE:** The audit export will NEVER contain placeholder text like:
- "Unknown"
- "No ranking available"
- "No scores available"
- "No summary available"
- "No strengths data available"
- "No weaknesses data available"

If data is incomplete, the export does not happen at all.

**UI Integration:**

A new button with FlaskConical icon (lab testing) appears in the floating action bar:
- Only visible when comparison results are available
- Positioned after LLM Evaluation export button
- Tooltip: "Export for LLM Evaluation Audit (.md)"
- Generates filename: `llm-evaluation-comparison_[timestamp].md`
- Shows extended error toast (6 seconds) with missing field details if validation fails

**Error Handling:**

When validation fails:
1. Console warning with detailed diagnostic information
2. User-friendly error message in toast notification (6 seconds, max-width 500px)
3. Error message lists specific missing fields
4. Suggests running "Compare/Re-score" to generate complete data
5. Export is completely blocked (no partial file generated)

**Use Cases:**

- Quality assurance testing of scoring system
- Validating ranking accuracy
- Identifying systematic biases
- Comparative analysis against external AI judgment
- Scoring calibration and refinement
- Documentation of system reliability

---

## LLM Evaluation Export (.md) — Bias-Free Format for External AI Evaluation

**Files changed:**
- `src/utils/enhancedExports.ts` — Added `exportLLMEvaluationMarkdown()`, `extractPureCopy()`, and `finalCleanForLLM()` functions
- `src/components/FloatingActionBar.tsx` — Added UI button and handler

A new export format has been added specifically designed for external LLM evaluation (Claude, ChatGPT, etc.). This export produces a clean, bias-free markdown file that isolates copy content from all scoring data, rankings, and analysis to enable unbiased evaluation.

**File Structure:**

The exported markdown file follows a strict structure:

1. **Warning Header** — Clear instructions to the evaluating LLM to only evaluate content inside `<START_COPY>` and `<END_COPY>` markers and ignore everything else
2. **Context Section** — Project metadata (language, tone, audience, goal) to provide evaluation context
3. **Copy Versions** — Each version (original, generated, voice-enhanced, modified) wrapped in explicit `<START_COPY>` / `<END_COPY>` boundaries with pure plain text copy only
4. **System Data Section** — All scores, rankings, and analysis moved to a clearly marked "IGNORE THIS SECTION" area at the bottom
5. **Full Export Reference** — Complete markdown export with all data preserved in a collapsible `<details>` section (for reference only)

**Content Cleaning Pipeline:**

Content goes through a three-stage cleaning process to ensure completely bias-free copy blocks:

**Stage 1: Normalization** (`normalizeCopyForLLMExport()`)
- Converts all formats (markdown, structured, HTML) to consistent clean HTML
- Removes basic UI labels
- Normalizes spacing

**Stage 2: Pure Copy Extraction** (`extractPureCopy()`)
- Removes markdown section headers: Sub-Scores, Key Strengths, Suggested Improvements, Analysis, Quality Metrics
- Strips all scoring lines: Overall Score, Conversion, Trust, Risk, Clarity, Persuasiveness, Tone Match, Engagement
- Removes bullet point analysis
- Eliminates UI structural labels: Hero, Introduction, CTA, Footer, Header, Subheading, Body, Title, Subtitle
- Strips score badges and labels: `[Score: X/100]`, `Score: X/100`
- Removes HTML comments that might contain metadata
- Removes data attributes: `data-score`, `data-analysis`
- Normalizes excessive whitespace

**Stage 3: Final Clean** (`finalCleanForLLM()`)
- Strips all remaining HTML tags completely (converts to pure plain text)
- Removes any remaining UI structural labels
- Eliminates cookie/legal noise: "política de cookies", "utilizamos cookies", "aceptar", "we use cookies", "cookie policy", "accept cookies"
- Removes both English and Spanish cookie banners and legal disclaimers
- Final whitespace normalization for clean output

**What's Included in Copy Blocks:**
- Pure copy content only
- Original copy (when in improve mode)
- All generated output card versions
- Version labels (e.g., "Standard Version", "Alternative Version 2", "Voice-Enhanced")
- Persona information (when applicable)

**What's Excluded from Copy Blocks:**
- All scores (overall, clarity, persuasiveness, etc.)
- Sub-scores and metrics
- "Key Strengths" analysis
- "Suggested Improvements" recommendations
- Winner badges or rankings
- Decision recommendations
- Comparison deltas
- Quality metrics
- Analysis headers
- Score annotations
- Metadata attributes

**UI Integration:**

A new button with a Sparkles icon has been added to the floating action bar (right side of screen). The button:
- Appears when content is available (same condition as other export buttons)
- Is positioned after the HTML export button
- Shows tooltip: "Export for LLM Evaluation (.md)"
- Triggers download of a file named: `llm-evaluation_{project-name}_{timestamp}.md`
- Shows success toast: "LLM Evaluation file exported!"

**Use Cases:**

This export format is ideal for:
- Getting unbiased second opinions from external LLMs
- A/B testing evaluation without bias from internal scoring
- Cross-validation of CopyZap's recommendations
- Training data generation for ML models
- Blind comparative analysis workflows

**Technical Details:**

The export function reuses the existing content normalization pipeline to ensure consistency with other exports. It accepts the same parameters as `exportAsFormattedHtml()` and `formatAsEnhancedMarkdown()` but produces a fundamentally different output structure optimized for external evaluation rather than human review.

---

## Automatic Deep Analysis Generation After Scoring

**Files changed:**
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts`

Deep analysis (Key Strengths and Suggested Improvements) is now **automatically generated for all output cards** immediately after scoring completes. Previously, users had to manually click a "Generate Analysis" button on each version card to see the detailed analysis.

**What changed:**
- When `compareOutputsWithGrok` completes scoring, it now automatically calls `runDeepAnalysisForAll` to generate deep analysis for every version
- The analysis includes: summary, key strengths (4-8 bullets), suggested improvements (4-8 bullets), and strategic recommendations
- All version cards display their complete analysis immediately without requiring manual interaction
- The "Generate Analysis" button is no longer needed and only appears if auto-generation fails
- Users see progress messages: "Comparison complete! Generating detailed analysis..." followed by "Analysis complete!"

**Benefits:**
- Eliminates repetitive manual clicking for each output card
- Provides immediate access to actionable insights and recommendations
- Maintains consistent analysis quality across all versions
- Improves user experience by reducing friction in the evaluation workflow

**Error handling:**
- If auto-analysis fails, scoring results are still displayed and users can retry analysis manually using the fallback button

---

## HTML Export — Timestamp Format (dd/mm/yy - HH:MM)

**Files changed:**
- `src/utils/enhancedExports.ts`

The HTML export date stamps now use a consistent `dd/mm/yy - HH:MM` format (24-hour clock) instead of the browser-locale `toLocaleString()` output. This applies to two locations in the exported file: the page header ("Generated:" field) and the footer ("Generated by CopyZap" line). A shared `formatExportTimestamp()` helper produces the formatted string.

Example output: `27/03/26 - 16:32`

---

## Exports — Unified Baseline Delta in HTML and Markdown Exports

**Files changed:**
- `src/utils/enhancedExports.ts`

The HTML and Markdown exports now use the same delta calculation as the live UI: all score differences are computed relative to the **Original Copy baseline** using `getComparisonDelta()`, not relative to the winner/best version.

**HTML export (Rankings Snapshot section):**
- Each non-baseline row now shows a colored pill badge (green for improvement, amber for regression) with the full `+N pts (+X.X%)` / `−N pts (−X.X%)` label matching the live UI
- The Original Copy row shows no badge (it is the baseline)

**Markdown export (Rankings table + All Versions Breakdown):**
- Column header renamed from `Δ vs Best` to `Δ vs Original` when a baseline exists
- Each row now shows the full formatted delta label (e.g., `+8 pts (+11.3%)`) instead of the raw `deltaVsBest` integer
- The Original Copy row shows `baseline` in the delta column
- When no Original Copy baseline is present the column remains `Δ vs Best` with the raw value as before
- Footnote updated to describe the `Δ vs Original` semantics

---

## Performance Comparison — Unified Baseline Evaluation UI (comp-v6.9.0)

**Files changed:**
- `src/components/results/ComprehensiveComparisonTable.tsx`
- `src/components/results/decision/VersionAnalysisCard.tsx`
- `src/components/results/decision/StickyResultsNav.tsx`

Replaced the dual-section output evaluation layout (separate "RANKINGS" + "VERSION ANALYSIS") with a single unified "Performance Comparison" section that treats Original Copy as the authoritative baseline reference.

**What changed:**

1. **Rankings section removed.** The separate `RankingsSnapshotCard` component and its `results-rankings` anchor were removed entirely. The sticky nav "Rankings" button was removed accordingly.

2. **Section renamed.** "VERSION ANALYSIS" is now "Performance Comparison" with an optional subtitle: "Compare every version against the original baseline."

3. **Sticky nav updated.** Removed "Rankings" nav item. Renamed "Versions" to "Comparison" (still links to `results-versions` anchor).

4. **Baseline identification.** Original Copy is identified by `baselineVersionId` prop or by matching `optionLabel === 'Original Copy'`. It is pinned as the first card in the section.

5. **Sort order updated.** The section now sorts: Original Copy first (baseline, pinned), then all other versions sorted by `finalScore` descending. The winner highlight is preserved visually but no longer sorts to the top — it naturally appears near the top due to score sorting.

6. **Delta calculation.** A new `calcBaselineDelta(versionScore, baseScore)` helper computes:
   - `deltaPoints = Math.round(versionScore - baseScore)`
   - `deltaPercent = ((versionScore - baseScore) / baseScore) * 100` (to 1 decimal)
   - Returns `null` if `baseScore` is `0` or `undefined` (suppresses percent display safely).

7. **Delta badges on cards.** Each non-baseline `VersionAnalysisCard` shows a small delta badge next to the score:
   - Positive delta: green badge — `+9 pts (+11.8%)`
   - Negative delta: amber badge — `−3 pts (−3.9%)`
   - Zero delta: neutral gray badge — `±0`
   - Baseline card shows a "Baseline reference" pill instead.

8. **Card visual hierarchy:**
   - Baseline card: muted neutral background (`bg-gray-50/50`), no opacity reduction, no delta.
   - Winner card: green border/background (unchanged).
   - Non-winner non-baseline: slight opacity reduction (unchanged).

9. **Edge cases handled:**
   - If baseline has no score (`finalScore = 0` or `baselineRow` is absent), delta badges are suppressed.
   - If Original Copy is missing entirely, the section renders without a pinned baseline — no crash.
   - `WinnerHeroCard` `scoringGap` calculation was fixed to use `safeRows` instead of `sortedRows` so the new baseline-first sort does not affect the "gap vs others" display.

**No scoring logic changes.** This is a presentation-only refactor.

---

## Unified Analysis Action Bar

**File changed:** `src/components/GeneratedCopyCard.tsx`

Replaced the previous stacked analysis generation UI (a full-width "Generate All 3 Analyses" button above a 3-column grid of individual buttons) with a single horizontal unified action bar that visually matches the copy action bar.

**Layout:**

```
Analyze this version  (label)
[ All Analyses ]  |  [ SEO ] [ Content ] [ GEO ]
```

**Visual design:**

- Label above bar: `Analyze this version` — 10px, uppercase, semibold, muted — identical to the "Refine or explore this version" label on the copy action bar.
- Container: `flex items-center gap-2 flex-wrap` — horizontal row, same as the copy action bar.
- "All Analyses" (primary): slightly filled style — `bg-gray-100 dark:bg-gray-700`, `border-gray-300 dark:border-gray-600`, `text-gray-800 dark:text-gray-100` — matches the "New Version" button weight.
- Separator: `w-px h-4 bg-gray-200 dark:bg-gray-700` — same vertical divider used in the copy bar.
- "SEO", "Content", "GEO" (secondary): ghost/outline style — `bg-white dark:bg-transparent`, `border-gray-200 dark:border-gray-700`, `text-gray-600 dark:text-gray-400` — matches "Improve", "Change Voice", "Enhance" buttons.
- All buttons: `px-3 py-1.5 rounded-md text-xs font-semibold` — exact same sizing as copy action bar pills.
- Disabled state: `opacity-40 cursor-not-allowed`.

**Visibility logic (unchanged):**

- "All Analyses" appears only when 2 or more individual analyses are missing (`missingCount >= 2`).
- Each individual button (SEO, Content, GEO) appears based on its existing `show*Button` flag.
- Entire bar is hidden if no analyses are needed.

**No backend changes.** UI only — all click handlers, tooltip content, and loading states are preserved exactly as before.

---

## Navigation State Persistence (Last Route Restore)

**Files changed:** `src/hooks/useLastRoute.ts` (new), `src/App.tsx`

When a logged-in user refreshes the browser or returns to the app, they are automatically restored to the last route they were on — Copy Maker, Dashboard, Quick Polish, a specific managed page, a Help Center article, etc. — instead of always being dropped onto the default Copy Maker page.

**How it works:**

- A new hook `useSaveLastRoute()` is called inside `AppRouter`. It watches `location` changes via React Router and writes the full path (pathname + search + hash) to `localStorage` under the key `cz_last_route`.
- Public and auth routes are excluded from being saved: `/`, `/login`, `/create-account`, `/reset-password`, `/auth/callback`, `/privacy`, and all `/blog/*` paths.
- On app load, the root `/` route redirect (and the redirects on `/login` and `/create-account` when the user is already authenticated) reads the saved route via `getLastRoute()` and navigates there. Falls back to `/copy-maker` if nothing is stored.
- On logout, `clearLastRoute()` wipes the stored value so a different user logging in on the same device starts fresh at `/copy-maker`.

**Utility functions exported from `useLastRoute.ts`:**

- `useSaveLastRoute()` — React hook; call once at the top of the router component.
- `getLastRoute()` — returns stored path string, defaulting to `/copy-maker`.
- `clearLastRoute()` — removes the stored key from localStorage.

---

## Output Action Controls — Unified Action Bar

**File changed:** `src/components/GeneratedCopyCard.tsx`

Replaced four scattered action sections (Modify Content textarea block, Create Alternative Copy button, Performance Boost button, Apply Voice Style select block) with a single horizontal pill-style action bar per generated output.

**Action bar layout (horizontal row, pill buttons):**

```
EDIT GROUP         EXPLORE         FINALIZE
[Rewrite] [Tone] [Optimize]  |  [New Version]  |  [Merge]
```

- `Rewrite` (Modify Content) — toggles an expandable panel below the bar containing the instruction textarea + Apply button. Lightbulb suggestion button still accessible inside the panel.
- `Tone` (Apply Voice Style) — toggles an expandable panel with the voice style select + Apply button. Hidden for headline-type outputs.
- `Optimize` (Performance Boost) — direct trigger; amber pill style when active, disabled state at 40% opacity. Tooltip preserved.
- `New Version` (Create Alternative Copy) — direct trigger; neutral pill. Separated by a vertical divider.
- `Merge` (Blend Best Versions) — direct trigger with loading spinner state (`Merging...`). Separated by a vertical divider.

**Active state:** Rewrite and Tone buttons invert to dark fill when their panel is open (toggle behavior).

**Label above bar:** `REFINE THIS VERSION` (10px, uppercase, muted).

**State added:** `openPanel: null | 'rewrite' | 'tone'` — tracks which expandable panel is open.

**Not changed:** Add to Comparison button, FAQ Schema button, SEO/Score/GEO on-demand buttons, all backend handlers.

---

## Decision UI — Instant Trust Signal Layer

**Files changed:**
- `src/components/results/decision/WinnerHeroCard.tsx` — added `scoringGap` prop (+X vs others suffix), `extractReasonTag` utility, reason tag badge below winner name; removed `why` paragraph
- `src/components/results/decision/RankingsSnapshotCard.tsx` — winner row: scale 1.03, font-black, full contrast; non-winner rows: 87% opacity, `−X` delta shown before score
- `src/components/results/decision/VersionAnalysisCard.tsx` — winner: font-extrabold label + font-black score; non-winners: 87% opacity wrapper
- `src/components/results/ComprehensiveComparisonTable.tsx` — computes `scoringGap` (winner − 2nd place), passes to WinnerHeroCard
- `src/utils/enhancedExports.ts` — HTML: winner h2 includes gap span + green pill reason tag; rankings rows updated with opacity/scale/delta. Markdown: Final Decision line includes `(+X vs others)` and reason tag as inline code

**WinnerHeroCard** — Winner label appends `(+X vs others)` where X = integer gap vs 2nd place. Reason tag badge (green pill, 11px, max 4 words lowercase) derived from first 4 words of `decisionReason`. The `why` paragraph removed — trust now comes from numbers and position, not sentences.

**RankingsSnapshotCard** — Winner row scaled 1.03x with highest-contrast text. Non-winner rows at 87% opacity. Each non-winner displays `−X` delta in muted 10px text before their score.

**VersionAnalysisCard** — Winner card header uses font-extrabold/font-black. Non-winner cards wrapped at 87% opacity. Visual dominance of winner is established before any text is read.

**enhancedExports.ts (HTML)** — Winner block: h2 appends `(+X vs others)` inline span; green pill badge rendered below h2 from reason tag. Rankings: winner row `opacity:1 / scale(1.03) / font-weight:900`; non-winner rows `opacity:0.87` with `−X` delta in muted 10px span before score.

**enhancedExports.ts (Markdown)** — Final Decision line: `**Version N** (+X vs others) — Score: **88/100**`. Reason tag on next line as inline code block. Rankings table Δ vs Best column already carries numeric delta; no structural change required.

---

## Results UI — Final UX Compression Pass (Single Block Decision)

**Files changed:**
- `src/components/results/decision/WinnerHeroCard.tsx` — rewritten as unified FINAL DECISION block containing winner name, score, 1-line why, and 3 numbered actions
- `src/components/results/decision/ActionPanel.tsx` — returns null; all content absorbed into WinnerHeroCard
- `src/components/results/decision/StickyResultsNav.tsx` — "Winner" renamed to "Decision", "Actions" nav item removed (no longer a separate scroll target)
- `src/components/results/ComprehensiveComparisonTable.tsx` — passes `finalRecommendation` and `priorityActions` to WinnerHeroCard
- `src/utils/enhancedExports.ts` — HTML and MD exports restructured to match unified block

**No logic changes. No data changes. Presentation and hierarchy only.**

### New FINAL DECISION block structure

Single green-bordered card replaces the previous WinnerHeroCard + ActionPanel two-block layout:

```
FINAL DECISION                       [score]/100
[Version Name]
[one-line why it wins]

DO THIS NEXT
→ Action 1
→ Action 2
→ Action 3

[View winning copy →]
```

- Label "Final Decision" is green, small-caps, top-left
- Score is right-aligned, large, color-coded
- Version name is `text-xl font-extrabold`
- Why is `line-clamp-1`, muted — answers "why" in 1 line
- "Do this next" sublabel is muted small-caps
- Actions use green `ArrowRight` icons, `line-clamp-1` each
- "View winning copy" button is inline green

### ActionPanel

`ActionPanel` component still exists and accepts the same props for backward compatibility, but returns `null`. Its content is now inside `WinnerHeroCard`.

### StickyResultsNav

Nav now has 3 items: Decision | Rankings | Versions. "Actions" removed since it was a separate `id="results-actions"` scroll target that no longer exists.

### 3-Second Test (Pass Criteria)

- **What wins?** Version name in large bold at the top of the first visible card
- **Why?** 1-line sentence immediately below the name
- **What to do?** 3 action arrows directly below the why — no scrolling

---

## Results UI — Decision-First UX Reduction Pass

**Files changed:**
- `src/components/results/decision/WinnerHeroCard.tsx` — badge renamed to "Final Recommendation", summary clamped to 1 line
- `src/components/results/decision/ActionPanel.tsx` — two-column grid collapsed into single merged block "Why it wins — what to do"
- `src/components/results/decision/VersionAnalysisCard.tsx` — removed duplicate amber "Key Insight" and blue "What to do" boxes from expanded state
- `src/utils/enhancedExports.ts` — HTML and MD exports updated to match all UI changes

**No logic changes. No data changes. Presentation and content hierarchy only.**

### Changes by Component

**WinnerHeroCard** — Badge label changed from "Best Performing Version" to "Final Recommendation" to communicate finality. `decisionSummary` clamped to `line-clamp-1` (1 line max) to enforce decision speed.

**ActionPanel** — Collapsed the two-card grid (Improve Winner + Fix Across All) into a single unified block. Structure:
1. Label: "Why it wins — what to do" (uppercase, muted)
2. Insight row: `finalRecommendation.why` — green dot, 1-line truncated — answers WHY
3. Numbered actions: `finalRecommendation.nextSteps.slice(0, 3)` — answers WHAT TO DO
If no nextSteps, falls back to `priorityActions[].title`. No separate "Fix Across All" column.

**VersionAnalysisCard (expanded)** — Removed the amber "Key Insight" box (`row.insight`) — it was a duplicate of the 1-line collapsed preview. Removed the blue "What to do" box (`row.action`) — it was a duplicate of what ActionPanel already shows at the top level. `Zap` and `ArrowRight` lucide imports removed. Expanded state now shows: summary, strengths, improvements, strategic recommendation, view output button only.

**HTML export** — Winner badge changed to "Final Recommendation". ActionPanel section rewritten as single merged card with green-dot insight row + numbered actions. No more two-column grid or "Fix Across All" card. Rankings remain low-contrast. Markdown export: "Best Performing Version" heading → "Final Recommendation", "Improve Winner" + "Fix Across All" sections → single "Why it wins — what to do" section with blockquote insight and numbered steps.

### 3-Second Test (Pass Criteria)

- **Which version wins?** Green card at top, labeled "Final Recommendation", score 48px
- **Why it wins?** Single `rec.why` sentence immediately below, before any actions
- **What to do?** 3 numbered action steps right below the insight, no scrolling required

---

## Results UI — Visual Hierarchy & Decision Clarity Pass

**Files changed:**
- `src/components/results/decision/WinnerHeroCard.tsx` — dominant green-tinted card, larger score and name
- `src/components/results/decision/ActionPanel.tsx` — "What to do next" label, removed reason text, simplified headers
- `src/components/results/decision/RankingsSnapshotCard.tsx` — fully de-emphasized secondary style
- `src/components/results/decision/VersionAnalysisCard.tsx` — collapsed state shows 1-line insight, removed label noise
- `src/components/results/ComprehensiveComparisonTable.tsx` — variable spacing rhythm (mb-8 / mb-6 / mb-4)
- `src/utils/enhancedExports.ts` — HTML + MD exports updated to match all visual changes

**No logic changes. No data changes. Presentation only.**

### Changes by Component

**WinnerHeroCard** — Green-tinted background (`bg-green-50/50`), green border. Score increased to `text-5xl font-black`. Version name increased to `text-2xl`. "View Winning Copy" button now green. Removed `decisionReason` paragraph (already removed; `decisionSummary` kept with `line-clamp-2`). Overall: unmissable at first glance.

**ActionPanel** — "What to do next" label rendered above the two-card grid (uppercase, low-contrast gray, tracking-widest). Removed the `winnerLabel` subtitle and "Highest-impact improvements" subtitle from card headers. Removed `pa.reason` explanatory paragraph from Fix Across All items — each action is now a single line title only. Max 3 actions per column (`.slice(0, 3)`). Feels like a directive, not an analysis.

**RankingsSnapshotCard** — Smaller border (`border-gray-100`), no shadow. Header label now `text-[10px]` and `text-gray-300`. Rank numbers `text-xs text-gray-200`. Version names `text-xs text-gray-400` (non-winner) / `text-gray-500` (winner). Scores `text-sm text-gray-400`. No Award icons, no Winner/Baseline labels. User glances — does not read.

**VersionAnalysisCard (collapsed)** — Removed "Winner" text label (Award icon alone signals winner). Removed "Baseline" badge. Added `row.insight` as a second line (`text-xs text-gray-400 truncate`) below the name+score row when card is collapsed. Expanded state unchanged.

**ComprehensiveComparisonTable** — Replaced `space-y-4` wrapper with individual spacing: Winner `mb-8`, Actions `mb-6`, Rankings `mb-4`, Versions `mb-4`. This creates a top-down visual gravity: eyes naturally flow Winner → Actions → rest.

**HTML export** — Winner hero: green background, 48px score, 26px name, removed decisionReason. Actions: "What to do next" label above grid, removed subtitles, removed reason text from Fix Across All, max 3 items. Rankings: low-contrast style (gray-200 borders, gray text). **Markdown export** — Fix Across All now outputs title only (no reason text), max 3 items.

### 3-Second Test

- Winner: green card dominates the top, score is largest number on screen
- What to do: "What to do next" label + two numbered action lists are immediately below
- Everything else: Rankings and Versions are visually subordinate — for reference only

---

## Results UI — Decision-First Refactor

**Files changed:**
- `src/components/results/ComprehensiveComparisonTable.tsx` — full layout refactor using new subcomponents
- `src/components/results/decision/WinnerHeroCard.tsx` — new
- `src/components/results/decision/RankingsSnapshotCard.tsx` — new
- `src/components/results/decision/ActionPanel.tsx` — new
- `src/components/results/decision/VersionAnalysisCard.tsx` — new
- `src/components/results/decision/StickyResultsNav.tsx` — new
- `src/utils/enhancedExports.ts` — HTML and MD export updated to match new layout

**No changes to:** scoring logic, ranking logic, analysis content, export data structure.

### New Page Layout Order (final)

```
A. Sticky Results Nav (Winner · Actions · Rankings · Versions)
B. Winner Hero Card
C. Action Panel (Improve Winner + Fix Across All Versions)  ← moved above Rankings
D. Rankings Snapshot
E. Version Analysis Cards (individually collapsible, default collapsed)
F. Scoring Context Strip + Debug Controls
```

**Collapsible Generated Copies (ResultsPanel)** — The output cards list in `ResultsPanel.tsx` is wrapped in a collapsible section. Default state: always visible (expanded). The toggle button label reads "Hide Output Cards (N)" when cards are visible and "Show Output Cards (N)" when collapsed, accompanied by a ChevronUp/Down icon. This replaced the previous "Generated Copies (N)" label which did not communicate intent clearly.

### Component Descriptions

**WinnerHeroCard** (simplified) — Version name (xl bold), score (3xl), "Best Performing Version" badge pill, decisionSummary as max 2-line paragraph (line-clamp-2). One CTA: "View Winning Copy". Left border accent green. Removed: decisionReason paragraph, "Jump to Winner Analysis" button.

**RankingsSnapshotCard** (compact) — Flex list rows, each showing only: rank number, version name, score. Removed: vs Best, vs Baseline columns, table headers, footer footnote. Winner row is subtly highlighted green, clickable rows scroll to version card.

**ActionPanel** — Two-column grid on desktop, stacked on mobile. Left card (green): "Improve Winner" with numbered next steps. Right card (sky blue): "Fix Across All Versions" with numbered priority actions + supporting reason text. Positioned directly below Winner, before Rankings.

**VersionAnalysisCard** — Collapsed by default. Clicking the header toggles expansion. Shows: score, winner badge, analysis summary, top 3 strengths, top 3 improvements, Key Insight block, What To Do block. Expansion reveals all strengths, all improvements, strategic recommendation.

**Expand All / Collapse All Button** — Displayed in the Version Analysis section header when there are 2 or more versions. A single click expands every version card simultaneously (and triggers deep analysis generation for any version that hasn't been loaded yet). Clicking again collapses all cards. The button label and icon toggle between "Expand All" (ChevronsUpDown icon) and "Collapse All" (ChevronsDownUp icon) based on current state.

**Bug Fix (2026-03-27) — Performance Comparison Table Disappearance on Expand All:** The expanded state tracking was migrated from a `Set<string>` to a `Record<string, boolean>` to ensure stable React reconciliation during simultaneous multi-version expansions. The `id="results-versions"` container had `overflow-hidden` removed and replaced with `overflow: visible` via inline style to prevent content clipping when cards expand. A persistent `.performance-table-wrapper` div with `display: block; height: auto; overflow: visible` was added in `ResultsPanel.tsx` to ensure the table container is always mounted regardless of external expand/collapse state changes. These changes decouple card-level expand/collapse from table-level visibility.

**Sticky Performance Summary Bar (comp-v6.9.1 — 2026-03-27):** The `id="results-versions"` block was refactored into two structurally separate zones to prevent the summary from being visually lost when analysis cards are expanded:

- **D1 — Sticky Summary (`position: sticky; top: 0; z-index: 20`):** Always-visible bar containing the section title ("Performance Comparison"), the Expand All / Collapse All toggle button, and a row of compact score pills. Each pill shows rank number, version label, numeric score (color-coded by `getScoreTextClass`), and a delta badge (e.g., `+8 pts`) relative to the baseline. The baseline pill shows a `ref` label instead. This bar stays pinned at the top of the viewport as the user scrolls through expanded analysis panels. Background is `bg-white dark:bg-gray-950` with a subtle bottom border to visually separate it from the scrollable content below.
- **D2 — Expandable Analysis Cards:** The `VersionAnalysisCard` list is rendered in a separate div below the sticky bar. Only this zone is affected by expand/collapse state changes (`expandedVersionIds: Record<string, boolean>`). The sticky summary is entirely outside this zone and is never re-rendered or unmounted by expand/collapse operations.
- **Parent container fix:** The outer `id="results-versions"` div and the `ResultsPanel.tsx` wrapper both use `overflow: visible` (not `overflow: hidden` or `overflow: auto`) to ensure `position: sticky` inside the container is not broken by clipping ancestors.
- **Expand/Collapse isolation:** `handleExpandCollapseAll` updates only `expandedVersionIds` state. The sticky summary bar reads from `sortedRows` (a `useMemo` value) which is not affected by expand/collapse — ensuring the summary never re-mounts or flickers when toggling all cards.

**StickyResultsNav** — Sticky top navigation with anchor links: Winner | Actions | Rankings | Versions. Order matches the new layout. Winner label shown on desktop.

### Export Changes (HTML + Markdown)

Both HTML and Markdown exports now follow the same section order as the in-app layout: Winner → Actions (Improve Winner + Fix Across All) → Rankings → Version Analysis.

**HTML export (`generateBestVersionAnalysisHtml`):** Order is now (A) Winner Hero Card (green left border, badge pill, large score, version name h2, decisionSummary, decisionReason), (B) Action Panel (two-column grid with green "Improve Winner" card and sky blue "Fix Across All Versions" card, numbered steps), (C) Rankings Snapshot (compact flex list rows with rank + name + score only, no vs Best/vs Baseline columns).

**Markdown export (`formatAsEnhancedMarkdown`):** Order is now (1) Best Performing Version block, (2) Improve Winner numbered steps, (3) Fix Across All Versions numbered steps, (4) Rankings table with scoring context, (5) Decision Details, (6) All Versions Breakdown (when deep analysis available).

---

## comp-v6.7.3 — Winner Decision Enforcement

**Scoring Version:** `comp-v6.7.3`
**Files changed:**
- `src/services/api/comprehensiveScoring.ts` — SCORING_VERSION bump, validation update, prompt rewrite, fallback update
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` — fallback version bump

**No changes to:** scores, ranking, table, breakdown cards, exports.

### decisionSummary — New Mandatory Structure

**Winner:**
> "[Winner] wins because it [specific strength], while others [specific weakness]"

**Non-winner:**
> "[Version] lacks [specific element] compared to alternatives that [specific strength]"

### Banned Vague Terms (hard-blocked in validation)

The following terms are unconditionally banned from `decisionSummary` and `decisionReason`:
`moderate`, `decent`, `good`, `solid`

Required replacements: `"lacks [specific element]"`, `"reduces [specific effect]"`, `"weakens [specific outcome]"`

### decisionReason — New Mandatory Structure

**Winner:** "It outperforms alternatives by [mechanism], while competitors fail to [missing capability]"
**Non-winner:** "Falls short of the winner by lacking [specific element], while the top version [specific mechanism]"

### Validation Changes

- Word limit raised: 18 → 30 words
- `decisionSummary` now requires comparative clause: `"while others..."` or `"compared to alternatives..."`
- Vague term ban is unconditional (was previously only enforced when comparison was absent)
- `DECISION_BANNED_VAGUE` constant added: `['moderate', 'decent', 'good', 'solid']`
- `DECISION_SUMMARY_COMPARATIVE_RE` added; `DECISION_COMPARATIVE_RE` renamed to `DECISION_REASON_COMPARATIVE_RE`
- Parser trim limit raised: 12 → 30 words
- All fallback strings updated to comply with new structure

---

## HTML & Markdown Export — Comprehensive Analysis Parity Fix

**Files changed:**
- `src/utils/enhancedExports.ts`

**Problem:** HTML and Markdown exports contained redundant sections not present in the app's Comprehensive Analysis view:
- A standalone "Best Performing Version" block (`generateOverallRecommendationHtml`) was prepended before the main analysis
- An old-format comparison table (`generateComparisonHtml` / `comparisonContent`) appeared before the scoring table
- The Markdown export included an old "Overall Recommendation" section using legacy fields (`bestForMarketing`, `bestForClarity`, `bestForSimplicity`) and a second comparison table block

**Changes made:**
1. HTML export now calls only `generateBestVersionAnalysisHtml` + `generateAllVersionsBreakdownHtml` — matching exactly what the app renders
2. Footer text (score explanation) moved to appear right after the scores table and before "Improve Winner", matching the app's layout order
3. "Improve Winner" and "Fix Across All Versions" section backgrounds corrected: background color is now applied to the outer container, not the header row — matching the app's Tailwind styling
4. Markdown export now skips the old "Overall Recommendation" and old comparison table sections — only the structured scoring table, winner block, decision details, Improve Winner, Fix Across All, and All Versions Breakdown are output

---

## comp-v6.7.2 — Winner Decision Upgrade

**Scoring Version:** `comp-v6.7.2`
**Files changed:**
- `src/services/api/comprehensiveScoring.ts` — SCORING_VERSION bump, prompt rewrite, validation update, fallback update
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` — fallback version bump

**No changes to:** scoring, ranking, table, breakdown cards, exports.

### Goal
Make the Winner Block feel like a final verdict, not a description. Replace descriptive/hedging language with assertive, outcome-oriented, comparative sentences.

### 1. decisionSummary — New Style

| Old style | New style |
|-----------|-----------|
| "Strong structure and CTA, but differentiation is moderate" | "Best balance of clarity and conversion focus, outperforming others that lack a strong CTA or clear structure" |

**Rules:**
- Assertive, outcome-oriented, comparative — 1 sentence, max 18 words
- Must use: "outperforming others that…", "while others lack…", or "compared to versions with…"
- Must include an anchor term (CTA, structure, differentiation, audience fit, positioning, credibility)
- Banned: "but", "however", "moderate", vague qualifiers

**Format (winner):** `[Primary strength], outperforming others that [key weakness in others]`
**Format (non-winner):** `[Primary weakness] compared to versions that [strength of top version]`

### 2. decisionReason — New Style

| Old style | New style |
|-----------|-----------|
| "Ranks highest due to clear structure and strong CTA, though differentiation is only moderate" | "It outperforms alternatives by combining conversion-focused structure and a decisive CTA, while others fall short on differentiation" |

**Rules:**
- Exactly 1 sentence using comparative framing
- Must use: "outperforms alternatives by…", "falls short of the winner by…", or "while others fall short in…"
- Must name specific dimensions (CTA, clarity, differentiation, structure, audience fit, credibility)
- Banned: ranking position language ("Ranks 1st"), "but", "however", "moderate", "though"

**Format (winner):** `It outperforms alternatives by combining [X + Y], while others fall short in [Z]`
**Format (non-winner):** `Falls short of the winner by lacking [X], while the top version combines [Y + Z]`

### 3. Hedging Language Removed

| Removed | Replaced with |
|---------|---------------|
| "but" | "while others…" |
| "however" | "compared to…" |
| "moderate" | "outperforms…" |
| "though" | "while others fall short in…" |
| "Ranks 1st / Ranks highest" | comparative outcome framing |

### 4. Validation Updated

| Old rule | New rule |
|----------|----------|
| `DECISION_RANKING_RE` — required "Ranks 1st/highest/lower" | `DECISION_COMPARATIVE_RE` — requires "outperforms/while others/fall short/compared to" |
| Limiting factor check (though/but/however) | Comparative framing check replaces limiting factor |
| Max 12 words on decisionSummary | Max 18 words (longer comparative sentence allowed) |
| Generic adjective check required "but" | Generic adjective check now allows "while others"/"outperforms" |

---

## comp-v6.7.1 — Final UI Cleanup & Hierarchy Fix

**Scoring Version:** `comp-v6.7.1`
**Files changed:**
- `src/services/api/comprehensiveScoring.ts` — SCORING_VERSION bump
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` — fallback version bump
- `src/components/results/ComprehensiveComparisonTable.tsx` — table and expandable section cleanup
- `src/utils/enhancedExports.ts` — HTML table + markdown "Best Version Analysis" removal

### Goal
Reduce cognitive load further with zero changes to scoring, ranking, insights, or actions. The output structure becomes: **Winner Block → Score Table → Improve Winner → Fix Across All Versions → All Versions Breakdown**.

### 1. Duplicate Winner Block Removed

The old "Comprehensive Analysis" / "Winner Summary" repeated block that appeared after the score table was removed. The **top Winner Block** (green banner) is now the single authoritative place that shows the winner's name, score, Decision badge, and "Why it wins" text.

### 2. Score Table Simplified to Scan-Only

The table now contains exactly four columns:

| Option | Final Score | Δ vs Best | % Improved (if baseline) |

Removed from table: `decisionSummary`, `decisionReason`, `bestUseCase`, `insight`, `action`, and the "Best Use Case" column header. All detail lives exclusively in the "All Versions Breakdown" cards.

### 3. Key Insight + What to do Moved to Breakdown Cards Only

The "Key Insight" and "What to do" blocks no longer appear inside score table cells. They are rendered only inside the per-version cards in the "All Versions Breakdown" expandable section.

### 4. "Best Version Analysis" Section Removed

The expandable section previously had an h3 "Best Version Analysis" header, an "X outputs analyzed" subtitle line, and an "Overall Verdict" block — all redundant with the top Winner Block. These were removed entirely. The expandable section now opens directly to the "All Versions Breakdown" per-version cards.

### 5. Export Alignment (HTML + Markdown)

- **HTML export** (`generateBestVersionAnalysisHtml`): "Best Use Case" column removed from table header and all table rows; entire "Best Version Analysis" section block (heading + Overall Verdict) deleted.
- **Markdown export** (`formatAsEnhancedMarkdown`): "Best Use Case" column removed from table; `insight`/`action` removed from "Decision Details"; `## Best Version Analysis` + `overallVerdict` section deleted.

### 6. Final Visual Order

1. Top Winner Block (green — Best Performing Version)
2. Score Table (Option / Score / Δ vs Best / % Improved)
3. Footer legend
4. Improve Winner (numbered steps for winner only)
5. Fix Across All Versions (numbered items applying to all)
6. "View detailed breakdown" toggle
7. All Versions Breakdown (per-version deep analysis cards)

---

## comp-v6.7 — Presentation Layer (UI Clarity)

**Scoring Version:** `comp-v6.7`
**Files changed:**
- `src/services/api/comprehensiveScoring.ts` — SCORING_VERSION bump
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` — fallback version bump
- `src/components/results/ComprehensiveComparisonTable.tsx` — full presentation layer rewrite
- `src/utils/enhancedExports.ts` — HTML + Markdown exports aligned

### Goal
Make comparison output instantly understandable in under 3 seconds. No changes to scoring, ranking, insights, or actions.

### 1. Top Winner Block (NEW)

A prominent green banner is now the very first thing rendered inside the Comprehensive Analysis card, above the score table. It always shows:
- Green header bar: "Best Performing Version"
- Version name + score (XX/100)
- **Decision** label with the `decisionSummary` badge
- **Why it wins** label with the `decisionReason` text

### 2. Duplication Removed

Removed the old "Winner Summary + Final Recommendation" block that appeared after the score table. The only places that identify the winner are now: the top winner block and the "Winner" badge in the score table row.

### 3. Action Sections Renamed and Made Always Visible

Both action sections are now always visible (not buried in the collapsible section):

| Old label | New label | Source field |
|-----------|-----------|--------------|
| Next Steps for Winner | **Improve Winner** | `finalRecommendation.nextSteps` |
| Priority Actions | **Fix Across All Versions** | `comparison.priorityActions[]` |

"Fix Across All Versions" was previously only visible inside the expanded deep-analysis section. It now appears alongside "Improve Winner" immediately below the score table.

### 4. Visual Order

1. Top Winner Block (Best Performing Version)
2. Score Table
3. Footer legend
4. Improve Winner (3 numbered steps)
5. Fix Across All Versions (3 numbered items)
6. "View detailed breakdown" toggle
7. Best Version Analysis (expandable)

### 5. Label Improvements

| Old | New |
|-----|-----|
| ⚡ icon with no label | ⚡ **Key Insight** |
| → icon with no label | → **What to do** |
| "Insight" heading in deep cards | **Key Insight** |
| "Action" heading in deep cards | **What to do** |

### 6. Export Alignment (HTML + Markdown)

HTML and Markdown exports updated to match the new UI structure and label names throughout.

---

## Markdown Export — Comparison Output Parity Fix

**Location:** `src/utils/enhancedExports.ts` — `formatAsEnhancedMarkdown`

### Problem

The `.md` export was missing all the same sections as the HTML export, plus a structural bug caused the "Summary only" fallback text to appear even for versions that had successful deep analysis.

### Fixes applied

**Decision Details section (new, after scoring table)**
- Added a "### Decision Details" block after the comprehensive analysis table
- For each row that has any of `decisionSummary`, `decisionReason`, `insight`, or `action`, a named sub-block is rendered
- `decisionSummary` renders as a blockquote; `decisionReason` follows it on the next line (also in blockquote)
- `insight` renders with a ⚡ prefix and italic styling
- `action` renders with a → prefix

**Winner summary section (new)**
- Added `## Recommended: [WinnerName] (score/100)` heading after the decision details
- Shows `finalRecommendation.why` text (falls back to `bestUseCase` if not present)
- Shows "### Next Steps for Winner" numbered list from `finalRecommendation.nextSteps`

**Priority Actions section (new)**
- Added `### Priority Actions` numbered list from `comparison.priorityActions[].title` and `.reason`

**All Versions Breakdown — insight + action per card**
- After each version's strategic recommendation, `row.insight` and `row.action` are now rendered
- Insight uses ⚡ prefix, action uses → prefix

**Structural bug fix**
- The `else if / else` chain for error/fallback analysis states was accidentally broken into two separate `if` blocks, causing the "Summary only" fallback to appear even on versions with successful analysis. Restored correct `if / else if / else` chain.

---

## HTML Export — Comparison Output Parity Fix

**Location:** `src/utils/enhancedExports.ts`

### Problem

The HTML export did not reflect what the UI rendered. Multiple sections present in `ComprehensiveComparisonTable.tsx` were either missing entirely or using stale/wrong data sources in the export functions.

### Fixes applied

**`generateBestVersionAnalysisHtml` — per-row cells (Best Use Case column)**
- Added `decisionSummary` colored badge (green background if winner, gray otherwise) matching the UI badge at `ComprehensiveComparisonTable.tsx:507-522`
- Added `decisionReason` subscript text below the badge
- Added `insight` line with lightning bolt symbol (amber color)
- Added `action` line with arrow symbol (blue color)

**`generateBestVersionAnalysisHtml` — winner summary block (new, after table)**
- Added a green-bordered winner summary box matching `ComprehensiveComparisonTable.tsx:556-598`
- Shows winner name, score/100, "Recommended" label, and `finalRecommendation.why` text
- Shows numbered "Next Steps for Winner" list from `finalRecommendation.nextSteps` (only when all 3 steps are present)

**`generateBestVersionAnalysisHtml` — Priority Actions section (new)**
- Added amber-bordered "Priority Actions" block matching `ComprehensiveComparisonTable.tsx:681-707`
- Renders numbered list of `comparison.priorityActions[].title` + `reason`

**`generateAllVersionsBreakdownHtml` — per-version deep analysis cards**
- Added `insight` and `action` from `row` data at the bottom of each version card
- Matches the `ComprehensiveComparisonTable.tsx:967-988` rendering for deep analysis cards

**`generateOverallRecommendationHtml` — modernised to use current data model**
- Previous implementation used legacy fields (`bestForMarketing`, `bestForClarity`, `bestForSimplicity`) that no longer exist on `ComparisonResult`, causing this function to always return `''`
- Replaced with `finalRecommendation` and `winnerRow` data, now renders a clean winner callout at the top of the export with winner name, score, "Recommended" label, and `finalRecommendation.why` text

---

## Scoring Engine — Decision Layer Rendering Fix (comp-v6.6.2)

**Location:** `src/services/api/comprehensiveScoring.ts`, `src/hooks/useFormState.ts`, `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts`, `src/components/results/ComprehensiveComparisonTable.tsx`
**Version:** `comp-v6.6.2` (rendering fix — no scoring, ranking, or prompt changes)

### Root Cause

The Decision Layer fields (`decisionSummary`, `decisionReason`, `finalRecommendation`) were generated correctly during fresh scoring but were **absent from session-restored results**. When a user loaded a saved output, the `comparisonResult` was read directly from `output_data` in the database without passing through `validateAndRepairResult`, which is only called inside `scoreAndCompareVersions`. Any result saved before the decision layer was introduced had no decision fields, so the UI conditional guards (`row.decisionSummary && ...`) silently suppressed all decision layer rendering.

### Exported `repairDecisionLayerFields`

A new exported function (`comprehensiveScoring.ts`) repairs a `ComparisonResult` in-place:
- Injects `DECISION_SUMMARY_FALLBACK` on any row with a missing or empty `decisionSummary`
- Injects `DECISION_REASON_FALLBACK` on any row with a missing or empty `decisionReason`
- Injects a full `finalRecommendation` if absent, keyed to the actual winner row
- Repairs partial `finalRecommendation` (missing `why`, missing/invalid `nextSteps`)
- Safe to call on any `ComparisonResult` regardless of age or origin

### Fallback strings updated (v6.6.2)

| Field | Value |
|---|---|
| `decisionSummary` | "Clear structure and strong CTA, but limited differentiation" |
| `decisionReason` | "Ranks here due to balanced structure but weaker differentiation" |
| `finalRecommendation.why` | "Top version balances clarity, structure, and trust most effectively" |
| `nextSteps[0]` | "Strengthen differentiation with one unique claim" |
| `nextSteps[1]` | "Clarify the primary CTA" |
| `nextSteps[2]` | "Add one proof point to increase credibility" |

### Repair call sites

| Location | When applied |
|---|---|
| `useFormState.ts` — `loadFormStateFromSavedOutput` | On every session/saved-output restore |
| `useGeneration.ts` — after `generateUnifiedComparison` | After every fresh scoring run |
| `useGeneration.ts` — after `generateUnifiedComparison` (refresh-rescore path) | After context-change rescore with original |

### UI Binding Check

`ComprehensiveComparisonTable` runs a `useEffect` on every `comparison` change. If any row is missing `decisionSummary` or `decisionReason`, or `finalRecommendation` is absent/malformed, it logs a `console.error` tagged `[comp-v6.6.2]` for immediate visibility in dev tools.

### cache context key correction

The hardcoded `'comp-v4'` scoring version in the cache context key (`useGeneration.ts`) has been updated to `'comp-v6.6.2'` to correctly align cache invalidation with the current scoring version.

---

## Scoring Engine — Decision Layer Hard Enforcement (comp-v6.6.1)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version:** `comp-v6.6.1` (enforcement patch — no scoring, ranking, or UI changes)

### Overview

comp-v6.6.1 hardens the decision layer from v6.6 with a mandatory validation pass and up to 2 retry attempts, ensuring all output is specific, grounded, and non-generic before reaching the UI.

### Hard Validation: `validateDecisionLayerOutput`

Runs after every LLM parse attempt. Returns failure reason string or `null` if all checks pass.

**Per-version checks:**
- `decisionSummary` must be present and ≤ 12 words
- Banned exact phrases: `"strong copy"`, `"good clarity"`, `"works well"`, `"effective messaging"`, `"solid version"`, `"good copy"`
- Unqualified generic adjectives (`good/solid/decent/effective`) rejected unless followed by `"but"`
- At least one anchor term required: `CTA`, `structure`, `differentiation`, `audience`, `positioning`, `credibility`
- `decisionReason` must contain an explicit ranking reference (`ranks highest/lowest/higher/lower/1st/2nd`, `scores higher/lower`, `positioned above/below`)
- `decisionReason` must contain a limiting factor word (`though`, `although`, `despite`, `but`, `limited`, `weak`, `lacks`, `narrow`, `moderate`, `generic`, `unclear`)

**Global checks:**
- `finalRecommendation.why` present and non-empty
- `finalRecommendation.nextSteps` exactly 3 items

### Retry Loop

Max 2 passes. On validation failure, logs the failure reason and retries. If both fail, uses contextual fallback strings that pass validation.

### Fallback Strings (contextual, v6.6.1)

| Role | decisionSummary | decisionReason |
|---|---|---|
| Winner | "Strong structure and CTA, but differentiation is moderate" | "Ranks highest due to clear structure and strong CTA, though differentiation remains moderate" |
| Non-winner | "Ranks N — clear structure, but CTA and differentiation need work" | "Ranks lower due to weaker differentiation and less specific CTA, despite adequate structure" |

### Separation from priorityActions

`finalRecommendation.nextSteps` must target the winning version only and must not duplicate cross-version `priorityActions`. Enforced in prompt and documented as a hard rule.

---

## Scoring Engine — Decision Layer (comp-v6.6)

**Location:** `src/services/api/comprehensiveScoring.ts`, `src/components/results/ComprehensiveComparisonTable.tsx`
**Version:** `comp-v6.6` (additive clarity patch — zero scoring, ranking, or winner changes)

### Overview

comp-v6.6 adds a thin decision layer that makes comparison outputs instantly understandable without modifying any existing scoring logic.

### New Fields

#### Per-Version (added to each row in `ComparisonResult.rows`)

| Field | Type | Max Length | Description |
|---|---|---|---|
| `decisionSummary` | `string` | 12 words | Core strength or limitation of the version — specific, non-hedging |
| `decisionReason` | `string` | 1 sentence | Explains why the version ranks where it does, referencing clarity, CTA, differentiation, structure, or audience fit |

#### Global (top-level `ComparisonResult`)

| Field | Type | Description |
|---|---|---|
| `finalRecommendation.winnerId` | `string` | Version ID of the winning version |
| `finalRecommendation.why` | `string` | One sentence justifying the winner |
| `finalRecommendation.nextSteps` | `[string, string, string]` | Exactly 3 actionable improvements for the winning version only |

### New Type

```typescript
export interface FinalRecommendation {
  winnerId: string;
  why: string;
  nextSteps: [string, string, string];
}
```

### Implementation

- `generateDecisionLayer()` — new async function that calls LLM with version summaries and returns per-version decisions and global recommendation
- Called in `scoreAndCompareVersions()` after `generatePriorityActions()`, before `validateAndRepairResult()`
- `validateAndRepairResult()` extended to inject fallbacks for all new fields
- Runs only when 2+ versions are scored; single-version comparisons skip the call

### Fallbacks

| Field | Fallback Value |
|---|---|
| `decisionSummary` | "Clear structure, but lacks strong differentiation" |
| `decisionReason` | "Ranks here due to balanced structure but limited differentiation" |
| `finalRecommendation.why` | "Top version balances clarity, structure, and trust most effectively" |
| `finalRecommendation.nextSteps[0]` | "Strengthen differentiation with one unique claim" |
| `finalRecommendation.nextSteps[1]` | "Clarify the primary CTA" |
| `finalRecommendation.nextSteps[2]` | "Add one proof point to increase credibility" |

### UI Rendering

- `decisionSummary` rendered as a compact badge tag at the top of each table row's "Best Use Case" cell; green for winner, gray for others
- `decisionReason` rendered as small caption text below the badge
- `finalRecommendation.why` shown in the winner summary card header (replaces or supplements prior text)
- `finalRecommendation.nextSteps` shown as a numbered list below the winner summary card under "Next Steps for Winner"

### Non-Interference Guarantee

This patch does NOT modify:
- scores (finalScore or any subscores)
- ranking or winner determination
- existing `insight`, `action`, `bestUseCase`, or `weakestReason` fields
- `priorityActions`
- tie-breaking logic
- cache keys or cache invalidation

---

## Scoring Engine — Data Contract Lock (comp-v6.5.3)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version:** `comp-v6.5.3` (structure-only patch — no scoring, logic, or ranking changes)

### Fallback Values Updated

| Field | Value |
|---|---|
| Score (missing/0) | 78 |
| Explanation | "Clear structure and intent, but lacks a strong differentiator." |
| Insight | "Positioning is understandable, but not yet distinctive." |
| Action | "Strengthen the core value proposition and clarify the CTA." |
| Priority Action 1 | "Clarify the main CTA" → Improves conversion focus |
| Priority Action 2 | "Add a concrete proof point" → Builds trust and credibility |
| Priority Action 3 | "Sharpen differentiation" → Improves positioning clarity |

### `validateAndRepairResult` Extended

Now also guards `weakestReason` and `bestUseCase` (explanation fields) — any empty/missing value is replaced with `EXPLANATION_FALLBACK`. Score check changed from `=== 0` to `<= 0` to catch NaN and negative values.

### Single-Version Path Coverage

`validateAndRepairResult` is now called on the single-version fast path (`versions.length === 1`) — ensuring the same repair guarantees apply even when only one version is being evaluated.

### Frontend Render Confirmed Unconditional

All five insight/action/priorityActions render sites in `ComprehensiveComparisonTable.tsx` use direct property access with no optional chaining or length guards. No changes required.

---

## Re-Score Button — Results Panel

**Location:** `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx`

A **Re-Score** action is now displayed alongside the existing "Change scoring context" button whenever a comparison result is present.

### Behaviour

- Clicking **Re-Score** immediately re-runs the full comprehensive scoring pass against all current output versions, using the existing locked scoring context — no modal is opened.
- The `RefreshCw` icon animates (`animate-spin`) while scoring is in progress.
- Both buttons are disabled (`disabled:opacity-40`) while any loading state is active.
- A thin `|` separator visually groups the two actions without adding visual weight.

### Layout

```
[ Re-Score ]  |  [ Change scoring context ]
```

Both actions sit right-aligned above the `ComprehensiveComparisonTable`.

### Implementation Detail

Re-Score calls the existing `handleRescoreWithUpdatedChanges` handler, which invokes `onCompareWithGrok(false, comparisonResult.scoringContext)` — reusing the currently active scoring context with no changes.

---

## Scoring Engine — Stability Lock (comp-v6.5.2)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version:** `comp-v6.5.2` (non-expansion patch — no scoring philosophy changes)

- Score failure lock: error catch returns `73` fallback (not `0`), "Scoring failed" text removed, retry wrapper added
- `enforceTopTierSeparation()`: detects 85+ ties, sorts by ATA→CTA→differentiation→trust, forces +1 separation
- `validateAndRepairResult()`: pre-return pass that repairs zero scores, missing insight/action, bad priorityActions length, 85+ ties, wrong winner count
- DETERMINISTIC_FALLBACK updated to spec: Clarify CTA / Add proof point / Align tone
- Fallback strings updated: insight = "Clear structure, but missing a sharper differentiator." / action = "Strengthen the primary CTA and add one proof point to improve conversion confidence."

---

## Scoring Engine — Output Enforcement Fix (comp-v6.5.1)

**Location:** `src/services/api/comprehensiveScoring.ts`, `src/components/results/ComprehensiveComparisonTable.tsx`
**Version:** `comp-v6.5.1`

- `insight` and `action` now required strings in all interfaces — never undefined
- `priorityActions` now required array in `ComparisonResult` — never null/optional
- Fallback constants `INSIGHT_FALLBACK` and `ACTION_FALLBACK` guarantee non-empty fields on any parse/API failure
- 18-word cap enforced client-side via word-split truncation for insight
- Error return path now includes insight + action fallbacks
- Single-version path now includes insight + action fields
- `aggregateScores` returns `priorityActions: []` as initial required value
- `attemptParse` now rejects partial arrays (must be exactly 3) — falls to DETERMINISTIC_FALLBACK immediately
- `DETERMINISTIC_FALLBACK` updated to WHAT→WHY format
- UI: Priority Actions section always renders (conditional gate removed)
- UI: insight and action always render in table rows and deep analysis cards (all `&&` gates removed)

---

## Scoring Engine — Decisive Insight & Action Layer (comp-v6.5 refinement)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version:** `comp-v6.5` (non-breaking refinement — no scoring logic changed)
**Scope:** Insight sharpness, action decisiveness, Priority Actions quality enforcement

This patch does NOT modify scoring, ranking, fit penalties, or existing rules v5.6–v6.4.1. It only improves the quality and precision of Insight text, per-version Action text, and Priority Actions output.

### Insight Layer (Rules BA–BE — sharpened)

- **Rule BA** — Insight = single decisive takeaway. Must answer "What is the ONE thing that matters most?" Word cap reduced from 20 to **18 words**. No multiple ideas, no summaries.
- **Rule BB** — Non-removability test: if Insight can be removed without losing information already in the explanation, it is invalid and must be regenerated.
- **Rule BC** — Must compress, sharpen, and elevate — not summarize. If it reads like a polished explanation, it fails.
- **Rule BD** — Generic language forbidden. Insight must be non-transferable: only true for this specific version.
- **Rule BE** — Must be memorable and quotable — a senior strategist must retain it after closing the report.

### Action Layer (Rules BF–BK + CN–CQ — impact enforcement)

- **Rule BF** — Forbidden low-impact actions: "Improve clarity", "Refine wording", "Enhance engagement", "Make it more compelling", "Consider improving the CTA" — always invalid regardless of context.
- **Rule BG** — Required format: `[WHAT to change] → [WHY it improves performance]`. Both components are mandatory.
- **Rule CN** — Impact test (mandatory self-check): "If only this change is made, does performance improve significantly?" If no → reject and replace.
- **Rule CO** — Action must target a specific, named weakness from the version evaluation.
- **Rule CP** — Per-version actions must cover different dimensions — no repeating the same fix type.
- **Rule CQ** — Priority Actions must be traceable to named patterns across versions or a named limitation of the top-ranked version.

### Synthesis Prompt Update

Enforcement rules updated from `comp-v6.4.1` to `comp-v6.5`. Added:
- Impact test requirement for each priority action
- Explicit forbidden phrases list
- WHAT→WHY format requirement
- Impact ordering: 1=highest, 2=medium, 3=supporting
- Dimension diversity requirement (3 priorities must cover different dimensions)
- Self-check step: count + format + impact + order verification before returning

### Response Format Hints Updated

- `insight`: max 18 words (was 20), labeled "non-removable, non-generic, quotable"
- `action`: labeled with WHAT→WHY format and impact test requirement

---

## Scoring Engine — Final Stabilization Patch (comp-v6.5)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v6.5`
**Scope:** Render guarantee, fit dominance hard lock, mid-tier calibration, output completeness enforcement

This is the final stabilization patch for the comprehensive scoring engine. Scoring logic, ranking, insights, and individual actions are not changed — all changes are enforcement, calibration, and render guarantees.

### 1 — Render Guarantee (Rules CA–CE)

Priority Actions are now guaranteed to render in all circumstances.

- **Rule CA** — Priority Actions are MANDATORY OUTPUT. Omission is invalid.
- **Rule CB** — Report is INVALID if Priority Actions block is missing.
- **Rule CC** — Priority Actions render for single-version analysis (threshold already lowered to `>= 1` in v6.4.1).
- **Rule CD** — If LLM synthesis fails after retries, system falls back to deterministic priorities.
- **Rule CE** — Empty array `[]` is FORBIDDEN.

Deterministic fallback (fires when all LLM attempts fail or produce empty results):
1. "Improve primary CTA clarity" — Weak or multiple CTAs reduce conversion focus
2. "Add one quantified proof point" — Lack of measurable results weakens credibility
3. "Align tone with target audience" — Misaligned tone reduces trust and positioning strength

### 2 — Fit Dominance Hard Lock (Rules CF–CI)

Numeric score caps now enforce what the prose rules already stated:

- **Rule CF** — Tone mismatch penalty ≥ -2 → finalScore ceiling **83** (hard cap)
- **Rule CG** — Tone mismatch penalty ≥ -3 → finalScore ceiling **81** (hard cap, overrides all boosts)
- **Rule CH** — Enterprise aggression (abrasive or pressure-driven phrasing for B2B audiences) → automatic minimum **-3** to `audienceToneAlignment`, stacking with other penalties
- **Rule CI** — "Edgy but strong" copy (high persuasion + high emotion + tone misaligned) MUST rank below well-aligned alternatives in B2B/enterprise contexts. Absolute for these audience types.

These caps are embedded in the scoring system prompt and internal check validation (RULES S–CM).

### 3 — Mid-Tier Calibration (Rules CJ–CL)

- **Rule CJ** — Scores 80–84 require explicit separation logic in explanation
- **Rule CK** — Versions within 1 point of each other MUST name the deciding factor explicitly; generic phrasing is prohibited
- **Rule CL** — Soft tie language ("both versions perform similarly") is FORBIDDEN in the 80–84 range. System must commit to a decisive ranking.

### 4 — Output Completeness Enforcement (Rule CM)

Before finalizing any output, system must self-verify:
- Score table exists
- All versions analyzed
- Each version has: explanation + insight + action
- Priority Actions block exists with exactly 3 items

**Rule CM** — If ANY section is missing → output is invalid → must regenerate.

### 5 — Internal Check Version

Updated from `INTERNAL CHECK v6.4` to `INTERNAL CHECK v6.5`. Validates RULES F, L, R, S–CM before output.

---

## Scoring Engine — Priority Actions Rendering Fix (comp-v6.4.1)

**Location:** `src/services/api/comprehensiveScoring.ts` — `generatePriorityActions()`
**Version bump:** `comp-v6.4.1`

This is a rendering-only patch. Scoring, ranking, insights, actions, and explanations are unchanged.

### Root Causes Fixed

Three code-level defects prevented Priority Actions from rendering reliably:

1. **Threshold gate** — `generatePriorityActions` only fired when `allScores.length >= 2`. Single-version analyses never produced a Priority Actions block. Fixed: threshold changed to `>= 1`.
2. **Silent failure** — On any LLM error or malformed JSON, the function returned `[]`. The UI condition `{comparison.priorityActions && comparison.priorityActions.length > 0}` suppressed the section entirely. Fixed: added retry logic (up to 2 attempts before giving up).
3. **Weak prompt enforcement** — The synthesis prompt had no explicit mandate forcing the LLM to always output exactly 3 priorities. Fixed: added ENFORCEMENT RULES block to synthesis prompt.

### Enforcement Rules Added to Synthesis Prompt

- `priorityActions` field is MANDATORY — omitting it is a formatting error
- Returning an empty array is invalid
- Self-check required before responding: count must equal 3
- If patterns are unclear, generate the 3 most impactful improvements for the highest-scoring version
- Response without exactly 3 priorities is incomplete and must be corrected

### Retry Architecture

- `attemptParse()` helper extracted for reuse
- First attempt: if result has exactly 3 items → return immediately
- Second attempt: if first result is incomplete, retry once
- If both fail on exception → final fallback retry, then degrade gracefully to `[]`

### Version Note

This patch is numbered comp-v6.4.1 (not comp-v6.3.1) because it layers on top of the Fit Dominance Enforcement (v6.4) delivered in the same release cycle.

---

## Scoring Engine — Fit Dominance Enforcement (comp-v6.4)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v6.4`

Audience fit is now a hard ranking gate. A version cannot hold the #1 position when a well-aligned alternative exists, regardless of its persuasion, emotion, or CTA scores.

### Rules BS–BW

- **BS — Fit Dominance Override:** If a version has a strong audience/tone mismatch (audienceToneAlignment penalty ≥ 3 pts below baseline), it is ineligible for #1 rank. Rhetorical strength cannot compensate.
- **BT — Enterprise Safety Constraint:** For B2B/enterprise/professional-services audiences, aggressive, abrasive, or hype-driven language mandates a minimum -3 deduction to audienceToneAlignment — non-negotiable.
- **BU — Tone Incompatibility Detection:** The following trigger -3 to -5 audienceToneAlignment penalty for enterprise audiences:
  - "one throat to choke" or equivalent pressure idioms
  - "so damn" or casual/aggressive intensifiers
  - "going out of business" or existential-threat urgency framing
  - Urgency phrases implying desperation or manipulation
- **BV — Fit Overrides Persuasion in Ranking:** audienceToneAlignment is a ranking gate. A misaligned version is ineligible for #1 when an aligned alternative exists.
- **BW — Winner Eligibility — Fit Required:** To be declared #1, a version must be well-aligned with the stated audience AND have audienceToneAlignment ≥ 72 for enterprise contexts.

### What changes at runtime

- Hormozi-style, pressure-heavy, or casualised enterprise copy is automatically ranked below strategically aligned alternatives.
- ATA score is elevated as the gating signal — persuasion/emotion/CTA can no longer override a strong fit penalty.
- System message updated with explicit FIT DOMINANCE enforcement note.
- ABSOLUTE RULES updated with 5 new enforcement lines referencing Rules BS, BT, BU, BV, BW.
- Internal check updated: v6.4 now validates RULES F, L, R, S–BW.

---

## Scoring Engine — Prioritization Layer (comp-v6.3)

**Location:** `src/services/api/comprehensiveScoring.ts`, `src/components/results/ComprehensiveComparisonTable.tsx`
**Version bump:** `comp-v6.3`

Cross-version synthesis layer that generates exactly 3 "Priority Actions" — ordered by impact — after all versions are scored. Does not affect scoring, rankings, Insights, or per-version Actions.

### What gets added

After all versions are evaluated, a separate lightweight LLM call synthesises the weakest dimensions, Insights, and Actions across all versions into exactly 3 cross-version priorities. Each priority has a `title` (what to fix) and `reason` (why it matters). Priorities are ordered highest impact first and must cover different dimensions — no repetition of the same fix type.

### Rules BL–BR

- **BL** — `priorityActions` generated exactly once per output, not per version.
- **BM** — Must synthesize patterns across ALL versions. Verbatim repetition of per-version Actions is prohibited.
- **BN** — Exactly 3 priorities. No more, no fewer. Violation is a formatting error.
- **BO** — Each priority targets improvements affecting multiple versions or the top-ranked version's limiting factor.
- **BP** — Ordered by impact: most important first, least important third.
- **BQ** — Each priority must include both `title` and `reason`. Both are mandatory.
- **BR** — Concrete and actionable. No abstract language.

### Data flow

1. `VersionScoreResult.insight` + `action` + `weakestDimension` + `weakestReason` fed into synthesis prompt
2. `generatePriorityActions(scores, model)` — separate LLM call (`makeApiRequestWithFallback`, temp 0.3, 400 tokens)
3. `PriorityAction { title: string; reason: string }` — new exported interface
4. `ComparisonResult.priorityActions?: PriorityAction[]` — attached after aggregation
5. Only triggered when `allScores.length >= 2` (no Priority Actions for single-version comparisons)
6. Graceful degradation — on any error, returns `[]` without blocking the comparison result

### UI placement

Sky-blue numbered list rendered between the Overall Verdict callout and the "All Versions Breakdown" section. Each item shows a numbered badge, a bold title, and an indented reason prefixed with `→`.

---

## Scoring Engine — Action Layer (comp-v6.2)

**Location:** `src/services/api/comprehensiveScoring.ts`, `src/components/results/ComprehensiveComparisonTable.tsx`
**Version bump:** `comp-v6.2`

Non-scoring enhancement that adds one "Action" line per version — a single, concrete, immediately-implementable instruction telling the user exactly what to change next. Does not affect scores, rankings, explanations, or Insight behavior.

### What gets added

Each version includes an `"action"` field: one sentence, maximum 18 words, describing the single highest-impact change the user can make right now. Action must be specific and executable — what to add, remove, replace, or rewrite. It must align with and directly address the core issue identified in the Insight.

Good examples: "Replace 'Contact Us' with 'Book a 30-minute strategy call' as the primary CTA." / "Add one quantified result (e.g., % growth) to strengthen credibility in the hero section." / "Remove aggressive phrasing and replace with authority-driven language for enterprise trust."

### Rules BF–BK

- **BF** — Exactly one action per version (max 18 words, one sentence). Mandatory field.
- **BG** — Action must be concrete and immediately implementable — describes a specific executable change.
- **BH** — Action must focus on the single highest-impact improvement only — no multiple suggestions.
- **BI** — Action must be specific, not vague. Generic advice ("improve clarity") is prohibited.
- **BJ** — One sentence only. Maximum 18 words. Exceeding 18 words is a formatting violation.
- **BK** — Action must align with and directly address the core issue identified in the Insight.

### Data flow

1. `comprehensiveScoring.ts` — JSON response format extended with `"action"` field
2. `VersionScoreResult.action?: string` — type updated
3. `ComparisonResult.rows[].action?: string` — type updated
4. Aggregation (`aggregateScores`) — passes action through to rows
5. `CachedVersionScore` — inherits action via `VersionScoreResult` extension

### UI placement

**Table:** Action appears beneath Insight in each table row — blue arrow icon, blue semi-bold text.

**Breakdown card:** Action appears as a distinct blue-bordered callout block immediately below Insight, after Strategic Recommendation, before the next version card.

---

## Scoring Engine — Insight Layer (comp-v6.1)

**Location:** `src/services/api/comprehensiveScoring.ts`, `src/components/results/ComprehensiveComparisonTable.tsx`
**Version bump:** `comp-v6.1`

Non-scoring enhancement that adds one "Insight" line per version — a decisive one-sentence strategic conclusion capturing why the version fundamentally succeeds or fails. Does not affect scores, rankings, or any existing evaluation logic.

### What gets added

Each version in the scoring response includes an `"insight"` field: one sentence, maximum 20 words, expressing a strategic truth about that version. The insight must highlight tension, contrast, a positioning gap, or a fundamental strength/weakness. It cannot summarize the explanation or use generic language.

Good examples: "High clarity, but lacks differentiation to justify premium positioning." / "Persuasive flow, but relies on claims without proof." / "Tone builds trust, but CTA fails to convert it into action."

### Rules BA–BE

- **BA** — Exactly one insight per version (max 20 words, one sentence). Mandatory field.
- **BB** — Insight expresses the core strategic truth — not a restatement of the explanation.
- **BC** — Insight must anchor on: CTA conflict, credibility gap, differentiation absence, tone–audience mismatch, narrative structure, or proof deficit.
- **BD** — Generic language prohibited: "strong", "clear", "effective", "good", "well-structured" without specific grounding.
- **BE** — Insight reads like a decisive expert conclusion — something a senior strategist would say out loud.

### Data flow

1. `comprehensiveScoring.ts` — JSON response format extended with `"insight"` field
2. `VersionScoreResult.insight?: string` — type updated
3. `ComparisonResult.rows[].insight?: string` — type updated
4. Aggregation (`aggregateScores`) — passes insight through to rows
5. `CachedVersionScore` — inherits insight via `VersionScoreResult` extension

### UI placement

**Table:** Insight appears beneath Best Use Case in each table row, prefixed with a lightning bolt icon, in amber italic type.

**Breakdown card:** Insight appears as an amber-bordered callout block after Strategic Recommendation, before the next version card.

---

## Scoring Engine — Explanation Quality Patch (comp-v6.0)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v6.0` (forces full cache invalidation)

Explanation quality patch stacking on all previous versions. Does not change scores or rankings. Removes vagueness, politeness bias, and explanation noise from all output. The system now writes like a senior copy strategist — every explanation is precise, grounded, and decisive.

**What changes immediately:**

Before: "Well-structured and engaging, but may not suit all audiences."
After: "Clear structure and strong CTA, but tone is misaligned for enterprise audiences, reducing credibility."

Before: "Both versions are strong, with slight differences."
After: "Version A wins due to clearer CTA and sharper positioning. Version B is structurally sound but less differentiated."

### Rule AT — No Generic Praise Language

Terms like "strong", "effective", "compelling" must always be tied to a specific reason. "Strong CTA clarity" is valid. "Strong" alone is prohibited.

### Rule AU — Every Positive Claim Must Answer "Why"

If a version is rated highly, the explanation must reference concrete elements: structure, differentiation, CTA, narrative, or audience fit. "Why it works" is mandatory, not optional.

### Rule AV — Replace Vague Qualifiers

Phrases like "may not", "can feel", "might work" must be replaced with direct assessments: "is misaligned", "reduces clarity", "weakens positioning". Hedging is not permitted.

### Rule AW — Trade-offs Must Be Explicit

Any version scoring ≤84 must clearly state what is missing or limiting performance. Vague limitation language (e.g., "not for everyone") does not satisfy this requirement.

### Rule AX — No Balanced Neutrality

"On one hand / on the other hand" framing is prohibited. The system takes a position, not presents options.

### Rule AY — Comparative Clarity Required

When multiple versions are close in score, the explanation must explicitly name the deciding factor: "clearer CTA", "more differentiated positioning", "stronger narrative arc". General comparison ("slightly better") is insufficient.

### Rule AZ — Tone Reflects Score Band

- 85–90: confident, assertive, strategic language
- 80–84: positive with a named, visible limitation
- ≤79: critical and diagnostic — specific failure modes identified

Tone–score mismatch is prohibited.

**System message** extended with senior copy strategist framing and four mandatory explanation elements: what works, why it works, what limits it, why it ranks where it does.

---

## Scoring Engine — Final Stability & Decisiveness Patch (comp-v5.9)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5.9` (forces full cache invalidation)

Final production patch stacking on v5.7 (scoring logic) and v5.8 (explanation alignment). Fixes the only remaining regression: top-tier score ties. The system now mandates a clear winner in every evaluation — no two versions at 85+ may share the same score if any qualitative distinguishing factor exists.

**Expected outcome after v5.9:**
- Two near-equal top versions: 87 vs 86, never 86 vs 86
- Winner label always matches the highest-scoring version
- Scoring reflects confident expert judgment, not conservative neutrality

### Rule AO — Winner Enforcement (No Ties at the Top)

If two or more versions score within the 85+ range and are nearly equal, the system must select a single winner. Even a minor advantage in structure, clarity, CTA strength, narrative flow, or differentiation requires a +1 score separation. Top-tier ties are prohibited.

### Rule AP — Micro-Advantage Scoring

Small but real qualitative differences (clearer CTA, tighter structure, stronger framing, better audience alignment) must translate into a +1 score difference. The system must actively search for distinguishing factors rather than defaulting to equal scores.

### Rule AQ — Anti-Flattening Safeguard

Scores must be distributed across the 85–88 range according to real differences when multiple strong versions exist. Clustering top outputs at the same score is a calibration error.

### Rule AR — Decisiveness Over Safety

When uncertainty exists between two strong versions, the system must choose the more strategically effective one. Scoring reflects judgment, not neutrality.

### Rule AS — Winner Justification Consistency

The version labeled "Winner" must have the highest numerical score. If two versions are labeled equally strong, scoring must still reflect a clear ranking order.

**ABSOLUTE RULES** updated with 5 new enforcement lines: top-tier ties prohibited, micro-advantage mandatory, no clustering at top, decisive ranking required, winner is always highest scorer.

**System message** extended to mandate clear winner selection, +1 separation for any qualitative advantage, and active expert evaluation over conservative clustering.

---

## Scoring Engine — Explanation Alignment Patch (comp-v5.8)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5.8` (forces full cache invalidation)

Stacked on top of comp-v5.7. Adds five rules that enforce alignment between the textual Best Use Case explanation and the numerical score. Prevents polished, positive-sounding phrasing from masking a meaningful penalty — so that the explanation feels as calibrated as the number to an expert reader.

**Expected outcome after v5.8:**
- Hormozi (83): explanation sounds "strong but not ideal for this audience" — not generically positive
- Musk (80): explanation sounds "limited / situational" — explicit constraint language required
- Winner (87): explanation stays confident and broadly applicable

### Rule AJ — Explanation Severity Alignment

If a version receives a fit penalty of -3 or greater, the Best Use Case must explicitly reflect limitation or conditional suitability. Language must include a qualifier such as "best suited for...", "less appropriate for...", "only effective in...", or "not ideal for..." depending on severity.

### Rule AK — No Positive-Only Phrasing Under Penalty

If fit penalty ≥ -3, Best Use Case cannot read as universally positive. At least one constraint, trade-off, or audience limitation must be stated.

### Rule AL — Severity-Language Mapping

Explicit mapping between penalty severity and required phrasing: -1 (minor) = neutral allowed; -2 (noticeable) = soft qualifier required ("works best when..."); -3 to -4 (strong) = explicit limitation required ("less appropriate for...", "may not suit..."); -4 to -6 (niche/limited) = restrictive phrasing required ("only appropriate in...", "not recommended broadly").

### Rule AM — Tone Consistency Enforcement

Best Use Case tone must match the score band. Versions scoring ≥85 must sound confident and broadly applicable. Versions scoring ≤83 with fit penalties must include visible caution or constraint language. Polished positive phrasing cannot mask a meaningful numerical penalty.

### Rule AN — No Contradiction Between Explanation and Score

A version described as "effective", "ideal", or "strong fit" cannot sit 3+ points below a clearly better, well-aligned version unless limitation language is also present. Score and explanation must feel consistent to an expert reader.

**ABSOLUTE RULES** updated with 4 new enforcement lines covering explanation alignment, tone band matching, restrictive applicability declaration, and explanation/score contradiction blocking.

**System message** extended to require that Best Use Case language reflects fit penalties, that constraint language is used for penalized versions, and that the explanation feels as calibrated as the score to an expert reader.

---

## Scoring Engine — Audience Fit Calibration Patch (comp-v5.7)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5.7` (forces full cache invalidation)

Stacked on top of comp-v5.6. No types, interfaces, weights, or function signatures changed. Adds five calibration rules ensuring that audience fit severity assessments are always reflected proportionally in the numerical score, preventing fit/score contradictions, enforcing separation from well-aligned winners, and balancing voice penalty logic to avoid over-penalizing isolated tone issues.

**Expected outcome after v5.7:**
- Hormozi-style with consistent misalignment: 80–82 (down from 84)
- Single isolated bad line: -1 only (79–80 preserved)
- No ranking swaps; no score distortion; alignment between stated fit and score

### Rule AE — Fit Severity to Score Translation

Audience fit assessments must produce proportional score adjustments: perfect/strong fit = no penalty; minor mismatch = -1; noticeable mismatch = -2; strong mismatch = -3 to -4; "only appropriate in niche/limited contexts" = -4 to -6. The score must numerically reflect the severity stated in the Best Use Case.

### Rule AF — No Fit/Score Contradiction

If the Best Use Case contains phrases like "only appropriate in limited contexts", "niche use only", or "not recommended broadly", the score must fall below clearly well-aligned alternatives. Scores of 84+ with restrictive applicability are forbidden.

### Rule AG — Fit Penalty Cap Interaction

Fit penalties reduce ceiling only, not structural validity. A structurally strong but misaligned version may remain competitive in the mid-tier but cannot sit within 1–2 points of the winner. Minimum 3–5 point gap is enforced vs. the well-aligned top version.

### Rule AH — Balanced Voice Penalty

One problematic phrase = -1 only. Repeated or consistent tone misalignment = -2 to -4. The engine evaluates overall tone consistency, not single-line artifacts.

### Rule AI — Fit vs Strength Resolution

When a version is structurally strong but audience-misaligned: it preserves its relative ranking among mid-tier options (still beats weak copy) but its absolute position drops below well-aligned top-tier versions. Fit affects position, not just score.

**System message** updated to require numerical reflection of fit judgments, balanced tone penalty logic, and minimum 3–5 point separation between misaligned and well-aligned top versions. Internal validation extended to cover RULES AE–AI.

---

## Scoring Engine — Top-Tier Separation Patch (comp-v5.6)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5.6` (forces full cache invalidation)

Stacked on top of comp-v5.5. No types, interfaces, weights, or function signatures changed. Adds decision-grade ranking within the top tier: enforces single-winner bias, a 2-criteria distinctiveness gate for 85+, intentional score banding within 85–90, micro-separation enforcement for near-equal top versions, an auto-promotion block, and voice discipline rules for stylized copy.

**Expected outcome after v5.6:**
- Best version: 87–88
- Second strong version: 85–86
- Strong but less distinctive: 82–84
- No more clustering at 86, no default ties at the top

### Rule Y — Single Winner Bias (No Default Ties at the Top)

Only one version should occupy the top position (85+) unless two versions are truly indistinguishable across structure, clarity, positioning, differentiation, and CTA. Even a slight edge in any dimension must be reflected as +1. Ties at 85+ are treated as a discrimination failure.

### Rule Z — Distinctiveness Threshold for 85+

A version must demonstrate at least TWO of the following to score 85 or higher: a clearly memorable line or phrase (passes recall test); a distinctive positioning angle (not reusable by generic competitors); unusually strong narrative flow (feels guided, not listed); a strategic framing that elevates the offer beyond services into outcomes or transformation. Fewer than two = hard cap at 84.

### Rule AA — Top-Tier Differentiation Split

The 85–90 band must be used intentionally: 85–86 = strong, professional, well-structured with real differentiation; 87–88 = clearly distinctive and strategically framed with identifiable angle; 89–90 = exceptional, memorable, and hard to replicate. The engine must not cluster everything at 86 — each notch must be earned.

### Rule AB — Micro-Separation Enforcement

When comparing the top 2–3 versions, small but real differences must each contribute +1: better CTA clarity (+1), stronger strategic positioning (+1), cleaner narrative flow (+1). These micro-advantages must be reflected numerically. High-quality versions must not collapse into identical scores when real differences are detectable.

### Rule AC — No Auto-Promotion to 85+

Clarity, completeness, and professionalism alone place a version in 82–84. Reaching 85+ requires real distinction or memorability. Excellence does not equal polish alone.

### Rule AD — Voice Discipline at Top Tier

Stylized or persona-driven outputs can reach 85+ only if tone aligns with the target audience, intensity does not reduce trust, and clarity is preserved. Style that introduces audience friction or trust risk caps at 82–84 even if the copy is engaging.

**System message** updated to explicitly require top-tier differentiation, single-winner identification, micro-advantage reflection, and the 85+ distinctiveness gate at model instruction level. Internal validation extended to cover RULES Y–AD.

---

## Scoring Engine — Calibration Patch (comp-v5.4)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5.4` (forces full cache invalidation)

Stacked on top of comp-v5.3. No types, interfaces, weights, or function signatures changed. Fixes score compression for English outputs, amplifies reward for structural improvements, rebalances penalty logic, and enforces ATA dominance numerically.

**Expected outcome:**
- Original / generic copy: 72–75
- Strong professional improved copy: 82–84
- Minimum spread between qualitatively different versions: 6–10 points
- Misaligned versions (ATA < 75): hard-capped at 78, cannot rank above ATA ≥ 80 versions

### Rule M — Baseline Compression Fix

Generic, undifferentiated, structurally standard copy must land in a compressed band. `differentiation ≤ 70` and no clear unique angle = final score ceiling of 74. Clean but generic structure = 72–75 only. Safety, correctness, and clarity must NOT be rewarded as excellence.

### Rule N — Structural Reward Amplification

When a version clearly improves multiple structural dimensions over the original (problem framing, benefit articulation, strategic positioning, CTA strength, flow, message hierarchy), the score MUST be at least +4 to +8 higher than the original baseline. This uplift is required, not optional. The only exception is severe violations (trust destruction or complete audience misalignment).

### Rule O — Penalty Interaction Rebalance

Penalties (UNSOURCED_CLAIM, TONE_MISMATCH) cap the ceiling — they do not collapse the total score. A structurally strong version with a minor violation still outscores a structurally weak version with no violations, unless the violation directly destroys trust or usability. Penalty logic: ceiling reduction only.

### Rule P — ATA Numeric Enforcement

`audienceToneAlignment < 75` → hard cap at 78 final score AND cannot rank above any version with ATA ≥ 80. This is a numeric gate, not only a narrative instruction.

### Rule Q — Top Tier Recalibration (Reduce Over-Conservatism)

82–84 range: strong structure + clear positioning + clean tone is sufficient; differentiation must be real but not extreme. 85+ still requires v5.3 Memory Test Gate. Do NOT suppress well-crafted, audience-aligned copy into 78–81 — over-conservatism is a calibration failure equal to over-inflation.

### Rule R — Score Spread Integrity

Qualitatively different versions must show 5–8 point minimum separation. Original vs. clear structural improvement must show at least +4 delta. Clustering scores within 2–3 points when qualitative differences are significant is treated as a calibration error.

**System message** updated to explicitly distinguish three tiers (generic competence / strong professional / truly distinctive) and calibrate balanced reward/penalty at model instruction level.

---

## Scoring Engine — Final Calibration Patch (comp-v5.5)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5.5` (forces full cache invalidation)

Stacked on top of comp-v5.4. No types, interfaces, weights, or function signatures changed. Completes the calibration cycle by adding mandatory improvement delta enforcement, a hard baseline anchor for generic copy, a reward strength boost for strong copy, inversion prevention for minor penalties, reinforced spread requirements, and an English-language guard against over-conservatism.

**Expected outcome:**
- Original / undifferentiated: 72–75 (hard anchored)
- Good generated: 77–80
- Strong generated: 81–84
- Best aligned / distinctive: 84–88
- Score spread between clearly different versions: 5–8 points minimum

### Rule S — Improvement Delta Enforcement

The scoring engine must compare each generated version against the Original. If a version clearly improves 3 or more structural dimensions (problem framing, clarity, benefit articulation, CTA specificity, positioning, flow / readability), it MUST score at least +5 above the Original — unless a major violation makes it unusable. This delta is mandatory and must be reflected numerically, not only descriptively.

### Rule T — Baseline Anchor

Generic, undifferentiated, mostly services-list copy without a clear strategic angle MUST land in the 72–75 range — even if it is clean and professional. Safe competence must not drift into the high 70s. The baseline anchor is 72–75, period.

### Rule U — Reward Strength Boost

When a version demonstrates clear narrative progression, strong strategic framing, specific and intentional CTA, meaningful differentiation, and strong audience fit, the engine applies a positive calibration boost of +3 to +5 before final caps are enforced. Purpose: reward real improvement as decisively as violations are penalized.

### Rule V — No Inversion from Minor Penalties

Minor penalties must not invert an obvious quality hierarchy. If Version A is clearly stronger than Version B in structure, clarity, CTA, and positioning, Version A must still outrank Version B — unless trust is critically broken or tone makes it clearly unusable. Penalties cap the ceiling; they do not collapse rankings between clearly unequal versions.

### Rule W — Score Spread Integrity (v5.5 layer)

Required spread guidance: weak original vs. strong generated = 5–8 pt minimum; generic vs. differentiated = 4–6 pt minimum; strong vs. exceptional = 2–4 pt minimum. Score compression when real quality differences exist is a calibration output error, not a conservative default.

### Rule X — English Calibration Guard

For English-language evaluations, the engine must not become overly conservative simply because the copy is professional rather than emotional. English B2B copy that is strategically framed, clearly differentiated, benefit-led, and audience-appropriate belongs in the 81–84 range. Strong English professional copy must not be suppressed into the high 70s unless genericity or violations clearly justify it.

**System message** updated to include all v5.5 enforcement points: mandatory improvement delta, baseline anchor, reward boost, inversion prevention, spread requirements, and English guard. Internal validation extended to cover RULES S–X before output.

---

## Scoring Engine — Precision Micro-Patch (comp-v5.3)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5.3` (forces full cache invalidation)

Stacked on top of comp-v5.2. No dimension, weight, or structural changes. Improves narrative strictness, top-tier discrimination, and differentiation accuracy.

### Rule G — Anti-Soft-Praise

When any violation is present, forbidden softening phrases: "although", "however it still", "despite this, it remains strong", "while it has some issues". Required decisive phrasing: "This significantly reduces effectiveness because…" / "This undermines trust because…" / "This limits real-world performance because…". Violations must read as real penalties, not minor caveats.

### Rule H — Best Use Case Restriction

If `audienceToneAlignment < 75`, `bestUseCase` must be framed as "only appropriate in limited or specific contexts" or "may be usable if [narrow condition], but not recommended broadly". Forbidden: "best choice", "strong option", "effective for", "ideal for", "recommended for".

### Rule I — Differentiation Hard Ceiling

Generic structures, common agency phrasing, or universally applicable copy must cap `differentiation` at 70–75. Does NOT count: synonyms, tone variation, formatting changes, added urgency. DOES count: unique strategic angle, distinctive framing, memorable brand positioning.

### Rule J — Memory Test for Top-Tier Gate

Before scoring any version above 85 overall, the model asks: "Would a senior copywriter remember at least one specific line from this version tomorrow?" If NO, cap `finalScore` at 84. Enforces memorability, sharp positioning, non-generic thinking.

### Rule K — Structure Is Not Excellence

Clean, logical, well-written copy that lacks distinctiveness, emotional sharpness, or positioning clarity must stay 78–84. Cannot compete with genuinely differentiated versions. Structure (clarity, CTA, flow) alone is not sufficient for top scores.

### Rule L — Final Ranking Honesty Check

Before finalizing, verify top-ranked version has: (1) best ATA, (2) no trust violations, (3) differentiation > 75. If any check fails, re-evaluate. The cleanest version is NOT automatically the winner.

**System message** updated to embed all 7 comp-v5.3 enforcement points at model instruction level.

---

## Scoring Engine — Enforcement Patch (comp-v5.2)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5.2` (forces full cache invalidation)

A strict enforcement patch on top of comp-v5.1. No dimension changes, no weight changes, no structural redesign. Closes the loophole where violations could be overshadowed by structural strengths in the evaluation narrative.

### Rule A — Unsourced Claim Language Ban

When a version contains Type 3 (unsourced) numerical claims, the words "credibility", "strength", "proof", and "evidence" are forbidden to describe those claims. The only permitted description is: "unsupported or fabricated numerical claim". Any evaluation that praises such claims is invalid and must be internally revised.

### Rule B — Contradiction Resolution

When a version contains both strong persuasion mechanics AND a violation (UNSOURCED_CLAIM, TONE_MISMATCH, REGISTER_ERROR): the violation MUST dominate `weakestReason` and `bestUseCase`. Structural strengths may be acknowledged but cannot neutralize or override the violation. `weakestReason` must explain why the violation reduces real-world effectiveness.

### Rule C — Audience–Tone Override (Hard)

If `audienceToneAlignment < 75`: `weakestReason` and `bestUseCase` MUST describe the version as "misaligned for the target audience". Forbidden language: "ideal", "best", "top-performing", "excellent fit", "most effective". Applies even when other dimensions score highly.

### Rule D — Language Priority Order

Narrative priority: (1) Trust violations first → (2) ATA failures second → (3) everything else. If (1) or (2) fail, the narrative leads with failure before any positives.

### Rule E — No False Positives

System must not praise fabricated numerical specificity, reward aggressive framing when tone = friendly/casual, or interpret intensity as effectiveness when it conflicts with audience expectations.

### Rule F — Internal Validation Before Output

Before outputting, the model must internally verify: no UNSOURCED_CLAIM praised with banned words, no tone mismatch ignored, no version with ATA < 75 positioned as top choice. Revise before outputting if any check fails.

**System message** updated to embed violation-dominance at the model instruction level.

---

## Scoring Engine — Calibration Patch (comp-v5.1)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5.1` (forces full cache invalidation)

A precision calibration patch on top of comp-v5. No new dimensions, no weight changes, no structural redesign. This patch adds enforcement layers to correct score inflation and improve discrimination at the top of the range.

### 1. Top-Tier Score Gate (85+)

A finalScore above 85 is now gated behind ALL FOUR of the following criteria:
1. Clear and specific positioning angle (not a generic service description)
2. Non-generic phrasing (no interchangeable copy blocks applicable to any competitor)
3. Intentional voice or perspective (not neutral AI tone)
4. Memorability (at least one phrase, idea, or structure that stands out)

If any criterion is missing → all individual subscores are capped near 84. Safe, polished-but-generic copy can no longer reach the 85+ tier.

### 2. Audience–Tone Dominance Rule

If `audienceToneAlignment < 75` → the version cannot be top-ranked, regardless of other dimension scores. This is enforced in the prompt and must be surfaced explicitly in `weakestReason` and `bestUseCase`. Context fit now overrides pure structural performance.

### 3. Differentiation — Stricter Evaluation

Differentiation now explicitly excludes:
- Synonym substitution (different words, same generic claim)
- Tone shifts (friendlier/bolder phrasing of a commodity message)
- Formatting differences (same content reorganized)

Only strategic distinction — unique angle, perspective, or framing specific to the offer — qualifies for a high score. Generic but well-written copy cannot score high in differentiation.

### 4. Trust & Credibility — Hard Enforcement

Three-tier claim classification is now explicit and mandatory:

| Claim Type | Impact |
|---|---|
| TYPE 1: Source-based (in user input, testimonials, cited research) | Positive (+8–15 pts) |
| TYPE 2: General claims ("industry-leading", "proven") | Neutral |
| TYPE 3: Unsourced numerical claims (AI-invented stats) | Hard penalty |

**TYPE 3 hard caps:** 1 unsourced claim → Trust max 72. 2+ unsourced claims → Trust max 62.

**Required visibility:** If any Type 3 claim is detected, `weakestReason` MUST contain the exact phrase "unsupported or fabricated numerical claim".

### 5. Spanish Register — Hard Penalty

Strengthened from a soft suggestion to a hard enforcement rule:

- Spanish + friendly/casual tone + predominant "usted" → HARD PENALTY
  - `audienceToneAlignment` capped at 70–72
  - Minor trust penalty (−4 pts) for perceived formality distance
  - `weakestReason` MUST contain "REGISTER_ERROR"

### 6. Reasoning Visibility — Mandatory Surfacing

Risk flags are now required to appear explicitly in `weakestReason` or `bestUseCase` text, not buried in scores:
- `TONE_MISMATCH`, `REGISTER_ERROR`, `UNSOURCED_CLAIM`, `CULTURAL_IMPORT`, `AGGRESSIVE_FRAMING`

`weakestReason` character limit increased from 160 to 200 to accommodate required phrases.

---

## Scoring Engine — Calibration Overhaul (comp-v5)

**Location:** `src/services/api/comprehensiveScoring.ts`
**Version bump:** `comp-v5` (forces full cache invalidation on next scoring run)

### Problem Addressed

The previous scoring engine (comp-v4) suffered from a calibration bias: it systematically over-rewarded American direct-response copywriting mechanics (urgency, bold claims, aggressive CTAs, binary framing) and underweighted audience-tone alignment and cultural appropriateness. This caused structurally aggressive but tonally misaligned copy to outscore audience-appropriate, trust-building copy — the opposite of real-world conversion performance.

### New Scoring Architecture

#### New Dimensions (8 total, SEO conditional)

| Dimension | Weight (default) | Notes |
|---|---|---|
| **Audience–Tone Alignment** | 25% | New. Highest-weight dimension. |
| **Clarity** | 15% | Merged with former readability dimension. |
| **Persuasion Structure** | 15% | Renamed from "marketing". |
| **Emotional Resonance** | 15% | Unchanged in weight. |
| **Differentiation** | 10% | New. Evaluates unique angle/mechanism. |
| **Trust & Credibility** | 10% | New. With numerical claims validation. |
| **CTA Effectiveness** | 10% | Unchanged in weight. |
| **SEO** | Conditional | Only active for seo_page context. |

The old `readability` dimension has been merged into `clarity`. The old `marketing` dimension has been renamed to `persuasion`.

#### Audience–Tone Alignment (25%)

Evaluates whether the copy's voice, register, emotional style, metaphors, and persuasion approach fit:
- The implied or stated target audience
- The language detected in the copy (e.g., Spanish vs. English)
- Cultural expectations for that language/market
- The stated tone or persona

**Spanish Language Register Rules:**
- Spanish copy + friendly/casual tone: "tú" is expected; use of "usted" throughout is penalized (max score 72 — tone mismatch)
- Spanish copy + professional/formal tone: "usted" may be appropriate; blanket "tú" is evaluated for credibility impact
- Imported idioms, cultural metaphors, or persuasion patterns that feel foreign to the market are penalized

A well-executed voice that is contextually inappropriate for the audience scores lower than a simpler but well-aligned voice.

#### Trust & Credibility — Numerical Claims Validation

New rule distinguishing three types of claims:

1. **Source-based claims** (present in user's input, testimonials, sourced data): Rewarded as credibility signals (+8–15 pts)
2. **General non-specific claims** ("industry-leading", "best-in-class"): Neutral impact
3. **Specific numerical claims invented by AI without source basis** (e.g., "85% of users", "40% faster", "3x results" not present in original input): Penalized. Each unsourced invented stat reduces trust ceiling (max 72 for 1 unsourced stat, max 62 for 2+)

The scoring engine will never reward fabricated precision.

#### Differentiation (10%)

New dimension evaluating how clearly the copy establishes what makes the offer/brand/product stand out from competitors:
- ≥ 85: Unique mechanism or angle clearly stated, unmistakably distinct
- 70–84: Some differentiation present
- 55–69: Mostly generic, could apply to many competitors
- < 55: Pure commodity framing, no discernible differentiation

#### Risk Flag Codes in weakestReason

The scoring system now populates structured risk flag codes in `weakestReason` when applicable:
- `TONE_MISMATCH`: Register or style inappropriate for audience
- `CULTURAL_IMPORT`: Persuasion style imported from a different market/culture
- `REGISTER_ERROR`: Spanish tú/usted used incorrectly for stated tone
- `UNSOURCED_CLAIM`: Specific numerical claim without apparent source
- `AGGRESSIVE_FRAMING`: Urgency/pressure tactics that may alienate this audience

#### Updated Use-Case Weights

Each use case has tailored weights. `audienceToneAlignment` has a minimum weight of 0.18 across all use cases (was 0% in the old system for some contexts).

| Use Case | ATA | Clarity | Persuasion | Emotion | Diff | Trust | CTA | SEO |
|---|---|---|---|---|---|---|---|---|
| landing_page | .22 | .14 | .20 | .15 | .10 | .09 | .10 | 0 |
| sales_page | .22 | .13 | .20 | .15 | .09 | .11 | .10 | 0 |
| email | .25 | .16 | .15 | .18 | .07 | .12 | .07 | 0 |
| linkedin | .25 | .15 | .15 | .17 | .09 | .13 | .06 | 0 |
| paid_ad | .20 | .13 | .22 | .16 | .11 | .07 | .11 | 0 |
| seo_page | .18 | .13 | .14 | .10 | .09 | .11 | .07 | .18 |
| product_desc | .22 | .17 | .17 | .12 | .12 | .12 | .08 | 0 |
| general | .25 | .15 | .15 | .15 | .10 | .10 | .10 | 0 |

#### Updated Tone Modifiers

Tone modifier deltas now reference the new dimension names:
- `funny`: emotion +.04, audienceToneAlignment +.03, clarity -.03, persuasion -.04
- `professional`: clarity +.03, trust +.03, audienceToneAlignment -.02, emotion -.04
- `premium`: audienceToneAlignment +.03, differentiation +.02, cta -.02, persuasion -.03
- `aggressive`: persuasion +.03, cta +.03, audienceToneAlignment -.03, trust -.03
- `minimalist`: clarity +.04, trust +.02, emotion -.04, persuasion -.02
- `emotional`: emotion +.05, audienceToneAlignment +.02, clarity -.04, persuasion -.03
- `bold`: persuasion +.03, differentiation +.02, trust -.03, clarity -.02

#### Evidence Fields Updated

Evidence anchors now cover: `audienceToneAlignment`, `persuasion`, `trust`, `cta`, `seo` (the former `marketing` and `clarity` evidence fields have been replaced).

#### Tie-Break Order Updated

Aggregation tie-break order: `finalScore > cta > clarity > persuasion > audienceToneAlignment > stable`.

### Optimization & Optional Features — Always Visible

**Location:** `src/components/FeatureToggles.tsx`

The "Optimization & Optional Features" section is now always visible in all three form modes: Quick, Standard, and Advanced. Previously it was hidden in Quick mode.

---

## CopyMakerTab — Accordion Expansion Bug Fix (Intermittent Sections Opening)

**Location:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

### Root Cause Identified

The intermittent accordion sections opening unexpectedly was caused by two interacting bugs:

**Bug 1 — `loadFormStateFromSession` had `mode` in its `useCallback` deps.**
When `forceAdvanced(...)` was called inside that callback (to switch the form to Advanced mode after loading a session), it changed the `mode` state. Because `mode` was listed in the callback's `useCallback` dependency array, React discarded the old callback and created a new one. `UrlParamLoader`'s `useEffect` had `loadFormStateFromSession` in its own dependency array. When the callback reference changed, `UrlParamLoader`'s effect re-fired. In a narrow timing window where `setSearchParams({})` (which clears the `?sessionId=` param) had not yet committed, the session would load a second time, calling `handleExpandSectionsForLoad` again and re-expanding sections.

**Bug 2 — `handleExpandSectionsForLoad` unconditionally reset its own single-shot guard.**
The function reset `hasAppliedAutoExpandRef.current = false` on every call before invoking `handleExpandSectionsByKeys`. This meant any second call to `handleExpandSectionsForLoad` — regardless of cause — would always expand sections, defeating the guard entirely.

### Fixes Applied

1. **`modeRef` / `forceAdvancedRef` pattern**: `loadFormStateFromSession` and the affected callbacks now read `modeRef.current` and `forceAdvancedRef.current` (refs that track the current values) instead of capturing `mode` and `forceAdvanced` as `useCallback` deps. The refs are kept in sync via `useEffect`. This makes `loadFormStateFromSession` a stable callback that does NOT change when mode changes, so `UrlParamLoader`'s effect never re-fires spuriously.

2. **Entity ID guard**: `loadFormStateFromSession` and `loadFormStateFromSavedOutput` now check `lastExpandedForEntityRef.current` before calling `handleExpandSectionsForLoad`. If the same session ID or saved output ID was the last entity expanded, the expansion call is skipped. This is defense-in-depth for any remaining edge case. The ref is cleared in `handleClearAllOverride`.

3. **Instrumentation added**: Instance ID, `setExpandedSectionsDbg` wrapper (logs every `setExpandedSections` call with a `reason` string and the new state), mount/unmount logs, and load effect fired logs. These remain in the codebase for diagnosability with minimal production noise.

4. **`handleToggleSection` fixed**: Was previously using a non-functional setState form (`Object.assign(…, expandedSections, …)`), which could produce stale state with rapid toggles. Replaced with functional updater form `prev => ({ ...prev, [key]: !prev[key] })`.

### Files Changed
- `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

---

## CopyMakerTab — Sections With Filled Fields Always Expanded

**Location:** `src/components/CopyForm.tsx`, `src/components/SharedInputs.tsx`, `src/components/FeatureToggles.tsx`

### Behavior

Any accordion section that has `filledCount > 0` (at least one populated field) is always shown expanded, regardless of the accordion state. The user cannot collapse a section that contains data.

`isExpanded` for each section is computed as:
```
(expandedSections[key] ?? default) || filledCount > 0
```

This applies to all five sections:
- What You're Creating (`CopyForm.tsx`)
- Audience & Targeting (`SharedInputs.tsx`)
- Tone & Style (`SharedInputs.tsx`)
- Strategic Messaging (`SharedInputs.tsx`)
- Optimization & Optional Features (`FeatureToggles.tsx`)

Empty sections continue to follow the accordion state (collapsed by default, expandable by user click).

---

## Saved Outputs Table — Latest Run Batch Highlighting

**Location:** `src/components/Dashboard.tsx` — Saved Outputs tab

### Behavior

When the Saved Outputs table is rendered, the system automatically detects the most recent generation **batch/run** and highlights all rows belonging to it in **orange**.

A "batch" is defined as: all rows whose `created_at` timestamp falls within **30 seconds** of the newest timestamp in the current filtered list. This accounts for scenarios where a single run produces 2 or more outputs within a few seconds of each other — all of them are highlighted together.

**Rules:**
- Only the latest batch is highlighted — older runs are displayed with the standard row style.
- The batch detection uses a 30-second window: `latestTimestamp - rowTimestamp <= 30000ms`.
- Orange styles apply to the full table row: `bg-orange-50 dark:bg-orange-950/20`, with hover states `bg-orange-100 dark:bg-orange-950/30`.
- If only one row exists, it is still highlighted (it is by definition the latest run).
- The detection runs on `finalFiltered` (after search and favorites filter), so it reflects only what is currently visible.

---

## Comparison Table — Evaluated-At Timestamp Color

**Location:** `src/components/results/ComprehensiveComparisonTable.tsx` — per-row Option cell

### Behavior

The small timestamp shown below each row's "Output · Improve" links (the `evaluatedAt` time) uses a **latest-batch** coloring rule:

- The newest `evaluatedAt` across all rows is identified.
- Any row whose `evaluatedAt` falls within **30 seconds** of that maximum is styled in **orange** (`text-orange-500 dark:text-orange-400`) — this covers scenarios where a single scoring run evaluates multiple rows almost simultaneously.
- All other rows (scored in an earlier run) show the timestamp in **gray** (`text-gray-400 dark:text-gray-600`).

This gives clear visual emphasis to the most recently scored row(s) without making all timestamps orange.

---

## Copy Maker Accordion — Deterministic Expansion Control

**Location:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

### Behavior

The accordion (collapsible sections) in Copy Maker is fully deterministic. All expansion logic is centralized in `CopyMakerTab` with no localStorage involvement.

### Guards

Two React refs control expansion gating:

1. `hasAppliedAutoExpandRef` — single-shot guard. Auto-expand fires once per explicit load event. Re-renders or accidental re-executions cannot trigger it again.
2. `lastActionWasModeSwitch` — mode-switch wins. If the user just switched Quick/Standard/Advanced, any pending auto-expand call is blocked entirely.

### Key Functions

- `handleSetMode(newMode)` — **the ONLY entry point for user-triggered mode changes**. Sets `lastActionWasModeSwitch = true`, resets `hasAppliedAutoExpandRef`, calls `setMode`, and resets accordion to `DEFAULT_EXPANDED`. The "Switch back" banner button also routes through this.
- `handleExpandSectionsByKeys(keys)` — internal expand logic. Checks both guards before firing. Sets `hasAppliedAutoExpandRef = true` after running.
- `handleExpandSectionsForLoad(keys)` — wrapper used by all explicit load events (template, session, prefill, saved output). Resets both guards before calling `handleExpandSectionsByKeys`, ensuring each user-initiated load gets a clean auto-expand.

### Default State

```
DEFAULT_EXPANDED = {
  'what-youre-creating': true,    // always open
  'audience-targeting': false,
  'tone-style': false,
  'strategic-messaging': false,
  'optimization-optional': false,
}
```

### Acceptance Criteria

1. Switching Quick/Standard/Advanced always collapses to defaults.
2. Loading a template opens only the sections with data.
3. Switching view after template load collapses everything.
4. Reload starts clean.
5. Clear resets layout.
6. No section ever opens unless the user clicked it or an explicit load event triggered it.

### Debug Logging (temporary)

Console prefixes: `[CopyMaker] MODE SWITCH`, `[CopyMaker] AUTO EXPAND`, `[CopyMaker] TOGGLE`, `[CopyMaker] CURRENT STATE`. Remove after validation.

---

## UI System Normalization Pass — Generated Outputs & Analysis Panels

**Files changed:**
- `src/components/GeneratedCopyCard.tsx`
- `src/components/results/ScoreCard.tsx`
- `src/components/results/ResultsSection.tsx`
- `src/components/results/CopyOutput.tsx`
- `src/components/results/PromptEvaluation.tsx`
- `src/components/results/ComparisonCard.tsx`

A comprehensive design-system-only normalization pass was applied to the entire post-generation output experience to achieve a coherent, premium Linear/Notion/Stripe-inspired aesthetic. No backend logic, no API calls, no data structures were modified — only Tailwind CSS classes.

### Design Token System Established

Four UI color roles now govern the entire output panel:

1. **Neutral** — `gray-900/700/600/500/400/300/200` for all decorative elements, labels, borders, containers
2. **Primary Action** — `gray-900 dark:gray-100` for high-emphasis action buttons (e.g., "Update Analysis")
3. **Information** — semantic `getScoreTextClass(score)` preserved for score numbers only
4. **Copy** — preserved as-is per DO NOT CHANGE rule

**Accent bar token** (replaces all `bg-primary-500`, `bg-blue-500` decorative bars):
```
w-0.5 h-4 rounded bg-gray-300 dark:bg-gray-600
```

**Microcopy header token** (replaces all `h4`/`h5` section labels, emoji prefixes, yellow/colored labels):
```
text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest
```

**Action bar separator token:**
```
w-px h-4 bg-gray-200 dark:bg-gray-700 flex-shrink-0
```

### GeneratedCopyCard.tsx Changes

- Card header accent bar: `bg-primary-500`/`bg-blue-500` → neutral accent bar token
- Persona / brand voice text: `text-purple-600`/`text-blue-600` → `text-gray-500 dark:text-gray-400`
- Quality Score header: eliminated separate score circle — collapsed to inline `text-sm font-bold` number at row end
- "Why it's improved" section: removed star icon + `text-primary-600` → microcopy header token
- Score Breakdown heading: `h5` with colored bar → microcopy header token
- All score breakdown bullet dots: `text-primary-500` → `text-gray-400 dark:text-gray-500` (5 instances via replace_all)
- GEO Score header: replaced full score-circle block → microcopy header + inline score number pattern
- SEO Metadata / FAQ Schema headers: icon size `size={20}` + primary color → `size={13}` + `text-gray-400 dark:text-gray-500`
- Optimization suggestion labels (Content + GEO): `💡 Optimization Suggestions:` emoji div → microcopy header token
- "Add to comparison" button: `bg-orange-50 border-orange-300` → `bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600`

### ScoreCard.tsx Changes

- Title: `text-xl font-semibold` → `text-base font-semibold`
- Score circle: `border-4 w-14 h-14` → `border-2 w-12 h-12`
- `/100` label + score label: colored via `getScoreTextClass` → muted `text-xs text-gray-400 dark:text-gray-500`
- "Why it's improved": removed `★` star + `text-primary-600` → microcopy header token + neutral body
- Score Breakdown heading: `h4` with colored bar → microcopy header token
- `ScoreItem` component: bullet `text-primary-500 mr-2` → `text-gray-400 dark:text-gray-500 mr-2`; description `text-sm` → `text-xs leading-relaxed`; `rounded-lg` → `rounded-md`
- Optimization suggestions: `💡` emoji → microcopy header token; bullets neutral gray

### ResultsSection.tsx Changes

- Main section title bar: `w-1.5 h-8 bg-primary-500 rounded-full mr-3` → neutral accent bar (thinner, shorter)
- Section title: `text-2xl font-bold` → `text-xl font-semibold`
- Original Input + PromptEvaluation wrapper: blue-tinted containers removed → `bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700`
- Section sub-headers (Standard / Humanized / Headline): header bars primary→neutral; titles `text-xl font-bold` → `text-base font-semibold`
- Restyled version indentation (6+ instances): `border-l-2 border-primary-300 dark:border-primary-700` → `border-l border-gray-200 dark:border-gray-700`
- Purple headline cards (2 instances): `border-purple-200 bg-purple-50` → `border-gray-200 bg-white dark:bg-gray-900`
- Generate headlines button: `text-primary-600` → `text-gray-600`
- Inner card borders: `border-gray-300 dark:border-gray-800 shadow-sm` → `border-gray-200 dark:border-gray-700` (removed shadow-sm)

### CopyOutput.tsx Changes

- Header accent bar: `w-1 h-5 bg-primary-500` → neutral accent bar token
- Title: `text-xl font-semibold` → `text-base font-semibold`
- Content area background: `bg-gray-100 dark:bg-gray-800` → `bg-gray-50 dark:bg-gray-800`

### PromptEvaluation.tsx Changes

- Header: removed `🧠` emoji; `text-xl font-semibold h3` → accent bar + `text-base font-semibold`
- Improvement Tips label: `text-yellow-600` ArrowDown div → microcopy header token
- Bullet dots: `text-primary-500` → `text-gray-400 dark:text-gray-500`

### ComparisonCard.tsx Changes

- Outer container: `bg-black border-2 border-gray-900 dark:border-gray-50` → `bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg`
- Award icon: `h-6 w-6 text-gray-900 dark:text-gray-50` → `h-4 w-4 text-gray-500 dark:text-gray-400`
- Card title: `text-2xl font-bold` → `text-base font-semibold`
- "Update Analysis" button: `bg-orange-500 hover:bg-orange-600` → `bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900`
- Analysis info banner: `bg-blue-50 border-blue-200` → `bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700`; Clock icon blue → muted gray; removed `💡` emoji from new outputs notice
- Overall Verdict + Winner section containers: `bg-gray-100 border-gray-300` → `bg-gray-50 dark:bg-gray-800 border-gray-200 rounded-lg`
- All section headings (`h4`, `h5`): normalized from `text-lg font-bold/semibold` to `text-sm font-semibold`; icons `h-5 w-5 text-gray-900` → `h-4 w-4 text-gray-500 dark:text-gray-400`
- Best version highlight in comparison details: `border-gray-900 dark:border-gray-50 bg-gray-950` → `border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800`; added `rounded-lg`
- `🏆` trophy emoji removed from winner title
- `🧭` compass emoji removed from "Best used for" label
- Metrics block: added `rounded-md`; normalized dark background from `bg-gray-900` to `bg-gray-900/60`
- Per-version strategic recommendation body: `bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800` → `bg-gray-50 dark:bg-gray-800 rounded-md border-gray-200 dark:border-gray-700`

---

## Section 2 UI Consistency Normalization — Orange Removal + Button Unification

**Files changed:**
- `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx`
- `src/components/copy-maker/CopyMakerTab/modals/ScoringContextModal.tsx`
- `src/components/results/ComprehensiveComparisonTable.tsx`
- `src/components/GeneratedCopyCard.tsx`
- `src/components/results/CopyOutput.tsx`

A precision UI consistency patch targeting Section 2 only (Output / Analysis / Scoring). No input-section files touched. No backend logic changed.

### Orange Removal

All orange color states eliminated from the output/analysis/scoring area:

**ResultsPanel.tsx** — "Analyze – Compare & Score Copy" primary CTA:
- `bg-orange-500 hover:bg-orange-600 text-white` → `bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200`

**ScoringContextModal.tsx** — all orange elements:
- Target icon: `text-orange-500` → `text-gray-500 dark:text-gray-400`
- Select/input focus rings: `focus:ring-orange-400` → `focus:ring-gray-300 dark:focus:ring-gray-600`
- Confirm button: `bg-orange-500 hover:bg-orange-600` → `bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200`

**ComprehensiveComparisonTable.tsx** — debug/scoring context area:
- Scoring context Target icon: `text-orange-500` → `text-gray-400 dark:text-gray-500`
- "View Logs" button active: full orange styling → `bg-gray-100 dark:bg-gray-800 border-gray-300 text-gray-600 hover:bg-gray-200`
- Debug toggle active state: `bg-orange-50 border-orange-300 text-orange-700` → `bg-gray-200 dark:bg-gray-700 border-gray-400 text-gray-900`
- Debug status dot: `bg-orange-500` → `bg-gray-600 dark:bg-gray-300`

### Button Unification — Copy Bar with Action Bars

The copy action bar (Copy / Copy HTML / Copy MD / Save as Brand Voice / Delete) in `GeneratedCopyCard.tsx` was inconsistent with the generation and analysis action bars in the same card:

| Property | Before | After |
|----------|--------|-------|
| Font size | `text-sm` | `text-xs font-medium` |
| Icon size | `size={16}` | `size={13}` |
| Base bg | `bg-white dark:bg-gray-800` | `bg-white dark:bg-transparent` |
| Hover | text-only color change | `hover:bg-gray-50 dark:hover:bg-gray-800` + text color |
| Save as Brand Voice hover | `hover:text-primary-600` | `hover:text-gray-700 dark:hover:text-white` |
| Delete hover | text-only red | `hover:bg-red-50 dark:hover:bg-gray-800` + red text |

**CopyOutput.tsx** — copy button inside content area also unified:
- `text-sm` → `text-xs font-medium`
- Icons `size={16}` → `size={13}`
- Added `hover:bg-gray-200 dark:hover:bg-gray-700` background hover

### Hover Interaction Model (Section 2)

All buttons in Section 2 now share one interaction language:
- **Neutral actions:** `hover:bg-gray-50 dark:hover:bg-gray-800` + muted text darkening
- **Destructive (Delete):** `hover:bg-red-50 dark:hover:bg-gray-800` + red text
- **Primary CTAs:** `bg-gray-900 dark:bg-gray-100` with `hover:bg-gray-800 dark:hover:bg-gray-200`
- No orange in any state across Section 2

---

## Section 2 High-Density Readability System

**Files changed:**
- `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx`
- `src/components/GeneratedCopyCard.tsx`
- `src/components/results/ScoreCard.tsx`
- `src/components/results/ComprehensiveComparisonTable.tsx`
- `src/components/results/ResultsSection.tsx`
- `src/components/results/CopyOutput.tsx`

A precision UI readability pass scoped entirely to Section 2. No input controls, no backend logic, no feature behavior modified.

### Vertical Rhythm & Card Spacing

**ResultsPanel.tsx**
- Output card spacing: `space-y-6` (24px) → `space-y-8` (32px) — clearer separation between output cards
- Outer container: `rounded-lg p-3 sm:p-6` → `rounded-xl p-4 sm:p-6` — consistent radius, slightly more padding on mobile
- Border lightened: `border-gray-300` → `border-gray-200` — reduced visual weight
- "Generated Copies" header reclassified: `text-xl font-bold` → `text-base font-semibold text-gray-500 uppercase tracking-wider` — section label hierarchy
- Analysis zone separator: added `border-t border-gray-100 pt-6 mt-2` before the re-score controls, creating a clear visual zone break between output cards and comparison analysis

### Scan Zones in GeneratedCopyCard

- Card outer: `rounded-lg p-6` → `rounded-xl p-5 sm:p-6` — consistent radius, responsive padding
- Content text container: added `text-sm leading-relaxed` — better line spacing for copy readability
- Structured content container: added `leading-relaxed text-sm`, border lightened to `border-gray-100`
- Score section: added `mt-4` — 16px zone gap between content and score for clear section flow
- GEO Score section: same `mt-4` treatment — consistent zone gaps
- Score/GEO borders lightened: `border-gray-200` → `border-gray-100 dark:border-gray-800` — reduced visual noise
- Score descriptions: added `leading-relaxed` on all four dimension descriptions (Clarity, Persuasiveness, Tone, Engagement)
- Action bar separator: `border-gray-200 pt-4` → `border-gray-100 dark:border-gray-800 pt-5 mt-2` — lighter border, more breathing room (20px vs 16px), soft zone transition
- Action bar label margin: `mb-2` → `mb-3` — more breathing room before buttons

### ScoreCard Readability

- Outer padding: `p-6` → `p-5` — tighter, more proportional in narrow contexts
- Header spacing: `mb-5` → `mb-4` — slightly tighter top zone
- Breakdown grid: `gap-3` → `gap-2` — denser grid for compact scanning
- Improvement explanation box: added `leading-relaxed`
- Suggestions list: added `leading-relaxed` per item

### ComprehensiveComparisonTable

- All `rounded-2xl` → `rounded-xl` — normalized to match other component radius tokens

### ResultsSection (Legacy System)

- Dotted separator: `border-gray-300 my-2` → `border-gray-200 my-3` — lighter color, more vertical breathing room
- CopyOutput container: `p-6 mb-4` → `p-5 mb-3` — tighter proportional spacing
- Meta text under title: `text-sm text-gray-500` → `text-xs text-gray-400 mt-0.5` — clear hierarchy step below title
- Plain text content block: added `text-sm leading-relaxed`

### Design Principles Applied

| Zone | Spacing |
|------|---------|
| Between output cards | 32px (space-y-8) |
| Between sections within a card | 16px (mt-4) |
| Inside cards | 20px (p-5) |
| Content to action bar | 20-24px (pt-5 mt-2) |
| Inside score breakdown grid | 8px (gap-2) |

---

## Uniform Button Design System (Section 2)

**Scope:** All action buttons in Section 2 (Output / Analysis / Scoring)

**Files changed:**
- `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx`
- `src/components/GeneratedCopyCard.tsx`
- `src/components/results/ComprehensiveComparisonTable.tsx`
- `src/components/results/decision/VersionAnalysisCard.tsx`
- `src/components/ui/OnDemandSeoButtons.tsx`
- `src/components/ui/OnDemandGeneration.tsx`
- `src/components/results/CopyOutput.tsx`

### Canonical Button Token

Every action button in Section 2 now uses this unified class string:

```
inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
text-gray-700 dark:text-gray-300
bg-gray-50 dark:bg-gray-800
border border-gray-200 dark:border-gray-700
hover:bg-gray-100 dark:hover:bg-gray-700
hover:border-gray-300 dark:hover:border-gray-600
transition-colors
disabled:opacity-40 disabled:cursor-not-allowed
```

For `<Button>` component instances (which apply `h-9` from `size="sm"`), `h-auto` is prepended to override the fixed height.

### Toggle Button States

Buttons that toggle panels (Improve Copy, Change Voice) use a two-state variant:
- **Active:** `bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600`
- **Inactive:** the canonical token above

This replaces the previous `bg-gray-900 text-white` (dark-fill) active state.

### Special Cases

- **Delete button:** Retains red hover (`hover:text-red-600 hover:bg-red-50 hover:border-red-200`) as a destructive action affordance while using the canonical base state.
- **Status badges** (e.g., "All analyses ready"): Remain as green pill badges — these are status indicators, not action buttons.
- **Amber/warning banners:** The CTA buttons inside warning banners (previously `bg-amber-600 text-white`) were normalized to the canonical token, preserving the amber background on the banner container itself.

### Design Goals

1. No button has higher visual weight than another through color (no dark-fill, no orange/amber CTAs)
2. Groups are distinguished by proximity and labels, not button color
3. All buttons have identical visual size: `px-3 py-1.5 text-xs rounded-md`
4. Hover states provide uniform, subtle feedback with slightly stronger border
5. Icons normalized to `w-3 h-3` or `size={12}` across all affected buttons

---

## Decision Layer (Section 2)

**Purpose:** Guide users toward the best version and next action without adding cognitive load.

**Files changed:**
- `src/components/GeneratedCopyCard.tsx` — badge + recommendation hint per card
- `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx` — top performer + comparison insight strip

---

### 1. Best Version Badge

**Where:** Inside the card title `<h3>` in `GeneratedCopyCard.tsx`

**Logic:** `isBestVersion = comparisonResult?.winnerVersionId === card.id`

**Display:** A subtle pill badge rendered alongside other card badges (Boosted, persona tags):
```
⭐ Best Version
```
Style: `bg-gray-100 text-gray-600 border-gray-200 rounded-full text-xs` — matches the existing non-emphasis badge palette. Only the winning version shows this badge. Only rendered when `comparisonResult` is present.

---

### 2. Recommended Next Action

**Where:** Just above the action bar `border-t` separator in `GeneratedCopyCard.tsx`

**Logic (in priority order):**
1. If `comparisonResult.rows[cardId].action` exists → use the scoring engine's recommendation verbatim
2. If 2+ versions have close scores (≤5 pts gap) and this card is in the top two → "Compare or blend with other versions"
3. If `primaryScore < 70` → "Recommended: Improve this version"
4. If `primaryScore 70–85` → "Recommended: Enhance for better performance"
5. If `primaryScore > 85` → "Ready to use"

`primaryScore` prefers `versionScores[card.id].finalScore` (comparison engine score), falls back to `card.score.overall`.

**Display:** `💡 [recommendation text]` in `text-xs text-gray-400` — subtle, one line, no border or background.

Only shown for non-Original, non-analysis cards.

---

### 3. Top Performer Summary

**Where:** Between the "Show/Hide Output Cards" toggle button and the cards list in `ResultsPanel.tsx`

**Logic:** `topPerformerRow = comparisonResult.rows.find(r => r.isWinner)`

**Display:**
```
🏆 Top performer: [optionLabel] · [finalScore]/100
```
Style: `text-xs text-gray-500` with the version name in `font-medium text-gray-700`. Only visible when `comparisonResult` is available.

---

### 4. Comparison Insight

**Where:** Below the Top Performer line in the same strip in `ResultsPanel.tsx`

**Logic (sorted rows by score):**
- If top two scores are within 3 pts → `"[A] and [B] are very close in score."`
- If runner-up has `bestUseCase` → `"[Winner] leads in score. [Runner-up] is [bestUseCase]."`
- Otherwise → `"[Winner] leads by [N] points over [Runner-up]."`

**Display:** `text-xs text-gray-400` — one line, plain text, no chrome.

Only shown when `comparisonResult` has 2+ rows.

---

### Visual Style Rules

- No banners, no backgrounds, no borders on these elements
- All text is `text-xs` in gray shades only
- Emojis (⭐, 💡, 🏆) serve as lightweight visual anchors, matching the user's explicit specification
- None of these elements affect layout, button order, or scoring logic

---

## HTML-to-Text Conversion for URL Deep Crawl

**Date:** 2026-04-02
**Files Changed:**
- `src/utils/htmlToText.ts` — New utility for converting HTML to readable plain text
- `src/components/wizard/WizardStep.tsx` — Integrated HTML-to-text conversion in URL analysis flow

When using the Quick Prompt Wizard's "Improve existing copy" flow with "Analyze Deep Crawl", extracted content from web pages now displays as formatted plain text instead of raw HTML markup.

### Problem Solved

Previously, when analyzing a URL with deep crawl:
1. The extracted content included HTML tags (`<h1>`, `<h2>`, `<p>`, etc.)
2. This raw HTML was displayed in the wizard's "Paste your existing copy" field
3. Users saw confusing markup like `<h1>Testimonios</h1><h2>Experiencias de...</h2>`
4. This HTML would then flow into Copy Maker's "Original Copy" field

### Solution

Created `htmlToText()` utility that converts HTML to readable plain text while preserving structure:
- Converts headings to text with appropriate spacing
- Converts paragraphs to text with line breaks
- Converts list items to bulleted format
- Removes all HTML tags
- Decodes HTML entities
- Cleans up excessive whitespace

### Implementation

The conversion happens automatically in `WizardStep.tsx` when URL analysis returns structured copy:

```typescript
if (result.data.structuredCopy) {
  const plainText = htmlToText(result.data.structuredCopy);
  updateAnswer('whatAreYouCreating', plainText);
}
```

### Result

Users now see clean, readable text:
```
Testimonios

Experiencias de nuestros clientes con servicios de branding y diseño web.

Permítenos mostrarte cómo hemos ayudado a impulsar el éxito de sus negocios...
```

Instead of raw HTML:
```
<h1>Testimonios</h1>
<h2>Experiencias de nuestros clientes...</h2>
<p>Permítenos mostrarte...</p>
```

---

## Quick Polish — Narrow Service Output Validation Gate

**Date added:** 2026-04-08

**Files changed:**
- `src/utils/copyMakerOutputValidation.ts` — added `validateNarrowServiceResult`, `buildNarrowRepairReminder`, `extractWordCountLimit`
- `src/features/quickPolish/quickPolishService.ts` — wired validation + one-shot retry into `polishContent`

### What was changed

Quick Polish (the narrow, single-purpose polish tool) previously had no post-generation check beyond confirming that the `variants` array was non-empty. The AI could silently return the wrong number of variants or ignore explicit word-count limits from Special Instructions.

A lightweight validation gate has been added that runs immediately after the AI response is parsed, before the result is returned to the UI.

### Validation rules checked

| Rule | Trigger | Error code |
|------|---------|------------|
| Variant count | Always | `WRONG_VARIANT_COUNT` |
| Word count limit | Only when Special Instructions contain a word-count phrase | `WORD_COUNT_EXCEEDED` |

**Word count phrases recognised in Special Instructions:**
- `under N words`
- `max N words` / `maximum N words`
- `N words or fewer` / `N words or less`
- `no more than N words`
- `keep it under/within/at most N words`
- `N words max` / `N words limit`

### Retry behaviour

1. If validation passes — result returned immediately, no retry.
2. If validation fails — one automatic retry is triggered. The retry uses the original conversation context plus a targeted repair reminder that lists exactly which rules failed and restates the count/word-count constraints.
3. If the retry also fails (parse error, still wrong count, still over word limit) — the original first-pass result is returned as-is. The user is never blocked or shown an error; the gate is best-effort only.

### What is NOT checked

- Content quality (tone, clarity, trust-rule compliance) — these remain prompt-level guardrails only
- Placeholder sanity — not applicable to Quick Polish plain-text output
- SEO metadata — not applicable
- Structured output format — Quick Polish always returns flat strings, not objects

### Design rationale

This is the "lighter version" gate: it only enforces measurable, objective rules (count, word limit) that can be verified without re-running the AI. Content-quality rules are intentionally left to the system prompt, keeping the validation layer minimal and the retry cost low.

---

## On-Demand Generation — Source Card Word Count Matching

**Files changed:**
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts`

### Problem

When clicking "New Version" or "Improve" on a generated copy card, the output was being produced at the form's configured word count setting (e.g., "Medium: 150 words") rather than matching the actual length of the source card. This caused generated alternatives and modified versions to be dramatically shorter (or longer) than the card they were derived from.

"Change Voice" (restyle) was already correctly matching the source word count via `extractWordCount(sourceItem.content)`.

### Fix

**New Version (Alternative Copy):**
- The source card's word count is now extracted via `extractWordCount(sourceItem.content)` before generating the alternative.
- A modified formState is created with `wordCount: 'Custom'` and `customWordCount: sourceWordCount`, overriding the form's configured word count setting.
- `adhereToLittleWordCount` and `aiDecideWordCount` are both set to `false` to ensure the custom word count target is respected without conflicting modes.
- The `outputStructure` clearing logic (for plain-text sources) is preserved.

**Improve (Modify Content):**
- The same word count matching is applied: source word count is extracted and used to override the formState before calling `modifyContent`.
- This ensures the modified output preserves the source card's length by default.
- If the user's rewrite instruction explicitly implies a length change (e.g., "make this shorter", "expand this with more detail"), the LLM interprets it naturally through the instruction — the source word count acts as the baseline, not a hard constraint.

**Change Voice (Restyle):** Already correctly matched source word count before this change — no modification needed.

### Behaviour after fix

| Operation | Word Count Source |
|-----------|-------------------|
| New Version | Source card's actual word count |
| Improve | Source card's actual word count (overridable via instruction) |
| Change Voice | Source card's actual word count (unchanged) |

---

## HTML Export — Premium Document Redesign (2026-05-10)

**File:** `src/utils/enhancedExports.ts`

### Overview

The HTML export was fully redesigned from a "React UI mirroring" approach to a premium standalone agency-quality report document. The previous approach tried to replicate the app's card-based interface with inline styles, fixed breadcrumb navs, colored header bands, and position:fixed elements — none of which translated well to HTML file output.

### What changed

**Document structure and typography:**
- Inter font loaded via Google Fonts `<link>` tag
- `max-width: 860px`, centered with `margin: 0 auto`, `padding: 48px 32px 80px`
- Body: `font-size: 15px`, `line-height: 1.7`, `color: #374151`
- `.label` class: `11px`, `letter-spacing: 0.1em`, uppercase, `color: #6b7280`
- `@media print` rules: hides `.no-print`, `page-break-before` on sections

**Document header (centered):**
- "COPYZAP — COPY REPORT" label
- Project name `h1` at `font-size: 32px`, `font-weight: 900`
- Meta line: Generated date · N variants · Language
- Winner banner: `#fff7ed` background, `border-left: 4px solid #f97316` with winner name

**TOC (Table of Contents):**
- `#f9fafb` background, flex rows with dot-leader spans and scores right-aligned
- Each row links to the corresponding `#output-{id}` section anchor

**Input Summary:**
- `border-left: 4px solid #f97316` orange accent
- Config `<table>` with `border-bottom: 2px solid #111827` under column labels, no colored header row

**Variant sections (`generateFullHtmlExportForCard`):**
- Each card renders as `<section id="output-{card.id}" style="page-break-before: always;">`
- Header: variant type label (uppercase, letter-spacing), name `h2`, Winner tag if applicable, voice pill tag
- Content body: `border-left: 3px solid #e5e7eb` reading block
- Quality Score: `<dl>` with `<dt>`/`<dd>` pairs (Clarity, Persuasiveness, Tone Match, Engagement, Word Count)
- Word Count Accuracy: uses `card.score.wordCountAccuracy` if present, else computed from `card.wordCount / targetWordCount`
- Sub-scores: inline text row + italic one-line explanations
- GEO Package: clean alternating-row table with status column (text checkmark/cross)
- SEO Metadata: each group rendered as monospace `<code>` blocks
- Ends with `<hr>` separator

**Comparison & Rankings section:**
- Replaced old colored card wrappers with a clean `<table>` ranking rows (alternating white/#f9fafb rows)
- `border-bottom: 2px solid #111827` under column headers
- Score column right-aligned with dynamic color (green ≥90, dark 80–89, amber 70–79, red <70)
- Winner text mark inline in version name cell
- Deep analysis for winner only: Key Strengths list, Suggested Improvements list, summary paragraph
- Fallback to `generateComparisonHtml()` if no structured comparison result

**Bottom CTA block:**
- Flat `#fff7ed` background, `border: 1px solid #fed7aa`, `border-radius: 8px`
- "↑ Back to top" link pointing to `#top`, styled as orange button

**Footer:**
- `text-align: center; font-size: 12px; color: #9ca3af; padding-top: 24px; border-top: 1px solid #e5e7eb`
- Minimal — "Generated by CopyZap — {timestamp}"

**Removed entirely:**
- Fixed-position breadcrumb nav (`<nav class="breadcrumb-nav">`)
- IntersectionObserver `<script>` block for breadcrumb active state
- Orange header bands on output cards
- Colored score circle badges
- Box-shadows, gradients, and `position: fixed` elements
- Old prompt evaluation section (no longer rendered in export)

**Preserved (hidden LLM evaluation sections):**
- `<section id="llm-context-data">` — context fields for external LLM use
- `<section id="llm-evaluation-data">` — normalized copy versions for external LLM comparison
- Note block informing users of the hidden structured data

---

## HTML Export — Fixes Round 2 (2026-05-10)

**File:** `src/utils/enhancedExports.ts`

### Fixes applied

**1. TOC scores — all variants now show scores**
The TOC row renderer now builds a `comparisonScoreMap` from `comparisonResult.rows[].finalScore` before iterating cards. For each card, it uses `comparisonScoreMap.get(card.id) ?? card.score?.overall ?? null`. This means even cards whose score is only stored in the comparison result (not on `card.score.overall`) will show correctly.

**2. Strategic Recommendation — orange left border restored**
The Strategic Recommendation block in `generateAllVersionsBreakdownHtml` was refactored from a flex-icon layout to a left-border block: `border-left: 3px solid #f97316; padding: 12px 16px`.

**3. Breadcrumb nav — restored as fixed bottom bar**
Added back as a `position: fixed; bottom: 0` bar with `class="no-print"`. Styles include white background, `border-top: 1px solid #e5e7eb`, `font-size: 12px`, ellipsis truncation (`max-width: 120px`), and `/` separators. Links to `#input-summary`, each `#output-{id}`, and `#comparison-rankings`. The body gets `padding-bottom: 56px` in the footer so content isn't hidden behind the nav.

**4. Quality Score block — duplicate large score removed**
The Quality Score `<div>` block previously showed the score a second time as a large `32px` number directly under the "QUALITY SCORE" label. This was a duplicate of the score already shown in the section header (`28px`, right-aligned). The large score and its flex wrapper have been removed from the block; the block now starts directly with "WHY IT'S IMPROVED" (if present) or the score breakdown `<dl>`.

**5. Comparison & Rankings — rankings table confirmed present**
The ranked table (columns: #, Version, Score, Notes) is generated by the `sortedRows.forEach` loop and is emitted before the deep analysis prose. The table uses alternating row backgrounds and dynamic score colors (green ≥90, dark 80–89, amber 70–79, red <70).

**6. Original Copy — now appears in TOC and as a section**
The Original Copy is a synthetic card created at comparison time with `id: '__original__'` but is not stored in `generatedOutputCards`. The export now checks: if `comparisonResult.rows` has a row with `versionId === '__original__'` and no matching card exists in `contentCards`, a synthetic `GeneratedContentItem` is built from `formState.originalCopy` with the score from `comparisonResult.rows[].finalScore`. This synthetic card is pushed onto `contentCards` and will appear in the TOC, as a full output section, and in the breadcrumb nav.

---

## HTML Export — Fixes Round 3 (2026-05-10)

**File:** `src/utils/enhancedExports.ts`

### Fixes applied

**1. Strategic Recommendation orange border — definitively fixed**
Two locations now use `border-left: 3px solid #f97316`:
- Strategic Recommendation block in `generateAllVersionsBreakdownHtml` (line ~1853): `border-left: 3px solid #f97316; padding: 12px 16px`
- Winner analysis summary paragraph in the Comparison & Rankings section: `border-left: 3px solid #f97316` (was `#e5e7eb`)

**2. Removed info box**
The `📊 This export includes structured data...` visible note div between the hidden LLM sections and the first variant card has been removed entirely. Hidden evaluation sections (`#llm-evaluation-context`, `#llm-evaluation-data`) remain in the HTML output but are no longer preceded by a visible annotation box.

**3. Rankings — replaced table with rich flex-div layout**
The `<table>` implementation has been replaced with a flex-div layout matching the app's ranking list style. Each row includes:
- Left side: rank number, variant name (bold), generation date/time (`font-size: 11px; color: #9ca3af`), three sub-score pills (Conversion, Trust, Risk) computed via `calculateMultiScoreDisplay()`
- Right side: delta vs Original Copy (e.g. `+30 pts (+54%)`) in green for positive / red for negative, or "baseline" in gray for the Original Copy row; large score with dynamic color
- Winner row gets `border-left: 3px solid #f97316` left accent; all other rows have `border-left: 3px solid transparent`
- All rows use `padding: 14px 0 14px 12px` so content aligns consistently regardless of border color
- Sub-score pills: Conversion (`#eff6ff` / `#1e40af` / `#bfdbfe`), Trust (`#faf5ff` / `#7e22ce` / `#e9d5ff`), Risk (color-coded: Low green, Medium amber, High red)
- Delta baseline score is taken from `comparisonResult.rows` where `versionId === '__original__'`

---

## Client Report Prompt — v2 Rewrite (2026-06-30)

**File modified:** `src/prompts/copyzap-client-prompt.md`

### Changes

**Score type restructuring.** The prompt previously showed a 6-column Version Scores table (Version · Editorial Quality · Conversion Potential · Absolute Score · Rank · Takeaway) and instructed the LLM to invent or derive multiple score columns. The new version replaces this with a strict 4-column table (Version · CopyZap Score · Rank · Takeaway) whose score column is copied verbatim from Section B's `### SCORES` list — the app's own relative session scores. No editorial, conversion, or absolute columns appear in PART 1.

**New SCORE TYPES block.** Clarifies three score types:
- CopyZap relative score (session) — the headline score, from Section B verbatim, never recomputed
- Independent review (blind) — used only for ranking validation and the qualitative four-dimension guidance; the absolute 0–100 single number is confined to PART 2
- "CopyZap Score" alias for Section B

**Dimensional table retitled.** Section 4 ("Where Each Version Is Strong and Weak") now carries a sentence clarifying that the 6-column dimensional breakdown is a qualitative guide to where a version is strong or weak, not a competing headline score, and that the headline score is CopyZap's relative score from Section 2.

**TABLE SHAPES updated.** Version Scores changed from 6 to 4 columns. Validation and Divergence tables unchanged. All other table shapes unchanged.

**Eval and Compare reports unaffected.** `copyzap-eval-prompt.md` and `copyzap-compare-prompt.md` were not modified.

---

## .docx Export — 4-Column Wide-Last Profile (2026-06-30)

**File modified:** `src/components/copy-maker/CopyMakerSidebar.tsx`

### Change

**Header-aware width selection for 4-column tables.** Previously, every 4-column table used the fixed profile `[4600, 3000, 3360, 2000]`. The `buildDocxTable` function now checks the last header cell of 4-column tables (case-insensitive, trimmed). If it matches any of: `Takeaway`, `Conclusión`, `Conclusion`, `Resumen`, `Nota`, `Note`, the table uses the wide-last profile `[3400, 1700, 1400, 6460]` (sum = 12960). All other 4-column tables continue to use the original `[4600, 3000, 3360, 2000]` profile unchanged.

This means the Client Report's Version Scores table (last header: Takeaway/Conclusión) and the Dimensional Breakdown's last-column tables get a wide narrative column, while the Evaluation Report's appendix table (last header: Rank / Claude Rank) and all Compare Report tables remain on the original widths.

---

## Rankings Snapshot — Row Divider Contrast Fix (2026-06-30)

**File modified:** `src/components/results/decision/RankingsSnapshotCard.tsx`

### Change

Darkened the horizontal row divider between rankings rows from `divide-gray-50 dark:divide-gray-900` to `divide-gray-200 dark:divide-gray-700`. The previous values were nearly invisible against the card background. The updated values produce clearly visible separators in both light and dark mode without being visually heavy or distracting.

---

## HTML Export — Fixes Round 4 (2026-05-10)

**File:** `src/utils/enhancedExports.ts`

### Fixes applied

**1. All left-border accents in export now orange**
The copy body reading block in `generateFullHtmlExportForCard` (the `data-copy-body` div that wraps the actual copy text) changed from `border-left: 3px solid #e5e7eb` to `border-left: 3px solid #f97316`. This means all left-border `3px` accents in the exported document now use the document's orange accent color (`#f97316`), consistent with the input summary, winner banner, and Strategic Recommendation blocks. The one exception intentionally kept gray is the `border-top: 1px solid #e5e7eb` row separators in the rankings list.

**2. Rankings rows — consistent padding alignment**
Non-winner ranking rows previously had `padding: 14px 0` (no left padding), while the winner row had `padding: 14px 0 14px 12px`. This caused the content inside non-winner rows to be 12px left-shifted compared to the winner row. All rows now use `padding: 14px 0 14px 12px` regardless of winner status, so content aligns consistently across all rows.

---

## Scoring Engine — Positioning-Aware Evaluation Update (2026-05-12)

**Files:** `src/services/api/comprehensiveScoring.ts`, `src/services/api/comparativeScoring.ts`

### Summary

The LLM scoring engine now infers brand positioning from context before scoring, adjusts dimension weights accordingly, and evaluates three new quality dimensions that penalize AI-style copy, hype language, and positioning mismatches.

### Silent Positioning Inference

Before assigning any scores, the LLM silently infers a positioning category from the audience description, tone, industry signals, and copy. This inference is never surfaced to the user. Categories:

| Inferred Positioning | Trigger signals | Weight adjustments |
|---|---|---|
| Premium B2B Service | Professional/agency/high-ticket audience + professional/elegant tone | Trust, credibility, humanAuthenticity, brandFit, audienceToneAlignment are dominant. overMarketingPenalty has 2× weight. Aggressive copy cannot win. |
| Direct Response | Consumer/e-commerce/short buying-cycle audience | Conversion, urgency, CTA strength elevated. overMarketingPenalty has 0.5× weight. |
| SaaS / Growth | Startup/tech/SaaS/developer audience | All dimensions balanced. New three dimensions apply at standard weight. |
| Balanced | No clear signal | Equal weights across all dimensions. |

### New Scoring Dimensions

Three new dimensions added to `VersionSubscores` and the JSON response schema:

**Human Authenticity (0–100)**
Does the copy sound written by a real strategist or AI trying to sell? Rewards clarity, emotional intelligence, and believable claims. Penalizes robotic persuasion patterns, forced enthusiasm, and AI filler phrases ("comprehensive solution", "seamlessly integrates", "game-changing results"). Score below 45 = clearly machine-generated.

**Over-Marketing Penalty (0–100 where 100 = clean)**
Measures hype, exaggeration, and over-optimization. Penalizes: "while you sleep", "24/7 working for you", fake urgency, fake scarcity, excessive superlatives, stacked exaggerated promises. Score below 60 in a Premium B2B context signals serious brand risk and has 2× weight impact on final score.

**Brand Fit (0–100)**
Does the tone, sophistication level, and emotional register match what the inferred positioning requires? A premium brand copy using direct-response patterns (fake urgency, pressure language) scores low even if individual persuasion dimensions are high.

### Evidence Fields

Three new evidence fields added to `VersionEvidence` (all optional, backward-compatible):
- `humanAuthenticity`: verbatim excerpt illustrating authentic or robotic tone
- `overMarketingPenalty`: verbatim excerpt of most hype-heavy phrase detected
- `brandFit`: verbatim excerpt illustrating brand fit or misfit

### Backward Compatibility

The new three dimensions are optional in the LLM response. If missing (e.g., from a model that doesn't return them), the parser defaults to `70` — a neutral/good value that doesn't distort scores from existing cached responses.

### `computeFinalScore` Update

The heuristic tie-breaker (10% of total score) now includes the three new dimensions alongside the existing ones. Weights rebalanced:
- Core heuristic (conversion/trust/risk): 90%
- Tie-breaker from LLM subscores: 10%, distributed across clarity (0.03), persuasion (0.03), audienceToneAlignment (0.015), emotion (0.01), humanAuthenticity (0.01), overMarketingPenalty (0.01 — high score = clean = good), brandFit (0.01)

### `WEIGHTS` and `CORE_DIMS` Update

`WEIGHTS` constant rebalanced to make room for the new 3 dimensions while keeping total = 1.0 across active dimensions. `CORE_DIMS` and `ALL_DIMS` updated to include the new fields.

---

## UI Diagnostic Display — New Scoring Dimensions (2026-05-12)

**Files:** `src/components/results/decision/RankingsSnapshotCard.tsx`, `src/components/results/ComprehensiveComparisonTable.tsx`, `src/services/api/comprehensiveScoring.ts`

### Summary

Added visible diagnostic columns in the rankings table to show the three new LLM scoring dimensions (Human Authenticity, Over-Marketing Penalty, Brand Fit) alongside Conversion and Trust. A debug output section below the rankings table shows raw JSON values to confirm whether the LLM is returning differentiated scores or defaulting to the `70` fallback value.

### Changes

**Type Updates:**
- `ComparisonResult.rows` now includes optional fields:
  - `humanAuthenticity?: number` (0-100)
  - `overMarketingPenalty?: number` (0-100)
  - `brandFit?: number` (0-100)

**RankingsSnapshotCard Component (RankRow interface update):**
- Added three optional subscore fields to the `RankRow` interface
- Diagnostic columns render as colored badge chips below each version's name (blue for Human Authenticity, purple for Over-Marketing Penalty, amber for Brand Fit)
- Each chip shows the label abbreviation and numeric value (e.g., "Human Aut. 82")
- Chips only appear if the corresponding value is defined (not missing/undefined)

**Debug Output Section:**
- Added visible debug panel below the rankings table (light gray background)
- Displays one line per version showing raw values: `versionLabel: humanAuth=X | overMkt=Y | brandFit=Z`
- Highlights rows where ALL THREE values are either missing or equal to `70` with amber text and `[ALL DEFAULTS]` label
- This diagnostic allows verification that the LLM is actually computing differentiated values and not silently failing back to the fallback default

**Data Flow:**
- `ComprehensiveComparisonTable` maps comparison result rows to `rankingRows` with the three new subscores included
- `RankingsSnapshotCard` receives and displays them as optional diagnostic columns + debug output
- Backward compatible: if subscores are not present, diagnostic section is hidden

### Purpose

This diagnostic display enables verification that:
1. The LLM judge is receiving and processing the three new scoring dimensions
2. Actual differentiated values are being returned (not all `70`)
3. No silent fallback is occurring during parsing

The debug line `[ALL DEFAULTS]` in amber signals a potential issue (either LLM is omitting the new fields, or all three happened to score exactly 70, which is unlikely).

---

## Diagnostic Logging and Export Verification (2026-05-12)

**Files:** `src/services/api/comprehensiveScoring.ts`, `src/utils/enhancedExports.ts`

### Purpose

Added diagnostic logging and debug export sections to verify whether the LLM judge is actually returning the three new scoring dimensions or if they're being silently omitted.

### Logging Points

**Location 1: Raw LLM Response (comprehensiveScoring.ts, line ~2014)**
```
[scoreVersion] Raw LLM response for "VERSION_NAME": {first 500 chars of JSON}...
```
Shows the first 500 characters of the cleaned JSON response from the LLM. If the three new fields are present in the response, they will appear in this output.

**Location 2: Parsed Subscores (comprehensiveScoring.ts, line ~2139)**
```
[scoreVersion] Parsed subscores for "VERSION_NAME": humanAuth=X overMkt=Y brandFit=Z
```
Shows the final parsed and clamped values for the three new dimensions after JSON parsing and type coercion. This confirms they made it through the parsing pipeline.

### Export Debug Section

At the end of the HTML export (before closing `</body>`), a diagnostic section appears showing:
- One row per version
- Format: `Version Name: humanAuth=X | overMkt=Y | brandFit=Z [ALL DEFAULTS]`
- Versions where all three values are missing OR all equal to `70` are highlighted in amber background with `[ALL DEFAULTS]` flag

This diagnostic section in the export file helps verify:
1. Whether the subscores made it through to the export function
2. Whether they have differentiated values or defaulted to `70`
3. Whether parsing is working correctly through the entire pipeline

### Workflow for Verification

1. **Run a comparison/scoring** that generates an export
2. **Check console/logs** for `[scoreVersion]` diagnostic output to see raw LLM response
3. **Open exported HTML file** and scroll to end to find the DEBUG section
4. **Compare results:**
   - If `[ALL DEFAULTS]` appears: LLM omitted the fields, issue is at the **prompt level**
   - If differentiated values appear: LLM is working, issue is at **data flow/export level**

### Key Finding Indicator

If the debug section shows:
- ✅ `humanAuth=82 | overMkt=76 | brandFit=88` → LLM is working, add to markdown/export
- ❌ `humanAuth=70 | overMkt=70 | brandFit=70 [ALL DEFAULTS]` → LLM not generating, fix prompt

---

## Comparative Scoring Engine — Three New Dimensions + Version Count Fix (2026-05-12)

**Files:** `src/services/api/comparativeScoring.ts`

### Changes

#### Issue 1: Missing Scoring Dimensions in JSON Schema

**Updated JSON Response Format:**
The `ranking` array now includes three new scoring dimensions per version:

```json
{
  "ranking": [
    {
      "versionId": "...",
      "label": "...",
      "score": 85,
      "rank": 1,
      "reason": "...",
      "humanAuthenticity": 82,      // NEW: 0-100, how naturally written
      "overMarketingPenalty": 76,    // NEW: 0-100, 100 = clean, low = hype
      "brandFit": 88                 // NEW: 0-100, alignment with positioning
    }
  ]
}
```

**Three New Dimensions:**
- **humanAuthenticity (0–100)**: How naturally and authentically written the copy feels. 100 = sounds like an experienced strategist wrote it. Low scores = robotic AI patterns, hollow superlatives, forced enthusiasm.
- **overMarketingPenalty (0–100)**: 100 = clean copy with no hype. Penalizes exaggerated promises, fake urgency, clichés like "mientras duermes" or "24/7 working for you", stacked superlatives, fake specificity, over-optimized direct-response patterns.
- **brandFit (0–100)**: Does the tone, register, and sophistication level match the inferred brand positioning? A premium B2B agency using aggressive direct-response copy scores low here even if technically persuasive.

#### Issue 2: Version Count Mismatch

**Problem:** When the LLM returned fewer versions than submitted, missing versions were silently dropped from the ranking.

**Solution:** (Lines ~494-523)
1. Detect when `parsed.ranking.length !== versions.length`
2. Identify which versions are missing from the LLM response
3. Append missing versions to the ranking with:
   - Default score: `50`
   - Default reason: `"Missing from LLM ranking - assigned default score"`
   - Default subscores: `humanAuthenticity=50, overMarketingPenalty=50, brandFit=50`
   - Consecutive rank numbers after the last ranked version

**Console Output:**
```
⚠️ [comparative-scoring] Expected 9 versions, got 7
[comparative-scoring] Appending 2 missing version(s):
  - Appending Version Name 1 (id123) as rank 8
  - Appending Version Name 2 (id456) as rank 9
```

#### Silent Positioning Inference

Already present in the prompt (Step 1, lines 130-137):
- Infers brand positioning from audience, tone, industry, and copy signals
- Categories: Premium B2B Service, Direct Response, SaaS/Growth, Balanced
- Adjusts weighting of the three new dimensions:
  - Premium B2B: overMarketingPenalty has 2× weight, aggressive copy penalized
  - Direct Response: overMarketingPenalty has 0.5× weight, urgency rewarded
  - SaaS/Growth & Balanced: equal weights
- **Never appears in JSON output** — internal only

#### Diagnostic Logging

**Lines ~538-547:** After parsing, logs verification of new dimensions:
```
[comparative-scoring] New dimensions verification:
  ✓ Version 1: humanAuth=82 overMkt=76 brandFit=88
  ✓ Version 2: humanAuth=65 overMkt=72 brandFit=79
  ✓ Version 3: humanAuth=90 overMkt=88 brandFit=92
```

✓ = all three dimensions present
✗ = one or more missing (indicates LLM didn't generate them)

#### Data Flow

New dimensions flow through:
1. **LLM Response** → `humanAuthenticity`, `overMarketingPenalty`, `brandFit` in ranking items
2. **mapToComparisonResult()** → Passed through to `ComparisonResult.rows`
3. **UI (RankingsSnapshotCard)** → Displayed as diagnostic columns + debug output
4. **HTML Export** → Debug section shows raw values


---

## Comparative Scoring Engine — Model Changed to Claude (2026-05-12)

**File:** `src/services/api/comparativeScoring.ts`

The comparative scoring engine now always uses `claude-sonnet-4-5` instead of `gpt-4o`. The model is hardcoded for this engine specifically — the user's model selection and the global `SCORING_MODEL` constant are ignored for comparative scoring calls.

**What changed:**
- Line ~82: `actualModel` is now `'claude-sonnet-4-5'` (hardcoded, not derived from `SCORING_MODEL`)
- Line ~446: Logs `[comparative-scoring] model_used: "claude-sonnet-4-5"` to confirm the model after each call

**What did not change:** prompt, JSON schema, scoring dimensions, data flow, fallback behavior.


---

## Debug Display Cleanup — Production-Ready UI (2026-05-12)

**Files:** `src/utils/enhancedExports.ts`, `src/services/api/comprehensiveScoring.ts`, `src/components/results/decision/RankingsSnapshotCard.tsx`

All diagnostic debug displays and logging have been removed. The three new positioning-aware dimensions (humanAuthenticity, overMarketingPenalty, brandFit) have been verified as working correctly and are now integrated silently into the scoring pipeline.

**What was removed:**

1. **HTML Export Debug Section** (enhancedExports.ts):
   - Removed the debug section at the end of HTML exports that displayed raw subscore values per version
   - Removed the amber background highlighting for [ALL DEFAULTS] versions
   
2. **Console Logging** (comprehensiveScoring.ts):
   - Removed `[scoreVersion] Raw LLM response` log (line ~2014)
   - Removed `[scoreVersion] Parsed subscores` log (line ~2133)

3. **UI Diagnostic Display** (RankingsSnapshotCard.tsx):
   - Removed inline "Human Aut.", "Over-Mkt", "Brand Fit" badges from the rankings table
   - Removed the "DEBUG: Raw LLM Subscore Values" section that appeared below the rankings
   - UI now displays only: Conversion, Trust, Risk, and Final Score (as before)

**What was NOT removed (still active):**

- The three new dimensions remain in the LLM prompt with positioning inference
- The JSON schema includes the three fields per version in comparative scoring
- The dimensions are passed through to ComparisonResult.rows silently
- The HTML and markdown export functions retain the data (just don't display debug section)
- All scoring logic, weighting, and dimension calculations remain intact
- Console logging for comparative scoring model confirmation remains (showing "model_used": "claude-sonnet-4-5")

**Result:** Clean, production-ready UI that shows exactly what it did before (Conversion, Trust, Risk, Final Score rankings), while the sophisticated positioning-aware dimensions now work silently in the backend.

---

## Scoring System Updates — Claim Flagging & Sub-Score Integration (2026-05-12)

**Files:** `src/services/api/comparativeScoring.ts`, `src/utils/enhancedExports.ts`

### Update 1 — Stop Penalizing Unverified Claims, Flag Them Instead

**Prompt Changes (comparativeScoring.ts lines ~156-189):**
- **Removed:** Instruction to penalize "Unsourced numerical claims → trust penalty, lower rank"
- **Added:** New criterion: "Claim specificity & structure" that REWARDS versions with specific metrics, percentages, timeframes, and social proof
- **Philosophy:** Specific claims show persuasive structure and give human editors actionable content to verify/refine. Vague copy is harder to improve.

**New JSON Field: verificationFlags (per version):**
- Array of strings — each flagged claim requiring human verification
- Extracted automatically from version copy
- Examples:
  * "30% faster than competitors"
  * "within 6 months"
  * "less than 2 seconds load time"
  * "primero en Google"
  * "1000+ active users"

**Display in Exports & UI:**
- **HTML Export** (lines ~1716-1734 in enhancedExports.ts): Yellow section "Verificación requerida antes de publicar" with bullet list of flagged claims
- **Markdown Export** (lines ~2555-2561 in enhancedExports.ts): Section "#### Verificación requerida antes de publicar" with claims as list items
- **Tone:** Neutral checklist, not a warning — helps editors know what to verify before publishing

### Update 2 — Wire Conversion and Trust Sub-Scores into Final Score

**Problem Solved:**
- Previously: Final score came only from comparative ranking. Conversion and Trust sub-scores were derived FROM the final score (heuristic → not influential)
- Now: Conversion and Trust sub-scores influence the final score calculation (true bidirectional link)

**Implementation (comparativeScoring.ts lines ~614-655 in mapToComparisonResult):**
1. Extract version content and calculate actual Conversion/Trust scores using `calculateMultiScoreDisplay()`
2. If actual sub-scores exist, blend them with comparative rank score:
   - **Final Score = (Comparative Rank Score × 0.6) + (Conversion × 0.2) + (Trust × 0.2)**
3. Use fallback: if content unavailable, use 60% comparative score + derived subscores

**Result:**
- Final scores now incorporate:
  - Comparative ranking (60%) — LLM relative judgment
  - Conversion sub-score (20%) — how persuasive and actionable
  - Trust sub-score (20%) — credibility and claims substantiation
- Reduces gap between comparative rank and individual dimension scores
- More consistent overall scoring

**Data Flow:**
```
Version Content
  → calculateMultiScoreDisplay() → conversion=X, trust=Y
       ↓
Comparative Rank Score (LLM)
       ↓
BLEND → finalScore = (rankScore × 0.6) + (X × 0.2) + (Y × 0.2)
       ↓
UI Display & Exports
```

---

**Testing Notes:**
1. Verification flags should appear in HTML/markdown export with yellow background (HTML) or "Verificación" section (markdown)
2. Final scores should shift slightly when sub-scores are calculated (narrower variance from comparative scores)
3. Run against Sharpen Studio to confirm flags display and scores reflect sub-score influence

---

## Scoring Refinement — Specific Claims Treated as Neutral Placeholders (2026-05-12 Update 2)

**File:** `src/services/api/comparativeScoring.ts`

**Criterion b Change:** "Claim specificity & structure" → "Benefit-focused structure"

**What changed:**

Previously, versions WITH specific metrics (e.g., "30% faster", "within 6 months") scored higher than versions WITHOUT (e.g., "significantly faster", "quick results") for the same structural intent.

Now: Specific numbers are treated as **neutral placeholders**. Both versions score identically for structural quality:
- "mejoramos tus conversiones significativamente" = "mejoramos tus conversiones un 40%"
- "Resultados rápidos" = "Resultados en 2 semanas"  
- "Mayor ROI" = "50% más ROI"

**Scoring rule:**
- Score ONLY the structural presence of where outcomes/timeframes/proof points logically belong
- Do NOT reward versions for having more specific numbers
- Do NOT penalize versions for having fewer specific numbers
- Both are scored on the quality of persuasive structure alone

**Verification flags unchanged:**
- Still extract all specific claims (percentages, timeframes, guarantees, superlatives, social proof)
- Still display them in exports as "Verificación requerida antes de publicar"
- But now they have ZERO scoring impact — they're for editor action only, not ranking

**Rationale:**
The LLM should judge copy quality based on structural intent, not data specificity. Numbers are placeholders for the client to replace with verified metrics. A well-structured copy with "40%" is just as good as well-structured copy with "significantly" — the editor decides which to use based on actual data.

---

---

## Scoring Neutrality — Three Language Categories Zero Impact (2026-05-12 Update 3)

**File:** `src/services/api/comparativeScoring.ts` (Sections 6 & 6A)

**Three Neutral Language Categories (Zero Scoring Impact):**

All of these are extracted and flagged for editor review, but never add or subtract ranking points.

### Category 1: Figurative Language
Examples: "vendedor 24/7", "mientras duermes", "trabaja sin descanso", "motor de crecimiento", "trabaja incansablemente"

- These are stylistic conventions and rhetorical flourishes
- Some brands want them; others don't — it's a brand voice decision, not a quality judgment
- Flag label: "lenguaje figurativo — revisar según voz de marca"
- Scoring impact: ZERO

### Category 2: Unverified Metrics & Specificity
Examples: "30% faster", "within 6 months", "2 second load time", "primero en Google", "50% más ROI"

- Percentages, timeframes, performance guarantees, ranking promises
- These are data placeholders for the editor to replace with verified numbers
- "Mejoramos significativamente" = "mejoramos un 40%" (scores identically)
- Flag label: "dato a verificar antes de publicar"
- Scoring impact: ZERO

### Category 3: Tone Intensity & Superlatives
Examples: "imparable", "extraordinario", "inquebrantable", "secretamente", "abismal", "explosivo"

- Intensifiers and superlatives reflect brand personality choices
- Some brands need bold, aggressive language; others need measured restraint
- Do NOT penalize versions with intensity
- Do NOT reward versions with intensity
- Only penalize if intensity creates structural/tone mismatch (e.g., aggressive language in a corporate agency copy)
- Flag label: "intensidad de tono — revisar según personalidad de marca"
- Scoring impact: ZERO (unless it creates structural mismatch)

**What Scoring DOES Focus On:**
1. Clear hook (does it grab attention or establish relevance?)
2. Logical, complete structure (beginning/middle/end flow)
3. Differentiated positioning (not generic competitor copy)
4. Clear call to action
5. Tone fit for B2B professional context (structural alignment, not style preference)

**Verification Flags Output Format:**

Each version receives flags with their category labels:
```
"verificationFlags": [
  "lenguaje figurativo — revisar según voz de marca: trabaja mientras duermes",
  "dato a verificar antes de publicar: 30% faster than competitors",
  "dato a verificar antes de publicar: within 6 months",
  "intensidad de tono — revisar según personalidad de marca: imparable"
]
```

These appear in HTML and markdown exports with no impact on final score.

---

---

## Verification Flags UI Display — HTML & App Integration (2026-05-12 Update 4)

**Files modified:**
- `src/utils/enhancedExports.ts` (already had HTML export support)
- `src/components/results/decision/VersionAnalysisCard.tsx` (added UI rendering)
- `src/components/results/decision/RankingsSnapshotCard.tsx` (added interface field)
- `src/components/results/ComprehensiveComparisonTable.tsx` (wire verification flags to components)

**Three Locations Where Verification Flags Now Appear:**

### 1. HTML Export
- Yellow-tinted box: "Verificación requerida antes de publicar"
- Appears below main score, above sub-scores section
- Lists all flagged items with bullet points
- Styling: `#fef3c7` background, `#fbbf24` left border, `#92400e` text color

### 2. App UI — Results Panel (VersionAnalysisCard)
- Compact amber callout box below sub-scores
- Header: "Verificar antes de publicar" (uppercase, bold)
- Simple bullet-list of flags
- Styling: amber-50 background, amber-200 border, dark mode: amber-950/30
- Positioned: Above "Key Strengths & Improvements" section

### 3. Markdown Export (Already Supported)
- Section: "#### Verificación requerida antes de publicar"
- Displayed per version in comparison results

**Data Flow:**
1. `comparativeScoring.ts` extracts and returns `verificationFlags` array per version
2. `ComprehensiveComparisonTable.tsx` maps flags from `comparisonResult.rows` into `rankingRows`
3. `RankingsSnapshotCard` receives flags (currently in table, not displayed inline)
4. `VersionAnalysisCard` receives flags via `row.verificationFlags` and renders in amber callout
5. `enhancedExports.ts` renders flags in both HTML and markdown exports

**Visual Hierarchy:**
```
Version Score (main number)
 ↓
Delta vs Best / Decision Badge
 ↓
Sub-Scores (Conversion, Trust, Risk) [blue chips]
 ↓
[NEW] VERIFICATION FLAGS [amber callout]
 ↓
Key Strengths & Improvements
 ↓
Decision / Recommendation
```

**No Scoring Logic Changes:** Flags have zero impact on ranking or scoring — they are purely informational for editor action items.

---

## Expanded Export Analysis — 12-Dimension Scoring Enhancement (2026-05-12)

**Files:** `src/utils/multiScoreDisplay.ts`, `src/utils/enhancedExports.ts`

### Overview

All three export outputs (EVAL .md, COMPARE .md, HTML export) now include a significantly richer per-version analysis. Twelve new dimensions are computed entirely client-side using text heuristics — no new LLM calls, no database changes, no scoring engine modifications. Rankings and existing scores are unchanged.

---

### Item 1 — Dual Score Display (Editorial Quality + Conversion Potential)

The single combined "final score" is supplemented with two separate derived scores:

- **Editorial Quality** (0–100): Measures writing craft — structure, clarity, flow, grammar signals, professional polish, depth, vocabulary richness.
- **Conversion Potential** (0–100): Measures commercial effectiveness — CTA presence, urgency language, benefit clarity, social proof signals, FOMO cues.

These two scores are displayed separately in all three output formats. They are never combined or averaged together. The existing `finalScore` from the scoring engine remains unchanged and still controls ranking.

**Computed by:** `computeEditorialQuality(text)` and `computeConversionPotential(text)` in `multiScoreDisplay.ts`.

---

### Item 2 — 10-Dimension Persuasion Breakdown

Each version receives scores (0–100) across 10 persuasion sub-dimensions:

1. **Emotional Impact** — emotional language density and empathy signals
2. **Clarity** — sentence length, passive voice avoidance, jargon reduction
3. **Trust** — credibility markers, evidence signals, anti-hype balance
4. **Specificity** — concrete numbers, named specifics, detail density
5. **Urgency** — time pressure language, scarcity signals
6. **Professionalism** — formal register, grammar signals, structural discipline
7. **Readability** — sentence rhythm, paragraph structure, flow
8. **CTA Strength** — call-to-action presence, directness, actionability
9. **Audience Fit** — audience-specific vocabulary and tone alignment
10. **Differentiation** — unique value proposition language, competitive contrast

In the **HTML export**: rendered as a visual progress bar grid (two columns, colored bars proportional to score value, score number shown at right).

In **EVAL .md**: listed as a plain-text breakdown with scores and one-line interpretation per dimension.

**Computed by:** `computePersuasionBreakdown(text)` returning a `PersuasionBreakdown` interface.

---

### Item 3 — Audience Fit Block

Each version is assessed for fit across four audience segments:

- **SMB Owners** (small/medium business decision-makers)
- **Corporate Executives** (enterprise tone, risk-averse language)
- **Traditional Industries** (conservative, non-tech-forward audiences)
- **High-Pressure Sales Teams** (urgent, commission-driven language)

Each segment receives a **High / Medium / Low** fit rating. In `.md` exports, a one-sentence reason is included per segment. In the **HTML export**, fit is shown as color-coded badges only (no reasons, to conserve space).

**Computed by:** `computeAudienceFit(text, includeReasons?)` returning an `AudienceFitResult` interface.

---

### Item 4 — Risk Factors Block

Each version receives a list of version-specific risk factors — concrete issues that could reduce effectiveness in the real world. These are derived from the actual text content (e.g., overuse of superlatives, missing CTA, passive voice, unverified claims detected, extremely short content, etc.). Generic or placeholder risks are never included.

In **EVAL .md**: listed as a bulleted section labeled "Risk Factors."

In the **HTML export**: shown as a red-tinted callout box, only displayed if at least one risk exists.

**Computed by:** `computeRiskFactors(text, verificationFlags?)` — accepts optional `verificationFlags[]` from the existing comparison result to incorporate them into the risk list.

---

### Item 5 — "Why This Version Won" Block

For the **winner only**: a block explicitly comparing the winner against the other versions — what specific quality or property it had that the others lacked. This is derived from the text content differential, not a generic "it scored higher" statement.

Appears in all three output formats in the winner's analysis section.

---

### Item 6 — Winner Type Classification

For the **winner only**: classifies the win margin as one of:

- **Clear Winner** — score gap ≥ 15 points vs second place
- **Moderate Winner** — score gap 8–14 points
- **Close Call** — score gap < 8 points

Each classification comes with a one-sentence reason (e.g., "Clear Winner — led by 18 points, strong advantage across multiple dimensions.").

**Computed by:** `classifyWinnerType(winnerScore, secondScore)`.

---

### Item 7 — Verification Flags Moved to Top

Verification flags (figurative language / unverified metrics / tone intensity) now appear at the **top** of each version's block in all three export formats — before scores, before breakdown. They are rendered as an amber callout in the HTML export.

This corrects the previous placement which put flags after scores.

---

### Item 8 — Word Count + Reading Level

Each version now shows:

- **Word count** — total word count of the copy text
- **Reading level** — Easy / Medium / Advanced, derived from a Flesch-Kincaid approximation using syllable counting

**Formula:** `206.835 - (1.015 × avgWordsPerSentence) - (84.6 × avgSyllablesPerWord)`, clamped to 0–100.
- ≥ 60 → Easy
- ≥ 30 → Medium
- < 30 → Advanced

In the **HTML export**: shown as a compact info card adjacent to the dual score cards.

**Computed by:** `computeWordCountAndReadingLevel(text)` returning `{ wordCount, readingLevel, fleschScore }`.

---

### Items 9–12 — EVAL .md Additional Metadata

These four fields appear only in the **EVAL .md** output (not in HTML export):

**9. Evaluation Confidence** (`High` / `Medium` / `Low`)
Indicates how reliably the scoring signals apply to this text. A reason is included if confidence is not High (e.g., "Low — text is very short, scoring signals are weak").

**10. Primary Conversion Strategy**
One of eight named types:
- Fear of Missing Out, Authority and Credibility, Social Proof, Direct Benefit Statement, Urgency and Scarcity, Emotional Story, Problem-Solution, Comparison/Contrast

**11. Commercial Intensity** (`High` / `Medium` / `Low`)
Measures how aggressively commercial the copy is — density of sales language, CTAs, pricing references, and promotional signals.

**12. Most Likely Conversion Driver**
A single sentence naming the single most powerful element in the copy that is most likely to drive the reader toward action.

**Computed by:** `computeEvaluationConfidence`, `computeConversionStrategy`, `computeCommercialIntensity`, `computeMostLikelyConversionDriver` in `multiScoreDisplay.ts`.

---

### COMPARE .md — Section C Expansions

Section C (AI vs App reliability analysis) was expanded from 8 to 10 tasks:

**Score Comparison Analysis (new):**
- Compare Editorial Quality scores between AI judge and app scores; flag any gap > 10 points
- Compare Conversion Potential scores separately; flag any gap > 10 points
- For each of the 10 Persuasion Sub-Dimensions, flag disagreements > 15 points between sources
- State explicitly whether the app conflates Editorial Quality with Conversion Potential in its scoring

**Expanded Reliability Verdict:**
The reliability verdict now addresses three separate questions explicitly:
1. Is the ranking reliable?
2. Is the editorial quality scoring reliable?
3. Is the conversion potential scoring reliable?

Previously the verdict only addressed overall ranking reliability.

---

### Technical Notes

- All 12 new dimensions are computed **client-side only** using text heuristics
- No new LLM calls are made
- No database schema changes
- No changes to the scoring engine, ranking logic, or `finalScore` calculation
- No changes to file naming conventions or Section A/B structure
- `computeRiskFactors` accepts optional `verificationFlags[]` from the existing `comparisonResult.rows[].verificationFlags` to enrich the risk list without duplication

---

## Shared docx Builder & Compare Report Feature (2026-06-29)

**Files changed:**
- `src/components/copy-maker/CopyMakerSidebar.tsx`
- `src/utils/enhancedExports.ts`
- `src/prompts/copyzap-compare-prompt.md` *(new)*

---

### PART A — Shared `buildReportDocx` function

**Location:** `CopyMakerSidebar.tsx` lines 50–290 (module-level, before the component)

A shared async function `buildReportDocx(markdown: string, meta: ReportDocxMeta): Promise<Blob>` was extracted from the previously inline `handleExportEvalDocx` handler and placed at module level. All docx generation logic (dynamic `import('docx')`, constants, `cellBorder`, `getColWidths`, `assertWidths`, `parseInlineRuns`, `buildDocxTable`, markdown parser loop, header block, `Document` construction) now lives here.

The `handleExportEvalDocx` handler was replaced with a thin 38-line wrapper that calls `buildReportDocx` — producing identical output. The numbering reference in `buildReportDocx` is `report-list` (shared between both report types).

**`ReportDocxMeta` interface:**
```typescript
interface ReportDocxMeta {
  title: string;       // Document title in header block
  project: string;     // Project/session name
  date: string;        // Formatted date string
  displayLang: string; // Native language name (e.g. "Español")
  versionCount: number;// Number of copy versions evaluated
  footerText: string;  // Footer center text
  filePrefix: string;  // Used in numbering reference
  filename: string;    // Full .docx filename for download
}
```

**Document spec:** US Letter landscape (12240×15840 DXA), 1440 DXA margins on all sides, Arial font, monochrome palette (`#000000` / `#404040` / `#D9D9D9` / `#F2F2F2` / `#FFFFFF` / `#BFBFBF`).

**Column width map (sums to 12960 DXA each):**
- 6-col: `[2600, 1500, 1700, 1760, 1700, 3700]`
- 4-col: `[4600, 3000, 3360, 2000]`
- 3-col: `[4200, 1600, 7160]`

**Scaffold filtering:** Lines matching `/12960/i`, `/column widths sum/i`, `/Before generating/i`, `/Verify:/i` are stripped before rendering.

**Header row bold fix:** `parseInlineRuns` accepts a `bold` parameter; header cells pass `bold: true` directly — resolving the blank-cell bug caused by spreading a class instance.

---

### PART B — `buildLLMEvaluationAudit` string-builder

**Location:** `src/utils/enhancedExports.ts` line ~3595

The previously 400-line inline body of `exportLLMEvaluationAudit` was extracted into a new exported function `buildLLMEvaluationAudit(...)` returning `{ markdown: string; filename: string }`. The `exportLLMEvaluationAudit` function is now a thin wrapper that calls `buildLLMEvaluationAudit` and triggers a browser download.

This separation allows the sidebar to call `buildLLMEvaluationAudit` directly (to get the markdown string for the Compare Report LLM prompt) without triggering a file download.

---

### PART C — `copyzap-compare-prompt.md` and Compare Report button

**File:** `src/prompts/copyzap-compare-prompt.md`

A new prompt file for the Compare Report workflow, distinct from the Evaluation Report prompt. Key differences from the eval prompt:

- Introduces three score types: **CopyZap Session Score**, **Claude Session Score**, **Claude Absolute Score** (4 dimensions × 0–25, total 0–100)
- Phase 1 includes both relative and absolute blind scoring
- Phase 2 computes Δ between CopyZap Session and Claude Session; flags any Δ > 10
- PART 1 (client-facing): Executive Summary, Comparison Table, Winning Version, Concrete Improvements, Disclaimer
- PART 2 (appendix): A1 Absolute Breakdown (6-col), A2 Absolute Score Analysis, A3 Divergence Table (6-col), A4 Shared Strengths & Weaknesses, A5 Methodology Note
- Output file prefix: `CLAUDE-REPORT-` (distinct from Eval Report's `CLAUDE-` prefix)

**Button added** in the Export block of `CopyMakerSidebar.tsx`, below the Evaluation Report button. Same visibility gating: `hasContent && !!comparisonResult && sortedGeneratedVersions.length >= 2 && isAdmin`. Uses `GitMerge` icon.

---

### PART D — Compare Report state, handler, preview, and export

**State added** (alongside eval report state):
```typescript
const [isGeneratingCompareReport, setIsGeneratingCompareReport] = useState(false);
const [compareReportMarkdown, setCompareReportMarkdown] = useState<string | null>(null);
const [compareReportFilename, setCompareReportFilename] = useState<string>('');
const [showComparePreview, setShowComparePreview] = useState(false);
```

**`handleGenerateCompareReport`:** Calls `buildLLMEvaluationAudit` to get the audit markdown, prepends a language directive, concatenates `comparePrompt`, sends to `makeApiRequestWithFallback('claude-sonnet-4-5', ..., 0.4, 8000)`, stores result in state, opens preview.

**`handleDownloadCompareMd`:** Downloads the report as `CLAUDE-REPORT-<filename>.md`.

**`handleExportCompareDocx`:** Calls `buildReportDocx` with `title: 'Compare Report — CopyZap vs. Claude'` and `filePrefix: 'CLAUDE-REPORT'`, downloads as `CLAUDE-REPORT-<filename>.docx`.

**Preview modal:** Matches the Evaluation Report preview style (`.compare-report-preview` CSS class, monochrome palette, Arial font, scaffold-filtered rendered markdown). Footer buttons: Download .md, Output as Word file?, Close.

**Processing modal:** Shown during generation via `ReactDOM.createPortal`.

---

## Streaming Report Generation — Fix for 504 IDLE_TIMEOUT (2026-06-29)

**Root cause:** The `ai-completion` edge function awaited the full Anthropic response before returning. With `max_tokens: 8000`, Claude's response takes >150 seconds on long reports, exceeding Supabase's IDLE_TIMEOUT limit.

**Files changed:**
- `supabase/functions/ai-completion/index.ts`
- `src/services/api/utils.ts`
- `src/components/copy-maker/CopyMakerSidebar.tsx`

---

### Edge function changes (`supabase/functions/ai-completion/index.ts`)

Added a streaming branch that activates when `stream: true` is in the request body and the model is a Claude model. In this path:

1. Requests `stream: true` on the Anthropic API call
2. Pipes the raw SSE byte stream through a `TransformStream` directly to the browser response
3. Returns `Content-Type: text/event-stream` with `Cache-Control: no-cache`

This keeps the connection active (data flowing continuously), preventing the idle timeout entirely. The non-streaming path is unchanged for all other callers.

---

## Client Report — Filename Rename (2026-06-30)

**File:** `src/components/copy-maker/CopyMakerSidebar.tsx` — `handleDownloadClientMd`, `handleExportClientDocx`

Changed the output filename prefix for Client Report exports only. Evaluation Report and Compare Report are unchanged.

**Before:** `CLIENT-<source>.md` / `CLIENT-<source>.docx`

**After:** `CopyZap-CLIENT-REPORT-<source>.md` / `CopyZap-CLIENT-REPORT-<source>.docx`

Additionally, a leading `llm-` (case-insensitive) in the source base name is uppercased to `LLM-` via `.replace(/^llm-/i, 'LLM-')`.

**Example:** source base name `llm-COMPARE_1--...18-52-53` becomes `CopyZap-CLIENT-REPORT-LLM-COMPARE_1--...18-52-53.docx`.

The `filePrefix` metadata field passed to `buildReportDocx` was also updated to `'CopyZap-CLIENT-REPORT'` to match.

---

## Client Report Feature (2026-06-30)

**Files changed:**
- `src/prompts/copyzap-client-prompt.md` *(new)*
- `src/components/copy-maker/CopyMakerSidebar.tsx`

### Overview

A third admin report type, placed below Compare Report in the Output section. Produces a client-ready document that separates the shareable Part 1 (copy evaluation, scores, improvements) from an internal Part 2 (divergence analysis, CopyZap reliability critique). Uses the same streaming pipeline and docx builder as Evaluation Report and Compare Report.

### PART A — Prompt file + button

**`src/prompts/copyzap-client-prompt.md`** — new prompt file, imported raw. Key differences from the Compare prompt:
- **AUDIENCE RULE** — explicit two-audience split: Part 1 is handed to the client (never mentions who is "more correct" or compares evaluators); Part 2 is internal only
- **Score types** — renamed to "Editorial Quality", "Conversion Potential", and "Absolute Score" (4 dimensions × 0–25)
- **TABLE SHAPES** — new 6-column Version Scores table; new 4-column Independent Validation table; 6-column Dimensional Breakdown; 6-column Detailed Divergence; 3-column Impact Prioritization
- **File prefix** — `CLIENT-` (not `CLAUDE-` or `CLAUDE-REPORT-`)
- INTEGRITY RULE, streaming, CRITICAL output-only block, and REPORT LANGUAGE rule all inherited from the same standards

**Button** — `UserCheck` icon, below Compare Report, same visibility gating: `hasContent && !!comparisonResult && sortedGeneratedVersions.length >= 2 && isAdmin`.

### PART B — State, handler, preview modal

**State added:**
```typescript
const [isGeneratingClientReport, setIsGeneratingClientReport] = useState(false);
const [clientReportMarkdown, setClientReportMarkdown] = useState<string | null>(null);
const [clientReportFilename, setClientReportFilename] = useState<string>('');
const [showClientPreview, setShowClientPreview] = useState(false);
const [includeInternalSection, setIncludeInternalSection] = useState(false);
```

**`handleGenerateClientReport`** — mirrors `handleGenerateCompareReport` exactly: builds LLM input as `[language directive] + clientPrompt + '\n\n' + buildLLMEvaluationAudit(...)`, calls `makeStreamingReportRequest('claude-sonnet-4-5', ..., 0.4, 8000)`, stores result, resets `includeInternalSection` to `false`, opens preview, plays sound.

**Preview modal** — reuses the same structure as the Compare Report preview (`.compare-report-preview` CSS class, monochrome scaffold filtering). Footer contains: checkbox toggle, Download .md, Output as Word file?, Close.

### PART C — Export toggle (stripInternalSection)

**`stripInternalSection(markdown)`** — helper function:
- Searches for the first heading matching `/^#{1,6}\s*(PARTE|PART)\s*2\b/im`
- If found, returns only the text before that heading (trimmed)
- If not found, returns the full markdown unchanged

**Checkbox** — labelled "Incluir análisis interno (Parte 2)", bound to `includeInternalSection`, default `false` (unchecked).

Both `handleDownloadClientMd` and `handleExportClientDocx` pass `includeInternalSection ? fullMarkdown : stripInternalSection(fullMarkdown)` as the content — so an unchecked box yields a clean client-only Part 1 document. The preview in the modal also reflects the checkbox state in real time.

### Files not changed

Evaluation Report and Compare Report handlers, state, prompts, and modals are unchanged.

---

## buildReportDocx — Blockquote + Emoji Normalization (2026-06-30)

**File:** `src/components/copy-maker/CopyMakerSidebar.tsx` — `buildReportDocx`, line ~161

Added a `normalizeDocxLine` pre-processing step applied to every line of the markdown before any further parsing (heading detection, list detection, table detection, body text). Runs immediately after `markdown.split('\n')`.

**Two normalizations applied (in order):**

1. **Strip blockquote markers** — removes a leading `>` (with or without a trailing space) so quoted text renders as normal body copy rather than with a literal `>` character. Pattern: `l.replace(/^>\s?/, '')`.

2. **Strip emoji** — removes all characters in the standard emoji Unicode blocks:
   - Miscellaneous Symbols and Pictographs (U+1F300–U+1F5FF)
   - Emoticons (U+1F600–U+1F64F)
   - Transport and Map Symbols (U+1F680–U+1F6FF)
   - Additional Symbol blocks (U+1F700–U+1FAFF)
   - Miscellaneous Symbols (U+2600–U+26FF)
   - Dingbats (U+2700–U+27BF)
   - Variation Selectors (U+FE00–U+FE0F)
   - Regional Indicator Symbols (U+1F1E0–U+1F1FF)
   - Preserved (not removed): `→` (U+2192, plain arrow) and `★` (U+2605, black star) — both monochrome and intentional in report copy

3. **Collapse double spaces** — any `  +` left after emoji removal is reduced to a single space.

**Scope:** Applies to all body text, list items, heading text, and table cells — because `normalizeDocxLine` runs before the line is categorized. The scaffold filter (`isScaffold`) continues to run after normalization.

**Why not in parseInlineRuns:** Normalization at the line level is simpler and ensures table cells (which call `parseInlineRuns` directly) also benefit without extra plumbing.

---

## Compare Prompt v3 — Durations + A2 Qualitative Fix (2026-06-30)

**File:** `src/prompts/copyzap-compare-prompt.md`

Third revision of the compare prompt, addressing two remaining quality failures found in client reports:

**1. Invented durations/statistics in rewrites (e.g. "6–8 semanas")**

Strengthened the INTEGRITY RULE to cover statistics, timeframes, and institutions explicitly. The rule now states:

> Never insert a specific number, percentage, duration, date, or named institution into rewritten copy unless it appears in the source material. This applies EVEN to figures that sound reasonable or generic — for example "6–8 semanas", "en 3 meses", "el 40% de las familias".

Placeholder examples added: `[plazo — verificar antes de publicar]`, `[porcentaje — verificar]`, `[dato — verificar antes de publicar]`.

The coverage note now explicitly lists: "rewrites, the executive summary, the 'what to fix' list, and every other part of the report."

**2. A2 section quoting numeric gaps ("X points below average")**

The PHASE 2 instruction now reads:

> note any dimension that is notably weaker than that version's other dimensions and what it reveals (describe it qualitatively; do NOT compute or quote exact gap figures or per-version averages)

The A2 instruction mirrors this:

> describe it qualitatively ("its weakest dimension", "clearly lower than its others"). Do NOT calculate averages or state numeric gaps like "X points below its average"; that arithmetic is error-prone and unnecessary.

**Other changes:**
- CRITICAL block strengthened: explicitly lists banned Spanish transitional phrases ("Evaluación ciega", "Análisis ciego") alongside English ones
- PHASE 1/2 headers simplified to "(SILENT — do not print; see CRITICAL rule above)" / "(SILENT — do not print)"
- Phases reframed as "Work out, for your own reasoning only" (not "produce, for your own use") to reinforce silent nature
- INTEGRITY RULE title changed from "no invented numbers" to "no invented facts (applies everywhere, strictly)"

---

## Compare Prompt Hardening — Output-Only + Integrity Rule (2026-06-29)

**File:** `src/prompts/copyzap-compare-prompt.md`

Replaced the prompt file verbatim with a hardened version addressing two quality failures:

**1. Phase leakage (report was ~17 pages instead of ~9)**

Added a `CRITICAL — OUTPUT ONLY THE FINAL REPORT` block immediately after the opening paragraph. This block explicitly prohibits:
- Printing Phase 1 or Phase 2 working notes
- Outputting raw scores, version lists, or internal rankings before the report begins
- Printing transitional phrases such as "Fase 1", "Preparando reporte", "Ahora procederé a", or any reasoning narration

Both PHASE 1 and PHASE 2 headers now carry the label "(SILENT — do not print; see CRITICAL rule above)" so the instruction applies at the point of each phase.

**2. Fabricated testimonials (structural gaps section invented named persons)**

Strengthened the `INTEGRITY RULE` with an explicit sub-clause:

> This rule explicitly covers testimonials: do NOT write invented testimonials attributed to named or located persons (e.g. "Laura M. from CDMX" or "Juan, empresario en Monterrey"). If a testimonial would help, use the placeholder: [testimonio de ejemplo — reemplazar con uno real y verificado].

Added a direct callout in **item 4 — Structural Conversion Gaps** under REPORT STRUCTURE:

> Obey the INTEGRITY RULE: if you suggest adding social proof or a testimonial, use the placeholder [testimonio de ejemplo — reemplazar con uno real y verificado] — do NOT invent names, locations, or attributed quotes.

**Other changes:**
- PHASE 1 note: "(Use only these four dimensions. Do not invent additional dimensions.)"
- REPORT STRUCTURE opening: "this is the entire visible output, assembled in exactly this order"
- TABLE SHAPES and BEFORE EXPORTING sections unchanged

---

### Client-side streaming reader (`src/services/api/utils.ts`)

New exported function `makeStreamingReportRequest(model, messages, temperature, maxTokens)`:

- Sends `{ ..., stream: true }` to the edge function
- Reads the Anthropic SSE stream chunk-by-chunk via `response.body.getReader()`
- Parses each `data:` line, extracts `content_block_delta` events with `type: "text_delta"`
- Concatenates all `delta.text` fragments into the final string
- Throws if the assembled text is empty

---

### Sidebar handler changes (`CopyMakerSidebar.tsx`)

Both `handleGenerateEvalReport` and `handleGenerateCompareReport` now call `makeStreamingReportRequest` instead of `makeApiRequestWithFallback`. The return value is the assembled string directly (no `.choices[0].message.content` unwrap needed).

---

## CopyMaker Sidebar Two-Zone Redesign (2026-08-06)

**Feature:** Restructured the Copy Maker sidebar (`src/components/copy-maker/CopyMakerSidebar.tsx`) from a flat list of 30 buttons across 9 collapsible sections into two visually distinct zones with clear color accents, collapsed low-value multi-button clusters into dropdowns/flyouts, fixed the broken Best Elements section toggle, removed dead code, and added a temporary rollback toggle.

**Two-zone layout:** The sidebar now renders two clearly separated zones, each with its own accent color, a color bar + uppercase label header, and a soft background/border:
- **"Session" zone** (purple `#8457d1` / bg `#f6f2fd` / border `#e5d9f8`) — contains everything that acts on the whole session.
- **"This version" zone** (blue `#2f6fd6` / bg `#f0f5fd` / border `#dbe6f9`) — contains everything that acts on the currently-selected generated card.

Typography: zone title labels are `Inter 600`, 10.5px, uppercase, letter-spacing ~0.06em; item labels are `Inter 300`, 12.5px. The item whose dropdown/flyout is currently open bumps to `Inter 400` with a white background + subtle shadow so it reads as "expanded" without making every item bold. Icons use `lucide-react` at stroke-width 1.5 (no second icon library introduced).

New shared primitives added at the top of the sidebar file: `ZoneHeader`, `ZoneItem`, `InlineFlyout`, `FlyoutOption`, plus `SESSION_ZONE` / `VERSION_ZONE` / `ADMIN_ZONE` theme constants.

**Session zone contents (in order):**
1. Evaluate Inputs (`CheckCircle2`, `onEvaluateInputs`)
2. Save — new dropdown (`Download` icon) replacing the three separate Save Session / Save as Template / Save Output buttons. Inline flyout with "Session" / "Template" / "Output" options → existing `onSaveSession` / `onSaveTemplate` / `onSaveOutput` handlers.
3. Score all (`BookCheck`, `handleScoreAllMissing`) — same label logic (`Score all (N)` / `Re-score all (N)`) and same `unscorledCount >= 2` visibility condition.
4. Blend Best Version (`GitMerge`, `onBlendVersions`) — same `comparisonResult` gating.
5. Reports (`FileStack`) — opens a side panel (see below).

**This-version zone contents (in order):** a *flat* list of 8 items at the same visual level/indentation as the Session-zone items above — no CREATE/GENERATE/SCORE/COPY section headers, no accordions. Items: 1) New Version (`onAlternative`, only if `showAlternativeButton`), 2) Improve (`setShowImproveModal(true)`), 3) Change Voice (`setShowVoiceModal(true)`), 4) Boost (`onBoost`, only if `showBoostButton`), 5) Generate SEO Metadata (only if `showSeoButton`), 6) Generate GEO Elements, 7) **Score** as an inline dropdown (▾) — when both content and GEO scoring are available it shows a 3-option flyout ("Content + GEO" / "Content only" / "GEO only"); when only one of `showContentScoreButton`/`showGeoScoreButton` is true it renders a single direct-action button instead of a 1-option dropdown, 8) **Copy** as an inline dropdown (▾) with a 3-option flyout ("Plain text" / "HTML" / "Markdown"). The two dropdowns open as a small inline flyout directly under that one row, not as expanding sections. "Save as Brand Voice" is preserved as a direct button after the Copy dropdown (removing it would be a behavior change). The old `SubSectionHeader` component and its four `openCreate`/`openGenerate`/`openAnalyze`/`openCopy` state vars were deleted as dead code. All modal/abort state and every existing visibility condition (`showAlternativeButton`, `showBoostButton`, `showSeoButton`, `showContentScoreButton`, `showGeoScoreButton`) are preserved exactly — this is a structural fix only, not a behavior change.

**Reports side panel:** 4+ options → side panel (per the interaction-pattern rule). Slides in from the right with a close button. For a regular user it contains exactly 2 items: "Copy as Markdown" (`handleCopyAllMarkdown`) and "Export as HTML file" (`handleExportToHtml`). For an admin (`useIsAdmin(currentUser)`), an additional visually separated **"Admin-only"** section (amber `#c2703d` / bg `#fdf3ec` / dashed border `#f3ddc7`) contains all 8 admin items with every existing `hasContent`, `comparisonResult`, and version-count gating condition preserved exactly: Export HTML (Preview), Export HTML (Preview) 2 — Spanish client report, LLM Eval Export, LLM Audit Export, Evaluation Report, Compare Report, Client Report, View Prompts.

**Best Elements fold (Task 5):** The standalone "Best Elements" sidebar section (the old Section 2D, which had a non-functional `onToggle={() => {}}` and incorrectly shared `blendOpen` state with the "Blend Best Version" section above it) was removed entirely. The Best Elements **display** and **Compile** action already lived in `ResultsPanel` (`BestElementsCard` + `onCompileBestElements`); the only missing piece was the **trigger**. A "Generate Best Elements Summary" trigger button (`Sparkles`, purple) was added to `ResultsPanel` near the existing `BestElementsCard`, gated on the same conditions (`comparisonResult` + 2+ versions) and labeled to make clear it reflects all compared versions, not just one card. This resolves the scope mismatch flagged in the task: the cross-version trigger and display now both live in the results area rather than being duplicated per-card. `onGenerateBestElements` and `isGeneratingBestElements` are now threaded through `ResultsPanel`'s props from `CopyMakerTab`.

**Rollback toggle (Task 7 — temporary):** The pre-redesign sidebar was preserved as `src/components/copy-maker/CopyMakerSidebarLegacy.tsx` (renamed internal component, same default export shape). `CopyMakerTab` checks `?legacySidebar=1` in the URL query string and renders `CopyMakerSidebarLegacy` instead of the redesigned `CopyMakerSidebar` when set. Both imports and the URL-param check carry explicit comments marking this as a temporary safety net to be deleted (along with the legacy file) once the redesigned sidebar has been live for ~2 weeks with no regressions — so it doesn't become permanent dead weight.

**Dead-code cleanup (Task 8):** Removed 5 dead files with zero functional impact (confirmed no callers anywhere in the codebase): `src/components/x-HomePage.tsx`, `src/components/ModeToggle.tsx`, `src/components/Header.tsx`, `src/components/LeftFloatingActionBar.tsx`, `src/components/FloatingActionBar.tsx`. The latter two were imported by `CopyMakerTab` but never rendered (dead imports, also removed). Also removed the disabled action-button block in `src/components/GeneratedCopyCard.tsx` (the `{false && ...}` block wrapped in a comment reading "Action Buttons — removed; actions are handled exclusively through the sidebar" — the sidebar already has working equivalents).

**Interaction-pattern rule applied:** ≤3 options with no grouping/descriptions → inline flyout (Save, Score, Copy). 4+ options or options that benefit from grouping → side panel (Reports).

**Acceptance:** `npm run build` passes. Regular users see exactly: Evaluate Inputs, Save (▾3), Score all, Blend Best Version, Reports (▾2) in the Session zone; the unchanged per-card actions in the This-Version zone with Score and Copy collapsed to dropdowns. Admins see the same Session zone plus a visually distinct amber "Admin-only reports" group with all 8 admin items, gating conditions unchanged. Best Elements Summary no longer appears as a standalone sidebar section; its trigger, content, and Compile action are all reachable from the results area. `?legacySidebar=1` renders the old sidebar unchanged. The 5 dead files and dead code block are removed. No existing handler, prop, or visibility condition was changed in behavior — only presentation/grouping.

**Honest caveat:** I verified the build passes and the wiring is type-correct, but I could not open the sidebar in a browser to visually confirm the two-zone color accents, the dropdown flyouts, or the Reports side panel rendering — no browser automation is available here. The logic, props, and gating conditions are preserved by construction (the same handlers and conditions are invoked, just re-grouped), but the final visual check in the editor is yours to run.

## Deleted Version Row Removed From Performance Comparison (2026-08-07)

**Bug:** Deleting a generated output/version removed the card from its own list, but the deleted version's row stayed in the Performance Comparison table/chart indefinitely because `comparisonResult.rows` was never filtered.

**Fix:** Updated `handleDeleteOutput` in `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` so that, in the same `setFormState` call that filters `generatedVersions`, it also updates `comparisonResult`:

1. Computes `validVersionIds` from the remaining (non-deleted) versions — same set already computed for score-cache cleanup.
2. Filters `comparisonResult.rows` down to rows where `row.versionId === ORIGINAL_VERSION_ID` (the `'__original__'` baseline, never a deletable card) OR `row.versionId` is in `validVersionIds`. Every other row is dropped.
3. If the deleted version was the current winner (`winnerVersionId` no longer present in the filtered rows), re-crowns a new winner: picks the remaining row (excluding `'__original__'`) with the highest `finalScore`. If no candidate rows remain, sets `winnerVersionId` to an empty string.
4. Recomputes `isWinner` on every remaining row to match the (possibly new) `winnerVersionId`.
5. Writes the updated `comparisonResult` (filtered `rows`, updated `winnerVersionId`, updated `isWinner` flags) back into `copyResult` alongside the updated `generatedVersions` and `versionScores`, in the same `setFormState` call.
6. The comparison panel itself stays visible exactly as before — only the stale row is removed. `comparisonResult` is never set to `null`. No other fields on `comparisonResult` (`priorityActions`, `finalRecommendation`, `winnerExplanation`, `winnerFactors`, `winnerBreakdown`, `decisionLayer`, etc.) are touched.

**Edge cases handled:** deleting a non-winner (winner stays the same, only the deleted row disappears); deleting the winner (new winner re-crowned from remaining versions by highest `finalScore`, only that row marked `isWinner`); deleting down to zero remaining generated versions (no crash — `winnerVersionId` becomes `''`, `rows` contains at most the `'__original__'` baseline row). The `'__original__'` baseline row is always kept regardless of which version is deleted.

**Acceptance:** `npm run build` passes. The Performance Comparison panel remains visible after a delete with the remaining rows only — the deleted version's row disappears immediately, the winner is re-crowned correctly if needed, and nothing crashes when all generated versions are deleted.

**Honest caveat:** Build passes and the wiring is type-correct; I could not exercise the delete flow in a browser to visually confirm the row disappears and the winner re-crowns, so the final functional check in the editor is yours to run.

## Purpose Rewrite → Copy Maker Handoff Field Mapping Fix (2026-08-07)

**Bug:** When a user in Purpose Rewrite clicked "Continue in Copy Maker," the polished text handed off correctly, but the Tone dropdown landed in a garbled/blank state — and two other sender fields (`content_type`, `intent.goal`) were silently dropped.

### Primary fix — tone vocabulary translation

**Root cause:** Purpose Rewrite's tone values (`src/features/quickPolish/intents.ts`, `TONE_OPTIONS`) are lowercase (`'neutral' | 'premium' | 'friendly' | 'bold' | 'formal'`). Copy Maker's `Tone` type (`src/types/index.ts`) is capitalized and a different vocabulary (`'Professional' | 'Friendly' | 'Bold' | 'Minimalist' | 'Creative' | 'Persuasive'`). The handoff code in `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` (~line 1626, in the one-shot prefill effect) did an unchecked `as any` cast: `tone: (prefill.intent?.tone as any) || prev.tone`. The lowercase value never matched any option in the Tone `<select>` (populated from `TONES` in `src/constants/index.ts`), so React held an invalid string like `"premium"` while the dropdown appeared blank/reset.

**Fix:** Added an explicit `QUICK_POLISH_TONE_MAP: Record<string, Tone>` constant near the top of `CopyMakerTab.tsx` that translates every QuickPolish tone to a valid `Tone` enum value:

- `neutral` → `Professional`
- `premium` → `Persuasive`
- `friendly` → `Friendly`
- `bold` → `Bold`
- `formal` → `Professional`

The prefill-apply effect now uses `QUICK_POLISH_TONE_MAP[prefill.intent.tone] ?? 'Professional'` instead of the `as any` cast. Unknown values fall back to `'Professional'` rather than silently passing an invalid string through. The `Tone` type is now imported from `../../../types` (it was previously only used via the `FormState` shape).

### Secondary fix #2 — `content_type` handling

`content_type` is sent by `QuickPolishPage.tsx` (`handleContinueInCopyMaker`, ~line 438) but Copy Maker's `FormState` has no corresponding content-type/structure field today. The receiving prefill effect already reads it into a debug-log context object (`contentType: prefill.content_type`) but does not map it onto any form field. No `FormState` field is a clean home for it (the closest, `pageType`/`section`, are already populated from `intent.label`). It is therefore intentionally left unmapped — no `// TODO` was added because the value is already surfaced in the debug log for traceability, and forcing it into an unrelated field would itself be a "crazy field" bug.

### Secondary fix #3 — `intent.goal` mapping

`intent.goal` is sent by `QuickPolishPage.tsx` (~line 434) but was previously never read on the receiving side. It is now mapped onto Copy Maker's `keyMessage` field (the "Key Message / core message" concept is the closest existing FormState field for the QuickPolish "goal / desired outcome" concept):

```ts
keyMessage: prefill.intent?.goal || prev.keyMessage,
```

### Fix #4 — word-count field rename

Renamed `selected_output_word_count` to `original_input_word_count` across the codebase to accurately describe what it holds (the word count of the *original input text*, not the selected polished output — this is intentional, since it sets the target length for Copy Maker). Touched:

- `src/features/quickPolish/types.ts` (`PrefillToCopyMaker` interface field + comment)
- `src/features/quickPolish/QuickPolishPage.tsx` (sender assignment)
- `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` (all reads: word-count decision, `customWordCount` assignment, debug log fields)

This is a rename only — the value and behavior are unchanged.

**Acceptance:** `npm run build` passes. Going through Purpose Rewrite with each of `neutral/premium/friendly/bold/formal` tones and clicking "Continue in Copy Maker" now lands a real, correctly-selected Tone option in Copy Maker every time — never blank, never reset to a default that doesn't match. `originalCopy`, `targetAudience`, `callToAction`, `language`, and `customWordCount` still populate correctly (no regression). `keyMessage` now populates from `intent.goal`. A normal (non-handoff) visit to Copy Maker is unaffected — all changes are gated on `prefill` being present.

**Honest caveat:** Build passes and the wiring is type-correct (the `Tone` import resolves, the map keys cover every value in `TONE_OPTIONS`), but I could not exercise the handoff flow in a browser to visually confirm the Tone dropdown shows the right option for each preset — that final functional check in the editor is yours to run.
