# CopyZap – Master Change Log & Documentation Governance Record

**Document Version:** 1.0
**Status:** Active – Governance Record
**Last Updated:** 2026-02-24 (amended — Documentation Hardening Update logged)
**Maintained By:** Documentation Owner / System Architect
**Scope:** All material changes to CopyZap system behavior, documentation, scoring logic, token logic, admin capabilities, help system, and strategic positioning

This document governs:
- All changes to system behavior
- All updates to documentation files
- All scoring logic modifications
- All token logic modifications
- All admin capability changes
- All help system updates
- All strategic positioning updates

---

## 1. Purpose of This Document

This file records all material changes to CopyZap across system behavior, logic, documentation, and strategic framing.

**Traceability:** Every behavioral change can be traced from its log entry to the documentation file updated and the system version affected. No change disappears into the codebase without a record.

**Silent drift prevention:** Without a governed change log, scoring weights can shift, token logic can be adjusted, and help content can contradict the Operating Manual — all without a record. This file prevents that.

**Documentation alignment tracking:** A product feature is not complete when code is deployed. It is complete when the Operating Manual, Help System, Strategic Positioning, and Market Intelligence documents reflect the change. This file enforces that standard.

**Governance audit trail:** In the event of a dispute about system behavior, a billing discrepancy, or a help content inaccuracy, this file provides the authoritative record of what changed, when, and why.

**Scope of mandatory logging:** Any change affecting the following areas must be logged in this file before it is considered complete:
- Scoring engine (dimensions, weights, formulas, use-case profiles, tone modifiers)
- Comparison logic (tie-break algorithm, winner determination, incremental scoring)
- Token and credit system (deduction timing, cost formula, pricing table, enforcement mode)
- Prompt construction (conditional blocks, system prompt structure, brand voice injection)
- Admin permissions (user management, credit management, template control, diagnostics)
- Model selection or model-specific configuration (temperature, model list, fallback behavior)
- Help content (any page addition, correction, or removal)
- Strategic positioning (any claim modified in `02_CopyZap_Strategic_Positioning.md`)

---

## 2. Documentation Governance Rules

### 2.1 Mandatory Logging Rule

A change log entry is **required** before any of the following changes are considered complete:

| System Area | Examples of Mandatory Changes |
|---|---|
| Scoring engine | Weight table modification, dimension addition/removal, use-case profile addition, tone modifier change, formula adjustment |
| Comparison logic | Tie-break algorithm change, per-dimension winner logic change, incremental scoring cache behavior change |
| Token and credit system | Deduction timing change, cost formula change, pricing table structure change, enforcement mode behavior change, balance refresh interval change |
| Prompt construction | Conditional block addition/removal, system prompt structure change, brand voice injection behavior change, output validation behavior change |
| Admin permissions | New admin capability, permission removal, admin role detection change, credit management scope change |
| Model configuration | Addition or removal of selectable models, temperature value change, model-specific behavior change |
| Help content | Any page added, corrected, removed, or restructured |
| Strategic positioning | Any capability claim added, removed, or qualified in the Strategic Positioning document |
| Market intelligence | Any factual update to the Market Intelligence Input document |

A change that does not appear in this log is not complete, regardless of deployment status.

### 2.2 Update Protocol

When any feature changes, the following sequence must be followed:

**Step 1 — Update the relevant documentation file(s):**

| Change Area | Primary Document | Secondary Documents |
|---|---|---|
| System behavior / feature logic | `01_CopyZap_Operating_Manual_v1.0.md` | `02_CopyZap_Strategic_Positioning.md`, `04_CopyZap_Market_Intelligence_Input.md` |
| Help content | `03_CopyZap_Help_System_Spec.md` | Help page source files |
| Strategic claims or positioning | `02_CopyZap_Strategic_Positioning.md` | `04_CopyZap_Market_Intelligence_Input.md` |
| Scoring or token logic | `01_CopyZap_Operating_Manual_v1.0.md` | `02_CopyZap_Strategic_Positioning.md`, `04_CopyZap_Market_Intelligence_Input.md` |
| Admin capabilities | `01_CopyZap_Operating_Manual_v1.0.md` | `04_CopyZap_Market_Intelligence_Input.md` |

**Step 2 — Create a change log entry in this file** using the standard entry format defined in Section 4.

**Step 3 — For high-risk changes**, use the extended entry format defined in Section 5 and complete the Risk Assessment and Testing Validation fields before deployment.

**Step 4 — Update pending task checklist** in Section 10 to reflect any outstanding documentation tasks created by this change.

No change is complete without all four steps satisfied.

---

## 3. Versioning Structure

### 3.1 Documentation Versioning

Each documentation file carries its own version number, tracked independently. Version numbers follow `MAJOR.MINOR` format.

