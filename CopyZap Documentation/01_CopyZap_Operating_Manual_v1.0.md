# CopyZap Operating Manual – v1.0 (Pre-Testing Freeze)

This document is the single source of truth for system behavior.

---

## 0. Document Governance

### 0.1 Purpose

This file is the constitutional system reference for CopyZap. It defines all known behavioral rules, module logic, permission architecture, scoring formulas, token accounting, and guardrails as they exist at the time of this document's creation.

This document overrides help text and UI copy descriptions wherever inconsistencies exist. If the UI says one thing and this document says another, this document governs until this document is deliberately updated.

This document does not describe aspirational or planned features. It describes only behavior that exists in the system at the time of writing. Where behavior is not yet defined or not yet determinable from the source, the placeholder `[TO BE DEFINED]` is used.

### 0.2 Authority and Update Protocol

- No feature change is considered complete without a corresponding update to this document.
- Before implementing any structural change, this document must be read to identify what sections are affected.
- Any modification affecting scoring, token deduction, user roles, comparison logic, or prompt construction must update the relevant section of this document.
- Documentation update is not optional. It is part of the definition of done.
- The sections most likely to require updates are: Section 5 (Scoring Engine), Section 6 (Comparison Engine), Section 7 (Token and Billing), Section 4 (Module Specifications).

### 0.3 Versioning

| Field | Value |
|---|---|
| Manual Version | v1.0 |
| Status | Pre-Testing Freeze |
| Last Updated | 2026-02-24 (amended — Documentation Hardening Update: scoring contracts defined, rubric-based scoring language standardized) |
| App Version | [TO BE FILLED] |

---

## 1. Product Scope Definition

### 1.1 What CopyZap Is

CopyZap is a web-based AI copywriting workflow platform that generates, evaluates, rewrites, and compares marketing-oriented text. It accepts structured user inputs — describing a product, audience, tone, and output format — and returns AI-generated copy along with scoring, scoring breakdowns, and comparison analysis.

The system supports multiple distinct generation flows:

- **Copy Maker**: Primary full-form copy generation from structured inputs.
- **Quick Polish / Purpose Rewrite**: Short-text improvement using intent-based presets.
- **CopySnap**: Three-mode tool (Improve, Answer, Question) for lightweight text manipulation.
- **Comparison Engine**: Side-by-side evaluation of multiple generated versions.
- **Scoring Engine**: Dimensional scoring of generated outputs with weighted formulas.

The system stores sessions, tracks token/credit consumption per operation, and enforces role-based access to admin features.

### 1.2 What CopyZap Is Not

- CopyZap is not a general-purpose chatbot.
- CopyZap is not a document editor or word processor.
- CopyZap is not a publishing platform.
- CopyZap is not a CRM or lead management system.
- CopyZap is not a social media scheduler.
- CopyZap does not index or serve user content publicly.
- CopyZap does not claim to produce legally compliant copy. Compliance review is the user's responsibility.
- CopyZap does not guarantee factual accuracy of generated content.

### 1.3 Core Product Philosophy

The system generates output based on inputs. The quality of output is directly dependent on the quality and completeness of inputs. The scoring and evaluation components are calibrated to provide actionable feedback, not flattering scores.

The system enforces constraints on AI outputs — including trust restrictions, forbidden claim categories, and output structure validation — to minimize generation of legally risky or factually fabricated content.

Scoring is dimensional and use-case weighted. Scores are not absolute quality ratings. They are relative assessments against the type of content being produced.

The system does not fabricate behavior or invent features. Where system logic is missing or undefined, the interface exposes placeholders or disables the relevant control.

### 1.4 Target User (Behavioral Definition)

The target user is a person who:

- Has a product, service, or offer to describe.
- Needs marketing copy generated or improved.
- Can provide structured input about their audience, tone, and goals.
- Wants to evaluate and compare multiple output versions before committing to one.
- Does not require deep technical knowledge to operate the tool.
- May work alone or manage copy for multiple clients.
- May operate in English or Spanish (other languages not guaranteed).

---

## 2. System Architecture Overview (Behavioral)

### 2.1 Core Modules

| Module | Role |
|---|---|
| Copy Maker | Primary copy generation from structured form |
| Quick Polish | Short-text intent-based rewrite |
| CopySnap | Lightweight improve / answer / question tool |
| Scoring Engine | Dimensional scoring of generated outputs |
| Comparison Engine | Side-by-side evaluation of output versions |
| Token Tracking | Records credit consumption per operation |
| Session System | Groups operations and outputs under a session ID |
| Admin Panel | Elevated controls for user management and diagnostics |
| Help System | Static and search-indexed documentation |
| Dashboard | View and manage saved outputs, sessions |

### 2.2 Data Flow (High-Level)

1. User provides structured input through form UI.
2. Form state is validated (placeholder detection, required field checks).
3. A session ID is retrieved or created before generation begins. Generation aborts if session ID is absent.
4. Form state is converted into a system prompt and user prompt.
5. The prompt is sent to an AI model via the edge function layer.
6. The edge function returns raw text or structured JSON.
7. The frontend validates the output structure (light validation with repair retry on failure).
8. Token usage is extracted from the API response and recorded (mandatory).
9. Scoring runs after generation completes (not during).
10. Comparison runs after at least two scored versions exist (or is triggered manually).
11. All outputs are associated with the active session ID and stored.

### 2.3 When Scoring Runs

- Scoring does not run automatically during generation.
- Scoring is triggered after generation completes, either automatically (if configured) or by user action.
- Incremental comparison updates scoring when a new version is added to a comparison set.
- Scoring can also be re-triggered manually per version.

### 2.4 When Comparison Recalculates

- Comparison recalculates when a new version is added to the comparison set.
- Comparison recalculates if the user explicitly re-runs a comparison.
- Comparison does not recalculate automatically when the user edits text unless a re-run is explicitly triggered.

### 2.5 When Tokens Are Deducted

- Token deduction records are written after the AI API call completes and usage data is extracted from the response.
- Deduction is not pre-authorized; it is post-hoc recording.
- Failed operations that produced no token usage do not record a deduction.
- Retry attempts that consume tokens each record their own deduction.
- Token tracking failures are queued locally and retried up to 5 times at 1-minute intervals before being discarded.

### 2.6 Version Lifecycle

1. User generates copy → Version 1 created.
2. User generates again (same session or modified inputs) → Version 2 created.
3. Versions can be compared.
4. A version can be marked as the baseline.
5. Blended versions (mixing elements from two versions) are created by user action and treated as a new version.
6. Modified versions (user-edited post-generation) are tracked as distinct from the AI-generated original.

### 2.7 Storage Logic (High-Level)

- Session data and outputs are stored in the Supabase database.
- Token tracking records are stored in the `tokens_used` table.
- Credits balance is tracked in the `pmc_users` table or equivalent.
- Sessions are associated with user IDs and scope keys.
- Orphaned sessions (empty or expired) are subject to cleanup via scheduled database function.

---

## 3. User Roles and Permission Architecture

### 3.1 Role Definitions

**Standard User**

