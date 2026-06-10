# CopyZap – Help System Specification & Coverage Audit

**Document Version:** 1.0
**Status:** Pre-Testing Freeze Audit
**Last Updated:** 2026-02-24
**Source Authority:** `01_CopyZap_Operating_Manual_v1.0.md`
**Secondary Source:** Live inspection of `src/components/help/pages/`

This document defines:
- Current help implementation
- Help coverage mapping per module
- Missing documentation
- Alignment with the Operating Manual
- Help system governance rules

**Authority Rule:** Where help content contradicts the Operating Manual, the Operating Manual governs. This document flags all known contradictions.

---

## 1. Purpose of This Document

This file governs the CopyZap help system. It serves four functions:

**1. Audit**
Maps all confirmed system behaviors (from the Operating Manual) to existing help content. Identifies what is covered, what is partial, and what is missing.

**2. Governance**
Establishes the rules that determine what help content says, who is responsible for updating it, and when an update is mandatory.

**3. Development Plan**
Identifies gaps that must be addressed before v1.0 testing and gaps that can be deferred to a later release.

**4. Drift Prevention**
As the system evolves, this document tracks which help sections are at risk of becoming outdated and flags areas where future changes require corresponding help updates.

This document does not invent help pages that do not exist. All coverage assessments are based on confirmed help page content. Where status is unknown, the placeholder `[AUDIT REQUIRED]` is used.

---

## 2. Help System Governance Rules

### 2.1 Source of Truth

The Operating Manual (`01_CopyZap_Operating_Manual_v1.0.md`) is the single source of behavioral truth for all help content.

Rules derived from this principle:

- Help content that describes system behavior must match the Operating Manual exactly.
- If help content says scoring "runs automatically after generation," but the Operating Manual says scoring does NOT run automatically, the help content is incorrect and must be updated.
- If the Operating Manual marks a behavior as `[TO BE DEFINED]`, the corresponding help section must either omit the topic or mark it as `[TO BE UPDATED]`. Help must not fabricate defined behavior for undefined system states.
- If an edge case is documented in the Operating Manual (e.g., "if session ID is missing, generation aborts"), the help system must either explain this edge case or leave it out. It must not describe incorrect behavior for that edge case.

### 2.2 Update Protocol

The following rules govern when help content must be updated:

| Trigger | Required Action |
|---|---|
| A feature behavior changes | Corresponding help entry must be updated before the feature is considered deployed |
| A new module is added | A new help section must be authored for that module |
| A scoring dimension is added or changed | Section 4.4 help entries must be updated |
| Token tracking behavior changes | Credits & Billing help must be updated |
| A model is added or removed | Model Selection help must be updated |
| An admin capability is added or changed | Admin help must be updated; standard user help must be verified for inadvertent exposure |
| A guardrail or constraint is added to a module | The corresponding module help must reflect the constraint |
| A feature is deprecated | Corresponding help content must be marked outdated or removed |

A feature deployment is not complete until the corresponding help has been validated against this document.

### 2.3 Help Content Boundaries

The following rules define what help content is permitted to contain:

**Help explains usage, not internal formulas.**
Help may explain that scoring uses multiple dimensions and that a use-case weighting system exists. Help must not expose the exact weight values per dimension per use case (e.g., "CTA has weight 0.22 for landing pages").

**Help does not expose internal prompt structure.**
Help must not reveal the contents of system prompts, the specific guardrail phrases instructed to the model, or the structure of the prompt construction pipeline. It may explain at a behavioral level what constraints exist (e.g., "Quick Polish does not add claims not present in your original copy").

**Help must not contradict token logic.**
If the system bills per operation post-completion, help must not state that credits are reserved before an operation begins.

**Help must not describe admin-only features to standard users.**
Credit management, user CRUD operations, public template administration, usage export, and admin diagnostics are admin-only. Help pages describing these features must be clearly marked as admin-only content. They must not appear in the standard user help navigation without clear role labeling.

**Help does not guarantee factual accuracy of AI output.**
Consistent with the Operating Manual's compliance enforcement policy (Section 9.5), help must not claim the system produces legally compliant, factually accurate, or regulation-compliant copy.

---

## 3. Current Help System Architecture

### 3.1 Help Entry Points

Based on confirmed implementation:

| Entry Point | Location | Status |
|---|---|---|
| Help Center main page | `/help` route, rendered via `HelpCenter.tsx` | Confirmed |
| Help sidebar navigation | `HelpSidebar.tsx`, grouped by category | Confirmed |
| Help layout wrapper | `HelpLayout.tsx`, includes top navigation and breadcrumb | Confirmed |
| In-product contextual tooltips | Per-field or per-module tooltips | [AUDIT REQUIRED — extent of coverage not confirmed] |
| Start Hub help reference | Start Hub modal links to Help Center | Confirmed |
| Help search | `HelpSearch.tsx`, powered by pre-built index (`docs/help-index.json`, `docs/search-index.json`) | Confirmed |
| Help feedback collection | `submit-help-feedback` edge function integrated into pages | Confirmed |

**Important architectural constraint (from Operating Manual, Section 4.8):**
Help content is static at build time. Index is built during the `prebuild` step via `build-search-index.cjs`. Updates to help pages require a new build and deploy. This means help cannot be updated independently of a product release.

### 3.2 Help Structure

**Navigation Organization (confirmed from `HelpSidebar.tsx`):**

