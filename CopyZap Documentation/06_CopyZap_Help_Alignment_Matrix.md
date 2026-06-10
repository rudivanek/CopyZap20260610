# CopyZap – Help & Documentation Alignment Matrix

**Document Version:** 1.0
**Status:** Active Governance Reference
**Last Updated:** 2026-02-19 (revised: bulk generate + per-version deep analysis entries added to Module 8)
**Authority Source:** `01_CopyZap_Operating_Manual_v1.0.md`

---

## Purpose

This document maps each confirmed system capability against three documentation surfaces:

1. **Operating Manual** (`01_CopyZap_Operating_Manual_v1.0.md`) — Source of truth for system behavior
2. **Help Documentation** (`src/components/help/pages/`) — User-facing documentation
3. **Strategic Positioning File** (`02_CopyZap_Strategic_Positioning.md`) — Competitive and investor narrative

For each capability, this matrix records:
- Current documentation status per surface
- Risk level if undocumented or inaccurate
- Enforcement priority for pre-launch readiness

This matrix is a governance tool, not a feature list. Its purpose is to surface coverage gaps and prevent misalignment between system behavior and what is documented.

---

## Status Key

| Symbol | Meaning |
|---|---|
| ✅ Complete | Feature is accurately and fully documented |
| ⚠️ Partial | Feature is documented but coverage is incomplete or has confirmed gaps |
| ❌ Missing | Feature has no documentation in this surface |

## Risk Level Key

| Level | Definition |
|---|---|
| HIGH | Undocumented or incorrect state impacts user understanding of scoring accuracy, token/credit usage, language capability, model behavior, or workflow output quality. Incorrect documentation in this category creates user trust failures or incorrect usage patterns. |
| MEDIUM | Undocumented or incorrect state impacts clarity and user success but does not affect system integrity, billing accuracy, or output quality claims. |
| LOW | Undocumented or incorrect state affects strategic narrative, investor positioning, or competitive framing. No direct user impact. |

## Enforcement Priority Key

| Level | Definition |
|---|---|
| P1 — Pre-Launch Mandatory | Must be documented and verified accurate before any public access. No exceptions. |
| P2 — Pre-Launch Recommended | Should be documented before public launch. Non-critical but expected by professional users. |
| P3 — Post-Launch Acceptable | Can be addressed after launch as part of ongoing documentation improvement. |

---

## Alignment Matrix

### Module 1: Startup Layer

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Start Hub — what it is, when it appears | ✅ Complete | ✅ Complete | ✅ Complete (Section 16.1) | LOW | P2 | Help page: `StartHub.tsx`. Fully covered. |
| Start Hub — three entry paths (Wizard, Form, Template) | ✅ Complete | ✅ Complete | ✅ Complete (Section 16.1) | LOW | P2 | All three paths documented in help. |
| Start Hub — visibility toggle (show/hide setting) | ✅ Complete | ✅ Complete | ❌ Missing | LOW | P3 | User preference toggle documented in help. Not relevant to strategic file. |
| Quick Setup Wizard — step-by-step entry flow | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 16.1, 16.2) | MEDIUM | P2 | Help covers what it is but limited technical depth on what the wizard optimizes for. |
| Public templates as entry point (pre-populated form state) | ✅ Complete | ✅ Complete | ✅ Complete (Section 16.1) | LOW | P2 | Template picker documented in help. |

---

### Module 2: Quick Prompt Wizard

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Wizard — guided brief collection flow | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 16.2) | MEDIUM | P2 | Help page `QuickPromptWizard.tsx` covers basics but lacks technical detail on question structure and output quality improvement. |
| Wizard — inputs pre-populate Copy Maker form | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 16.2) | MEDIUM | P2 | Connection to Copy Maker is implied but not explicitly stated in help. |
| Wizard — does not replace Copy Maker | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.2 — "What it does not do") | MEDIUM | P2 | Users may confuse wizard with full form. Help should clarify relationship. |
| Wizard — blank-page friction reduction context | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 16.2) | LOW | P3 | Strategic framing exists. Help covers this implicitly. |

---

