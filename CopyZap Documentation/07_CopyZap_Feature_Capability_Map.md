# CopyZap – Feature Capability Map (v1.0 Pre-Testing Freeze)

**Status:** Pre-Testing Freeze
**Scope:** Capability inventory (feature + option level)
**Source of Truth:** Derive behavior from `01_CopyZap_Operating_Manual_v1.0.md`
**Last Updated:** 2026-02-24T00:00:00 UTC
**File:** `CopyZap Documentation/07_CopyZap_Feature_Capability_Map.md`

---

This document provides a single, detailed, structured inventory of what CopyZap can do — including all modules, all feature options, all modes, all sub-options, and all user-visible actions. It is a capability inventory, not a user guide. Features not confirmed in code or the Operating Manual are marked **[TO BE VERIFIED IN APP]**.

---

## Table of Contents

1. [Product Workflow Overview (One-Page Map)](#1-product-workflow-overview)
2. [Feature Inventory Index (Table)](#2-feature-inventory-index)
3. [Startup / Start Hub](#3-startup--start-hub)
4. [Quick Prompt Wizard](#4-quick-prompt-wizard)
5. [CopyMaker (Copy Creation)](#5-copymaker-copy-creation)
6. [Purpose Rewrite](#6-purpose-rewrite)
7. [Quick Polish](#7-quick-polish)
8. [CopySnap](#8-copysnap)
9. [Post-Generation Iteration Actions](#9-post-generation-iteration-actions)
10. [Evaluation Layer: Scoring & Comparison](#10-evaluation-layer-scoring--comparison)
11. [Decision Layer: Best Version Analysis](#11-decision-layer-best-version-analysis)
12. [Workflows: Saved Workflows & Reapplication](#12-workflows-saved-workflows--reapplication)
13. [Models, Tokens, and Cost Transparency](#13-models-tokens-and-cost-transparency)
14. [Admin-Only Capabilities](#14-admin-only-capabilities)
15. [Capability Gaps / Verification List](#15-capability-gaps--verification-list)
16. [Change Notes](#16-change-notes)

---

## 1. Product Workflow Overview

High-level flow showing all major stages in sequence:

```
[Startup / Start Hub]
        │
        ├─► Quick Prompt Wizard (guided setup)
        │         └─► CopyMaker (pre-filled form)
        │
        ├─► CopyMaker (direct entry)
        │
        └─► Template Loader (load saved template → CopyMaker)

[CopyMaker – Copy Creation]
        │
        ├─► Generate (original version)
        │
        ├─► Improve Existing Copy tab (original → improved version)
        │
        └─► URL Analysis input (extract copy + structure from live URL)

[Post-Generation – Iterate]
        │
        ├─► Apply Voices (restyle with brand voice)
        ├─► Generate Variations / Alternative Copy
        ├─► Modify (user-edited version)
        ├─► Boost (performance enhancement)
        └─► Blend (merge two versions)

[Evaluate]
        │
        ├─► Score versions (6-dimension scoring)
        ├─► GEO Score (LLM-readiness)
        ├─► Comparison Table (side-by-side)
        └─► Deep Analysis (per-version detailed breakdown)

[Decide]
        └─► Best Version Analysis (winner + per-dimension leaders)

[Transform – Alternative Paths]
        ├─► CopySnap (rapid short-text transformation: Improve / Answer / Question)
        ├─► Quick Polish (intent-based short-text rewrite)
        └─► Purpose Rewrite [TO BE VERIFIED IN APP]

[Reuse]
        ├─► Save Output (to Saved Outputs library)
        ├─► Save as Template (reuse form config)
        ├─► Save as Prefill (save input presets)
        └─► Run Saved Workflow (multi-step automation)
```

See Operating Manual §4 (Module Specifications) for behavioral rules per module.

---

## 2. Feature Inventory Index

| Layer | Module / Area | Primary Job | Key Options (Short) | Detail Section |
|-------|---------------|-------------|---------------------|----------------|
| Rapid Creation | Startup / Start Hub | Entry routing without friction | Wizard, Direct Form, Template Loader | §3 |
| Rapid Creation | Quick Prompt Wizard | Guided form pre-fill in 2 steps | Create / Improve / Polish modes; URL analysis | §4 |
| Creation | CopyMaker | Full-featured copy generation | Quick / Standard / Advanced modes; 6 languages; 10+ AI models | §5 |
| Refinement | Purpose Rewrite | Precision copy rewriting by purpose | [TO BE VERIFIED IN APP] | §6 |
| Refinement | Quick Polish | Intent-based short-text rewrite | 11 intents; 1–3 variants; EN/ES reliable | §7 |
| Transformation | CopySnap | Rapid transformation of short text | Improve / Answer / Question modes; 13 languages | §8 |
| Iteration | Voices / Variations / Modify / Boost / Blend | Derive new versions from existing output | Per-output actions post-generation | §9 |
| Evaluation | Scoring & Comparison | Score and rank all versions | 6-dimension scoring; GEO score; comparison table | §10 |
| Decision | Best Version Analysis | Identify winner and per-dimension leaders | Best overall + category leaders | §11 |
| Workflows | Saved Workflows / Reapply | Automate multi-step copy operations | Create / Apply / Edit / Share workflows | §12 |
| Models & Cost | Model Selection / Credits | Choose AI model; track credit usage | 10+ models; credit balance visibility | §13 |
| Admin | Admin-only features | User, template, usage management | User CRUD; credit limits; public templates | §14 |

---

## 3. Startup / Start Hub

### 3.1 Purpose

The Start Hub provides friction-free rapid entry into copy creation. Instead of navigating to the CopyMaker form manually, users can select a pre-defined workflow entry point that opens the correct module, mode, and UI state in a single action.

UI Location: Modal opened from the main navigation or dashboard. Triggered by a "Start" or hub button.

See Operating Manual §3.1.

### 3.2 User-Visible Capabilities

| Capability | Description |
|------------|-------------|
| Launch Quick Setup Wizard | Opens the wizard in a selected mode (create / improve / polish) |
| Launch CopyMaker directly | Opens the form at a specified UI level (quick / standard / advanced) |
| Load a saved template | Opens the Template Picker modal to select and load a saved template |
| Skip/dismiss Start Hub | User can close the hub and proceed without selecting an entry point |
| Disable "show on startup" | Preference to suppress Start Hub on future app loads |

### 3.3 Entry Paths

The Start Hub dispatches one of three entry types, each with additional configuration parameters:

**Entry Type 1: `copy_wizard`**
- Opens: Quick Setup Wizard
- Parameters:
  - `wizardMode`: `create` | `improve` | `polish`
  - `wizardStep`: number (resume at a specific step, if applicable)

**Entry Type 2: `copy_form`**
- Opens: CopyMaker form directly
- Parameters:
  - `uiLevel`: `quick` | `standard` | `advanced`
  - `focusField`: string (auto-focus a specific input field)
  - `panelsOpen`: string[] (panels to open on load)
  - `panelsHidden`: string[] (panels to suppress)

**Entry Type 3: `template_loader`**
- Opens: Template Picker modal
- Allows user to select from their own saved templates or public templates

### 3.4 Outputs Created

The Start Hub does not itself create copy or content. It routes the user to the appropriate creation module. Outputs depend on which entry path is taken and what is done in the resulting module (see §4, §5, §7).

---

## 4. Quick Prompt Wizard

### 4.1 Wizard Goals

The Quick Prompt Wizard reduces the complexity of setting up a copy generation job. Instead of filling a large form with dozens of fields, the user answers a short guided sequence. The wizard then:

- Pre-fills the CopyMaker form with the collected data
- Applies intelligent defaults (tone, word count, mode)
- Optionally generates the copy immediately without requiring the user to review the form

See Operating Manual §4.2.

### 4.2 Wizard Modes

The wizard operates in one of three modes, selectable in Step 1:

| Mode | Internal Key | What It Does |
|------|-------------|--------------|
| Make New Copy | `create` | Collects content/audience/goal and generates new copy from scratch |
| Improve Existing Copy | `improve` | Accepts existing copy (manual paste or URL extraction) and improves it; auto-enables SEO and GEO toggles |
| Quick Polish | `polish` | Switches to the Quick Polish sub-flow (see §7); does not use the standard 2-step wizard |

### 4.3 Wizard Inputs (Field Inventory)

#### Step 1 Fields

| Field | Required | What It Affects | Example Values | Downstream Use |
|-------|----------|-----------------|----------------|----------------|
| `projectDescription` | Required | Session name; token usage reporting | "Landing page for B2B SaaS tool" | CopyMaker session naming; token tracking |
| `mode` | Required | Determines full wizard flow | `create` / `improve` / `polish` | Sets CopyMaker `tab`; enables/disables fields |
| `whatAreYouCreating` | Required | The core content input | "Homepage hero for a task management tool" | Passed as `businessDescription` or `originalCopy` depending on mode |
| `targetAudience` | Required | Audience targeting | "Small business owners aged 30–50" | CopyMaker `targetAudience`; prompt context |
| `painPoints` | Optional | Audience pain point framing | "Scattered tools, missed deadlines" | CopyMaker `targetAudiencePainPoints` |
| `specialInstructions` | Optional | Constraints / extra guidance | "Avoid jargon. Keep under 100 words." | CopyMaker `specialInstructions`; prompt injection |

AI suggestion buttons are available on `targetAudience` and `painPoints` fields.

A searchable suggestions modal is available for `specialInstructions`.

#### Step 2 Fields (Create / Improve modes only)

| Field | Required | What It Affects | Options | Downstream Use |
|-------|----------|-----------------|---------|----------------|
| `tone` | Optional | Output voice and register | Professional, Friendly, Bold, Minimalist, Creative, Persuasive | CopyMaker `tone` field; prompt context |
| `wordCount` | Optional | Output length guidance | Short (50–100), Medium (100–200), Long (200–400), Custom | CopyMaker `wordCount` / `customWordCount` |
| `customWordCount` | Conditional | Exact word count target | Integer | CopyMaker `customWordCount` |
| `enableSEO` | Optional | Triggers SEO metadata generation | Checkbox | CopyMaker `generateSeoMetadata`; auto-enabled for `improve` mode |
| `enableGEO` | Optional | Triggers GEO scoring | Checkbox | CopyMaker `generateGeoScore`; auto-enabled for `improve` mode |
| `selectedModel` | Optional | AI model used for generation | See §13.1 | CopyMaker `model` field |
| `brandVoiceId` | Optional (Standard/Advanced UI modes) | Brand consistency | User's saved brand voices | CopyMaker `brandVoiceId` |
| `customerId` | Optional (Standard/Advanced UI modes) | Customer profile pre-fill | User's saved customers | CopyMaker `customerId` |

#### URL Analysis Sub-Inputs (available in Improve mode, Step 1)

When the user provides a URL in the improve mode, three analysis options are available:

| Option | Label | Method | What It Extracts | Structure Modal |
|--------|-------|--------|-----------------|-----------------|
| Analyze Context | "Analyze Context" | Standard URL analysis | targetAudience, painPoints, tone, whatCreating | No |
| Extract Copy | "Extract Copy" | Standard URL analysis | Full structuredCopy, targetAudience, painPoints, outputStructure (with word counts) | Yes — prompts user to confirm extracted structure |
| Deep Crawl | "Analyze Deep Crawl" | Firecrawl API (multi-page) | Full structuredCopy, targetAudience, painPoints, outputStructure (with word counts) | Yes — prompts user to confirm extracted structure |

**Structure Confirmation Modal:** When `outputStructure` is extracted from URL analysis (Extract Copy or Deep Crawl), the wizard displays a modal showing the detected page structure with word counts. The user can:
- Accept the extracted structure (populated into `outputStructure` wizard state)
- Discard it (proceed with empty output structure)

**Important:** The extracted `outputStructure` is now correctly passed to the CopyMaker form in all modes, including `improve` mode. (Fixed 2026-02-20.)

**URL Analysis Error Cases:**
- Blocked or paywalled pages: analysis returns error; user notified [TO BE VERIFIED IN APP — exact error message]
- Dynamic/JS-heavy pages: standard analysis may return partial data; Deep Crawl (Firecrawl) handles these better
- Timeout: [TO BE VERIFIED IN APP — timeout duration and fallback behavior]

**URL Analysis Limits:**
- Standard analysis: single-page extraction
- Deep Crawl (Firecrawl): multi-page crawl [TO BE VERIFIED IN APP — exact page depth / count limits]

### 4.4 Wizard Outputs

After completion, the wizard produces:

| Output | Description |
|--------|-------------|
| Pre-filled CopyMaker form | All collected wizard fields mapped to corresponding CopyMaker form fields |
| Active session | Session created with the `projectDescription` as session name |
| Optional: immediately generated copy | If user clicks "Generate Now" from wizard, copy generation fires without navigating the form |

After wizard apply, the user lands on the CopyMaker form with all fields pre-populated. They may review and edit before generating, or generate immediately.

### 4.5 Workflow Handoff Rules

**Wizard → CopyMaker Prefill Behavior:**

| Wizard Field | CopyMaker Field | Notes |
|-------------|-----------------|-------|
| `projectDescription` | `projectDescription` | Also sets session name |
| `whatAreYouCreating` | `businessDescription` (create) or `originalCopy` (improve) | Mode-dependent mapping |
| `targetAudience` | `targetAudience` | Direct mapping |
| `painPoints` | `targetAudiencePainPoints` | Direct mapping |
| `specialInstructions` | `specialInstructions` | Only applied if wizard value non-empty |
| `tone` | `tone` | Direct mapping |
| `wordCount` / `customWordCount` | `wordCount` / `customWordCount` | Direct mapping |
| `enableSEO` | `generateSeoMetadata` | Direct flag mapping |
| `enableGEO` | `generateGeoScore` | Direct flag mapping |
| `outputStructure` | `outputStructure` | Used if extracted from URL analysis; otherwise `[]` for improve, AI suggestion for create |
| `brandVoiceId` | `brandVoiceId` | Direct mapping |
| `customerId` | `customerId` | Direct mapping |
| `selectedModel` | `model` | AI model selection |

**Mode Forcing:** Before applying wizard data, the wizard forces the CopyMaker UI to Advanced mode (trigger: `wizard_apply` or `wizard_generate`). This ensures all fields set by the wizard are visible and editable.

**Tab Setting:** The wizard sets the CopyMaker `tab` field:
- `create` mode → `tab: 'create'` (or default `tab: 'copyMaker'`)
- `improve` mode → `tab: 'improve'`

**Optimization Restore Policy:** After wizard data is applied, the optimization restore policy is applied to the resulting form state. This ensures previously-set optimization toggles are restored if not overridden by the wizard.

**Parameter Persistence:** Once wizard data is applied to the CopyMaker form, the CopyMaker form owns all fields. Editing a field in the form does not affect wizard state. Session name updates dynamically if `projectDescription` is edited in the form.

---

## 5. CopyMaker (Copy Creation)

### 5.1 Modes

CopyMaker operates in three UI modes that control field visibility. The mode does not restrict what the AI does — it restricts what the user sees and can configure.

UI Location: Mode toggle in the CopyMaker header bar.

#### Quick Mode

Shows 13 fields only. Designed for fast entry.

Fields visible:
- `projectDescription`, `productServiceName`, `businessDescription`
- `originalCopy` (improve tab only)
- `section`, `targetAudience`
- `language`, `tone`, `wordCount`, `customWordCount`
- `keyMessage`, `callToAction`, `specialInstructions`

Hidden: All advanced audience, SEO, GEO, keyword, brand voice, scoring, and structure fields.

Defaults used: Model defaults; no brand voice; no scoring; no SEO generation unless previously set.

#### Standard Mode

Shows all Quick fields plus approximately 20 additional feature fields.

Additional fields visible (beyond Quick):
- `customerId`, `brandVoiceId`
- `targetAudiencePainPoints`, `competitorUrls`, `preferredWritingStyle`
- `languageStyleConstraints`, `brandValues`, `keywords`, `context`, `excludedTerms`
- `outputStructure`, `includeSectionTitles`
- `generateSeoMetadata`, `generateScores`, `prioritizeWordCount`, `wordCountTolerancePercentage`
- `generateGeoScore`, `forceKeywordIntegration`, `forceElaborationsExamples`
- `enhanceForGEO`, `addTldrSummary`, `geoRegions`
- SEO variant count fields: `numUrlSlugs`, `numMetaDescriptions`, `numH1Variants`, `numH2Variants`, `numH3Variants`, `numOgTitles`, `numOgDescriptions`
- `adhereToLittleWordCount`, `littleWordCountTolerancePercentage`

#### Advanced Mode

Shows all Standard fields plus 5 additional expert fields.

Additional fields visible (beyond Standard):
- `industryNiche`
- `readerFunnelStage`
- `competitorCopyText`
- `readerSophistication`
- `toneLevel` / `desiredEmotion`

### 5.2 Input Categories (Inventory)

#### Core Content Inputs

| Field | Mode Required | Description | Effect on Output |
|-------|--------------|-------------|-----------------|
| `tab` | All | create / improve / copyMaker | Determines generation type |
| `businessDescription` | All | What is being created and for what purpose | Primary generation context |
| `productServiceName` | All | Name of the product or service | Injected into prompt for identity |
| `projectDescription` | All | Session/project label | Session naming; not directly in copy prompt |
| `originalCopy` | Improve only | The copy to be improved | Source text for improvement prompt |
| `section` | Quick+ | Page section type (Hero, Benefits, Features, Services, About, Testimonials, FAQ, Full, Other) | Prompt framing; scoring use case mapping |

#### Targeting Fields

| Field | Mode Required | Description | Effect on Output |
|-------|--------------|-------------|-----------------|
| `targetAudience` | All | Who the copy is for | Audience framing in prompt |
| `targetAudiencePainPoints` | Standard+ | Problems the audience faces | Pain-point language in prompt |
| `readerFunnelStage` | Advanced | Awareness / Consideration / Decision / Retention / Re-activation | Funnel-appropriate language and CTAs |
| `readerSophistication` | Advanced | Beginner / Intermediate / Advanced / Expert | Vocabulary and explanation depth |
| `industryNiche` | Advanced | SaaS / Health / RealEstate / Ecommerce / Education / Hospitality / Finance / Nonprofit / Other | Industry-specific terminology |

#### Tone and Style Fields

| Field | Mode Required | Description | Options |
|-------|--------------|-------------|---------|
| `tone` | All | Overall voice register | Professional, Friendly, Bold, Minimalist, Creative, Persuasive |
| `toneLevel` / `desiredEmotion` | Advanced | Emotional target | Free text |
| `preferredWritingStyle` | Standard+ | Writing style preference | Free text |
| `languageStyleConstraints` | Standard+ | What to avoid stylistically | Free text |

#### Voice and Brand Fields

| Field | Mode Required | Description | Effect |
|-------|--------------|-------------|--------|
| `brandVoiceId` | Standard+ | Saved Brand Voice profile ID | Injects brand voice instructions into prompt |
| `customerId` | Standard+ | Customer profile ID | Loads customer's brand voice and context |
| `selectedPersona` | [TO BE VERIFIED IN APP] | Named persona selection | [TO BE VERIFIED IN APP] |
| `brandValues` | Standard+ | Core brand values text | Injected into prompt framing |

#### Keywords / SEO / GEO Fields

| Field | Mode Required | Description | Effect |
|-------|--------------|-------------|--------|
| `keywords` | Standard+ | Target keywords list | Keyword integration in prompt |
| `keywordsExplicit` | Standard+ | Force exact keyword use | Strict keyword placement instruction |
| `forceKeywordIntegration` | Standard+ | Toggle for forced keywords | On/off instruction modifier |
| `generateSeoMetadata` | Standard+ | Generate SEO metadata variants | Triggers SEO metadata block in output |
| `numUrlSlugs` | Standard+ | Number of URL slug variants | 1–5 variants |
| `numMetaDescriptions` | Standard+ | Number of meta description variants | 1–5 variants |
| `numH1Variants` | Standard+ | Number of H1 variants | 1–5 variants |
| `numH2Variants` | Standard+ | Number of H2 variants | 1–5 variants |
| `numH3Variants` | Standard+ | Number of H3 variants | 1–5 variants |
| `numOgTitles` | Standard+ | Number of OG title variants | 1–5 variants |
| `numOgDescriptions` | Standard+ | Number of OG description variants | 1–5 variants |
| `generateGeoScore` | Standard+ | Generate GEO/LLM readiness score | Triggers GEO scoring block |
| `enhanceForGEO` | Standard+ | Optimize copy for GEO | Modifies prompt for LLM answer format |
| `geoRegions` | Standard+ | Target geographic regions | Localizes content for GEO |
| `addTldrSummary` | Standard+ | Add TL;DR to output | Appends summary block |

#### Constraints

| Field | Mode Required | Description |
|-------|--------------|-------------|
| `excludedTerms` | Standard+ | Words / phrases to avoid |
| `context` | Standard+ | Background context not in main copy |
| `competitorUrls` | Standard+ | URLs of competitors (for analysis input) |
| `competitorCopyText` | Advanced | Competitor copy text to reference |

#### Optional Toggles

| Toggle | Mode Required | Description |
|--------|--------------|-------------|
| `generateScores` | Standard+ | Auto-score all generated versions |
| `prioritizeWordCount` | Standard+ | Treat word count as hard constraint |
| `wordCountTolerancePercentage` | Standard+ | Acceptable word count deviation (%) |
| `adhereToLittleWordCount` | Standard+ | Enforce strict minimum word count |
| `littleWordCountTolerancePercentage` | Standard+ | Tolerance for minimum word count |
| `aiDecideWordCount` | Standard+ | Let AI determine appropriate length |
| `forceElaborationsExamples` | Standard+ | Force AI to add examples and elaborations |
| `faqSchemaEnabled` | Standard+ | Generate FAQ JSON-LD schema |
| `includeSectionTitles` | Standard+ | Add section titles to structured output |
| `createVariants` | Standard+ | Auto-generate variant versions |
| `numberOfVariants` | Standard+ | Number of variants to generate (if createVariants enabled) |

### 5.3 Language Selection

UI Location: Language dropdown in CopyMaker form (Quick mode and above).

| Language | Code | Reliability |
|----------|------|-------------|
| English | en | Full support — guaranteed quality |
| Spanish | es | Full support — guaranteed quality |
| French | fr | Accepted — quality not guaranteed |
| German | de | Accepted — quality not guaranteed |
| Italian | it | Accepted — quality not guaranteed |
| Portuguese | pt | Accepted — quality not guaranteed |

**Important constraints:**
- UI is English-only regardless of selected output language.
- Reliable generation quality is guaranteed for English and Spanish only.
- French, German, Italian, and Portuguese are accepted inputs. The AI will attempt to generate in these languages, but output quality may be inconsistent depending on the complexity of the brief.
- Selecting a language instructs the AI to produce output in that language.
- Scoring and comparison operate on the generated text regardless of language.
- SEO metadata generation respects the selected language.

### 5.4 Output Artifacts

After generation, CopyMaker produces a `CopyResult` containing:

| Artifact | Description | Condition |
|----------|-------------|-----------|
| Generated Copy | Main output text (Original or Improved version) | Always |
| Alternative Copy | Alternative version | If alternative copy generation is enabled |
| Headline Ideas | Suggested headlines | If headline generation is enabled [TO BE VERIFIED IN APP] |
| Score (6-dimension) | Per-version quality scores | If `generateScores` is enabled |
| SEO Metadata | URL slugs, meta descriptions, H1/H2/H3, OG variants | If `generateSeoMetadata` is enabled |
| GEO Score | LLM-readiness score with breakdown | If `generateGeoScore` is enabled |
| FAQ Schema (JSON-LD) | Structured FAQ markup | If `faqSchemaEnabled` is enabled |
| Prompt Evaluation | Evaluation of the prompt used for generation | If enabled [TO BE VERIFIED IN APP] |
| TL;DR Summary | Short summary appended to output | If `addTldrSummary` is enabled |

Each generated version is a `GeneratedContentItem`:
- `id` (unique)
- `type` (Original, Improved, Alternative, Boosted, RestyledImproved, etc.)
- `content` (string or StructuredCopyOutput)
- `score` (ScoreData — optional)
- `seoMetadata` (optional)
- `geoScore` (optional)
- `faqSchema` (optional)

---

## 6. Purpose Rewrite

### 6.1 Purpose

Purpose Rewrite is a precision refinement layer that rewrites copy for a specific declared purpose (e.g., for a specific section type or use case), preserving intent while adapting framing.

**[TO BE VERIFIED IN APP — confirm whether Purpose Rewrite is a distinct module/tab or a sub-action within CopyMaker's Improve tab]**

See Operating Manual §4.x (Purpose Rewrite section).

### 6.2 Inputs

- Original copy (text input)
- Target purpose / section type [TO BE VERIFIED IN APP — exact option list]
- Tone (optional) [TO BE VERIFIED IN APP]
- Special instructions (optional)

### 6.3 Output Behavior

- Returns one or more rewritten versions adapted for the selected purpose
- Creates a new version in the output panel [TO BE VERIFIED IN APP]

### 6.4 Language Limitation

Only **English and Spanish** are reliably supported. Input in other languages may be processed as English or produce unexpected results.

### 6.5 Typical Use Cases

- Adapting a homepage hero into a landing page CTA section
- Rewriting a features list as a benefits-focused narrative
- Converting long-form copy to short-form ad copy

### 6.6 Edge Cases / Warnings

- Non-EN/ES input is processed but results are unreliable
- Very long input may be truncated before rewriting [TO BE VERIFIED IN APP — character limit]
- If the declared purpose does not match the input content type, results may be misaligned

---

## 7. Quick Polish

### 7.1 What It Does

Quick Polish is an intent-based short-text rewrite tool. The user selects an intent (what type of copy they are improving) and Quick Polish rewrites the input to match that intent's best-practice pattern. It does not add new claims — it reshapes existing copy.

UI Location: Accessible from the Start Hub (`polish` mode) or directly from the main navigation.

See Operating Manual §4.3.

### 7.2 Input Methods

**Manual input:**
- User pastes or types existing copy into the text field
- Selects an intent from 11 available intents
- Configures intent-specific parameters

**URL-based input:**
- [TO BE VERIFIED IN APP — confirm whether Quick Polish can be launched from wizard with URL-extracted copy pre-filled]

### 7.3 Intent Options (11 Available)

| Intent Key | Display Name | Purpose | Parameter Fields |
|------------|-------------|---------|-----------------|
| `hero_branding` | Hero / Brand Statement | Hero headline + subheadline rewrite | audience, goal, tone |
| `cta` | Call to Action | CTA rewrite | goal, tone, cta |
| `about` | About / Bio | About section or bio rewrite | audience, tone |
| `instagram_caption` | Instagram Caption | Social caption rewrite | audience, goal, tone |
| `ad_short` | Short Ad Copy | Paid ad copy rewrite | audience, goal, tone, cta |
| `email_intro` | Email Opening | Email intro / subject rewrite | audience, goal, tone |
| `value_prop` | Value Proposition | USP / value prop rewrite | audience, tone |
| `seo_snippet` | SEO Snippet | SEO-optimized snippet rewrite | goal, tone |
| `section_body` | Section Body | Website / landing page body section | audience, goal, tone |
| `product_desc_short` | Product Description | Short product/service description | audience, goal, tone, cta |
| `problem_pain` | Problem / Pain Statement | Pain-point framing rewrite | audience, tone |

### 7.4 Configuration Options

| Option | Description | Values |
|--------|-------------|--------|
| `contentType` | Format of input text | plain, html, markdown |
| `tone` | Output tone (auto-filled per intent; user can override) | neutral, premium, friendly, bold, formal |
| `audience` | Target audience (if intent supports it) | Free text |
| `goal` | Goal of the copy (if intent supports it) | Free text |
| `cta` | Call-to-action text (if intent supports it) | Free text |
| `specialInstructions` | Optional constraints | Free text |
| `variantsCount` | Number of variant rewrites | 1, 2, or 3 |

**Model:** `claude-sonnet-4-5` (hardcoded; user cannot select model in Quick Polish)

### 7.5 Language Support

- **English and Spanish:** Reliably supported
- **Other languages:** Not reliably supported; behavior undefined for non-EN/ES input
- UI is English-only

### 7.6 Outputs

- 1 to 3 rewritten text variants (plain text)
- No structured JSON; no SEO metadata; no scoring (scoring behavior: [TO BE VERIFIED IN APP])
- Output can be saved as a standalone SavedOutput record

### 7.7 Known Limitations

- Maximum input length: [TO BE VERIFIED IN APP — confirm character limit]
- Does not add new factual claims — rewriting only
- Tone auto-fill per intent can be manually overridden
- No brand voice support confirmed [TO BE VERIFIED IN APP]
- No workflow integration confirmed [TO BE VERIFIED IN APP]

---

## 8. CopySnap

### 8.1 What CopySnap Is

CopySnap is a rapid transformation engine for short text. Unlike CopyMaker (which builds copy from a full brief), CopySnap takes existing text and transforms it via one of three modes: Improve, Answer, or Question. It is designed for quick turnarounds on short copy blocks (max 2000 characters).

UI Location: Accessible from the main navigation as a standalone module.

See Operating Manual §4.4.

### 8.2 Supported Transformations (Mode Inventory)

#### Mode 1: IMPROVE

Rewrites and improves the input copy.

| Parameter | Options | Description |
|-----------|---------|-------------|
| Goal | `clearer`, `persuasive`, `shorter`, `punchier` | What aspect to improve |
| Platform | `general`, `x`, `linkedin`, `email` | Target platform (affects tone/length norms) |
| Length | `short` (20–40% reduction), `same` (±10%), `longer` (20–40% increase) | Target output length relative to input |

Output structure: `{ best: string, alternatives: string[], notes: string[] }`

#### Mode 2: ANSWER

Generates a reply/response to the input text (treating input as a message or question to respond to).

| Parameter | Options | Description |
|-----------|---------|-------------|
| Reply Style | `helpful`, `friendly`, `confident`, `witty`, `direct` | Voice and demeanor of the reply |
| Stance | `neutral`, `agree`, `disagree` | Position relative to the input |
| Length | `short` (1–2 sentences), `medium` (2–4 sentences), `long` (4–6 sentences) | Reply length |

**Critical constraint:** Zero question marks in output unless explicitly permitted via Special Instructions.

Output structure: `{ best: string, alternatives: string[] }`

#### Mode 3: QUESTION

Generates questions based on or in response to the input text.

| Parameter | Options | Description |
|-----------|---------|-------------|
| Question Type | `clarify`, `challenge`, `explore`, `convert` | The purpose of the question |
| Count | 1, 3, or 5 | Number of questions to generate |
| Directness | `soft`, `direct` | Question tone and confrontation level |

Output structure: `{ questions: string[] }`

### 8.3 Language Detection and Response Rules

CopySnap automatically detects the language of the input and responds in that same language. The user cannot manually select the output language.

**Auto-detection supports 13 languages:**

| Language | Code | Detection Method |
|----------|------|------------------|
| English | en | Common word patterns; primary fallback |
| Spanish | es | Accented characters (áéíóúñ) + Spanish words |
| French | fr | Accented characters (àèéêëï) + French words |
| German | de | Umlaut characters (äöüß) + German words |
| Italian | it | Accented characters (àèéìòù) + Italian words |
| Portuguese | pt | Accented characters (áàâãéêíóôõúç) + Portuguese words |
| Dutch | nl | Common Dutch words (het, een, van, dat, zijn) |
| Russian | ru | Cyrillic character range (а-яА-ЯёЁ) |
| Japanese | ja | Hiragana / Katakana / Kanji Unicode ranges |
| Chinese | zh | CJK ideogram range (U+4E00–U+9FFF) |
| Korean | ko | Hangul range (U+AC00–U+D7AF) |
| Arabic | ar | Arabic script range (U+0600–U+06FF) |
| Hindi | hi | Devanagari range (U+0900–U+097F) |

**Important:**
- If detection is uncertain or input is very short, defaults to English
- Reliable output quality guaranteed only for English and Spanish
- Other language outputs may degrade in quality depending on model capability

### 8.4 Inputs

| Input | Required | Description | Constraint |
|-------|----------|-------------|------------|
| `input` text | Required | The copy to transform | Max 2000 characters |
| Mode selection | Required | Improve / Answer / Question | One mode per session |
| Mode parameters | Required | Mode-specific options (see §8.2) | Specific per mode |
| `specialInstructions` | Optional | Constraints or extra context | Can constrain but cannot override mode behavior |
| `humanTone` toggle | Optional | Apply natural voice instructions | On/off; modifies generation instruction |

**Model:** `claude-sonnet-4-5` (hardcoded; user cannot select model in CopySnap)

### 8.5 Outputs and Next Steps

| Output | Description |
|--------|-------------|
| Best version | Primary transformation result |
| Alternatives | 1–2 additional variants (Improve and Answer modes) |
| Notes | Generation guidance notes (Improve mode only) |
| Questions list | Array of generated questions (Question mode only) |

**After generation, the user can:**
- Copy any version to clipboard
- Save output (with title and description) to SavedOutputs
- Save the entire CopySnap session (with name and description)
- Use the output as input for a new CopySnap transformation [TO BE VERIFIED IN APP — confirm if input field auto-populates from best result]
- Send output to CopyMaker [TO BE VERIFIED IN APP — confirm if this flow exists]

### 8.6 UX Behaviors

| Behavior | Description |
|----------|-------------|
| Character counter | Shows characters remaining (max 2000) in input field |
| Language auto-detection | Fires after input is entered; no user action required |
| State transitions | Generating → Result displayed; errors shown inline |
| Session scope key | `copysnap-{userId}` — sessions are per-user |
| Error states | Network errors, invalid input, and model errors surfaced to user [TO BE VERIFIED IN APP — exact error messages] |

---

## 9. Post-Generation Iteration Actions

These actions are available after a copy generation job completes in CopyMaker. They operate on existing generated versions to produce new derived versions.

UI Location: Action buttons and menus within the Results panel (ResultsSection component).

See Operating Manual §4.5.

### 9.1 Apply Voices

**What it does:** Restyles a generated version using a selected brand voice profile or preset voice style. Produces a new version (type: `RestyledImproved` or similar) without altering factual content.

| Attribute | Detail |
|-----------|--------|
| Trigger | "Apply Voices" button on a generated version |
| Inputs | Selected brand voice (from user's saved voices) or preset voice style |
| Creates new version | Yes — tagged with applied voice persona |
| Token impact | Yes — requires an AI call |
| Target | Individual versions (Original, Improved, Alternative) |

### 9.2 Generate Variations

**What it does:** Produces alternative versions from the base output, varying approach, framing, or angle while preserving the core brief.

| Attribute | Detail |
|-----------|--------|
| Trigger | "Variations" or "Generate Alternative" button |
| Inputs | Base version content + original form parameters |
| Creates new version | Yes — type: `Alternative` or numbered variant |
| Count selection | [TO BE VERIFIED IN APP — confirm if user can choose number of variations] |
| Token impact | Yes — requires an AI call per variant |

### 9.3 Modify

**What it does:** User manually edits a generated version in-line. The edited version is tracked as a distinct saved state.

| Attribute | Detail |
|-----------|--------|
| Trigger | Edit mode on a generated version card |
| Inputs | User's manual text edits |
| Creates new version | Tracked as modified state (`saved_mode` field) |
| Token impact | No — no AI call; user edits directly |

### 9.4 Boost

**What it does:** Applies a performance enhancement pass to an existing version to increase quality scores.

| Attribute | Detail |
|-----------|--------|
| Trigger | "Boost" (rocket) button on a generated version |
| Inputs | The existing version content + original parameters |
| Creates new version | Yes — type: `Boosted` |
| Limit | Maximum 2 boost operations per base version |
| Disabled condition | Disabled if current score is ≥ 9.0 (already near-peak) |
| Token impact | Yes — requires an AI call |

### 9.5 Blend

**What it does:** Merges elements from two generated versions to create a combined output that synthesizes the strengths of both.

| Attribute | Detail |
|-----------|--------|
| Trigger | "Blend" action (selecting two versions) |
| Inputs | Two selected versions from the output panel |
| How many can be blended | Two versions at a time |
| Creates new version | Yes — type: `Blend` or similar |
| Output naming | [TO BE VERIFIED IN APP — confirm naming pattern for blended versions] |
| Token impact | Yes — requires an AI call |

### 9.6 Score

**What it does:** Generates quality scores for an existing version that was not scored during initial generation.

| Attribute | Detail |
|-----------|--------|
| Trigger | "Score" button on an unscored version |
| Inputs | Version content + form parameters for use case determination |
| Output | 6-dimension score + overall score |
| Token impact | Yes — requires an AI call |

### 9.7 Compare

**What it does:** Triggers side-by-side comparison of all available versions in a comparison table view.

| Attribute | Detail |
|-----------|--------|
| Trigger | "Compare" button or compare toggle |
| Inputs | All generated versions with scores |
| Output | ComparisonTable showing scores, deltas, winner |
| Token impact | No — comparison is computed from existing scores; no AI call unless deep analysis is requested |

### 9.8 Save

**What it does:** Saves an individual generated version to the Saved Outputs library.

| Attribute | Detail |
|-----------|--------|
| Trigger | "Save" button on a version card |
| Inputs | Version content; optional title and description |
| Output | Record created in `pmc_saved_outputs` table |
| Token impact | No |

---

## 10. Evaluation Layer: Scoring & Comparison

### 10.1 Scoring Capabilities

CopyMaker supports three scoring systems applied to generated versions.

See Operating Manual §5.

#### System 1: 6-Dimension Copy Quality Score

| Dimension | Score Range | What It Measures |
|-----------|-------------|------------------|
| Marketing | 0–100 | Unique mechanism, hook strength, urgency signals |
| Clarity | 0–100 | Structure, hierarchy, paragraph density |
| SEO | 0–100 | Keyword density and placement (only for `seo_page` use case) |
| Emotion | 0–100 | Resonance, empathy, vivid language |
| CTA | 0–100 | Presence, specificity, and urgency of calls-to-action |
| Readability | 0–100 | Sentence length, run-ons, verbose phrasing |

**Overall Score Formula:**
```
Overall = Σ (dimension_score × dimension_weight)
```
Weights vary by use case (see Operating Manual §5.2). Weights always sum to 1.0.

SEO dimension is excluded (weight = 0) for all non-SEO use cases.

**Score Normalization:**
- Raw dimension scores (0–100) are weighted and summed
- Overall score is expressed on a 0–10 scale [TO BE VERIFIED IN APP — confirm final scale: 0–10 vs 0–100]

#### System 2: GEO Score (LLM-Readiness)

| Criterion | Points | What It Measures |
|-----------|--------|-----------------|
| Direct Answer Clarity | 20 | How directly the copy answers likely queries |
| Scannable Structure | 15 | Headers, bullets, visual hierarchy |
| Question-Based Headings | 10 | Headings formatted as questions |
| Local Relevance | 20 | Geographic and contextual specificity |
| Quote-Friendly Sentences | 15 | Standalone, quotable sentences |
| Authority Signals | 10 | Credibility markers, data references |
| TL;DR / Answer Box | 10 | Presence of a concise summary block |

Total: 100 points.

#### System 3: Prompt Evaluation Score

Evaluates the quality of the prompt used to generate the copy (not the copy itself).

| Dimension | Range |
|-----------|-------|
| Completeness | 0–100 |
| Clarity | 0–100 |
| Coherence | 0–100 |
| Strategic Value | 0–100 |
| Actionability | 0–100 |

### 10.2 Comparison Table

**What is compared:** All generated versions with available scores are shown in a side-by-side table.

**Columns per version:**
- Version name/type
- Overall score
- Per-dimension scores (Marketing, Clarity, Emotion, CTA, Readability; SEO if applicable)
- Delta vs. best version (`deltaVsBest`)
- Improvement percentage (`improvementPct`)

**Winner determination logic (see Operating Manual §5.7):**

1. Highest `finalScore` wins
2. Tie-break 1: Highest CTA score
3. Tie-break 2: Highest Clarity score
4. Tie-break 3: Highest Marketing score
5. Tie-break 4: Stable order (first version encountered)

### 10.3 Deep Analysis

**What it is:** A per-version detailed breakdown beyond scores — includes narrative feedback, specific improvement suggestions, and criterion-level rationale.

| Capability | Detail |
|------------|--------|
| Per-version deep analysis | Individual narrative breakdown |
| Bulk generation | Can trigger deep analysis for all versions in one action [TO BE VERIFIED IN APP — confirm UI trigger] |
| Overall comparison verdict | `comparisonDeepAnalysisMeta` — synthesis across all versions |

### 10.4 User-Visible Outputs

| Output | Where Shown |
|--------|-------------|
| Version scores (per-dimension + overall) | Version cards in Results panel |
| Best version indicator | Highlighted in comparison table and Results panel |
| Category leaders | `bestForMarketing`, `bestForClarity`, `bestForSimplicity` shown in comparison summary |
| Score delta vs. best | Per-version in comparison table |
| Improvement percentage | Per-version in comparison table |
| Deep analysis narratives | Per-version expanded section |
| Overall verdict | Comparison table summary |
| GEO score breakdown | GEO score panel (if enabled) |

---

## 11. Decision Layer: Best Version Analysis

### 11.1 What It Produces

After scoring and comparison, the Best Version Analysis surfaces a single recommended version with supporting evidence.

| Signal | Description |
|--------|-------------|
| Best overall | Version with highest weighted total score |
| Best for Marketing | Version with highest Marketing dimension score |
| Best for Clarity | Version with highest Clarity dimension score |
| Best for Simplicity | Version with highest Readability dimension score |
| Delta summary | How much better the winner is vs. the next-best version |
| Rationale | Narrative explanation for why the winner was selected [TO BE VERIFIED IN APP — confirm if narrative is always generated] |

### 11.2 What Signals Are Included

- All 6 dimension scores per version
- GEO score (if generated)
- Word count accuracy
- Version type (Original, Improved, Alternative, Boosted, etc.)
- Applied voice/persona (if any)

### 11.3 How It Is Used

The user reviews the Best Version Analysis to decide which version to:
- Copy and use
- Save to Saved Outputs
- Export (see export capabilities [TO BE VERIFIED IN APP])
- Use as a starting point for further iteration (Boost, Blend, Modify)

---

## 12. Workflows: Saved Workflows & Reapplication

### 12.1 What a Workflow Represents

A saved workflow is a named, ordered sequence of copy operations that can be applied to new copy generation jobs. Workflows automate multi-step iteration that would otherwise require manual repeat actions.

A workflow contains:
- `name` (display label)
- `description` (optional)
- `steps` (ordered array of WorkflowStep objects)
- `customer_id` (optional — associate with a customer profile)
- `enable_analyze_compare` (boolean — run scoring/comparison after all steps complete)
- `is_public` (boolean — visible to all users if true; admin-only write)
- `permissions` (array of per-user access grants for shared workflows)

### 12.2 Workflow Step Types

| Step Type | Description |
|-----------|-------------|
| `create_alternative_copy` | Generate an alternative version of the current copy |
| `apply_voice_style` | Apply a brand voice or preset voice style to a version |
| `analyze_compare_copy` | Run scoring and comparison analysis on current versions |

Each step specifies:
- `target`: which version to operate on (`original`, `alt_1`, `alt_2`)
- `brand_voice_id` (for voice steps)
- `preset_voice_style` (for voice steps using presets)
- `customInstructions` (optional override instructions)

### 12.3 Save Workflow

- User creates a workflow from scratch using the Workflow Builder UI
- Workflow Builder allows adding, ordering, and configuring steps
- Workflow is saved to the `workflows` table for the user's account
- Admins can mark workflows as `is_public` to share with all users

### 12.4 Apply Workflow

- User selects a saved workflow via the WorkflowSelector in CopyMaker
- Workflow runs after initial copy generation
- Each step executes in sequence
- Optional: scoring/comparison auto-runs after all steps

### 12.5 Parameter Editing

- Workflows can be edited in the Workflow Builder at any time
- Editing a workflow does not affect previous runs
- Workflow permissions can be granted to specific other users

### 12.6 Workflow Impact on Prompts and Outputs

- Each workflow step generates an AI call using the current form parameters plus step-specific instructions
- Results are added as new versions to the output panel
- If `enable_analyze_compare` is true, all versions are scored at the end of the workflow run

### 12.7 Shared Workflows

- Admins or workflow owners can grant access to other users via `WorkflowPermission`
- Permission levels: [TO BE VERIFIED IN APP — confirm available levels (view / execute / edit)]
- Shared workflows appear in the recipient's WorkflowSelector

---

## 13. Models, Tokens, and Cost Transparency

### 13.1 Model Selection

UI Location: Model selector in CopyMaker header (Advanced mode and above; may also appear in Standard mode — [TO BE VERIFIED IN APP]).

**Available AI models (confirmed from FormState type):**

| Model | Provider | Tier |
|-------|----------|------|
| `claude-sonnet-4-5` | Anthropic | Standard |
| `claude-haiku-4-5` | Anthropic | Fast / Low-cost |
| `claude-opus-4-5` | Anthropic | Premium |
| `deepseek-chat` | DeepSeek | Low-cost |
| `gpt-4o` | OpenAI | Standard |
| `chatgpt-4o-latest` | OpenAI | Latest Standard |
| `gpt-4-turbo` | OpenAI | High-capability |
| `gpt-3.5-turbo` | OpenAI | Fast / Low-cost |
| `grok-4-latest` | xAI | Standard |
| `gemini-2.0-flash` | Google | Fast |

**CopySnap and Quick Polish:** Model is hardcoded to `claude-sonnet-4-5`. User cannot select model in these modules.

**Impact on output:** Higher-tier models generally produce higher quality output with better instruction-following at higher credit cost.

### 13.2 Credit Usage

| Action | Consumes Credits | Notes |
|--------|-----------------|-------|
| Generate copy (CopyMaker) | Yes | Per AI call |
| Apply Voices | Yes | Per AI call |
| Generate Variations | Yes | Per AI call |
| Boost | Yes | Per AI call |
| Blend | Yes | Per AI call |
| Score versions | Yes | Per AI call |
| Deep Analysis | Yes | Per AI call |
| CopySnap transformation | Yes | Per AI call |
| Quick Polish rewrite | Yes | Per AI call |
| URL Analysis (standard) | Yes | Per AI call |
| URL Analysis (Deep Crawl / Firecrawl) | Yes | Per AI call |
| Copy to clipboard | No | Local operation |
| Save output | No | Database write only |
| View comparison table (existing scores) | No | Display only |

**Credit visibility:**
- Users can view their current credit balance [TO BE VERIFIED IN APP — confirm exact UI location]
- Admins can view per-user credit usage via the Usage Audit panel

### 13.3 Language Behavior Differences Per Module

| Module | UI Language | Output Language Mode | Supported Output Languages |
|--------|-------------|---------------------|---------------------------|
| CopyMaker | English only | User-selected | English, Spanish, French, German, Italian, Portuguese |
| CopySnap | English only | Auto-detected from input | 13 languages (see §8.3; reliable: EN, ES) |
| Quick Polish | English only | Auto (EN/ES reliable) | English, Spanish (others unreliable) |
| Quick Prompt Wizard | English only | Follows CopyMaker selection | Follows CopyMaker selection |
| Scoring | English only | Score labels in English | Scores language-agnostic |

---

## 14. Admin-Only Capabilities (Summary)

Admin status is determined by membership in the `app_admins` table, verified via the `useIsAdmin()` hook and enforced by `AdminRoute` wrappers and Row Level Security policies.

UI Location: Admin-only routes prefixed with `/admin/`.

| Capability | Route | Description |
|------------|-------|-------------|
| Manage Users | `/admin/manage-users` | Create, edit, disable, delete user accounts; set credit limits and access dates |
| Manage Customers | `/admin/manage-customers` | Create and manage customer profiles and associated brand voices |
| Manage Prefills | `/admin/manage-prefills` | Create and manage global input preset templates |
| Manage Special Instructions | `/admin/manage-special-instructions` | Create and manage global special instruction presets |
| Usage Audit | `/admin/usage-audit` | View credit/token usage per user; export usage data |
| Admin Diagnostics | `/admin/diagnostics` | System health checks; role detection verification; configuration status |

**User Management Fields:**

| Field | Description |
|-------|-------------|
| `name`, `email` | Identity fields |
| `credits_allowed` | Credit ceiling for the user; immediately affects available balance |
| `start_date`, `until_date` | Access window (time-limited accounts) |
| Account disable | Prevents login without deletion |
| Account delete | Permanent removal |

**Public Template Management:**
- Admins can create and mark templates as `is_public = true`
- Public templates are visible in all users' template pickers
- Write access to `is_public` is restricted to admins via RLS policy

**Credit Management:**
- Admin sets `credits_allowed` ceiling per user
- Cannot directly adjust `credits_remaining` (calculated from `credits_allowed − credits_used`)
- No direct credit injection or deduction outside of allowance setting [TO BE VERIFIED IN APP — confirm if admin can manually credit/debit]

**Export:**
- Token/credit usage records exportable via `admin-export-token-usage` edge function

**Model enable/disable:** [TO BE VERIFIED IN APP — confirm if admin can enable/disable specific models per user or globally]

**Debug access:** Admin Diagnostics panel provides system health status and role detection status.

---

## 15. Capability Gaps / Verification List

Items marked **[TO BE VERIFIED IN APP]** throughout this document, consolidated for testing:

**Start Hub**
- [ ] Confirm exact entry option labels as shown to users (wizard, form, template)
- [ ] Confirm if "disable Show on Startup" preference persists across sessions
- [ ] Confirm panel open/hidden behavior from Start Hub dispatch

**Quick Prompt Wizard**
- [ ] Confirm exact URL analysis button labels in the UI ("Analyze Context" / "Extract Copy" / "Analyze Deep Crawl")
- [ ] Confirm Deep Crawl page depth/count limits (Firecrawl)
- [ ] Confirm error messages for blocked/paywalled pages during URL analysis
- [ ] Confirm URL analysis timeout duration and fallback behavior
- [ ] Confirm whether Quick Polish can be launched from wizard with URL-extracted copy pre-filled

**CopyMaker**
- [ ] Confirm exact scale of overall score (0–10 or 0–100)
- [ ] Confirm headline generation toggle availability and behavior
- [ ] Confirm prompt evaluation availability and UI trigger
- [ ] Confirm model selector visibility in Standard vs. Advanced mode

**CopySnap**
- [ ] Confirm if input field auto-populates from best result (chaining)
- [ ] Confirm if "Send to CopyMaker" flow exists from CopySnap results
- [ ] Confirm exact error messages for generation failures

**Quick Polish**
- [ ] Confirm maximum input character limit
- [ ] Confirm scoring behavior (does Quick Polish generate scores?)
- [ ] Confirm brand voice support availability
- [ ] Confirm workflow integration (can Quick Polish be part of a saved workflow?)

**Post-Generation Actions**
- [ ] Confirm if user can select the number of variations to generate
- [ ] Confirm blended version naming pattern in output panel
- [ ] Confirm bulk deep analysis UI trigger location

**Workflows**
- [ ] Confirm available workflow permission levels (view / execute / edit)
- [ ] Confirm workflow execution behavior on first-generation vs. re-run

**Models and Credits**
- [ ] Confirm exact UI location of credit balance display for users
- [ ] Confirm if admin can manually credit/debit user accounts directly
- [ ] Confirm if admin can enable/disable specific models per user or globally

**Best Version Analysis**
- [ ] Confirm if narrative rationale is always generated or only on demand

**Purpose Rewrite**
- [ ] Confirm whether Purpose Rewrite is a distinct module or a sub-action within the Improve tab
- [ ] Confirm exact option list for target purpose / section type
- [ ] Confirm maximum input character limit

---

## 16. Change Notes

This file is a capability inventory and **must be updated whenever features or options change.**

- When a new module is added: add a new numbered section
- When a new input field is added to any module: update the relevant field inventory table
- When a behavior changes: update the affected rows and note the change date
- When a [TO BE VERIFIED IN APP] item is confirmed: remove the tag and fill in the confirmed value

**Reference:** Update the Change Log in `05_CopyZap_Change_Log.md` whenever this file changes.

**Source authority:** `01_CopyZap_Operating_Manual_v1.0.md` governs behavior. Where this file and the Operating Manual conflict, the Operating Manual takes precedence until this file is deliberately updated to reflect a confirmed change.

---

*End of CopyZap Feature Capability Map v1.0*