| Group | Pages Included |
|---|---|
| Getting Started | Getting Started, Start Hub |
| Core Features | Copy Maker, Quick Prompt Wizard, Smart vs Expert Mode, Brand Voice System, Templates & Reuse, Voice Styles & Blending, Generated Output, Optional Features, Best Practices |
| Advanced | Dashboard & History, Export & File Management, Credits & Billing, Workflow Builder, Feature Interactions [AUDIT REQUIRED] |
| Tutorials | Quick tutorials index, workflow tutorials |
| Reference | Glossary, Recommended Settings [AUDIT REQUIRED] |
| Support | Troubleshooting FAQs, Contact |

**Page structure:**
- Page-based, not single-page accordion
- Some pages use `HelpPageTemplate` component for standardized layout
- Collapsible sidebar groups on desktop
- Mobile drawer sidebar
- Sticky breadcrumb at page bottom
- Fixed navigation header

**Search functionality:**
- Search is pre-indexed at build time
- Keyword search against indexed page content
- Does not support real-time or dynamic content search
- Index must be rebuilt on help content changes

---

## 4. Help Coverage Mapping by Module

---

### 4.1 Copy Maker

**4.1.1 Feature Summary (from Operating Manual)**
Primary copy generation module. Accepts a structured multi-field form. Supports brand voice injection, target word count, output structure sections, SEO metadata, GEO scoring, special instructions, customer profiles, competitor copy, template selection, and multi-model selection. Two pipeline modes: enhanced and legacy. Output validated after generation; automatic repair retry on structure failure. Session ID required before generation begins.

**4.1.2 Existing Help Entries**
- `GettingStarted.tsx`: Step-by-step first generation guide; required vs. optional field descriptions
- `ProjectSetup.tsx`: Essential inputs, tone, word count, language settings
- `SmartVsExpertMode.tsx`: Mode switching, field visibility
- `OutputFeatures.tsx`: Output components, post-generation actions
- `OptionalFeatures.tsx`: SEO, GEO, Brand Voice, Voice Styles, Output Structure
- `BestPractices.tsx`: Input quality guidance, common pitfalls
- `CoreWorkflows.tsx`: End-to-end workflow examples referencing Copy Maker
- `CopyMakerIndex.tsx`: [AUDIT REQUIRED — content not fully confirmed]

**4.1.3 Coverage Status**
PARTIAL COVERAGE

**4.1.4 Missing Topics**
- Session ID requirement — help does not explain that generation aborts if session ID is missing. Users who encounter this error have no help context for it.
- Competitor copy input — OptionalFeatures page may reference this; confirm whether behavioral detail is explained [AUDIT REQUIRED]
- Enhanced vs. Legacy pipeline modes — no confirmed help entry explaining the AI engine mode toggle or what "enhanced" means behaviorally
- Automatic repair retry — not mentioned in any confirmed help page. Users who see a "raw output" warning have no help context
- Temperature and model-specific behavior — help does not need to expose temperature values, but should explain that model selection affects output style
- Output structure word count auto-distribution — the behavior that distributes word counts proportionally across sections is not confirmed as documented in help
- Placeholder detection warning — the behavior that warns users about unfilled placeholders before generation [AUDIT REQUIRED]

**4.1.5 Risk of User Confusion**
- Users who encounter a session ID error will have no help context and may assume a bug.
- Users who see the "raw output" warning after a repair failure will not understand what happened or what to do.
- Users switching between Enhanced and Legacy mode will not understand the behavioral difference.

---

### 4.2 Purpose Rewrite (Quick Polish)

**4.2.1 Feature Summary (from Operating Manual)**
Short-text rewriting module using intent-based presets. Eleven intent presets with defined output targets. Strict claim guardrails — forbidden additions include superlatives and urgency CTAs. Input language is auto-detected (English/Spanish) and output language is locked to match. HTML preservation is attempted. Special instructions can constrain but not override intent.

**4.2.2 Existing Help Entries**
- No dedicated Quick Polish or Purpose Rewrite help page confirmed in the current page inventory.
- Quick Polish is referenced in `CoreWorkflows.tsx` under "Improve Existing Copy" but behavioral detail is limited.

**4.2.3 Coverage Status**
MISSING — No dedicated help page for this module.

**4.2.4 Missing Topics**
- All eleven intent presets and their behavioral differences
- Claim guardrails: what the system will and will not add to polished copy
- Distinction between strict-mode intents (no CTAs, no persuasive additions) and permissive intents
- Language detection behavior and what happens when language cannot be detected
- Special instructions scope: what they can and cannot do in this module
- HTML preservation: behavioral explanation and known limitations
- Word count behavior: intent-driven, not user-configurable in this module

**4.2.5 Risk of User Confusion**
- Users expecting Quick Polish to add new selling points will be confused when the output contains no new claims — they will not understand that this is intentional guardrail behavior, not a model failure.
- Users who submit special instructions like "write a full blog post" will receive a short polished snippet and will not understand why the instruction was ignored.
- Agencies deploying Quick Polish for client copy need to understand the claim guardrails to trust the output.

---

### 4.3 CopySnap

**4.3.1 Feature Summary (from Operating Manual)**
Three-mode lightweight tool: IMPROVE, ANSWER, QUESTION. IMPROVE mode accepts goal, platform, and length. ANSWER mode generates social replies with stance, style, length, and emoji controls — with a hard constraint against question marks in output. QUESTION mode defined. Input capped at 2000 characters. Output validated post-generation: sentence count, emoji count, stance adherence, semantic overlap, markdown prohibition. Sessions use scope key `copysnap-{userId}`.