A standard user can:
- Generate copy using Copy Maker, Quick Polish, and CopySnap.
- View, manage, and delete their own saved outputs.
- Create and manage their own brand voices.
- Create and manage their own templates (private).
- Create and manage their own workflows.
- View their own credit balance and session history.
- Access the Help Center.
- Access the Dashboard for their own data.

A standard user cannot:
- Access the Admin Panel.
- View other users' outputs, sessions, or data.
- Modify system-level templates marked as public.
- Adjust any user's credit balance.
- Trigger admin diagnostics.
- View aggregate token usage across all users.

**Admin User**

An admin user retains all standard user capabilities and additionally can:
- Access the Admin Panel.
- Create, edit, and delete user accounts.
- View all users' credit balances and usage summaries.
- Adjust individual user credit allocations.
- Manage public templates (create, edit, mark public/private).
- Access admin diagnostics.
- Export token usage data.
- View aggregate token statistics.
- Access beta registration counts.
- Manage special instructions presets.
- Manage customer prefills.

### 3.2 Admin-Only Feature Registry

**User Management**

| Field | Detail |
|---|---|
| Purpose | Create, edit, disable, and delete user accounts |
| Admin Can | Create users, set passwords, set credit limits, disable accounts, delete accounts |
| Admin Cannot | [TO BE DEFINED — whether admins can impersonate users] |
| Side Effects | Creating a user triggers a welcome email edge function |
| Logging | [TO BE DEFINED] |
| Token Impact | None on admin account; credit allocation changes affect target user |
| Security Dependency | Admin status verified via `useIsAdmin` hook and AdminRoute wrapper |

**Credit Adjustment**

| Field | Detail |
|---|---|
| Purpose | Set or modify per-user credit limits |
| Admin Can | Set `creditsAllowed` value for any user |
| Admin Cannot | [TO BE DEFINED] |
| Side Effects | Immediately affects user's available credit on next balance check |
| Logging | [TO BE DEFINED] |
| Token Impact | Indirect (changes ceiling, not deductions) |
| Security Dependency | RLS policies restrict writes to admin role |

**Public Template Management**

| Field | Detail |
|---|---|
| Purpose | Create and publish templates visible to all users |
| Admin Can | Mark templates as `is_public = true`, edit public templates |
| Admin Cannot | [TO BE DEFINED] |
| Side Effects | Public templates become visible in all users' template pickers |
| Logging | [TO BE DEFINED] |
| Token Impact | None |
| Security Dependency | RLS policy restricts `is_public` field writes to admin only (migration: `20251207193400_fix_is_public_admin_only.sql`) |

**Token Usage Export**

| Field | Detail |
|---|---|
| Purpose | Export raw or aggregated token usage data |
| Admin Can | Trigger CSV/data export of token records |
| Admin Cannot | [TO BE DEFINED] |
| Side Effects | None |
| Logging | [TO BE DEFINED] |
| Token Impact | None |
| Security Dependency | Edge function: `admin-export-token-usage` |

**Admin Diagnostics**

| Field | Detail |
|---|---|
| Purpose | View system health, role detection status, configuration checks |
| Admin Can | View diagnostic output |
| Admin Cannot | Modify system configuration via diagnostics UI |
| Side Effects | None |
| Logging | [TO BE DEFINED] |
| Token Impact | None |
| Security Dependency | Admin role check required before rendering component |

### 3.3 Permission Matrix

| Capability | Standard User | Admin |
|---|---|---|
| Generate copy (Copy Maker) | Yes | Yes |
| Generate copy (Quick Polish) | Yes | Yes |
| Generate copy (CopySnap) | Yes | Yes |
| View own outputs | Yes | Yes |
| Delete own outputs | Yes | Yes |
| Create private brand voices | Yes | Yes |
| Create private templates | Yes | Yes |
| Create private workflows | Yes | Yes |
| View own credit balance | Yes | Yes |
| View own session history | Yes | Yes |
| Access Help Center | Yes | Yes |
| Access Admin Panel | No | Yes |
| View all users' data | No | Yes |
| Adjust user credit limits | No | Yes |
| Create/edit public templates | No | Yes |
| Export token usage | No | Yes |
| View admin diagnostics | No | Yes |
| Delete any user account | No | Yes |
| View beta registration count | No | Yes |
| Manage global special instructions | No | Yes |

### 3.4 Security and RLS Dependencies

**Role Detection Mechanism**

Admin status is determined by the `useIsAdmin` hook, which calls `getIsAdmin(user)` from the admin service. The result is cached per auth session and reset on auth state change. The `AdminRoute` component wraps admin-only pages and redirects non-admins to `/copy-maker` (or a configured `fallbackPath`) if they attempt to access an admin route.

**Row Level Security**

All tables in the Supabase database have RLS enabled. Policies are defined per operation type (SELECT, INSERT, UPDATE, DELETE). Standard users can only access rows they own (enforced via `auth.uid() = user_id` conditions). Admin-level access is gated through RLS policies that reference the `app_admins` table (introduced in migration `20260210163509_add_app_admins_allowlist.sql`).

**Logging Enforcement**

[TO BE DEFINED — whether admin actions produce an audit trail]

---

## 4. Core Module Specifications

---

### 4.1 Copy Maker

**Purpose**

The primary copy generation module. Accepts a structured multi-field form and returns AI-generated marketing copy, optionally with structured output sections, SEO metadata, GEO scoring, and alternative variants.

**Entry Point**

`generateCopy(formState, currentUser, sessionId, progressCallback)` in `src/services/api/copyGeneration.ts`

**Required Inputs**

- `sessionId`: Must be present. Generation aborts if absent.
- `currentUser`: Required for token tracking and session association.
- `formState`: Must contain sufficient content to construct a prompt. Minimum required fields are not hard-coded beyond placeholder detection.

**Optional Inputs**

- Brand voice selection (loads voice profile and injects into system prompt)
- Target word count
- Output structure (sections with titles and word count distribution)
- SEO metadata generation flag
- GEO scoring flag
- Special instructions
- Language or style constraints
- Customer profile
- Competitor copy (for contrast guidance)
- Template selection (pre-fills form state)
- AI engine mode: `enhanced` (multi-stage pipeline) or legacy (single-stage)

**Prompt Construction Logic**

- System prompt and user prompt are constructed from form state fields.
- If a brand voice is selected, voice characteristics are injected into the system prompt.
- If output structure is defined, word count targets are distributed across sections automatically.
- Conditional blocks are added based on presence of: competitor copy, special instructions, GEO regions, SEO keywords.
- Temperature: `0.5` for content ≤150 words target; `0.7` for longer content.
- Max tokens: `4000` (hardcoded in edge function).

**Model Selection Logic**

- User selects primary model from available options (GPT-4o, Claude, DeepSeek, Gemini).
- If `aiEngineMode === 'enhanced'`, routes to Enhanced Pipeline in `src/utils/ai-pipeline/enhancedPipeline.ts`.
- Otherwise routes to Legacy Pipeline.
- Model-specific temperature settings applied via `getEnhancedModelSettings(model)`:
  - GPT models: temperature 0.45, top_p 0.9
  - Claude models: temperature 0.3, top_p 1.0
  - Gemini models: temperature 0.5
  - DeepSeek models: temperature 0.65