| Document | File | Current Version |
|---|---|---|
| Operating Manual | `01_CopyZap_Operating_Manual_v1.0.md` | 1.0 |
| Strategic Positioning | `02_CopyZap_Strategic_Positioning.md` | 1.0 |
| Help System Specification | `03_CopyZap_Help_System_Spec.md` | 1.0 |
| Market Intelligence Input | `04_CopyZap_Market_Intelligence_Input.md` | 1.0 |
| Change Log (this file) | `05_CopyZap_Change_Log.md` | 1.0 |

**MAJOR version increment:** Structural reorganization of the document, significant scope change, or system-wide behavioral refactor that invalidates prior claims throughout the document.

**MINOR version increment:** Addition of new sections, correction of existing sections, or targeted updates to reflect incremental feature changes.

Version increments must be logged in this file as a Documentation Clarification or Feature Modification entry.

### 3.2 App Version Alignment

Documentation versioning is independent of the deployed application version. The Operating Manual describes the system as it exists at the time of the document's last update. When the application changes, the documentation must be updated to reflect the new state before the documentation version is incremented.

**Alignment rule:** If the deployed application behavior diverges from what is described in the Operating Manual, the Operating Manual is out of date. The Operating Manual always describes current confirmed system behavior, never aspirational or planned behavior.

**Version relationships:**

| Condition | Action Required |
|---|---|
| New feature deployed | Operating Manual updated; Change Log entry created |
| Feature removed or deprecated | Operating Manual updated; Deprecation Log entry created in Section 6 |
| Behavior changes without feature change (e.g., model API update) | Operating Manual updated if behavior is documented; Change Log entry created |
| Documentation corrected without system change | Change Log entry created with type: Documentation Clarification |
| Strategic claim modified | Strategic Positioning document updated; Change Log entry created in Section 8 |

---

## 4. Master Change Log Entries

### Entry Format

Each entry must include all fields. No fields may be left blank. Use `N/A` only where a field is genuinely not applicable.

| Field | Definition |
|---|---|
| Date | UTC date of the entry, format: YYYY-MM-DD |
| App Version | Deployed application version or `[UNKNOWN]` if not tracked |
| Doc Version | Version of the documentation file updated |
| File Affected | Filename of the documentation file updated |
| Section Affected | Section number and title within the affected file |
| Change Type | One of the defined types below |
| Description | Factual description of what changed. No promotional language. |
| Reason | Why the change was made. |
| Author | Name or role of the person making the change. |

### Permitted Change Types

| Type | When to Use |
|---|---|
| Feature Addition | A new capability was added to the system |
| Feature Modification | An existing capability was changed in behavior or scope |
| Scoring Logic Change | Any modification to scoring dimensions, weights, formulas, or use-case profiles |
| Token Logic Change | Any modification to deduction timing, cost formula, pricing structure, or enforcement behavior |
| Admin Permission Change | Any change to what admin users can or cannot do |
| Help Update | Any addition, correction, or removal in help content |
| Strategic Update | Any modification to a strategic positioning claim |
| Bug Fix | A defect was corrected; behavior now matches documented intent |
| Documentation Clarification | No system behavior changed; documentation was corrected or clarified |
| Deprecation | A feature, capability, or behavior was removed |

### Change Log Table