**4.3.2 Existing Help Entries**
- No dedicated CopySnap help page confirmed in the current page inventory.
- CopySnap is not confirmed as covered in `CoreWorkflows.tsx`, `OutputFeatures.tsx`, or `OptionalFeatures.tsx`.

**4.3.3 Coverage Status**
MISSING — No confirmed dedicated help page for CopySnap.

**4.3.4 Missing Topics**
- CopySnap module overview and when to use each mode
- IMPROVE mode: goal, platform, and length options; what each goal does
- ANSWER mode: stance options, style options, the no-question-mark constraint, emoji rules, anti-fluff enforcement
- QUESTION mode: full definition [TO BE UPDATED — behavior marked TO BE DEFINED in Operating Manual]
- 2000-character input limit
- Output validation behavior and what triggers a failed output
- Saving CopySnap outputs with title and description
- CopySnap session behavior (separate scope from Copy Maker)

**4.3.5 Risk of User Confusion**
- ANSWER mode's prohibition of question marks is a non-obvious constraint. Users who expect the tool to generate questions as replies will be confused by the output style.
- The anti-fluff phrase list (banned: "builders vs bystanders", "meaningful progress", etc.) will produce outputs that feel unusual to users who expect these common phrases.
- Users who hit the 2000-character input limit will need clear guidance that this is a designed constraint, not a technical error.

---

### 4.4 Comparison and Scoring Engine

**4.4.1 Feature Summary (from Operating Manual)**
Six-dimension scoring: Marketing (0–100), Clarity (0–100), SEO (0–100), Emotion (0–100), CTA (0–100), Readability (0–100). Weights are use-case-specific across eight profiles. Overall score = weighted sum of applicable dimensions. Winner determination: highest overall score, with four defined tie-break levels. Improvement percentage calculated against baseline. Incremental comparison: new version scored without re-scoring existing versions. Scores NOT automatically recalculated when user edits copy or changes brand voice. Grok comparison uses opposing model.

**4.4.2 Existing Help Entries**
- `CompareBlend.tsx`: Compare feature (side-by-side), Blend feature, Content Scoring section. Describes scoring dimensions as: Clarity, Persuasiveness, Engagement, Overall Quality.
- `CoreWorkflows.tsx`: References "Compare & Blend Outputs" workflow with Grok AI mention
- `DashboardAndHistory.tsx`: References scores in session details

**4.4.3 Coverage Status**
PARTIAL COVERAGE — and contains a significant contradiction with the Operating Manual.

**4.4.4 Contradiction Identified**

The `CompareBlend.tsx` help page describes scoring dimensions as:
- Clarity
- Persuasiveness
- Engagement
- Overall Quality

The Operating Manual (`comp-v4` system, Section 5.1) defines the six confirmed dimensions as:
- Marketing
- Clarity
- SEO
- Emotion
- CTA
- Readability

**This is a direct contradiction.** The help page describes a different scoring system (likely the "Basic Content Score" legacy system, Section 5.1 of the Operating Manual) rather than the primary `comp-v4` system. This must be corrected. The help page must be updated to reflect the six-dimension `comp-v4` scoring system.

**4.4.5 Missing Topics**
- Six confirmed scoring dimensions and what each measures
- Use-case-specific scoring weights (explanation that weights differ by content type, without exposing exact values)
- Why the same copy scores differently as a landing page versus an email
- GEO scoring as a separate scoring system: its seven criteria and what it evaluates
- Prompt Evaluation Score: what it measures and when it runs
- Improvement percentage: what it means, what it is calculated against (baseline version), and how it changes as versions are added
- Winner determination: what "winner" means in the context of comparison, how tie-breaks work
- When scoring does NOT automatically recalculate (user edits, brand voice changes)
- Grok comparison: what it does, which model it uses, and the analysis types available
- Score synchronization: that the score in the comparison table must match the score in the dimensional breakdown

**4.4.6 Risk of User Confusion**
- Users reading the current help page will expect "Persuasiveness" and "Engagement" as scored dimensions, then see "Marketing," "Emotion," and "CTA" in the actual UI — directly contradicting help content.
- Users will not understand why the same copy scored lower on a second run (model non-determinism) unless this is explained.
- Users who edit their copy post-generation and then check scores will not understand why the score did not update, potentially leading to incorrect version selection.
- Users who do not understand the baseline concept will misinterpret improvement percentages.

**4.4.7 Required Help Content — Scoring Framework Clarification**

All scoring-related help pages must include the following explanation, verbatim or in close equivalent plain-language form:

CopyZap uses a rubric-based scoring system.

Individual dimension scores are generated by an AI evaluator following fixed criteria and may vary slightly between runs.

However, weighting formulas, comparison rules, and winner determination logic are fully deterministic. The same version scores always produce the same comparison outcome.

Scoring is designed as a structured decision framework, not an absolute measure of truth.

This block must appear on: `CompareBlend.tsx`, any dedicated scoring explanation page, and any help page that surfaces the phrase "improvement percentage."

---

### 4.5 Dashboard

**4.5.1 Feature Summary (from Operating Manual)**
View saved sessions, outputs, and activity history. Navigate to saved outputs and resume or review them. Associates outputs with session IDs.

**4.5.2 Existing Help Entries**
- `DashboardAndHistory.tsx`: Covers three tabs (Token Usage, Saved Outputs, Manage Workflows), sessions vs. saved outputs distinction, filtering, loading, deleting.