**Persona Handling**

Brand voice profiles are loaded and injected into system prompt when selected. Voice characteristics include writing style, tone, and persona descriptors.

**Word Count Enforcement**

- Target word count is calculated from form state via `calculateTargetWordCount(formState)`.
- If output structure sections are defined, word counts are auto-distributed proportionally.
- A strict word count enforcement option is available in some prompt configurations. Retry is triggered if output deviates significantly.

**Retry Logic**

- On output validation failure, a repair prompt is sent automatically (one retry).
- If repair fails, user is shown warning with options: view raw output or regenerate.

**Token Deduction Rules**

- Token usage is extracted from API response after generation completes.
- Token breakdown tracked: `inputTokens`, `outputTokens`, `reasoningTokens` (for applicable models).
- All token records include: user ID, model, operation type (`generate_copy`), session ID, retry count.
- Token tracking failures are queued and retried up to 5 times.

**Output Structure**

Returns one of:
- Plain string (unstructured copy)
- Structured object with `sections[]` array, each section containing `title` and `content`

Optional output fields:
- `alternatives[]`: Additional copy variants
- `seoMetadata`: Title, description, keywords
- `headlineIdeas[]`: Alternate headline suggestions

**Scoring Trigger Rules**

Scoring does not run automatically inline with generation. It is triggered as a separate step post-generation.

**Comparison Trigger Rules**

Comparison requires at least two versions. It is triggered manually by user action or automatically when a second version exists in a session.

**Edge Cases**

- If session ID is missing, generation aborts with an error before any API call is made.
- If brand voice load fails, generation proceeds without voice injection (silent degradation).
- If output validation fails after retry, raw output is preserved and shown to user with warning.

**Known Limitations**

- Max tokens is hardcoded to 4000. Very long structured outputs may be truncated.
- Word count adherence is instructional to the model, not mechanically enforced post-generation.
- Structured output section parsing can fail on malformed model responses.

---

### 4.2 Purpose Rewrite (Quick Polish)

**Purpose**

A short-text rewriting module that uses intent-based presets to clean, restructure, or rephrase existing copy without adding invented claims. Designed for single-paragraph or short-block text.

**Entry Point**

`src/features/quickPolish/quickPolishService.ts`

**Required Inputs**

- Input text (short-form copy to be rewritten)
- Intent preset selection

**Optional Inputs**

- Special instructions (can only constrain polishing, not redirect the task)
- Language override (defaults to detected input language)
- Number of variants to generate

**Intent Presets and Their Output Targets**

| Intent | Output Length |
|---|---|
| `hero_branding` | Concise |
| `section_body` | Moderate |
| `about` | Moderate |
| `product_desc_short` | Compact |
| `cta` | Very short |
| `seo_snippet` | Short |
| `email_intro` | Short-moderate |
| `instagram_caption` | Short |
| `ad_short` | Very compact |
| `value_prop` | Compact |
| `problem_pain` | Sharp |

**Prompt Construction Logic**

- System prompt is constructed from the intent preset rules.
- Input language is detected (Spanish/English pattern matching) and the output language is locked to match.
- Special instructions are appended as constraints only.

**Model Selection Logic**

Model is hardcoded to `claude-sonnet-4-5` for all Quick Polish operations.

**Persona Handling**

[TO BE DEFINED — whether brand voice can be applied in Quick Polish]

**Word Count Enforcement**

Word count targets are defined by intent preset (not user-configurable in this module). They are instructional to the model.

**Retry Logic**

[TO BE DEFINED]

**Token Deduction Rules**

[TO BE DEFINED — Quick Polish token operation type and tracking behavior]

**Output Structure**

Returns N distinct text variants. Each variant expresses the same meaning with different wording.

**Trust and Claim Guardrails**

Global Trust Rule: The model is instructed to NOT add new marketing claims, promises, or CTAs unless the intent explicitly permits it.

Forbidden additions in ALL intents:
- "best", "#1", "guaranteed", "proven", "world-class", "unmatched", "industry-leading"
- "Buy now", "Sign up today", "Limited time", "Don't miss out"

Intents that PERMIT persuasive language (not invented benefits):
- `cta`, `ad_short`, `product_desc_short`, `instagram_caption`

Intents with STRICT mode (no CTAs, no persuasive additions):
- `hero_branding`, `section_body`, `about`, `email_intro`, `seo_snippet`, `value_prop`, `problem_pain`

**HTML Preservation**

If input contains HTML tags, output preserves all HTML structure and tags.

**Scoring Trigger Rules**

Quick Polish outputs do NOT automatically receive scoring. They may be manually scored only if explicitly added to the comparison engine via user action.

**Comparison Trigger Rules**

[TO BE DEFINED — whether Quick Polish variants can be compared via Comparison Engine]

**Edge Cases**

- Special instructions that attempt to redirect the task (e.g., "Write a blog post") are ignored; intent governs.
- If input language cannot be detected, default behavior is [TO BE DEFINED].

**Known Limitations**

- Language detection is pattern-based (Spanish/English only reliably supported).
- HTML preservation is instructional to the model. Complex or nested HTML may not be preserved perfectly.

---

### 4.3 CopySnap

**Purpose**

A three-mode lightweight text tool. Mode 1 (Improve) rewrites existing text with specific goals. Mode 2 (Answer) generates social media replies to a given post. Mode 3 (Question) generates questions based on given text.

**Entry Point**

`src/components/CopySnap.tsx`

**Required Inputs**

- Input text (max 2000 characters)
- Mode selection (Improve / Answer / Question)
- Mode-specific configuration (see below)

**Optional Inputs**

- Special instructions

**IMPROVE Mode Inputs**

- Goal: `clearer`, `persuasive`, `shorter`, `punchier`
- Platform: `general`, `x`, `linkedin`, `email`
- Length: `short` (20–40% reduction), `same` (±10%), `longer` (20–40% increase)

**ANSWER Mode Inputs**

- Reply style: `helpful`, `friendly`, `confident`, `witty`, `direct`
- Stance: `neutral`, `agree`, `disagree`
- Length: `short` (1–2 sentences), `medium` (2–4 sentences), `long` (4–6 sentences)

**QUESTION Mode Inputs**

[TO BE DEFINED — specific controls for Question mode beyond input text]

**Prompt Construction Logic — IMPROVE Mode**

Priority resolution order: Platform > Length > Goals (when conflicts exist)

Category detection classifies input as one of: `tech-product`, `business-marketing`, `founder-update`, `linkedin-insight`, `email`, `general`

Category-specific CTAs are used instead of generic phrases like "Reply if...". Generic phrases are explicitly forbidden.

Quality rules:
- Minimum meaning check: Output must contain a subject and a concrete benefit.
- Short mode: Must preserve core action AND primary benefit from the original.
- Longer mode: Maximum one extra sentence. Must add clarity or implication, not filler.
- Semantic overlap check: If output is >85% similar to input, a warning is triggered.

**Prompt Construction Logic — ANSWER Mode**