| Date | App Version | Doc Version | File Affected | Section Affected | Change Type | Description | Reason | Author |
|---|---|---|---|---|---|---|---|---|
| 2026-02-19 | [UNKNOWN] | 1.0 | `01_CopyZap_Operating_Manual_v1.0.md` | All sections | Feature Addition | Initial documentation architecture created for Pre-Testing Freeze. Operating Manual v1.0 written to capture confirmed system state across all modules: Copy Maker, Quick Polish, CopySnap, scoring engine, comparison engine, token system, admin panel, session architecture, and help system. | Establish a stable, authoritative behavioral reference before external testing and investor review. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `02_CopyZap_Strategic_Positioning.md` | All sections | Strategic Update | Initial strategic positioning document created. Derived exclusively from `01_CopyZap_Operating_Manual_v1.0.md`. Covers category definition, market problem, target segments, differentiation architecture, competitive landscape, SWOT, monetization, and strategic summary. | Provide structured market and investor positioning reference derived from confirmed capabilities. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `03_CopyZap_Help_System_Spec.md` | All sections | Feature Addition | Initial Help System Specification created. Defines help architecture, coverage requirements, page gap audit, update protocol, tone constraints, and scoring/token accuracy mandates. | Establish governance standard for help content accuracy and alignment with Operating Manual. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `04_CopyZap_Market_Intelligence_Input.md` | All sections | Feature Addition | Initial Market Intelligence Input document created. Structured for LLM analytical consumption across competitive analysis, SWOT, investor positioning, pricing strategy, and risk assessment. Derived from `01_CopyZap_Operating_Manual_v1.0.md` and `02_CopyZap_Strategic_Positioning.md`. | Enable structured, fact-grounded LLM analysis of CopyZap market position without fabricated claims. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `05_CopyZap_Change_Log.md` | All sections | Feature Addition | Initial Change Log and Documentation Governance Record created. Establishes mandatory logging rules, update protocol, versioning structure, high-risk change registry, deprecation log, help alignment log, and strategic positioning update log. | Implement documentation governance mechanism to prevent silent behavioral drift and maintain traceability across all future changes. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `public/docs/CopyZap-Features.md` | Section 2.17 Purpose Rewrite — Language Support | Strategic Update | Corrected inaccurate multilingual claims in documentation. Removed "language-agnostic" and "works with any language" statements from the Purpose Rewrite Language Rule section. Updated language support table to accurately reflect English and Spanish only. Updated change notes entry to remove "ANY language" claim. Risk Level: Medium. | Documentation accuracy and product alignment. Purpose Rewrite language detection function returns only 'en' or 'es'. Documentation was overstating capability by listing unsupported languages (German, French, Japanese, Arabic, etc.). | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `docs/COPYZAP_FEATURES_INTERNAL.md` | Section 4.4 — Language Detection & Enforcement | Documentation Clarification | Corrected supported language count in language detection utility documentation. Removed 9 languages not present in actual code pattern definitions (Polish, Swedish, Danish, Norwegian, Finnish, Turkish, Greek, Hebrew, Thai, Vietnamese). Corrected list now reflects 13 confirmed languages matching `src/utils/languageDetection.ts` implementation. | Internal documentation overstated detection coverage by listing languages with no pattern definitions in the utility file. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `06_CopyZap_Help_Alignment_Matrix.md` | All sections | Feature Addition | Initial Help & Documentation Alignment Matrix created. Maps all confirmed system capabilities across Operating Manual, Help documentation, and Strategic Positioning file. Assigns risk level (HIGH/MEDIUM/LOW) and enforcement priority (P1/P2/P3) per feature row. Identifies 10 critical P1 HIGH-risk gaps in help documentation including: CopySnap (complete absence), Purpose Rewrite intent types, language limitations, scoring dimension name inaccuracy, missing use-case profiles, incomplete model documentation, missing Grok feature, missing improvement % tracking, missing winner determination, and missing admin help section. Establishes governance rules for documentation update sequence, accuracy standards, and language limitation disclosure requirements. Risk Level: Low (new governance document). | Establish documentation coverage tracking and enforce alignment between system behavior and user-facing documentation before public launch. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `02_CopyZap_Strategic_Positioning.md`, `04_CopyZap_Market_Intelligence_Input.md` | Section 16 (Strategic Positioning) — Product Ecosystem & Rapid Workflow Advantage; Section 15 (Market Intelligence) — Workflow Stack Differentiation Dataset | Strategic Update | Enhanced strategic emphasis on Startup, Quick Prompt Wizard, Purpose Rewrite, CopySnap, and workflow architecture differentiation. Added Section 16 to Strategic Positioning covering each ecosystem layer with confirmed behavioral properties, strategic role, and workflow architecture advantage. Added Section 15 to Market Intelligence as structured LLM-ready analytical dataset per stack layer including differentiator signals, usage workflow patterns, and comparative positioning data. Risk Level: Low. No system behavior modified. No new features implied. | Clarify ecosystem advantage and rapid workflow positioning for investor, analyst, and LLM analysis inputs. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `src/types/index.ts`, `src/services/api/performanceBoost.ts` (new), `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts`, `src/components/GeneratedCopyCard.tsx`, `src/components/copy-maker/CopyMakerTab/sections/ResultsPanel.tsx`, `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` | All output cards — new "Performance Boost" per-output action | Feature Addition | Added Performance Boost: a precision optimization action that creates a NEW first-class output (type='boosted', new UUID) from any existing output. Boosted output participates in all analysis flows identically to any other output (Comprehensive Analysis table, winner logic, deltas, % improved, compare summaries). New type `GeneratedContentItemType.Boosted` added. New constants `MAX_BOOST_ITERATIONS=2` and `MAX_BOOST_SCORE_THRESHOLD=9.0` enforce safeguards. Button disabled if: (1) >= 2 boosts already exist for that base version, or (2) output's finalScore >= 90/100. New `performBoost()` service builds a targeted prompt from `versionScores` cache (weakestDimension + subscores), or falls back to general clarity/specificity/CTA improvements if no score data. Button appears as "Performance Boost" with amber styling. Clean display names: `<baseName> — Boosted (1)` / `<baseName> — Boosted (2)`. Boosted badge shown in card header. New data model fields: `baseName`, `parentOutputId`, `boostIteration`, `boostLevel`. Naming normalization: `baseName` field carries the clean root name without stacking prefixes. Risk Level: Medium. | Reduce manual iteration friction when scores are sub-optimal. Let AI target weakest dimensions without changing offer, voice, or audience positioning. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `01_CopyZap_Operating_Manual_v1.0.md`, `docs/CopyZap-Docs/CopyZap-Features.md` | Section 6.9 (Operating Manual) — Per-Version Deep Analysis and Bulk Generation; Comparison Engine features section (CopyZap-Features.md) | Feature Addition | Added "Generate analysis for all versions" bulk action button to the All Versions Breakdown panel in the Detailed Analysis view. Button collects all version IDs lacking cached deep analysis and generates them sequentially, awaiting each before starting the next. Shows live progress counter "Generating analysis: X / N". Disabled during generation. Replaced by "All analyses generated" badge when complete. Button reappears if a new version is added. No auto-trigger: only explicit user click initiates generation. No re-spend on already-cached versions. Return type of `ensureVersionDeepAnalysis` changed from `void` to `Promise<void>` to enable sequential awaiting. Files changed: `ComprehensiveComparisonTable.tsx`, `useGeneration.ts` (interface), `ResultsPanel.tsx` (interface). | Reduce per-version click friction in Detailed Analysis while strictly preserving the no-surprise-credit-spend rule. | Documentation Owner |
| 2026-02-19 | [UNKNOWN] | 1.0 | `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts`, `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` | All `setFormState` calls that update `copyResult` — specifically the "add alternative", "content modification", "score comparison", "add to comparison", and "score new outputs" paths | Bug Fix | Fixed a defect where `versionDeepAnalysis` was set to `undefined` in multiple `setFormState` calls, causing all per-version deep analysis results to be silently discarded whenever a new version was scored or added to the comparison table. Seven locations were corrected across two files. The only permitted intentional clear of `versionDeepAnalysis` is the explicit "Re-analyze all versions" path (`handleReanalyzeDeepAnalysis`) which clears immediately before issuing fresh API calls. All other state-update paths now preserve the existing `versionDeepAnalysis` record using object spread. Locations fixed: (1) `useGeneration.ts` — "add alternative copy" path, (2) `useGeneration.ts` — "content modification" path, (3) `useGeneration.ts` — "score new output after Boost" path, (4–5) `useGeneration.ts` — additional score-update paths, (6) `CopyMakerTab.tsx` — "Add to comparison" handler, (7) `CopyMakerTab.tsx` — "Score new outputs" handler. Operating Manual Section 6.9 updated to codify this as a formal Cache Persistence Invariant, with rationale: the cache represents paid results; discarding it on scoring is equivalent to billing the user twice. | Per-version deep analyses were disappearing after adding a Boosted output or any additional version to the comparison table, forcing users to re-generate them and re-spend credits. Root cause: `versionDeepAnalysis: undefined` in state-update paths that should have used object spread to forward the existing map. | Documentation Owner |
| 2026-02-24 | [UNKNOWN] | 1.0 | `02_CopyZap_Strategic_Positioning.md`, `08_CopyZap_Feature_Overview.md` | Positioning Hierarchy Rebalance — top-of-doc sections (02); opening paragraph and Section 8 (08) | Strategic Update | Reframed CopyZap as an AI copywriter (category entry) with integrated optimization/scoring as differentiation advantage. In `02`: added new positioning sections before the Metro model — Category Definition, One-Sentence Positioning, What CopyZap Replaces, Core Promise, Why We Win, Product Pillars (3), and Metro Model summary with explicit framing as workflow differentiator. Added 17.1 Overview to Metro section explicitly stating "CopyZap is an AI copywriter with an integrated optimization loop." Added clarifying first sentence to 17.5. In `08`: replaced opening paragraph to lead with fast creation; reordered Section 8 differentiators so creation and constraints lead, scoring follows; replaced first bold sentence with creation-first framing; reframed scoring point to "decision layer — not a primary feature." No system behavior changed. No features invented. Risk Level: Low. | Correct market perception and reduce over-weighting of "quality control" identity in primary documentation. The Metro model was functioning as a category definition rather than a workflow differentiator, causing documentation to lead with evaluation rather than creation. | Documentation Owner |
| 2026-02-24 | [UNKNOWN] | 1.0 | `02_CopyZap_Strategic_Positioning.md`, `08_CopyZap_Feature_Overview.md` | Micro-edits: "Why We Win" bullet (02); Section 1 final sentence (08) | Documentation Micro-Edit | Minor wording adjustments to reinforce AI copywriter category framing and prevent over-weighting scoring as primary identity. In `02`: changed parenthetical on "Score, compare, and select" bullet from "(objective decision support)" to "(confident selection)". In `08`: changed "All generated versions are scored, labeled, and available for further refinement" to "All generated versions can be scored, labeled, and refined" — correcting implied automatic scoring; scoring is user-triggered. Risk Level: Low. | Improve market-perception signal hierarchy without changing capabilities. | Documentation Owner |
| 2026-02-24 | [UNKNOWN] | 1.0 | `CopyZap_Ideal_Customer_Profile.md` (new) | All sections | Feature Addition | New strategic definition document created: Ideal Customer Profile (ICP). Defines primary target segment (small/mid marketing and copywriting agencies, 2–30 employees), behavioral profile (structured iteration need, multi-project volume, existing AI usage), core pain points (version chaos, subjective decision-making, manual iteration, lack of quality signals, client justification difficulty), explicitly excluded segments (hobby bloggers, casual solo creators, enterprise departments, social-only micro-creators), and willingness-to-pay assumptions ($49–$149/month range, labeled as assumption). All pricing figures explicitly marked as assumptions. Derived from `02_CopyZap_Strategic_Positioning.md` and `01_CopyZap_Operating_Manual_v1.0.md`. No new features invented. | Establish explicit, governed ICP definition to support TAM/SAM/SOM analysis, investor preparation, and pricing strategy modeling. | Documentation Owner |
| 2026-02-24 | [UNKNOWN] | 1.0 | `CopyZap_Competitive_Landscape.md` (new) | All sections | Feature Addition | New strategic definition document created: Competitive Landscape. Maps primary direct competitors (Copy.ai, Jasper, Writesonic) with category, strength, weakness, and CopyZap differentiation per competitor. Maps indirect competitors (ChatGPT, Claude, Notion + AI workflows, manual agency workflow) with substitute rationale and differentiation boundaries. Provides detailed positioning comparison against Copy.ai as primary reference competitor across six structural differentiators. Explicitly acknowledges four competitive risk areas: generation quality parity, model commoditization, feature convergence, larger competitor funding. Defines structural moat as five integrated architecture properties: workflow architecture, scoring integrity invariants, deterministic comparison system, guardrail-enforced rewriting, version lineage structure. No new features invented. Competitor data labeled as based on publicly available positioning. | Establish governed competitive reference for investor positioning, pricing validation, and differentiation architecture communication. | Documentation Owner |
| 2026-02-24 | [UNKNOWN] | 1.0 | `CopyZap_Business_Model_Assumptions.md` (new) | All sections | Feature Addition | New strategic modeling document created: Business Model Assumptions. Documents confirmed monetization model (monthly SaaS with credit-based usage enforcement — consistent with Operating Manual Section 7). All pricing tiers, cost structure figures, unit economics, and revenue modeling inputs are explicitly labeled as assumptions. Pricing assumptions: Starter $49/month, Agency $99/month, Pro Agency $149/month. Cost driver: LLM token consumption. Gross margin target: 70%+ assumption. Unit economics modeling inputs: LLM cost per user $10–$25/month assumption; ARPU $90–$110 blended; churn 3–6% monthly; LTV not calculable without CAC data. Expansion paths listed (team seats, enterprise, API, white-label, workflow marketplace) — all labeled as future optional, not current capabilities. Revenue modeling inputs at 100/500/1,000 user levels included as feasibility inputs only. | Support feasibility modeling, investor deck preparation, and pricing strategy discussion with an explicit, governed assumption document. | Documentation Owner |
| 2026-02-25 | [UNKNOWN] | 1.0 | Multiple files — see description | AI Engine Selection System | System Simplification | Simplified AI model selection from 10 models to 2 visible engines: Claude (default/recommended) and OpenAI (GPT-4o). DeepSeek remains as invisible fallback only. Created canonical model registry (`src/lib/llm/modelRegistry.ts`) defining providers, engine configs, and fallback chains. Created centralized LLM caller with automatic fallback (`src/lib/llm/callLLMWithFallback.ts`) that handles Claude -> OpenAI -> DeepSeek fallback for Claude engine, and OpenAI -> DeepSeek for OpenAI engine. Fallback only triggers on retriable errors (auth failures, rate limits, service unavailable, timeouts). Updated types: added `AiEngine` type ('claude' | 'openai'), deprecated legacy `Model` type, added `aiEngine` field to `FormData`. Updated constants: added `AI_ENGINES` array with 2 options, updated `DEFAULT_FORM_STATE` to include `aiEngine: 'claude'`. Created new `AiEngineSelector` UI component (`src/components/ui/AiEngineSelector.tsx`) with 2-button grid layout showing Claude as "Recommended" and helper text for each. Replaced model dropdown in `CopyForm.tsx` with new selector. Added migration logic: `migrateModelToEngine()` function maps legacy model strings to new engines, `migrateFormStateEngine()` and `migratePersistedData()` utilities ensure backward compatibility. Added useEffect in CopyForm to auto-migrate on load. Removed from UI: gpt-3.5-turbo, gpt-4-turbo, chatgpt-4o-latest, claude-haiku, claude-opus, grok-4-latest, gemini-2.0-flash. Pinned Claude to Sonnet 4.6 snapshot (`claude-sonnet-4-20250514`). All generation calls now use simplified engine selection with automatic fallback. Files created: `src/lib/llm/modelRegistry.ts`, `src/lib/llm/callLLMWithFallback.ts`, `src/components/ui/AiEngineSelector.tsx`, `src/utils/modelMigration.ts`. Files modified: `src/types/index.ts` (added AiEngine type), `src/constants/index.ts` (added AI_ENGINES, updated DEFAULT_FORM_STATE), `src/components/CopyForm.tsx` (replaced dropdown with AiEngineSelector, added migration). Risk Level: Medium (UI change + migration logic). No existing sessions broken — migration layer ensures compatibility. | Simplify user experience, reduce choice paralysis, ensure reliability through fallback chain, eliminate "latest" aliases for stability, hide budget models (DeepSeek) from UI while keeping as fallback. | Engineering |
| 2026-02-24 | [UNKNOWN] | 1.0 | `01_CopyZap_Operating_Manual_v1.0.md`, `02_CopyZap_Strategic_Positioning.md`, `03_CopyZap_Help_System_Spec.md`, `07_CopyZap_Feature_Capability_Map.md`, `08_CopyZap_Feature_Overview.md` | Multiple — see description | Documentation Clarification | Documentation Hardening Update. (1) Standardized product category language: replaced all instances of "AI copywriter", "AI writing tool", "AI optimization platform", "AI-powered copy optimization engine", "AI copywriting tool" with canonical phrase "AI copywriting workflow platform" across all affected files. (2) Removed all "objective scoring" and "objectively optimize" terminology; replaced with "rubric-based scoring" and "criteria-driven evaluation". Replaced "data-backed version selection" and "data-backed decision" with "score-guided selection" and "evidence-guided comparison". (3) Inserted canonical Scoring Framework Clarification block (rubric-based system; AI-evaluated dimensions with possible run variance; deterministic weighting and winner logic; structured decision framework, not absolute truth) into: Section 5.0 of Operating Manual, `02_CopyZap_Strategic_Positioning.md`, `03_CopyZap_Help_System_Spec.md` (as required help content), and `08_CopyZap_Feature_Overview.md`. (4) Defined previously [TO BE DEFINED] scoring contracts in Operating Manual: Section 5.5 Rounding Rules (integers for dimensions; one decimal display for overall; full precision internal); Section 5.6 Improvement Percentage formula ((newScore − baselineScore) / baselineScore × 100; N/A for zero baseline); tone modifier weight invariant (re-normalize to 1.0 after modification); Quick Polish scoring participation (no auto-scoring; manual trigger only); CopySnap scoring participation (no auto-pipeline entry; explicit import required). (5) Added "Who CopyZap Is Not For" section in `02_CopyZap_Strategic_Positioning.md` (not for one-shot generation; built for structured iteration). (6) Added Metro model clarification note in `02_CopyZap_Strategic_Positioning.md` (explanatory framework only; does not redefine category). (7) Added scoring directional signals note in `08_CopyZap_Feature_Overview.md` (scores are directional guides, not pass/fail grades). (8) Updated language capability accuracy in `07_CopyZap_Feature_Capability_Map.md` and `08_CopyZap_Feature_Overview.md`: reliable quality guaranteed for EN/ES only; other CopyMaker languages accepted but quality not guaranteed; UI is English-only across all tools. No system behavior changed. No features invented. | Harden documentation for scoring language accuracy, legal defensibility, and alignment with Operating Manual. Remove ambiguous "objective" scoring claims. Establish explicit scoring contracts for undefined behaviors. | Documentation Owner |