**4.5.3 Coverage Status**
PARTIAL COVERAGE

**4.5.4 Missing Topics**
- Session scope keys (`copysnap-{userId}` vs. Copy Maker sessions): help should explain that CopySnap and Copy Maker have separate session histories
- Orphaned session cleanup: the system runs a scheduled cleanup of empty sessions; help should explain why sessions may disappear
- Modified version tracking (`saved_mode` field): help should explain the distinction between AI-generated and user-edited versions in saved outputs [AUDIT REQUIRED — whether this is exposed in Dashboard UI]
- Dashboard available filter and sort options [TO BE UPDATED — Operating Manual marks as TO BE DEFINED]

**4.5.5 Risk of User Confusion**
- Users expecting all their history in one view may be confused if CopySnap and Copy Maker sessions are separated.
- Users may be alarmed when old empty sessions disappear without explanation.

---

### 4.6 Token System (Credits)

**4.6.1 Feature Summary (from Operating Manual)**
Credits are tracked per AI operation. Cost is calculated post-completion from actual token usage (input, output, reasoning breakdown where applicable). Per-model pricing is admin-configurable and DB-stored. Credit balance is visible to users. Balance refreshes every five minutes, on window focus, and on mount. Failed token tracking is retried up to five times at one-minute intervals. When enforcement is active, operations are blocked if balance is zero.

**4.6.2 Existing Help Entries**
- `CreditsAndBilling.tsx`: What credits are, which actions consume credits, what happens at zero balance, usage history, FAQ.
- `DashboardAndHistory.tsx`: Token Usage tab.

**4.6.3 Coverage Status**
PARTIAL COVERAGE — with one behavioral inaccuracy risk.

**4.6.4 Inaccuracy Risk**

The `CreditsAndBilling.tsx` page describes credits being consumed by "actions." Help must not describe credits as being reserved or charged before an operation completes. Per the Operating Manual (Section 7.3), deduction is post-hoc — recorded after the API call completes from actual token usage. If the help page implies pre-authorization or describes billing timing inaccurately, it must be corrected.

**4.6.5 Missing Topics**
- Post-completion billing timing: credits are recorded after the operation completes, not reserved before it starts. Users should understand that a failed operation that produces no token usage does not consume credits.
- Per-model cost differentiation: users should understand that selecting a higher-cost model (e.g., GPT-4o) consumes more credits per operation than a lower-cost model (e.g., DeepSeek).
- Retry cost behavior: each retry attempt is billed separately if it consumes tokens. Help should explain that a retried generation does not receive a credit waiver.
- The five-minute balance refresh cadence: users who check their balance immediately after an operation may see a stale value.
- Credit enforcement mode: what it means when enforcement is active and what happens when it is not (operations may proceed over balance)

**4.6.6 Risk of User Confusion**
- Users who believe credits are reserved before a call will dispute charges for operations that "appeared to fail."
- Users who do not understand per-model pricing will be confused by variable credit consumption across similar operations.

---

### 4.7 Admin Panel

**4.7.1 Feature Summary (from Operating Manual)**
Admin panel provides: user CRUD, credit limit adjustment, public template management, token usage export, aggregate usage statistics, admin diagnostics, beta registration count, special instructions management, customer prefill management. Access gated by `AdminRoute` and `useIsAdmin` hook. RLS policies restrict admin operations at the database level.

**4.7.2 Existing Help Entries**
- No dedicated admin help page confirmed in the current page inventory.
- Admin capabilities are not referenced in confirmed standard user help pages.

**4.7.3 Coverage Status**
MISSING — No admin help documentation confirmed.

**4.7.4 Missing Admin Documentation**
- How to create, edit, and disable user accounts
- How to set and adjust user credit limits
- How to create and publish public templates
- How to export token usage data (format, scope, filters)
- How to use Admin Diagnostics and interpret output
- How to manage global special instructions presets
- How to manage customer prefill profiles
- What Usage Audit Panel shows and how to read it
- Admin role detection: how it works and why the Admin Panel may not appear immediately after role assignment

**4.7.5 Security Risk if Undocumented**

Without admin documentation, admins may:
- Assign credits incorrectly (confusing `creditsAllowed` ceiling vs. running balance)
- Publish templates to all users without understanding the public template system
- Export usage data without understanding what data is included
- Misinterpret diagnostic output and take unnecessary action

Without isolation of admin help from standard help:
- Standard users may encounter admin terminology in the help system and attempt to access admin features, triggering confusing redirects
- Admin feature descriptions in standard help could expose operational details that should remain internal

---

### 4.8 Model Selection

**4.8.1 Feature Summary (from Operating Manual)**
Users select from GPT-4o, Claude (claude-sonnet-4-5), DeepSeek (deepseek-chat), and Gemini variants. Each model receives model-specific temperature settings. Quick Polish and CopySnap are hardcoded to `claude-sonnet-4-5`. Copy Maker model selection is user-driven. Enhanced pipeline available for Copy Maker.

**4.8.2 Existing Help Entries**
- `SmartVsExpertMode.tsx`: References switching between modes but does not appear to detail model selection
- `BestPractices.tsx`: May reference model choice guidance [AUDIT REQUIRED]
- No confirmed dedicated model selection help page

**4.8.3 Coverage Status**
PARTIAL COVERAGE / [AUDIT REQUIRED]