Priority resolution order: Special Instructions > Platform norms > Length > Reply Style > Stance

Critical constraint: ANSWER mode FORBIDS question marks in output unless explicitly allowed via Special Instructions.

Per-length sentence limits:
- Short: maximum 2 sentences, maximum 1 question
- Medium: maximum 4 sentences, maximum 1 question
- Long: maximum 6 sentences, maximum 2 questions

Stance rules:
- `disagree`: Must include a softener (e.g., "In my experience...")
- `agree`: Must add a perspective (not merely "Totally agree")
- `neutral`: Rotates between context, reframe, observation, and question strategies

Emoji rules:
- Allowed only for `friendly` and `witty` styles
- Maximum 1 emoji per output
- For `witty` + `long`: humor permitted only in first sentence

Anti-fluff enforcement for medium and long length:
- Banned phrases include: "builders vs bystanders", "meaningful progress", "take action", "level up"

**Model Selection Logic**

Model is hardcoded to `claude-sonnet-4-5` for CopySnap operations.

**Persona Handling**

[TO BE DEFINED — whether brand voice can be applied in CopySnap]

**Word Count Enforcement**

Sentence count limits are enforced structurally by mode and length selection. Word count is not user-configurable in this module.

**Retry Logic**

[TO BE DEFINED]

**Token Deduction Rules**

[TO BE DEFINED — CopySnap token operation type and tracking behavior]

**Output Structure**

JSON format: `{ best: string, alternatives: [], notes?: [] }`

Formatting rules:
- No markdown in output text
- No headers, bold, or lists in reply text

**Validation Checks (Post-Generation)**

- Output must not be empty
- Minimum 10 characters
- Must end with `.`, `!`, or `?`
- Question count must be within mode limits
- ANSWER mode: zero question marks unless explicitly permitted
- Emoji count must be within limits
- No markdown formatting
- Stance validation (softener for disagree, perspective for agree)
- Semantic overlap with input must be below 70%

**Scoring Trigger Rules**

CopySnap outputs do NOT automatically enter the scoring pipeline. Scoring must be explicitly triggered if the output is imported into a Copy Maker session.

**Comparison Trigger Rules**

[TO BE DEFINED — whether CopySnap alternatives are presented through Comparison Engine]

**Session and Storage**

- CopySnap uses scope key: `copysnap-{userId}`
- Session tracks: input, specialInstructions, mode, output, copySuccess, modelUsed
- Outputs can be saved with a title and description via a save modal

**Edge Cases**

- Input over 2000 characters is rejected at the UI level before submission.
- If output fails validation, [TO BE DEFINED — whether retry is automatic or user-triggered].

**Known Limitations**

- Language detection and enforcement may be incomplete for non-English/non-Spanish inputs.
- Anti-fluff patterns are a defined list; new generic phrases not in the list will not be blocked.

---

### 4.4 Comparison and Scoring Engine

See Section 5 (Scoring Engine Specification) and Section 6 (Comparison Engine Logic) for detailed specifications.

**Purpose**

Evaluates one or more generated outputs dimensionally and produces scores, improvement percentages, and winner determination.

**Entry Point**

Scoring: `src/services/api/comprehensiveScoring.ts`
Comparison: `src/services/api/outputComparison.ts`
Unified (scoring + comparison wrapped): `src/services/api/unifiedComparison.ts`

**Token Deduction Rules**

- Operation types tracked: `comprehensive_scoring`, `output_comparison`, `grok_comparison`, `calculate_geo_score`, `evaluate_prompt`, `evaluate_content_quality`
- Each operation type records separately.

---

### 4.5 Dashboard

**Purpose**

Provides the user a view of their saved sessions, outputs, and activity history. Allows navigation to saved outputs and session-level filtering.

**Entry Point**

`src/components/Dashboard.tsx`

**Required Inputs**

None (loads from authenticated user context).

**Optional Inputs**

[TO BE DEFINED — available filters, sort options]

**Output Structure**

Displays saved sessions and outputs. Allows user to navigate to a saved output and resume or review it.

**Edge Cases**

[TO BE DEFINED]

**Known Limitations**

[TO BE DEFINED]

---

### 4.6 Token System

See Section 7 (Token and Billing Logic) for detailed specification.

**Purpose**

Records credit consumption per AI operation. Enforces credit limits. Provides credit balance to the user interface.

**Entry Point**

`src/services/api/tokenTracking.ts`
`src/hooks/useCreditsBalance.ts`
`src/utils/pricingResolver.ts`

---

### 4.7 Admin Panel

See Section 3 (User Roles and Permission Architecture) for access controls.

**Purpose**

Provides elevated controls: user management, credit management, public template management, usage data export, diagnostics.

**Entry Point**

Protected by `AdminRoute` wrapper. Routes to admin-specific components under `src/components/`.

**Admin Components**

- `ManageUsers.tsx`: User CRUD operations
- `ManageCustomers.tsx`: Customer profile management
- `ManagePrefills.tsx`: Prefill (saved input preset) management
- `ManageSpecialInstructions.tsx`: Global special instructions management
- `AdminDiagnostics.tsx`: System health view
- `UsageAuditPanel.tsx`: Token/credit usage audit

---

### 4.8 Help System Integration

**Purpose**

Provides in-product documentation via a searchable Help Center. Pages are pre-rendered React components, not dynamically fetched markdown.

**Entry Point**

`src/components/help/HelpCenter.tsx`

**Search**

Help search is powered by a pre-built index (`docs/help-index.json`, `docs/search-index.json`). Index is built during the `prebuild` step via `build-search-index.cjs`.

**Structure**

- Help pages are located in `src/components/help/pages/`
- Layout managed by `HelpLayout.tsx` and `HelpSidebar.tsx`
- Feedback collection integrated via `submit-help-feedback` edge function

**Known Limitations**

Help content is static at build time. Updates to help pages require a new build and deploy.

---

### 4.9 Performance Boost

**Purpose**

A per-output action that generates a NEW, first-class output by applying precision optimizations to an existing output. The boosted output participates in all analysis flows identically to any other output — it can become the winner, appear in the Comprehensive Analysis table, receive delta scores, and be included in compare summaries.

**Entry Points**

- Button: "🚀 Performance Boost" — rendered on each output card via `GeneratedCopyCard.tsx`
- Handler: `handlePerformanceBoost(sourceItem)` in `useGeneration.ts`
- API function: `performBoost()` in `src/services/api/performanceBoost.ts`

**Output Data Model**

The boosted output is a standard `GeneratedContentItem` with the following additional fields:

| Field | Type | Description |
|---|---|---|
| `type` | `GeneratedContentItemType.Boosted` | Identifies this as a boosted output |
| `baseName` | `string` | Clean root display name without any transformation prefixes (e.g., "Generated Copy 1") |
| `parentOutputId` | `string` | ID of the output that was boosted |
| `boostIteration` | `number` | 1-based counter per base version (1, 2, …) |
| `boostLevel` | `'lite'` | Boost intensity (reserved for future tiers) |
| `sourceDisplayName` | `string` | Rendered display name: `<baseName> — Boosted 🚀` or `<baseName> — Boosted 🚀 (2)` |