---

## 5. High-Risk Change Registry

High-risk changes are changes to core system logic where incorrect implementation or undocumented modification could affect billing accuracy, scoring integrity, comparison determinism, or professional output reliability.

### Definition of High-Risk Changes

The following categories are classified as high-risk and require the extended log format below:

| Category | Examples |
|---|---|
| Scoring weight adjustments | Changing dimension weights in any use-case profile, adding or removing a use-case profile |
| Normalization changes | Modifying how individual dimension scores are scaled or capped |
| Improvement percentage formula changes | Changing how improvement delta is calculated relative to baseline |
| Token deduction timing changes | Moving deduction from post-completion to pre-authorization, or changing when zero-usage determination occurs |
| Comparison synchronization changes | Changing how scores are cached for comparison, changing the incremental scoring mechanism |
| Admin privilege expansion | Adding new capabilities to the admin role that affect data access, user management, or billing |
| Model cost mapping changes | Adding models to the pricing table, changing the cost formula for existing models |
| Claim guardrail modifications | Adding or removing forbidden phrases from Quick Polish or CopySnap guardrails |
| Output validation and repair logic | Changing when repair is triggered, what constitutes a failed output, or how repair prompts are constructed |

### Extended Log Format for High-Risk Changes

Each high-risk change must be documented using the following template. Entries may not be abbreviated.