### Module 3: Copy Maker

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Copy Maker — overview and core purpose | ✅ Complete | ✅ Complete | ✅ Complete (Section 16.3) | LOW | P1 | Help page: `CopyMakerIndex.tsx`, `GettingStarted.tsx`. |
| Create mode vs. Improve mode | ✅ Complete | ✅ Complete | ❌ Missing | MEDIUM | P1 | Mode distinction documented in help. Not required in strategic file. |
| Brand voice injection into system prompt | ✅ Complete | ✅ Complete | ✅ Complete (Section 5, 16.3) | HIGH | P1 | Behavior is confirmed. Help covers it. Strategic file confirms architectural role. |
| Customer profile input | ✅ Complete | ✅ Complete | ⚠️ Partial | MEDIUM | P2 | Strategic file lists it as an accepted input. Help documents it. |
| Competitor copy input (contrast framing) | ✅ Complete | ✅ Complete | ✅ Complete (Section 16.3) | MEDIUM | P2 | Documented across all three surfaces. |
| SEO keywords input | ✅ Complete | ✅ Complete | ✅ Complete (Section 16.3) | MEDIUM | P2 | Covered across all surfaces. |
| GEO regions input (GEO scoring) | ✅ Complete | ✅ Complete | ✅ Complete (Section 5) | MEDIUM | P2 | GEO scoring 7-criterion system documented in strategic file. Help covers it. |
| Special instructions input | ✅ Complete | ✅ Complete | ✅ Complete (Section 16.3) | MEDIUM | P2 | Covered across all surfaces. |
| Output structure with section word count distribution | ✅ Complete | ✅ Complete | ✅ Complete (Section 16.3) | MEDIUM | P2 | Documented across all surfaces. |
| Structured prompt construction (conditional blocks) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5, 16.3) | HIGH | P2 | Architecture detail not required in user help but the behavior implication (better quality with more inputs) should be stated. |
| Output validation with automatic repair retry | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5, 16.3) | HIGH | P2 | User-facing implication (generation reliability) is not documented in help. Gap for professional users. |
| Session-based version lifecycle | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 16.3) | HIGH | P1 | Help documents session tracking for credit usage. Version lifecycle for scoring/comparison context is only partial. |
| Model selection (GPT-4o, Claude, DeepSeek, Gemini) | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 5.2) | HIGH | P1 | Help only documents Claude Sonnet 4.5, Claude Haiku, and GPT-3.5 Turbo. GPT-4o, DeepSeek, and Gemini are not documented in help. **Critical gap.** |
| Per-model temperature tuning | ✅ Complete | ❌ Missing | ✅ Complete (Section 5.2) | MEDIUM | P3 | Architecture detail. Not required in user help but should be acknowledged for professional users. |
| Placeholder detection before generation | ✅ Complete | ❌ Missing | ✅ Complete (Section 6 — feature table) | MEDIUM | P2 | Protects against `[YOUR PRODUCT]` artifacts in output. Users would benefit from knowing this exists. |

---

### Module 4: Purpose Rewrite (Quick Polish)

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Purpose Rewrite — what it is and core purpose | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 16.4) | HIGH | P1 | Help only references Quick Polish as "fast touch-ups." A dedicated page or section is missing. |
| Eleven intents (Hero, Body, CTA, Subject Line, Intro Hook, Testimonial, Feature Benefit, Value Proposition, About Us, Tagline, Blog Intro) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.4) | HIGH | P1 | Intent types are fully absent from help documentation. Users cannot effectively use the feature without understanding available intents. **Critical gap.** |
| Trust mode enforcement (what model may/may not add) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.4) | HIGH | P1 | Claim guardrail behavior is a professional safety feature. Not documented in help. |
| Iterative refinement (re-refine within same intent) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.4) | MEDIUM | P2 | Workflow benefit not communicated in help. |
| HTML preservation in output | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.4) | MEDIUM | P2 | Relevant for CMS and developer users. |
| Soft length awareness per intent | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.4) | MEDIUM | P2 | Users should understand why output length varies per intent. |
| Micro-confirmation tags (rule display) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.4) | LOW | P3 | UX enhancement. Users would benefit from understanding these tags. |
| Language support: English and Spanish only | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.4 — explicitly stated) | HIGH | P1 | Language limitation is not documented anywhere in help. Users in other languages may attempt to use the feature and receive degraded or unexpected results. **Critical gap — must be documented before launch.** |
| Does not access brand voices | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.4 — "What it does not do") | MEDIUM | P2 | Users familiar with brand voices may expect them to apply in this module. Should be clarified. |