**Naming Normalization**

The `baseName` field stores the clean root name. `sourceDisplayName` renders the full label from metadata, preventing prefix stacking (e.g., "Modified: Modified: Alternative: ...").

**Boost Generation Logic**

1. If `versionScores` cache contains a `VersionScoreResult` for the source output, the boost prompt includes the full dimension breakdown (`subscores`, `weakestDimension`, `weakestReason`).
2. The prompt instructs the model to improve the two lowest-scoring dimensions without changing the offer, positioning, or voice.
3. If no score data is available, the prompt defaults to clarity, specificity, and CTA improvements.
4. Temperature: 0.55 (tighter than modify/alternative to preserve voice fidelity).
5. Operation type: `performance_boost` (tracked in token system).

**Constraints (Non-Negotiables)**

- Preserve audience, offer, and positioning exactly.
- Maintain original tone and style constraints.
- Do NOT add guarantees, invented statistics, or fabricated testimonials.
- Do NOT use fake urgency that was not present in the original.
- Do NOT exaggerate existing claims.

**Safeguards**

| Condition | Behavior |
|---|---|
| 2 boosts already exist for the same base version | Button disabled, tooltip: "Further boosting may reduce authenticity." |
| Source output's `finalScore >= 90` (i.e., ≥ 9.0/10) | Button disabled, tooltip: "This output already scores at or above 9.0." |
| Loading in progress | Button disabled |

Constants controlling safeguards:
- `MAX_BOOST_ITERATIONS = 2` (in `src/types/index.ts`)
- `MAX_BOOST_SCORE_THRESHOLD = 9.0` (in `src/types/index.ts`)

**Analysis Pipeline Integration**

The boosted output is appended to `generatedVersions` using the identical pattern as Alternative and Modified outputs. It therefore:
- Appears in the output cards list
- Is included in Comprehensive Analysis table when comparison is run
- Can become the winner
- Receives `deltaVsBest` and `improvementPct` scores
- Can be further boosted (up to `MAX_BOOST_ITERATIONS` per base version)

---

## 5. Scoring Engine Specification (Freeze Section)

### 5.0 Scoring Framework Clarification

CopyZap uses a rubric-based scoring system.

Individual dimension scores are generated by an AI evaluator following fixed criteria and may vary slightly between runs.

However, weighting formulas, comparison rules, and winner determination logic are fully deterministic. The same version scores always produce the same comparison outcome.

Scoring is designed as a structured decision framework, not an absolute measure of truth.

### 5.1 Scoring Categories

The primary scoring system (`comp-v4`) uses six dimensions:

| Category | Range | Description |
|---|---|---|
| Marketing | 0–100 | Evaluates unique mechanism, hook strength, and urgency ("why now") |
| Clarity | 0–100 | Evaluates structure, hierarchy, and paragraph density |
| SEO | 0–100 | Evaluates keyword usage (conditional; excluded from some use case weights) |
| Emotion | 0–100 | Evaluates resonance, empathy triggers, vivid language, audience connection |
| CTA | 0–100 | Evaluates presence, specificity, and urgency of call-to-action |
| Readability | 0–100 | Evaluates sentence length, run-ons, verbose phrasing |

Secondary scoring systems:

**GEO Score** (Generative Engine Optimization, 100 points total):

| Criterion | Points |
|---|---|
| Direct Answer Clarity | 20 |
| Scannable Structure | 15 |
| Question-Based Headings | 10 |
| Local Relevance / GEO Markers | 20 |
| Quote-Friendly Sentences | 15 |
| Authority Signals | 10 |
| Optional TL;DR / Answer Box | 10 |

**Prompt Evaluation Score** (0–100):

| Criterion | Description |
|---|---|
| Completeness | Whether critical input fields are filled |
| Clarity | Whether provided details are specific and unambiguous |
| Coherence | Whether inputs work together logically |
| Strategic Value | Whether inputs are likely to produce effective copy |
| Actionability | Whether instructions are executable by the model |

**Basic Content Score** (legacy, 0–100):

Dimensions: overall, clarity (text), persuasiveness (text), toneMatch (text), engagement (text), wordCountAccuracy (0–100), suggestions (array).

### 5.2 Weighting Model

Weights are applied per use case. The SEO dimension only contributes weight for `seo_page` use case.

| Use Case | Marketing | Clarity | SEO | Emotion | CTA | Readability |
|---|---|---|---|---|---|---|
| `landing_page` | 0.24 | 0.22 | — | 0.18 | 0.22 | 0.14 |
| `sales_page` | 0.24 | 0.22 | — | 0.18 | 0.22 | 0.14 |
| `email` | 0.20 | 0.22 | — | 0.20 | 0.16 | 0.22 |
| `linkedin` | 0.22 | 0.20 | — | 0.22 | 0.14 | 0.22 |
| `paid_ad` | 0.26 | 0.20 | — | 0.22 | 0.22 | 0.10 |
| `seo_page` | Reduced | Reduced | 0.20 | Reduced | Reduced | Reduced |
| `product_description` | 0.22 | 0.22 | — | 0.14 | 0.14 | 0.28 |
| `general` | 0.22 | 0.22 | — | 0.18 | 0.18 | 0.20 |

Tone modifiers adjust weights dynamically:
- Tone values `funny`, `professional`, `premium`, `aggressive`, `minimalist`, `emotional`, `bold` each modify one or more dimension weights.
- Exact modifier deltas: [TO BE DEFINED — extract from source if needed for freeze precision]
- **Invariant:** Tone modifiers must adjust weights proportionally while preserving the invariant that all dimension weights sum to 1.0. If redistribution occurs, weights are re-normalized after modification.

### 5.3 Overall Score Formula

Overall score = sum of (dimension score × dimension weight) for all applicable dimensions.

For use cases without SEO weighting, SEO dimension is excluded and remaining weights sum to 1.0.

### 5.4 Normalization Rules

- Each dimension is scored on a 0–100 scale.
- Dimension scores are not normalized post-generation; they are generated directly by the AI model following rubric instructions embedded in the scoring prompt.
- The overall score is a weighted sum, which produces a value in the 0–100 range given all weights sum to 1.0.

### 5.5 Rounding Rules

Dimension scores are stored as integers (0–100).

Overall score is calculated as a weighted floating-point value.

Overall score is rounded to one decimal place for display.

Internal comparison logic uses full precision before rounding.

### 5.6 Improvement Percentage Calculation

Improvement percentage is calculated as:

```
((newScore − baselineScore) / baselineScore) × 100
```

Result is rounded to one decimal place.

If baselineScore is 0, improvement percentage is not calculated and displays as "N/A".

### 5.7 Winner Determination Logic

When multiple versions are compared, the winner is determined by:

1. Highest `finalScore` (weighted overall score)
2. Tie-break 1: Highest CTA score
3. Tie-break 2: Highest Clarity score
4. Tie-break 3: Highest Marketing score
5. Tie-break 4: Stable order (first version seen wins)

The comparison result exposes:
- `bestVersionIndex`
- `bestVersionTitle`
- `bestForMarketing` (version ID with highest marketing score)
- `bestForClarity` (version ID with highest clarity score)
- `bestForSimplicity` (version ID with highest readability score)