**4.8.4 Missing Topics**
- Which models are available and for which modules
- That Quick Polish and CopySnap use a fixed model (users cannot change the model for these modules)
- General behavioral differences between models (without exposing temperature values): e.g., Claude tends toward concise structured output; DeepSeek may produce more expansive responses
- That model selection affects cost: higher-cost models consume more credits per operation
- The Enhanced pipeline mode: what it means, when to use it, and how it differs from standard generation

**4.8.5 Risk of User Confusion**
- Users who switch models in Copy Maker and notice dramatically different output styles will not understand why without model behavior guidance.
- Users who attempt to change models in Quick Polish or CopySnap will not find the option and may assume it is a bug.

---

### 4.9 Persona System (Brand Voice)

**4.9.1 Feature Summary (from Operating Manual)**
Brand voice profiles are stored per user and injected into the system prompt before generation. Multiple brand voices can be created and stored. Voice characteristics include writing style, tone, and persona descriptors. If brand voice load fails, generation proceeds without voice injection (silent degradation). Scores are NOT automatically recalculated when brand voice changes.

**4.9.2 Existing Help Entries**
- `BrandVoiceSystem.tsx`: Comprehensive page covering creation (five methods), advanced style controls, template integration, database structure, troubleshooting, and FAQ.

**4.9.3 Coverage Status**
PARTIAL COVERAGE — breadth is strong; some critical behavioral gaps exist.

**4.9.4 Missing Topics**
- Silent degradation behavior: if brand voice fails to load, generation proceeds without the voice. Users will not know their brand voice was not applied. Help should explain what to do if brand voice seems absent from output.
- Score recalculation behavior: changing or removing a brand voice does not automatically trigger re-scoring. If a user switches brand voice and checks scores, the scores reflect the original generation, not the new voice. Help should make this explicit.
- Whether brand voice can be applied in Quick Polish [TO BE UPDATED — marked TO BE DEFINED in Operating Manual]
- Whether brand voice can be applied in CopySnap [TO BE UPDATED — marked TO BE DEFINED in Operating Manual]

**4.9.5 Risk of User Confusion**
- Users who switch brand voices and expect instant score updates will be confused when scores remain unchanged.
- Users whose brand voice fails to load silently may produce off-brand copy without realizing the voice was not applied.

---

### 4.10 Retry Logic

**4.10.1 Feature Summary (from Operating Manual)**
On output validation failure, a repair prompt is sent automatically (one retry). If repair fails, user sees warning with options: view raw output or regenerate. Maximum retries for API calls: 3 (exponential backoff: 1s, 2s, 4s). Each retry that consumes tokens produces its own separate token record.

**4.10.2 Existing Help Entries**
- `TroubleshootingFAQs.tsx`: References generation speed and technical issues generally. Does not confirm explicit coverage of retry logic.
- No confirmed dedicated explanation of retry behavior.

**4.10.3 Coverage Status**
MISSING

**4.10.4 Missing Topics**
- What "repair retry" means and when it triggers
- What users see when repair retry occurs (is there a visible state change?)
- What "view raw output" means and when to use it vs. regenerating
- That retries consume credits separately from the original attempt
- What the maximum retry count is and what happens after it is exceeded

**4.10.5 Risk of User Confusion**
- Users who see the raw output warning will not understand what it means or whether it is safe to use the raw output.
- Users who are billed for a failed-then-retried generation will dispute the extra credit consumption without documentation.

---

### 4.11 Improvement Percentage

**4.11.1 Feature Summary (from Operating Manual)**
Improvement percentage is calculated against a designated baseline version. Exact formula marked [TO BE DEFINED] in Operating Manual. When a new version is added to a comparison set, incremental scoring runs for the new version only; existing version scores are preserved from cache.

**4.11.2 Existing Help Entries**
- `CompareBlend.tsx`: References comparison and blending but does not confirm explicit coverage of improvement percentage as a concept.
- No confirmed dedicated help entry explaining improvement percentage.

**4.11.3 Coverage Status**
MISSING

**4.11.4 Missing Topics**
- What improvement percentage means: the difference in overall score between the new version and the baseline version
- What "baseline version" means and how a version is designated as baseline
- That improvement percentage reflects scoring, not guaranteed performance improvement in the real world
- That a version can show 0% improvement if scores are equal

**4.11.5 Risk of User Confusion**
- Users who see "+12% improvement" will interpret this as a guarantee of better performance in the real world without understanding it is a scored comparison, not a live conversion test.
- Users who do not understand the baseline concept will not know how to interpret the percentage.

---

### 4.12 Winner Determination

**4.12.1 Feature Summary (from Operating Manual)**
Winner is determined by: (1) highest overall weighted score, (2) highest CTA score, (3) highest Clarity score, (4) highest Marketing score, (5) first version seen. The comparison result exposes `bestVersionIndex`, `bestForMarketing`, `bestForClarity`, `bestForSimplicity`.

**4.12.2 Existing Help Entries**
- `CompareBlend.tsx`: Describes comparison and the concept of a "recommended" version. Does not confirm explicit documentation of tie-break logic or winner determination algorithm.

**4.12.3 Coverage Status**
PARTIAL COVERAGE

**4.12.4 Missing Topics**
- How winner is determined: highest weighted score wins
- What happens in a tie (tie-break by CTA, then Clarity, then Marketing, then order)
- `bestForMarketing`, `bestForClarity`, `bestForSimplicity` — that the comparison can recommend different versions for different goals, not just a single universal winner
- That the winner is based on the scoring system and may not reflect real-world performance