---

### Module 5: CopySnap

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| CopySnap — what it is and overview | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | CopySnap has no dedicated help documentation anywhere. Entire feature is undocumented for users. **Critical gap.** |
| IMPROVE mode — rewrites existing text by category and platform | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | No documentation in help. |
| IMPROVE mode — Human Tone option | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | MEDIUM | P2 | No documentation in help. |
| ANSWER mode — reply generation with stance and style | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | No documentation in help. |
| ANSWER mode — five reply styles (helpful, friendly, confident, witty, direct) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | No documentation in help. |
| ANSWER mode — three stance options (neutral, agree, disagree) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | No documentation in help. |
| ANSWER mode — stance-specific behavioral rules | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | Behavioral rules (softening for disagree, perspective-first for agree) not documented. |
| ANSWER mode — emoji constraints (friendly/witty only; max 1) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | MEDIUM | P2 | Users need to understand emoji behavior constraints. |
| ANSWER mode — anti-fluff enforcement | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | MEDIUM | P2 | Professional safety feature. Not documented. |
| QUESTION mode — discovery, qualification, engagement types | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | MEDIUM | P2 | No documentation in help. |
| Language detection — 13 languages (responds in input language) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | Language behavior is directly relevant to user experience. Not documented. Full list: English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Japanese, Chinese, Korean, Arabic, Hindi. |
| Input cap — 2000 characters | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | Users need to know the character limit to avoid truncation or failure. |
| Model — fixed at `claude-sonnet-4-5` (not user-selectable) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | Users accustomed to model selection in Copy Maker need to know this is fixed here. |
| CopySnap does not connect to scoring engine or brand voices | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5 — "What it does not do") | HIGH | P1 | Critical behavioral boundary. Users may expect scoring or brand voice to apply. Not documented anywhere. |

---

### Module 6: Scoring Engine

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Six scoring dimensions (Marketing, Clarity, SEO, Emotion, CTA, Readability) | ✅ Complete | ⚠️ Partial | ✅ Complete (Sections 5.1, 16.6) | HIGH | P1 | Help documents four dimensions (Clarity, Persuasiveness, Engagement, Overall Quality) which do not match the confirmed six-dimension system. **Inconsistency — help dimension names appear to be inaccurate or outdated.** |
| Dimension scores — 0 to 100 scale | ✅ Complete | ⚠️ Partial | ✅ Complete | HIGH | P1 | Scale implied in help but not explicitly stated. |
| Eight use-case scoring profiles (landing_page, sales_page, email, linkedin, paid_ad, seo_page, product_description, general) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.1, 16.6) | HIGH | P1 | Use-case-specific scoring is the core differentiator. Not documented in help. Users do not know scoring adapts to content type. **Critical gap.** |
| Tone modifiers that adjust weights dynamically | ✅ Complete | ❌ Missing | ✅ Complete (Section 5.1) | HIGH | P2 | Behavioral detail relevant to understanding score variation. Not documented. |
| GEO scoring — 7 criteria, 100-point scale | ✅ Complete | ✅ Complete | ✅ Complete (Sections 5, 6) | MEDIUM | P2 | Documented across all surfaces. |
| Scoring prompt uses structured rubric (not model's own judgment) | ✅ Complete | ❌ Missing | ✅ Complete (Section 8) | HIGH | P2 | Methodological distinction from generic AI quality ratings. Users would benefit from understanding this. |
| Incremental scoring (new versions scored without re-scoring existing) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.1, 16.6) | HIGH | P2 | Performance and accuracy implication. Not documented in help. |
| Cross-model comparison — Grok feature (opposing model for analysis) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.2, 16.6) | HIGH | P1 | This is a named feature with a defined behavior. Users need to know what it does and why. Not documented in help. |

---

### Module 7: Improvement % Tracking and Version Baseline

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Improvement percentage calculated relative to baseline version | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.1, 16.6) | HIGH | P1 | Core quantified iteration feature. Entirely absent from help. Users do not know this metric exists. |
| Baseline version designation (user selects baseline) | ✅ Complete | ❌ Missing | ✅ Complete (Section 5.1) | HIGH | P1 | Users need to understand how to set and change baseline. Not documented. |
| Version scores persist across session (not recalculated on compare) | ✅ Complete | ❌ Missing | ✅ Complete (Section 5.1) | MEDIUM | P2 | Behavior implication for users who re-run scoring. Not documented. |