These fields include anchor link IDs for navigation.

### 5.8 Recalculation Rules

**When user edits copy post-generation:**
Scores are NOT automatically recalculated. User must manually trigger re-scoring.

**When persona / brand voice changes:**
Scores are NOT automatically recalculated. Re-generation or manual re-scoring required.

**When incremental analysis runs:**
Scoring recalculates for the version being added to the comparison set. Existing version scores are preserved from cache unless explicitly invalidated.

### 5.9 Synchronization Rules

- The score displayed in the comparison table must match the score produced by the comprehensive analysis for that version.
- The overall score displayed per-version must match the weighted sum of the dimension scores for that version.
- If table scores are provided to the comparison engine (via `tableScores` parameter), those scores override AI-generated scores in the comparison result.
- Desynchronization between table scores and overall scores is a system integrity violation.

### 5.10 Invariants

The following are non-negotiable system rules for the scoring engine:

1. Weights for a given use case must sum to 1.0 (excluding SEO for non-SEO use cases).
2. No dimension score may exceed 100 or be below 0.
3. The winner determination algorithm must be deterministic (same inputs always produce same winner).
4. Table score must match the comprehensive analysis score for the same version.
5. Overall score must equal the weighted sum of dimension scores within acceptable floating-point precision.
6. Scoring may not run before a session ID is established.
7. Scoring results must be associated with a specific version ID, not a session ID alone.

---

## 6. Comparison Engine Logic

### 6.1 Version Identification Rules

- Each generated output is assigned a version index within the session.
- Versions are identified by title (e.g., "Version 1", "Version 2") and by internal index.
- The comparison result references versions by `versionTitle` and `bestVersionIndex`.

### 6.2 Modified Version Handling

- A version that the user has manually edited after generation is treated as a distinct version from the AI-generated original.
- Modified versions are tracked with a `saved_mode` field (migration: `20260211005722_add_saved_mode_to_outputs.sql`).
- Modified versions participate in comparison with the same logic as AI-generated versions.

### 6.3 Blended Version Handling

- A blended version is created by combining elements from two or more existing versions.
- Blended versions are created by user action and treated as new versions.
- Blended versions are subject to the same scoring and comparison logic as any other version.
- The comparison engine does not treat blended versions differently from generated versions.

### 6.4 Incremental Analysis Logic

- When a new version is added to an existing comparison set, only the new version is scored.
- Existing version scores are retrieved from cache rather than re-scored.
- After the new version is scored, the comparison result is recalculated across all versions including the new one.

### 6.5 Re-run Triggers

- User manually triggers a re-run of comparison.
- A new version is added to the comparison set (triggers incremental update, not full re-run).

### 6.6 Synchronization Enforcement

- The `compareOutputVersions` function accepts a `tableScores` parameter. When provided, these scores are used instead of AI-derived scores.
- The system must not display a comparison winner that contradicts the per-version scores shown in the scoring table.

### 6.7 Grok Comparison Feature

"Grok" is a feature name, not a model name. It uses an opposing model for cross-analysis.

Model selection rule: The comparison model is the opposite of the user's generation model.
- If user generated with DeepSeek → comparison uses GPT-4o
- If user generated with GPT-4o → comparison uses DeepSeek

Analysis types available: `marketing-effectiveness`, `clarity-readability`, `seo-keywords`, `emotional-impact`, `cta-effectiveness`, `comprehensive`, `custom`

Output is converted from JSON to markdown tables for display.

Token operation type: `grok_comparison`

### 6.8 Edge Cases

- If only one version exists, comparison cannot run. The UI must prevent or disable comparison trigger.
- If a version has no score, it is scored before being included in comparison.
- If scoring fails for one version, comparison proceeds without that version or surfaces an error. [TO BE DEFINED — exact behavior]

### 6.9 Per-Version Deep Analysis and Bulk Generation

**Per-Version Deep Analysis:**

After comparison runs, each version card in the "All Versions Breakdown" section exposes a per-version deep analysis. This analysis is generated lazily — it is not produced automatically on comparison completion. The function `ensureVersionDeepAnalysis(versionId)` is called when the user requests analysis for a specific version. Results are cached in a `versionDeepAnalysis` record keyed by `versionId`. If a result already exists in cache, the function is a no-op (no API call, no credit spend).

**Bulk Generation Button:**

A "Generate analysis for all versions" button appears at the top of the "All Versions Breakdown" panel when the panel is visible. Behavior:

- The button is shown only when `onEnsureVersionDeepAnalysis` is wired (standard app mode).
- On click, the system collects all version IDs that do not yet have a cached result. Only those IDs are processed.
- Analysis is generated sequentially per missing version ID by calling `ensureVersionDeepAnalysis` and awaiting each result before proceeding to the next.
- A live progress counter displays: "Generating analysis: X / N" where X is the number of completed analyses and N is the total missing at the time the button was clicked.
- The button is disabled while generation is in progress.
- When all versions have analysis, the button is replaced by an "All analyses generated" badge.
- If a new version is added after bulk generation completes, the button reappears because the new version lacks analysis.

**Credit Spend Rules:**

- No credits are spent on bulk generation unless the user explicitly clicks the button.
- No auto-trigger occurs on panel expansion, scoring completion, or any `useEffect`.
- Versions already in cache are never re-generated regardless of how many times the button is clicked.
- Each per-version analysis call uses the same token tracking path as any other AI operation (`versionDeepAnalysis` operation type).

**Cache Persistence Invariant:**

The `versionDeepAnalysis` cache is an append-only structure during a session. It must not be cleared by any operation other than the explicit "Re-analyze all versions" user action. Specifically, the following operations must preserve all existing `versionDeepAnalysis` entries:

- Scoring a new output and adding it to the comparison table.
- Adding a single version to the comparison via "Add to comparison".
- Scoring new/missing outputs via the "Score new outputs" action.
- Any update to `versionScores`, `comparisonResult`, or `comparisonDeepAnalysisMeta`.

The only permitted full clear of `versionDeepAnalysis` is the explicit bulk re-analysis path (`handleReanalyzeDeepAnalysis` in `useGeneration.ts`), which clears the cache immediately before issuing fresh API calls for every version. In all other state-update paths, `versionDeepAnalysis` must be passed through unchanged using spread (`...prev.copyResult`).

**Rationale:** Any state-update that silently resets `versionDeepAnalysis` causes previously generated (and credit-spent) analyses to disappear from the UI without user action. The cache represents paid results. Discarding it is equivalent to billing the user twice.