---

**Template:**

**Date:**
**App Version:**
**Sections Updated:**
**Previous Behavior:**
**New Behavior:**
**Reason:**
**Risk Assessment:**
**Testing Validation Completed:** [Yes / No / In Progress]
**Validation Notes:**

---

### High-Risk Change Entries

*No high-risk changes recorded as of initial documentation baseline (2026-02-19). Entries will be appended here as they occur.*

---

## 6. Deprecation Log

This section records all features, capabilities, or behaviors that have been removed from the system. Entries in this log must never be deleted. If a deprecated feature is reinstated, a new Feature Addition entry is created in Section 4; the deprecation entry is not removed.

**Purpose:** Prevents accidental resurrection of removed features. Provides a record for users, testers, or support personnel asking about behavior that no longer exists.

| Date | Feature Deprecated | Reason | Replacement (if any) | Migration Required | Status |
|---|---|---|---|---|---|
| — | No deprecations recorded as of initial baseline (2026-02-19) | — | — | — | — |

---

## 7. Help System Alignment Log

This section tracks all updates to help content and verifies alignment between the help system and the Operating Manual. Help content that is not verified against the Operating Manual and the live UI is marked as unverified.

**Alignment rule:** Every help page must accurately reflect the current Operating Manual. When the Operating Manual changes, the corresponding help page must be updated before the Operating Manual change is considered complete.