---

### Module 8: Winner Determination

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Comparison winner determination algorithm | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.1, 16.6) | HIGH | P1 | Winner determination is a core differentiator. No documentation in help. Users do not know how winners are selected. |
| Four-level tie-break sequence (overall score → CTA → Clarity → Marketing) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.1, 16.6) | HIGH | P1 | Tie-break logic is a documented invariant. Not in help. |
| Per-dimension winners surfaced (`bestForMarketing`, `bestForClarity`, `bestForSimplicity`) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.6) | HIGH | P2 | Nuanced output that users should understand. Not documented. |
| Comparison winner is deterministic (same inputs → same winner always) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.1, 8) | HIGH | P1 | A key trust signal for professional users. Not communicated in help. |
| Blended version creation (user combines elements from two versions) | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 6 — feature table) | MEDIUM | P2 | Help partially covers Compare & Blend but lacks detail on how blending works. |
| Per-version deep analysis — lazy generation on demand | ✅ Complete (Section 6.9) | ❌ Missing | ❌ Missing | MEDIUM | P2 | After comparison runs, each version card offers on-demand deep analysis. Generated lazily, cached after first call, no re-spend on cached results. Not documented in help or strategic file. |
| Bulk generate all missing analyses — explicit button | ✅ Complete (Section 6.9) | ❌ Missing | ❌ Missing | HIGH | P1 | "Generate analysis for all versions" button generates missing analyses sequentially. Shows "X / N" progress. Never auto-triggers. Credits deducted only on user click. Absent from help — users have no guidance on when or why to use it. |

---

### Module 9: Token and Credit Deduction

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Credit balance display and real-time update | ✅ Complete | ✅ Complete | ✅ Complete (Section 12) | HIGH | P1 | Fully documented across all surfaces. |
| Credit consumption per operation type | ✅ Complete | ✅ Complete | ✅ Complete (Section 12) | HIGH | P1 | Help documents typical costs per action. Strategic file confirms per-operation granularity. |
| Per-model cost differentiation | ✅ Complete | ⚠️ Partial | ✅ Complete (Sections 5.2, 12) | HIGH | P1 | Help implies models have different costs. Strategic file confirms per-model pricing table. Help does not list specific models and their cost tiers. |
| Credit enforcement — operations blocked when balance is insufficient | ✅ Complete | ✅ Complete | ✅ Complete (Section 12) | HIGH | P1 | Documented in help (what happens at 0 credits). |
| Admin-configurable per-model pricing (database-stored, not hardcoded) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.2, 12) | HIGH | P3 | Admin-level detail. Not required in user help. Documented in strategic file. |
| Token tracking per operation type (operation-level granularity) | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 5.2) | HIGH | P1 | Help covers session-level usage history. Operation-type granularity within a session is not explicitly documented. |
| No pre-authorization (credits deducted after call completes) | ✅ Complete | ❌ Missing | ✅ Complete (Section 12) | MEDIUM | P2 | Behavior detail that matters if a call fails mid-stream. Not documented. |
| Failed call produces no credit deduction record | ✅ Complete | ❌ Missing | ✅ Complete (Section 12) | MEDIUM | P2 | User expectation management. Not documented. |

---

### Module 10: Language Support Per Feature

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Copy Maker — output language selection (user-selected) | ✅ Complete | ⚠️ Partial | ❌ Missing | HIGH | P1 | Help mentions language selection exists but says only "multiple languages" — no list provided. |
| Purpose Rewrite — English and Spanish only (pattern-based detection) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.4) | HIGH | P1 | This limitation is not documented in help. Users attempting to use Purpose Rewrite in other languages will get degraded results without warning. **Must be documented before launch.** |
| CopySnap — 13-language detection, responds in input language | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | Language behavior not documented. Users need to know behavior before use. Full list: English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Japanese, Chinese, Korean, Arabic, Hindi. |
| CopySnap — detection is pattern-based (not model-driven) | ✅ Complete | ❌ Missing | ✅ Complete (Section 9 — weakness indicator) | HIGH | P2 | Detection reliability implication. Not documented. |
| Copy Maker — language support scope (beyond English/Spanish) | ✅ Complete | ❌ Missing | ❌ Missing | HIGH | P1 | Copy Maker's language capability relies on the underlying model (not pattern-based detection), which is broader, but this is not stated anywhere. Users in non-English markets need explicit guidance. |