**Files affected by this invariant:**
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` — all `setFormState` calls touching `copyResult`
- `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` — "Add to comparison" and "Score new outputs" handlers

---

## 7. Token and Billing Logic

### 7.1 Token Cost Calculation

Cost calculation uses the Phase 3 DB-driven pricing model with graceful fallback to legacy pricing.

Primary path:
1. Call `get_active_model_pricing(p_model_key, p_pricing_tier)` database RPC.
2. Result is cached in-memory with a 5-minute TTL.
3. Fields returned: `input_usd_per_1k`, `output_usd_per_1k`, `reasoning_usd_per_1k` (nullable, for applicable models).

Cost formula (when token breakdown is available):
`cost = (inputTokens / 1000 * input_usd_per_1k) + (outputTokens / 1000 * output_usd_per_1k) + (reasoningTokens / 1000 * reasoning_usd_per_1k)`

Cost formula (when token breakdown is unavailable):
`cost = (totalTokens / 1000) * average_usd_per_1k`

Fallback path (on database failure): Legacy pricing constants are used. Exact legacy values are defined in `src/utils/pricingResolver.ts`.

Special case: Firecrawl URL analysis operations use a fixed cost of `$0.015` regardless of token count.

### 7.2 Model Cost Mapping

Pricing is stored in the `llm_model_pricing` table. Pricing is managed by admin. Current pricing values are not hardcoded in this document as they are admin-configurable.

Models currently in use: `gpt-4o`, `claude-sonnet-4-5`, `deepseek-chat`, and Gemini variants.

### 7.3 Deduction Timing

- Token records are written AFTER the AI API call completes.
- Token usage is extracted from the API response object.
- Deduction is not pre-authorized or reserved before the call.
- Zero-cost operations (e.g., failed calls with no token usage) do not produce a deduction record.

### 7.4 Retry Cost Policy

- Each retry attempt that consumes tokens produces its own separate token record.
- The retry count is stored on the token record (`retryCount` field).
- There is no retry cost discount or waiver. Each attempt is billed at cost.
- Maximum retries: 3 (exponential backoff: 1s, 2s, 4s).

### 7.5 Free Operations

[TO BE DEFINED — whether any operations are explicitly exempt from token tracking]

### 7.6 Admin Token Adjustments

Admins can set `creditsAllowed` per user. This sets the credit ceiling. It does not directly deduct or add credits to a running balance.

[TO BE DEFINED — whether admins can directly adjust `creditsRemaining` or only `creditsAllowed`]

### 7.7 Logging Behavior

- Token tracking function: `trackTokenUsage(user, tokenUsage, model, operationType, sessionId, retryCount?, trackingId?, tokenBreakdown?)`
- Session ID is required. Token records without session IDs are not written (prevents orphaned records).
- Failed tracking attempts are stored in a local queue and retried up to 5 times at 1-minute intervals.
- After 5 failed attempts, the record is discarded.

### 7.8 Failure Behavior

- If token tracking fails after all retries, the operation output is NOT withheld from the user.
- Tracking failure is silent from the user's perspective (no UI error).
- [TO BE DEFINED — whether tracking failures are logged to an error monitoring service]

### 7.9 Credits Balance

- Balance is retrieved via RPC: `get_user_credits_balance(user_id_param)`
- Returns: `creditsAllowed`, `creditsRemaining`
- Balance is refreshed: on component mount, on window focus, every 5 minutes.
- Credit enforcement mode is configurable. When enforcement is active, operations that would exceed the credit limit are blocked before the API call.

---

## 8. Prompt Construction Rules

### 8.1 System Prompt Composition

- System prompt establishes the AI model's role and behavioral constraints.
- Brand voice characteristics are injected into the system prompt when a brand voice is selected.
- The system prompt includes formatting and output structure instructions when structured output is requested.
- Trust and claim guardrails are embedded in the system prompt for applicable modules (Quick Polish, CopySnap Answer mode).

### 8.2 User Prompt Composition

- User prompt is assembled from form state fields.
- Fields are assembled conditionally: fields with empty or undefined values are omitted from the prompt.
- Placeholder detection is run before prompt construction. If placeholders are found, a warning is shown to the user (but generation is not automatically blocked — user confirms).

### 8.3 Conditional Blocks

The following blocks are added only when the corresponding input is present:
- Competitor copy block: Added when `competitorCopyText` is non-empty.
- Special instructions block: Added when `specialInstructions` is non-empty.
- GEO targeting block: Added when `geoRegions` is non-empty.
- SEO keywords block: Added when `keywords` is non-empty.
- Output structure block: Added when `sectionBreakdown` is defined.
- Customer profile block: Added when a customer profile is selected.

### 8.4 Persona Injection Order

When a brand voice is selected:
1. Brand voice characteristics are loaded from storage.
2. Voice descriptors are injected into the system prompt before other content.
3. The user prompt references that the output should adhere to the established voice.

### 8.5 GEO and SEO Enforcement

- GEO scoring is a separate post-generation evaluation. It is not enforced during prompt construction; it is scored after generation.
- SEO keywords, when provided, are injected into the user prompt as target terms the output should incorporate.
- Whether keywords are actually incorporated is subject to model adherence, not mechanical enforcement.

### 8.6 Strict Word Count Enforcement

- When strict word count mode is active, the prompt includes explicit word count instructions.
- After generation, if output word count deviates significantly, a retry with a stricter repair prompt is triggered.
- Exact deviation threshold for retry: [TO BE DEFINED]

### 8.7 Retry Triggers

- Output validation failure (structure check fails) → repair prompt sent.
- Word count deviation beyond threshold (when strict mode) → [TO BE DEFINED].
- Model returns empty or malformed response → [TO BE DEFINED].

---

## 9. Guardrails and Constraints

### 9.1 Proof Constraints

Quick Polish Trust Rule: The AI is instructed not to add any new marketing claims, guarantees, superlatives, or proof statements that were not present in the original input.

Forbidden additions (all intents unless explicitly exempted):
- Absolute qualifiers: "best", "#1", "guaranteed", "proven", "world-class", "unmatched", "industry-leading"
- Urgency CTAs: "Buy now", "Sign up today", "Limited time", "Don't miss out"

This constraint applies to the model instruction only. Post-generation validation does not mechanically scan for these strings.

### 9.2 Trust Logic

[TO BE DEFINED — whether the system applies any post-generation trust validation beyond what is embedded in the prompt]

### 9.3 Risk Wording Logic

[TO BE DEFINED — whether the system detects or flags potentially high-risk language (e.g., health claims, financial promises) in output]

### 9.4 Intent Handling

In Quick Polish and CopySnap, the selected intent or mode governs the operation. Special instructions submitted by the user can constrain the operation but cannot override the intent or redirect the task type.

Example: If intent is `seo_snippet` and special instructions say "write a full blog post," the system produces an SEO snippet with the special instructions applied as constraints (e.g., include a specific keyword), not a blog post.

### 9.5 Compliance Enforcement

CopyZap does not guarantee regulatory compliance. No compliance module exists. Users are responsible for ensuring generated copy meets any applicable advertising, legal, or regulatory requirements in their jurisdiction.

---

## 10. UX Behavioral Rules

### 10.1 Collapsible Sections

[TO BE DEFINED — which form sections are collapsible and what state is preserved on collapse]

### 10.2 Permanent Visibility Rules

[TO BE DEFINED — which UI elements are always visible and cannot be hidden]

### 10.3 Recommendation Logic

After scoring, the system may surface a recommended version based on use case scoring. Recommendation is based on the winner determination logic defined in Section 5.7.

[TO BE DEFINED — whether recommendations appear inline, in a modal, or in a dedicated section]

### 10.4 Auto-Refresh Triggers

- Credits balance auto-refreshes every 5 minutes, on window focus, and on mount.
- Session data auto-refresh: [TO BE DEFINED]
- Comparison results auto-refresh: Only when explicitly triggered or when a new version is added.

### 10.5 Debug Visibility Restrictions

Debug information (prompt contents, raw API responses, token breakdown) is restricted to admin users or to a debug mode that is not exposed in the standard production UI.

Debug panels: `DebugInfoModal` in `src/components/results/DebugInfoModal.tsx` — access conditions: [TO BE DEFINED]

### 10.6 Error States

- Generation failure: User sees an error message with option to retry.
- Validation failure after repair: User sees warning with option to view raw output or regenerate.
- Token limit exceeded (when enforcement is active): User sees `TokenLimitModal`.
- Session ID missing: Generation is aborted with an error before any API call.
- Model validation failure: `AiModelValidationModal` is shown.

### 10.7 Loading States

`ProcessingModal` is used during generation to indicate processing state. Progress callbacks are used to update loading state incrementally where supported.

---

## 11. System Integrity Safeguards

The following are system-level invariants. Violations of these invariants represent defects.

1. **Scoring consistency**: The score displayed in the comparison table must equal the comprehensive analysis score for that version. Displaying different scores for the same version in different UI locations is a defect.

2. **Token deduction timing**: Token records are written after API call completion. Pre-deduction or post-failure deduction for zero-usage calls is a defect.

3. **Comparison synchronization**: The declared winner in comparison output must be consistent with the highest-weighted-score version. A declared winner with a lower overall score than another version is a defect.

4. **Retry enforcement**: Automatic retry on validation failure must execute before surfacing error to user. Surfacing error before first retry attempt is a defect.

5. **Session ID enforcement**: No token tracking record may be written without a session ID. Orphaned token records are a data integrity defect.

6. **Logging enforcement**: All token-consuming operations must produce a tracking record. Silent consumption without a record is a defect.

7. **Weight sum invariant**: Scoring dimension weights for any use case must sum to 1.0. Weights summing to a value other than 1.0 produce incorrect overall scores and are a defect.

8. **Winner determination determinism**: Given identical version scores, the winner determination algorithm must produce the same result on every execution. Non-deterministic winner selection is a defect.

9. **RLS enforcement**: No user may read or write another user's rows via direct table access. RLS policy gaps are security defects.

10. **Admin access gate**: Admin-only routes must redirect non-admin users before rendering admin content. Rendering admin content to non-admin users is a security defect.

---

## 12. Known Limitations

### 12.1 Beta Features

[TO BE DEFINED — which features are currently in beta status]

### 12.2 Performance Constraints

- Help search is index-based and built at compile time. It does not reflect content changes until a new build is deployed.
- Scoring is AI-model-driven. Scoring latency depends on model response time.
- Token tracking retry queue is in-memory. Failures are lost on page refresh after 5 attempts.
- Pricing cache TTL is 5 minutes. Pricing changes by admin take up to 5 minutes to propagate to active sessions.

### 12.3 Unsupported Scenarios

- Languages other than English and Spanish are not reliably supported in Quick Polish or CopySnap.
- Structured output parsing may fail for complex, deeply nested output structures from models that do not reliably follow JSON formatting instructions.
- CopyZap does not support real-time collaborative editing. Sessions are per-user.
- Mobile layouts: A `DesktopRequired` component exists, indicating some features explicitly require desktop viewports.

---

## 13. Testing and Validation Rules

### 13.1 Must-Pass Scenarios

- Standard user cannot access any route protected by `AdminRoute`.
- Generation aborts with a clear error if session ID is absent.
- Token record is created after every successful AI API call.
- Token record is NOT created for calls that return zero token usage.
- Comparison winner matches the highest-overall-score version (with tie-break applied correctly).
- Quick Polish output does not contain any of the globally forbidden phrases when a strict-mode intent is selected.
- CopySnap Answer mode output contains zero question marks when `?` is not explicitly permitted.

### 13.2 Scoring Validation Checklist

- [ ] Overall score equals weighted sum of dimension scores for the given use case.
- [ ] Weights for the use case sum to 1.0.
- [ ] No dimension score is outside the 0–100 range.
- [ ] Winner determination is consistent with scores displayed in the table.
- [ ] Improvement percentage is calculated correctly relative to the baseline version.
- [ ] Tone modifier weight adjustments produce a weight set that still sums to 1.0.

### 13.3 Token Validation Checklist

- [ ] Every token record contains a non-null session ID.
- [ ] Every token record contains a non-null user ID.
- [ ] Every token record contains a valid operation type string.
- [ ] Cost calculation matches the formula for the model's pricing record.
- [ ] Retry records are distinct from original attempt records.
- [ ] Credit balance decrements correctly after each operation.
- [ ] Credit enforcement blocks generation when balance is at zero (when enforcement is active).

### 13.4 Comparison Synchronization Checklist

- [ ] Scores displayed in comparison table match scores from comprehensive analysis for the same version.
- [ ] Adding a new version triggers incremental scoring for the new version only.
- [ ] Cached scores for existing versions are not altered when a new version is added.
- [ ] Winner determination output matches highest scoring version.

---

## 14. Future Extension Protocol

Any extension to the following areas requires updating the corresponding section of this document before the change is considered complete.

| Area | Section to Update |
|---|---|
| New scoring dimension | Section 5.1, 5.2, 5.3, 5.7 |
| New use case weight profile | Section 5.2 |
| New token operation type | Section 7, Section 4 (relevant module) |
| New AI model | Section 4.1 (model selection), Section 7.2 |
| New user role or permission | Section 3 |
| New admin feature | Section 3.2, 3.3 |
| New CopySnap mode | Section 4.3 |
| New Quick Polish intent | Section 4.2 |
| New guardrail or constraint | Section 9 |
| New UX behavioral rule | Section 10 |
| Change to comparison engine logic | Section 6 |
| Change to prompt construction | Section 8 |
| New module added to the product | Section 4 (new subsection), Section 2 |

---

## 15. Deprecated Features Registry

| Feature | Status | Deprecated In | Notes |
|---|---|---|---|
| `tokens_used` (original table) | Removed | Migration 20251127185942 | Replaced by updated schema |
| Legacy token tracking system | Removed | Migration 20260120000001 | Phase 4b2 removal |
| `pmc_session_token_summary` (old view) | Replaced | Migration 20260120181832 | Updated to credits-only view |
| `pgjwt` extension | Removed | Migration 20251223221412 | Deprecated extension removed |
| Intent system (8 core intents) | Removed | Migration 20260206184136 | Entire intent system removed |
| Workflow auto-public trigger | Removed | Migration 20260103171243 | Manual control required |

---

## 16. Change Log

| Date | Version | Section Updated | Description | Author |
|---|---|---|---|---|
| 2026-02-19 | v1.0 | All | Initial document creation from source code analysis | [TO BE FILLED] |

---

*End of CopyZap Operating Manual v1.0*