**4.12.5 Risk of User Confusion**
- Users who see two different "best for" recommendations may be confused about which version to use.
- Users who believe winner determination is subjective AI opinion (rather than a defined algorithm) will not trust the recommendation.

---

### 4.13 Version Editing Behavior

**4.13.1 Feature Summary (from Operating Manual)**
A version that the user edits after generation is tracked as distinct from the AI-generated original (via `saved_mode` field). Editing does NOT trigger score recalculation. Users must manually trigger re-scoring. Modified versions participate in comparison with the same logic as AI-generated versions. Blended versions are created by user action and treated as new versions.

**4.13.2 Existing Help Entries**
- `CompareBlend.tsx`: References blending behavior generally. Does not confirm explicit documentation of post-edit scoring behavior.
- No confirmed dedicated help entry for version editing behavior and score recalculation.

**4.13.3 Coverage Status**
MISSING

**4.13.4 Missing Topics**
- That editing copy post-generation does not update the score automatically
- How to manually re-trigger scoring after an edit
- The distinction between the original AI-generated version and the edited version in session history
- That blended versions are scored and compared as independent versions
- That a manually edited version is stored distinctly from the AI-generated original

**4.13.5 Risk of User Confusion**
- Users who edit copy and then check the score will see the score from before the edit, not after. Without documentation, they will not know the score is stale.
- Users who expect the comparison to reflect their edits will be confused when the comparison uses the pre-edit score.

---

## 5. Admin Help Segmentation

### 5.1 Admin Help Coverage Status

| Admin Feature | Help Documentation Status |
|---|---|
| User creation (CRUD) | MISSING |
| Credit limit adjustment (`creditsAllowed`) | MISSING |
| Public template management | MISSING |
| Token usage export | MISSING |
| Aggregate token statistics view | MISSING |
| Admin Diagnostics panel | MISSING |
| Global special instructions management | MISSING |
| Customer prefill management | MISSING |
| Beta registration count view | MISSING |
| Usage Audit Panel | MISSING |

### 5.2 Missing Admin Documentation

All admin features currently lack help documentation. The following documents are required:

1. **User Management Guide (Admin):** How to create, edit, disable, and delete user accounts. What fields are configurable. What side effects exist (welcome email on account creation).
2. **Credit Management Guide (Admin):** What `creditsAllowed` is and how it differs from `creditsRemaining`. How to set a credit ceiling. What enforcement mode means.
3. **Public Template Administration Guide (Admin):** How to create a public template. What "public" means (visible to all users). How to edit or retract a public template.
4. **Usage Export Guide (Admin):** What data is included in token usage exports. How to trigger an export. Format of exported data.
5. **Admin Diagnostics Guide:** What the diagnostics panel shows. How to interpret outputs. What actions to take for common diagnostic states.
6. **Global Presets Management Guide:** How to create and manage global special instructions presets. How to manage customer prefill profiles.

### 5.3 Security Risk if Undocumented

Without isolated admin documentation:

| Risk | Description |
|---|---|
| Credit mismanagement | Admin sets `creditsAllowed` incorrectly, believing it directly adds credits to a running balance when it sets a ceiling |
| Template exposure | Admin publishes a draft or internally-referenced template to all users by accident |
| Data export scope misunderstanding | Admin exports token usage and shares it without understanding what user-level data it contains |
| Diagnostic misinterpretation | Admin acts on a diagnostic warning without understanding its severity level |

Without isolation of admin help from standard user help:

| Risk | Description |
|---|---|
| Standard users see admin features in help | Users attempt to access routes that do not exist for them, triggering confusing redirects |
| Internal architecture exposed | Descriptions of RLS policies, admin route protection, or credit system internals leak into standard documentation |

**Recommended:** Admin help should be accessible only from within the Admin Panel, not from the standard Help Center navigation. Or: admin help pages must be clearly labeled "Admin Only" and excluded from standard user help search index.

---

## 6. Critical Help Gaps (High Priority)

The following gaps represent the highest risk of user confusion, incorrect product use, or scoring misunderstanding during testing.

| # | Gap | Risk Level | Module Affected |
|---|---|---|---|
| 1 | Scoring dimension mismatch in help | CRITICAL | Scoring / CompareBlend |
| 2 | No Quick Polish help page | HIGH | Purpose Rewrite |
| 3 | No CopySnap help page | HIGH | CopySnap |
| 4 | Improvement % not documented | HIGH | Scoring |
| 5 | Version edit does not trigger re-scoring — not documented | HIGH | Scoring / Version Editing |
| 6 | Token retry cost not documented | HIGH | Token System |
| 7 | Session ID abort behavior not documented | MEDIUM | Copy Maker |
| 8 | Silent brand voice load failure not documented | MEDIUM | Persona System |
| 9 | No admin help documentation | MEDIUM | Admin Panel |
| 10 | Enhanced pipeline mode not documented | MEDIUM | Model Selection |
| 11 | GEO score criteria not documented in help | MEDIUM | Scoring |
| 12 | Prompt Evaluation score not documented | MEDIUM | Scoring |
| 13 | Winner tie-break logic not documented | MEDIUM | Comparison Engine |
| 14 | Post-completion billing timing not confirmed accurate in help | MEDIUM | Token System |
| 15 | No repair retry explanation in help | LOW | Copy Maker |
| 16 | Language support limitation (English/Spanish only) — not confirmed in help | LOW | Quick Polish / CopySnap |

**Gap #1 is the highest priority** because users will see scoring dimension names in the UI that directly contradict what the help page describes, creating immediate distrust of both the scoring system and the help system.