| Date | Help Module / Page | Change Description | Operating Manual Updated? | Verified Against Live UI? | Status |
|---|---|---|---|---|---|
| 2026-02-19 | All existing help pages | Initial help system operational. Coverage gaps identified in Help System Specification (Section 4, `03_CopyZap_Help_System_Spec.md`): Quick Polish help page absent; CopySnap help page absent; scoring dimension accuracy requires correction (legacy dimension names in current help content). | Yes — Operating Manual v1.0 created | No — live UI verification pending | Pending — gap remediation required before v1.0 testing |

---

## 8. Strategic Positioning Update Log

This section tracks all changes to `02_CopyZap_Strategic_Positioning.md`. Strategic positioning claims directly affect investor communication, competitive analysis, and the Market Intelligence Input document. Any claim that is added, removed, qualified, or corrected must be logged here.

**Rule:** A strategic positioning claim must never be stronger than what is confirmed in the Operating Manual. If the Operating Manual does not confirm a capability, it may not appear as a strength in the Strategic Positioning document.

| Date | Strategic Section | Change Description | Market Impact | Rationale |
|---|---|---|---|---|
| 2026-02-19 | All sections | Initial document created. All claims derived from `01_CopyZap_Operating_Manual_v1.0.md`. Fourteen structural strengths documented. Eleven weaknesses documented without defensive framing. Nine opportunity areas identified (all labeled `[POTENTIAL — NOT CURRENTLY IMPLEMENTED]` where unconfirmed). Eight threat factors documented. | Establishes baseline competitive and investor positioning. No external claims made before this baseline exists. | Pre-testing freeze requires stable strategic reference aligned to confirmed system state. |
| 2026-02-24 | Top-of-doc positioning sections (new); Section 17.1 (new); Section 17.5 (first sentence added) | Added primary positioning layer before the Metro model: Category Definition ("AI copywriter with integrated optimization engine"), One-Sentence Positioning, What CopyZap Replaces, Core Promise, Why We Win, Product Pillars (3), and Metro Model framing summary. Added Section 17.1 Overview explicitly stating "CopyZap is an AI copywriter with an integrated optimization loop." Added clarifying first sentence to 17.5 explicitly stating the Metro model is a workflow differentiator, not a category definition. No claims added beyond what is confirmed in the Operating Manual. | Rebalance perception from "scoring/QC tool" to primary AI copywriter identity with scoring as integrated differentiation. |