---

### Module 11: Model Selection

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Available models: GPT-4o, Claude, DeepSeek, Gemini variants | ✅ Complete | ⚠️ Partial | ✅ Complete (Sections 5.2, 6) | HIGH | P1 | Help only documents Claude Sonnet 4.5, Claude Haiku, and GPT-3.5 Turbo. GPT-4o, DeepSeek, and Gemini are absent. **Significant accuracy gap.** |
| Per-model temperature tuning (GPT: 0.45; Claude: 0.3; DeepSeek: 0.65; Gemini: 0.5) | ✅ Complete | ❌ Missing | ✅ Complete (Section 5.2) | MEDIUM | P3 | Architecture detail. Not required in user help. Strategic file is the appropriate surface. |
| Cross-model comparison — Grok (opposing model used for analysis) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.2, 16.6) | HIGH | P1 | Named feature with distinct behavior. Not documented in help. |
| CopySnap model — fixed at `claude-sonnet-4-5` (not user-selectable) | ✅ Complete | ❌ Missing | ✅ Complete (Section 16.5) | HIGH | P1 | Users should know this module does not follow their global model selection. |
| Model cost differences and their credit impact | ✅ Complete | ⚠️ Partial | ✅ Complete (Section 12) | HIGH | P1 | Help implies cost varies by model but does not document which models cost more or less. |

---

### Module 12: Admin Capabilities

| Feature | In Operating Manual | In Help | In Strategic File | Risk Level | Enforcement Priority | Notes |
|---|---|---|---|---|---|---|
| Admin panel access and overview | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.2, 8) | HIGH | P1 | No admin documentation in help. Admin users have no self-service reference. **Complete gap.** |
| User management (create, edit, delete users) | ✅ Complete | ❌ Missing | ✅ Complete (Section 5.2) | HIGH | P1 | Not documented in help. |
| Credit limit management per user | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.2, 12) | HIGH | P1 | Not documented in help. |
| Public template management (create, publish, manage templates for all users) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.2, 6) | HIGH | P1 | Not documented in help. |
| Global special instructions presets management | ✅ Complete | ❌ Missing | ✅ Complete (Section 5.2) | MEDIUM | P2 | Not documented in help. |
| Customer prefill profile management (admin level) | ✅ Complete | ❌ Missing | ⚠️ Partial | MEDIUM | P2 | Not documented in help specifically for admin context. |
| Token usage export (admin) | ✅ Complete | ❌ Missing | ✅ Complete (Sections 5.2, 12) | HIGH | P1 | Not documented in help. Agency and enterprise buyers need this information. |
| System diagnostics (admin) | ✅ Complete | ❌ Missing | ✅ Complete (Section 5.2) | MEDIUM | P3 | Diagnostic capability not documented in help. |
| Admin-managed user roles and access | ✅ Complete | ❌ Missing | ✅ Complete (Section 5.2) | HIGH | P1 | Role structure not documented in help. |

---

## Pre-Launch Enforcement Requirements

**Before any public testing or launch, all P1 (Pre-Launch Mandatory) rows with HIGH risk level and ❌ Missing status in the Help column must be addressed.**

The following critical gaps must be resolved before public access:

### P1 — HIGH Risk — Help Documentation Missing

1. **CopySnap — complete feature documentation** (all modes, language support, model constraint, input cap, behavioral rules, guardrails)
2. **Purpose Rewrite — intent types** (all 11 intents must be listed and described)
3. **Purpose Rewrite — language limitation** (English and Spanish only — must be stated explicitly)
4. **Scoring Engine — dimension names** (help currently documents incorrect dimension names; must be corrected to: Marketing, Clarity, SEO, Emotion, CTA, Readability)
5. **Scoring Engine — use-case profiles** (8 profiles and their purpose must be documented)
6. **Grok cross-model comparison** (named feature with distinct behavior; must be documented)
7. **Model selection** (GPT-4o, DeepSeek, and Gemini must be added to help documentation)
8. **Improvement % tracking and baseline version** (core differentiator; must be documented)
9. **Winner determination algorithm** (users need to understand how winners are selected)
10. **Admin capabilities** (admin users need a dedicated help section or page)
11. **CopySnap model constraint** (fixed at `claude-sonnet-4-5`; must be documented)