---

## 7. Help System vs Operating Manual Consistency Audit

### 7.1 Confirmed Contradictions

| Location | Help Says | Operating Manual Says | Severity |
|---|---|---|---|
| `CompareBlend.tsx` — Content Scoring section | Scoring dimensions: Clarity, Persuasiveness, Engagement, Overall Quality | Six dimensions: Marketing, Clarity, SEO, Emotion, CTA, Readability (`comp-v4` system) | CRITICAL — must be corrected before testing |

### 7.2 Confirmed Over-Simplifications

| Location | What Help Simplifies | What Complexity Exists |
|---|---|---|
| `CompareBlend.tsx` | Comparison described as selecting a "recommended" version | Winner determined by four-level tie-break algorithm with per-dimension winners (`bestForMarketing`, `bestForClarity`, `bestForSimplicity`) |
| `CreditsAndBilling.tsx` | Credits consumed by "actions" | Credits are post-hoc calculated from actual token usage per operation type with input/output/reasoning breakdown and model-specific pricing |
| `CoreWorkflows.tsx` | "Compare & Blend" presented as a simple side-by-side view | Comparison runs a scoring-based winner determination engine; incremental scoring for new versions; Grok uses opposing model |

### 7.3 Areas Where Help Omits Edge Cases

| Operating Manual Edge Case | Help Coverage |
|---|---|
| Session ID missing → generation aborts before any API call | [NOT IMPLEMENTED in help] |
| Brand voice load failure → silent degradation, generation proceeds without voice | [NOT IMPLEMENTED in help] |
| Output validation failure after repair retry → raw output shown with warning | [NOT IMPLEMENTED in help] |
| Editing copy post-generation → scores are NOT recalculated | [NOT IMPLEMENTED in help] |
| Brand voice change → scores are NOT recalculated | [NOT IMPLEMENTED in help] |
| Token tracking failure after 5 retries → record discarded, user not notified | [NOT IMPLEMENTED in help] |
| Retry attempts bill separately | [NOT IMPLEMENTED in help] |
| Credits balance may be stale up to 5 minutes | [AUDIT REQUIRED — may be partially covered in Credits & Billing FAQ] |
| Desktop-required for some features | [AUDIT REQUIRED] |
| Languages other than English/Spanish unreliable in Quick Polish/CopySnap | [AUDIT REQUIRED] |

### 7.4 Unknown Status Areas

The following require direct code inspection to confirm accuracy:

| Area | Status |
|---|---|
| `CopyMakerIndex.tsx` help page content | [AUDIT REQUIRED] |
| `FeatureInteractions.tsx` help page content | [AUDIT REQUIRED] |
| `RecommendedSettings.tsx` help page content | [AUDIT REQUIRED] |
| `Workflows.tsx` and `RealCaseWorkflowsIndex.tsx` content | [AUDIT REQUIRED] |
| Whether any help page explicitly covers model selection | [AUDIT REQUIRED] |
| Whether competitor copy input is covered in OptionalFeatures | [AUDIT REQUIRED] |

---

## 8. Required Help Improvements for v1.0 Testing

### 8.1 Must Be Updated Before Testing

These gaps will cause direct user confusion or incorrect testing behavior if left unaddressed:

| Priority | Action Required |
|---|---|
| P0 | Correct scoring dimension names in `CompareBlend.tsx` — update from legacy dimensions to `comp-v4` six dimensions |
| P0 | Create dedicated Quick Polish help page covering intents, guardrails, and claim constraints |
| P0 | Create dedicated CopySnap help page covering three modes, ANSWER mode constraints, and input limits |
| P1 | Add improvement percentage explanation to `CompareBlend.tsx` or scoring-dedicated section |
| P1 | Add post-edit score recalculation behavior to scoring help: editing does not update scores automatically |
| P1 | Add token retry billing note to `CreditsAndBilling.tsx` |
| P1 | Confirm and correct billing timing language in `CreditsAndBilling.tsx` to match post-completion deduction |

### 8.2 Should Be Updated Before Testing (Lower Risk)

| Priority | Action Required |
|---|---|
| P2 | Add session ID error explanation to `TroubleshootingFAQs.tsx` |
| P2 | Add silent brand voice failure explanation to `BrandVoiceSystem.tsx` |
| P2 | Add repair retry explanation to troubleshooting content |
| P2 | Add winner tie-break explanation to comparison help |
| P2 | Add GEO scoring criteria explanation to scoring help |
| P2 | Add model selection behavior guidance (which modules have fixed models) |
| P2 | Create admin help documentation (accessible from Admin Panel) |

### 8.3 Can Be Deferred Post-Testing

| Priority | Action Required |
|---|---|
| P3 | Enhanced pipeline mode documentation |
| P3 | Prompt Evaluation score documentation |
| P3 | Language support limitation notice in Quick Polish and CopySnap |
| P3 | Version editing behavior detailed documentation |
| P3 | Desktop-required feature notice |
| P3 | Session scope key separation (CopySnap vs. Copy Maker history) |

---

## 9. Help Content Design Guidelines

The following principles govern all help content written for CopyZap.

**1. Behavioral, not theoretical**
Help explains what the system does and when it does it. "Scoring runs after generation completes, not during" is behavioral. "Scoring evaluates your copy's quality" is not useful guidance. Every help statement should map to an observable system behavior.