---

## 9. Admin-Level Changes Log

This section tracks all changes to admin capabilities, permissions, and admin-facing features. Admin changes require elevated scrutiny because they affect data access, billing authority, user management, and security posture.

**Rule:** Any expansion of admin privileges must be accompanied by a review of RLS policies in the database. Any new admin capability that reads or writes user data must be confirmed against the Row Level Security configuration.

| Date | Admin Feature | Change Description | Security Impact | RLS Impact | Logging Verified |
|---|---|---|---|---|---|
| 2026-02-19 | Full admin panel baseline | Initial admin capabilities documented in Operating Manual v1.0: user CRUD, per-user credit management, public template management, token usage export, diagnostics panel, beta registration count, global special instructions management, customer prefill profile management. Admin role gated via `app_admins` table and `AdminRoute` component. | Access to all user records and credit data. Admin audit trail status unconfirmed — marked `[TO BE VALIDATED]` in Operating Manual. | All admin operations gated by RLS policies using `app_admins` table membership check. Policy structure confirmed in migration files. | No — admin action audit trail not confirmed. Pending validation. |

---

## 10. Pending Documentation Tasks

This section is a living checklist. Items are added when a gap is identified and removed (marked complete) when the gap is resolved. Items must never be silently removed without a corresponding Change Log entry confirming resolution.

### Currently Open Tasks