---

## Governance Rules

### Rule 1: Documentation Update Sequence

When any confirmed feature changes, updates must follow this sequence in order:

1. Update `01_CopyZap_Operating_Manual_v1.0.md` first — source of truth
2. Update help documentation if user-facing behavior changed
3. Update `02_CopyZap_Strategic_Positioning.md` if positioning narrative is affected
4. Update this Matrix — mark new status, adjust risk or enforcement levels if needed
5. Log in `05_CopyZap_Change_Log.md` with Change Type and Risk Level

No step may be skipped. The matrix is always the final step before log entry.

### Rule 2: No Invented Features

Documentation must describe only confirmed system behavior. Capabilities not present in `01_CopyZap_Operating_Manual_v1.0.md` must not be added to help pages or strategic documents. When a feature is planned but not implemented, it may be recorded as a placeholder using the tag `[PLANNED — NOT YET IMPLEMENTED]` and must not appear in user-facing help documentation.

### Rule 3: Accuracy Over Coverage

Partial but accurate documentation is preferable to complete but inaccurate documentation. If a feature cannot be fully documented before launch, mark it `⚠️ Partial` in this matrix and ensure that any partial documentation that exists is factually correct. Remove inaccurate claims before adding additional coverage.

### Rule 4: Language Limitations Must Be Explicit

Any feature with a confirmed language restriction must include an explicit statement of that restriction in its help documentation. "Supports multiple languages" is not acceptable for features with confirmed language constraints. The specific supported languages must be named.

### Rule 5: HIGH Risk Items Are Non-Negotiable for P1 Enforcement

No HIGH-risk P1 item may remain as ❌ Missing in the help column at launch. MEDIUM-risk P1 items may be escalated to P2 with documented justification. LOW-risk items may be deferred at any priority level.

---

## Matrix Update Protocol

When updating this matrix after a documentation change:

1. Update the relevant row's status symbol(s) in the appropriate column(s)
2. Update the Notes column to reflect what was changed and when
3. If Risk Level changes (e.g., a gap was closed), update the Risk Level
4. If Enforcement Priority changes due to a gap being resolved, update it
5. Add a corresponding entry in `05_CopyZap_Change_Log.md`

---

## Quick Reference: Current High-Priority Gaps

The following table summarizes the most critical undocumented or inaccurate items requiring immediate attention:

| # | Feature | Gap Type | Risk | Priority | Action Required |
|---|---|---|---|---|---|
| 1 | CopySnap — all modes | ❌ Missing from help | HIGH | P1 | Create dedicated CopySnap help page |
| 2 | Purpose Rewrite — 11 intents | ❌ Missing from help | HIGH | P1 | Add intent list and descriptions to help |
| 3 | Purpose Rewrite — language limit | ❌ Missing from help | HIGH | P1 | Add explicit EN/ES-only statement to help |
| 4 | Scoring Engine — dimension names | Inaccurate in help | HIGH | P1 | Correct dimension names in help |
| 5 | Scoring Engine — 8 use-case profiles | ❌ Missing from help | HIGH | P1 | Add use-case profile documentation to help |
| 6 | Model selection — GPT-4o, DeepSeek, Gemini | ❌ Missing from help | HIGH | P1 | Add all confirmed models to help |
| 7 | Grok cross-model comparison | ❌ Missing from help | HIGH | P1 | Add Grok feature documentation to help |
| 8 | Improvement % and baseline version | ❌ Missing from help | HIGH | P1 | Add version tracking documentation to help |
| 9 | Winner determination algorithm | ❌ Missing from help | HIGH | P1 | Document how winners are determined in help |
| 10 | Admin capabilities | ❌ Missing from help | HIGH | P1 | Create admin help section |
| 11 | Bulk generate all missing analyses — explicit button | ❌ Missing from help | HIGH | P1 | Document in help: what the button does, when it appears, that it uses credits, and that it only generates missing analyses |

---

*End of CopyZap Help & Documentation Alignment Matrix v1.0*
*Authority source: `01_CopyZap_Operating_Manual_v1.0.md`*
*This document must be updated every time a feature changes or documentation is modified.*