**2. Usage-focused, not architecture-focused**
Users do not need to know that scoring uses a `comprehensiveScoring.ts` service or that the session system uses Supabase. They need to know: when scoring runs, what the scores mean, and what to do with the results.

**3. No internal formulas**
Scoring dimension weights, prompt temperature values, cost calculation formulas, and exact retry backoff intervals are internal. Help should explain what exists (e.g., "scoring weights differ by content type") without exposing exact values.

**4. No sensitive debug data**
Prompt contents, raw API responses, model-specific temperature settings, and edge function internals must not appear in standard help content. Debug information is restricted to admin users or debug mode (per Operating Manual Section 10.5).

**5. Step-by-step for procedural tasks**
Anything that requires multiple user actions (creating a brand voice, running a comparison, setting up a workflow) must be documented as a numbered sequence of steps, not as prose.

**6. Edge cases and failure states included**
Help should include what happens when things go wrong (validation failures, session errors, credit limit reached) not just the happy path. Edge case documentation prevents support tickets.

**7. Module isolation**
Each module's help should be self-contained. A user reading the Quick Polish help page should not need to read the Copy Maker help page to understand Quick Polish. Where modules interact, cross-references are acceptable but the primary content must stand alone.

**8. Accuracy over completeness**
A help page with three accurate statements is preferable to a help page with ten statements where two are wrong. Incomplete accurate coverage is always preferable to complete inaccurate coverage.

**9. Admin content fully isolated**
Help content describing admin features must not appear in standard user help. Admin help is a separate documentation space accessible only to users who can see the Admin Panel.

**10. No compliance claims**
Consistent with Operating Manual Section 9.5, help must not state or imply that CopyZap generates legally compliant copy. Any reference to compliance must include a user responsibility statement.

---

## 10. Future Help System Architecture

The following are improvement ideas for the help system beyond the current static implementation. All items are future considerations only — none are confirmed as implemented or planned.

**[Future Consideration] Contextual In-Module Help**
Help content triggered by module context rather than requiring manual navigation to the Help Center. A user working in Quick Polish would see Quick Polish-specific guidance without leaving the interface.

**[Future Consideration] Dynamic Help Based on Active Feature**
When a user enables GEO scoring, a help tooltip or inline note describes GEO scoring. When a user selects a model, a brief model description appears. This eliminates the navigation gap between feature use and documentation.

**[Future Consideration] Admin-Only Documentation Portal**
A separate help environment accessible only from within the Admin Panel. Admin documentation lives entirely outside the standard user Help Center. Admin-specific behavior (credit management, user administration, diagnostics) is never exposed to standard user navigation.

**[Future Consideration] Versioned Help System**
Help content versioned alongside product releases. When a behavior changes, the corresponding help entry is updated and the change is recorded in the Help System Change Log (Section 12). Users can identify which version of help applies to their experience.

**[Future Consideration] Dynamic Search Index**
Help search index rebuilt on content change, not only at build time. This would allow documentation updates to be deployed independently of product code releases, reducing the delay between behavior changes and help updates.

**[Future Consideration] Scoring Explanation Walkthrough**
An interactive or guided explanation of the scoring system — showing a sample output, its six dimension scores, and the weighted calculation — that makes scoring comprehensible without exposing the exact weight values.

---

## 11. Help System Completion Checklist

Use this checklist before v1.0 testing approval.

### Core Module Coverage

- [ ] Copy Maker help complete and accurate
- [ ] Quick Polish help page created
- [ ] CopySnap help page created
- [ ] Dashboard help complete and accurate

### Scoring and Comparison

- [ ] Scoring dimension names corrected in `CompareBlend.tsx` (from legacy to `comp-v4` dimensions)
- [ ] Six scoring dimensions explained (without weight values)
- [ ] Use-case scoring differentiation explained
- [ ] GEO scoring criteria documented
- [ ] Prompt Evaluation score documented
- [ ] Improvement percentage documented
- [ ] Baseline version concept documented
- [ ] Winner determination logic documented (without tie-break detail if too complex, but winner concept explained)
- [ ] Post-edit score recalculation behavior documented (editing does not auto-update scores)
- [ ] Post-brand-voice-change score recalculation behavior documented

### Token and Credits

- [ ] Post-completion billing timing confirmed accurate in help
- [ ] Per-model cost differentiation documented
- [ ] Retry billing behavior documented
- [ ] Credit enforcement mode documented
- [ ] Balance refresh cadence noted

### Admin

- [ ] Admin help documentation created
- [ ] Admin help isolated from standard user help navigation
- [ ] No admin feature descriptions present in standard user help without role labeling

### Edge Cases

- [ ] Session ID error explained in troubleshooting
- [ ] Silent brand voice failure documented
- [ ] Repair retry and raw output warning documented
- [ ] Language support limitation documented
- [ ] Desktop-required feature notice documented

### Consistency

- [ ] All help content reviewed against Operating Manual for contradictions
- [ ] No help content describes behavior marked `[TO BE DEFINED]` in Operating Manual as if it were defined
- [ ] No compliance guarantees present in help content

---

## 12. Help System Change Log

| Date | Module | Change | Status | Author |
|---|---|---|---|---|
| 2026-02-19 | All | Initial help system audit created against Operating Manual v1.0 | Complete | [TO BE FILLED] |

---

*End of CopyZap Help System Specification & Coverage Audit v1.0*
*Derived from: `01_CopyZap_Operating_Manual_v1.0.md` and live inspection of `src/components/help/pages/`*
*All coverage assessments reflect confirmed system state. No help pages have been invented.*