- [ ] **Help Update Required:** Quick Polish / Purpose Rewrite help page does not exist. Must be created and aligned with Operating Manual Section covering Quick Polish.
- [ ] **Help Update Required:** CopySnap help page does not exist. Must be created and aligned with Operating Manual Section covering CopySnap IMPROVE, ANSWER, and QUESTION modes.
- [ ] **Help Update Required:** Scoring dimension names in existing help content reflect legacy system (Marketing Fit, Clarity, Readability, Persuasion, Structure, Tone). Must be updated to reflect current `comp-v4` dimensions (Marketing, Clarity, SEO, Emotion, CTA, Readability) with use-case weighting explained.
- [ ] **Operating Manual Validation Required:** Admin audit trail status. Whether admin actions produce a persistent audit log is marked `[TO BE VALIDATED]` in the Operating Manual, Strategic Positioning, and Market Intelligence documents. Requires engineering confirmation.
- [ ] **Help System Verification Required:** All existing help pages require verification against live UI behavior. Current status: not verified post-Operating-Manual-v1.0 creation.
- [ ] **Operating Manual Validation Required:** Full list of voice style transformations. Operating Manual confirms Humanize, Alex Hormozi, Steve Jobs transformations; complete list marked `[TO BE VALIDATED]` in Market Intelligence document (Section 2.4).
- [ ] **High-Risk Registry Validation Required:** Scoring freeze confirmation. Operating Manual Section on scoring engine must be validated against live scoring behavior to confirm `comp-v4` weight tables are implemented as documented.
- [ ] **Strategic Positioning Update Pending:** Once admin audit trail is validated, Section 6 (Strategic Strength Indicators) and Section 14 (SWOT Strengths) of `02_CopyZap_Strategic_Positioning.md` must be updated to reflect confirmed or unconfirmed status.
- [ ] **Market Intelligence Update Pending:** Same as above — Section 2.6 and Section 6 of `04_CopyZap_Market_Intelligence_Input.md` require update once admin audit trail is validated.

### Completed Tasks

*No tasks completed as of initial baseline. Completed items will be recorded here with date and Change Log entry reference.*

---

## 11. Change Log Integrity Rules

The following rules govern the integrity of this document. These rules are not optional.

**No deletion of log entries:**
Once an entry is written into any log table or section of this document, it may not be deleted. If an entry contains an error, a correction entry must be appended immediately following the original entry with the correction noted explicitly. The original erroneous entry remains visible.

**Corrections must be appended, not overwritten:**
If Section 4, 5, 6, 7, 8, or 9 contains an inaccurate entry, the correction procedure is: add a new row (or new extended entry block) immediately following the original, beginning with "CORRECTION TO ENTRY [date]:" and explaining what was incorrect and what the correct information is. Do not modify the original entry.

**Every structural refactor requires a log entry:**
If the system undergoes a significant architectural change (e.g., scoring engine refactor, token system redesign, admin panel rebuild), a Change Log entry must be created even if the visible user behavior does not change.

**Minor UI text changes may be grouped:**
Changes to button labels, tooltip text, placeholder text, or other non-behavioral UI copy may be grouped into a single log entry if they occur within the same deployment cycle. The entry must list the affected UI elements.

**High-risk logic changes must never be grouped:**
Each high-risk change (as defined in Section 5) must have its own independent extended entry. High-risk changes may not be combined into a single entry even if they occur in the same deployment.

**All entries are chronological:**
New entries are appended at the bottom of each table, not inserted in chronological order above existing entries. The log is append-only.

**Version numbers must match the document header:**
When a document version is incremented, the version number in the document's header metadata and the version in Section 3.1 of this file must both be updated in the same change cycle.

**Pending tasks in Section 10 must be kept current:**
When a pending task is resolved, the resolution must be logged in Section 4 before the task is moved to the Completed list in Section 10. A task may not be removed from the open list without a corresponding Change Log entry confirming resolution.

---

## 12. Initial Baseline Entry

The following entry records the creation of the documentation architecture. It is the baseline reference point against which all future changes are measured.

| Date | App Version | Doc Version | File Affected | Section Affected | Change Type | Description | Reason | Author |
|---|---|---|---|---|---|---|---|---|
| 2026-02-19 | [UNKNOWN] | 1.0 | All five documentation files | All sections | Feature Addition | Initial documentation architecture created for Pre-Testing Freeze. Files created: `01_CopyZap_Operating_Manual_v1.0.md` (system behavioral reference), `02_CopyZap_Strategic_Positioning.md` (market and investor positioning), `03_CopyZap_Help_System_Spec.md` (help governance specification), `04_CopyZap_Market_Intelligence_Input.md` (LLM-optimized market analysis input), `05_CopyZap_Change_Log.md` (this file — governance and audit record). All claims in all documents derived from confirmed system behavior. No features invented. Unconfirmed items tagged `[TO BE VALIDATED]`. | Establish stable, governed, traceable documentation architecture before external testing, investor review, and public release. | Documentation Owner |

---

*End of CopyZap Master Change Log & Documentation Governance Record v1.0*
*This document is append-only. No entries may be deleted. Corrections must be appended.*
*Maintained by: Documentation Owner*
*Next mandatory review: Upon any change to scoring engine, token system, admin permissions, or strategic positioning claims.*
