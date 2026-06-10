# CopyZap Benefits Mapping

**Document Type**: Features-to-Benefits Analysis
**Date**: 2026-01-30
**Purpose**: Map every feature to its functional benefit and user benefit. No marketing language, no competitor comparisons.

---

## How to Read This Document

**Functional Benefit**: What the feature does (mechanical outcome)
**User Benefit**: Why it matters to the user (practical value)

---

## Table of Contents

1. [Interface and Modes](#interface-and-modes)
2. [Input and Control Features](#input-and-control-features)
3. [Generation Features](#generation-features)
4. [Output Features](#output-features)
5. [Copy Snap Features](#copy-snap-features)
6. [Template System](#template-system)
7. [Brand Voice System](#brand-voice-system)
8. [Workflow Features](#workflow-features)
9. [Credit System](#credit-system)
10. [Dashboard Features](#dashboard-features)
11. [Admin Features](#admin-features)
12. [Technical Features](#technical-features)

---

## Interface and Modes

### Three Interface Modes (Quick, Standard, Advanced)

**Functional Benefit**: Adjusts visible field count from 10 to 20 to 40+ fields based on selected mode.

**User Benefit**:
- New users see fewer fields (reduced confusion)
- Experienced users access full control (no artificial limitations)
- Users choose complexity level appropriate to their skill and task

### Mode Persistence

**Functional Benefit**: Stores user's last selected mode in browser localStorage, restores on next session.

**User Benefit**: Users don't reset to beginner mode every time they open the app.

### Hidden Field Value Retention

**Functional Benefit**: When switching from Advanced to Quick mode, populated fields remain in state even when hidden.

**User Benefit**: Users can switch modes without losing their work, exploration is safe.

---

## Input and Control Features

### Project Description Field

**Functional Benefit**: Labels sessions for organization; auto-populates Product/Service Name if that field empty.

**User Benefit**:
- Users find past sessions quickly in dashboard
- Reduces duplicate data entry

### Business Description / Original Copy (Mode-Specific Fields)

**Functional Benefit**: Form displays different primary input field based on Create vs. Improve mode.

**User Benefit**: Interface adapts to task, users see only relevant controls.

### Language Selection (6 Options)

**Functional Benefit**: Sets output language directive in AI prompt.

**User Benefit**: Users create content in their target market's language without translation tools.

### Tone Selection (6 Options)

**Functional Benefit**: Injects tone instruction into AI system prompt.

**User Benefit**: Users control brand voice consistency without rewriting prompts manually.

### Word Count Controls

**Functional Benefit**: Sets target word count, optional tolerance settings, and enforcement mode.

**User Benefit**:
- Users meet platform character limits (e.g., ad platforms)
- Briefs with specific length requirements satisfied
- Optionally let AI decide optimal length

### AI Decide Word Count Toggle

**Functional Benefit**: Removes word count instruction from prompt entirely.

**User Benefit**: For tasks where optimal length unknown, AI determines appropriate depth.

### Target Audience Field

**Functional Benefit**: Adds audience description to AI prompt context.

**User Benefit**: Output messaging appropriate to demographic/psychographic target.

### Key Message Field

**Functional Benefit**: Emphasizes primary value proposition in AI prompt.

**User Benefit**: Core message doesn't get buried in details.

### Call to Action Field

**Functional Benefit**: Instructs AI to include specific CTA.

**User Benefit**: Output ends with desired reader action, no manual CTA insertion needed.

### Brand Values Field

**Functional Benefit**: Adds brand principles to AI prompt context.

**User Benefit**: Copy aligns with brand ethos without manual review and rewrite.

### Keywords Field

**Functional Benefit**: Instructs AI to integrate specific keywords naturally.

**User Benefit**: SEO keywords incorporated without awkward forced insertion.

### Force Keyword Integration Toggle

**Functional Benefit**: Strengthens keyword instruction in prompt.

**User Benefit**: Higher likelihood of keyword presence for strict SEO requirements.

### Context Field

**Functional Benefit**: Adds situational background information to prompt.

**User Benefit**: Copy accounts for market conditions, competitive positioning, or timing without explicit instructions in every field.

### Page Type and Section Dropdowns

**Functional Benefit**: Tailors copy structure and style to conventional page/section formats.

**User Benefit**: Output matches expected structure for Homepage Hero vs. FAQ vs. Testimonials, reducing editing.

### Customer Selection

**Functional Benefit**: Links generation to specific client record, filters brand voice dropdown.

**User Benefit**:
- Agency users organize work by client
- Dashboard filters by customer
- Brand voices auto-filtered to relevant client

### Brand Voice Selection

**Functional Benefit**: Injects 20+ brand voice parameters into AI system prompt.

**User Benefit**: Multi-paragraph brand guidelines applied automatically, no copy-paste into every generation.

### Output Structure (Drag-and-Drop)

**Functional Benefit**: Defines exact section order and types, optional per-section word counts.

**User Benefit**:
- Predictable output format
- No rearranging sections manually
- Consistent structure across multiple generations

### Include Section Titles Toggle

**Functional Benefit**: Controls whether section headings appear in output.

**User Benefit**: Users get clean paragraphs (no headings) or structured sections (with headings) depending on destination format.

### Industry/Niche Dropdown (Advanced)

**Functional Benefit**: Adds industry context to AI prompt.

**User Benefit**: Terminology and conventions appropriate to vertical (e.g., "patients" in healthcare vs. "customers" in retail).

### Target Audience Pain Points (Advanced)

**Functional Benefit**: Emphasizes problem-solution framing in AI prompt.

**User Benefit**: Copy addresses specific frustrations, higher persuasive impact.

### Reader Funnel Stage (Advanced)

**Functional Benefit**: Adjusts copy depth/persuasion tactics based on buyer journey stage.

**User Benefit**: Awareness-stage copy educates, decision-stage copy closes, appropriate to context.

### Competitor URLs (Advanced)

**Functional Benefit**: Lists competitor URLs in AI prompt for reference.

**User Benefit**: AI can contrast positioning (though not fetching live content).

### Competitor Copy Text (Advanced)

**Functional Benefit**: Includes competitor copy in AI prompt for differentiation context.

**User Benefit**: Output naturally contrasts with competitor messaging.

### Reader Sophistication (Advanced)

**Functional Benefit**: Adjusts explanation depth based on audience knowledge level (Eugene Schwartz framework).

**User Benefit**: Copy not too basic for experts, not too complex for beginners.

### Preferred Writing Style (Advanced)

**Functional Benefit**: Sets narrative approach (Storytelling, Data-Driven, etc.).

**User Benefit**: Output matches preferred content format without post-generation rewrite.

### Language Style Constraints (Advanced)

**Functional Benefit**: Applies fine-grained rules (avoid jargon, short sentences, etc.).

**User Benefit**: Copy adheres to editorial guidelines automatically.

### Tone Level Slider (Advanced)

**Functional Benefit**: Adjusts intensity of selected tone on 0-100 scale.

**User Benefit**: Fine-tune tone without switching to completely different option.

### Desired Emotion (Advanced)

**Functional Benefit**: Instructs AI to target specific emotional response.

**User Benefit**: Copy emotionally calibrated for campaign goal (excitement vs. trust vs. urgency).

### Excluded Terms (Advanced)

**Functional Benefit**: Lists words/phrases to avoid in AI prompt.

**User Benefit**: Brand guidelines for forbidden terms (e.g., "cheap", "synergy") enforced at generation time.

### Special Instructions

**Functional Benefit**: Appends free-form custom instructions to end of AI prompt.

**User Benefit**: Edge cases and specific requirements covered without waiting for new feature implementation.

---

## Generation Features

### AI Model Selection (10 Models)

**Functional Benefit**: Determines which AI provider and model processes the request.

**User Benefit**:
- Speed options (Gemini 2.0 Flash vs. Claude Opus)
- Cost options (DeepSeek vs. GPT-4)
- Quality options (Claude Sonnet 4.5 for nuanced copy vs. GPT-3.5 for simple tasks)
- Specialization options (Grok for comparison analysis)

### Model Fallback System

**Functional Benefit**: If primary model fails, automatically attempts alternative model, tracks which was used.

**User Benefit**: Generation succeeds even when one API is down, no manual retry needed.

### Multi-Variant Generation (1-10 Variants)

**Functional Benefit**: Single API call generates N different versions of same prompt.

**User Benefit**:
- A/B testing options without manual regeneration
- Style variety without reconfiguring form
- Higher chance of usable output (one of N likely satisfactory)

### Word Count Enforcement System

**Functional Benefit**: Automatically generates revision prompts if word count outside tolerance, retries up to 2 times.

**User Benefit**: Output length matches requirements without manual editing or trial-and-error regeneration.

### SEO Metadata Generation

**Functional Benefit**: Generates 5-10 variants each of URL slugs, meta descriptions, H1-H3, OG tags in single operation.

**User Benefit**:
- Complete SEO package in one click
- Multiple options for each element (choose best)
- Consistent optimization across all elements

### Content Scoring

**Functional Benefit**: Generates numeric scores (1-10) for Clarity, Persuasiveness, Engagement, SEO, Overall.

**User Benefit**:
- Objective quality assessment (not just subjective review)
- Identify weak areas for targeted revision
- Compare multiple outputs numerically

### GEO (Generative Engine Optimization) Scoring

**Functional Benefit**: Assesses copy for AI search engine optimization across 5 dimensions (Citability, Summarizability, Factual Density, Authority, Structured Data Readiness).

**User Benefit**: Future-proof content for ChatGPT/Perplexity/AI search where traditional SEO metrics less relevant.

### GEO Enhancement Options

**Functional Benefit**: "Enhance for GEO" toggle strengthens AI search optimization, "Add TL;DR" prepends executive summary.

**User Benefit**: Content structured for AI extraction and citation, increasing visibility in AI search results.

### FAQ Schema Generation

**Functional Benefit**: Extracts/generates Q&A pairs, formats as JSON-LD schema markup.

**User Benefit**: Paste code into website `<head>` for rich search results (FAQ snippets), no manual schema coding.

### Quick Setup Wizard

**Functional Benefit**: Conversational interface generates complete form configuration via AI, user answers 4-6 questions.

**User Benefit**:
- Blank-page paralysis eliminated
- Faster configuration than manual form filling
- Learning tool (see how AI interprets needs into field values)

---

## Output Features

### Copy to Clipboard (Plain Text)

**Functional Benefit**: Copies output as plain text with markdown formatting to clipboard.

**User Benefit**: Paste into any text editor or field without formatting issues.

### Copy HTML

**Functional Benefit**: Converts markdown to HTML, copies styled markup to clipboard.

**User Benefit**: Paste into CMS or email editor with formatting intact.

### Replace Input

**Functional Benefit**: Loads output into "Original Copy" field, switches to Improve Mode.

**User Benefit**: Iterative refinement workflow (generate → improve → improve again) without manual copy-paste.

### Generate Alternative Copy

**Functional Benefit**: Creates new variant with "alternative version" instruction, adds to results.

**User Benefit**: More options without reconfiguring entire form.

### Apply Voice Style

**Functional Benefit**: Rewrites copy in selected voice persona (Steve Jobs, Alex Hormozi, etc.) or brand voice.

**User Benefit**:
- Test different brand voices on same content
- Match voice to channel (LinkedIn vs. X)
- Learn from famous copywriter styles

### Generate Score (On-Demand)

**Functional Benefit**: Adds content scores to output card if not already present.

**User Benefit**: Score outputs that were generated without scoring enabled, no full regeneration needed.

### Modify Content

**Functional Benefit**: Applies custom instruction to existing output (e.g., "add statistics", "make more concise").

**User Benefit**: Targeted edits without regenerating from scratch or manual editing.

### Generate FAQ Schema (On-Demand)

**Functional Benefit**: Extracts Q&A and formats as JSON-LD after generation.

**User Benefit**: Add schema to outputs generated without FAQ schema enabled, no regeneration needed.

### Generate SEO Metadata (On-Demand)

**Functional Benefit**: Generates SEO elements for existing output.

**User Benefit**: Add SEO package to outputs generated without SEO enabled, no regeneration needed.

### Compare Outputs (Grok Analysis)

**Functional Benefit**: Sends multiple outputs to Grok AI for comparative analysis across 6 dimensions.

**User Benefit**:
- Objective comparison (not gut feeling)
- Identifies strengths/weaknesses of each option
- Data-driven selection for A/B tests or final copy choice

### Clear All Outputs

**Functional Benefit**: Removes all output cards from results section.

**User Benefit**: Clean slate for new generation without page refresh.

### Save Output to Dashboard

**Functional Benefit**: Stores input data, output data, and metadata in `pmc_saved_outputs` table.

**User Benefit**:
- Reference library for future projects
- Client presentation deck
- Portfolio of generated content

### Export Options

**Copy as Markdown**

**Functional Benefit**: Copies all outputs, inputs, and metadata as formatted Markdown to clipboard.

**User Benefit**:
- Quick paste into Notion, Slack, GitHub, or any Markdown-compatible tool
- Preserves formatting and structure
- No file download needed

**Export as HTML**

**Functional Benefit**: Downloads professionally formatted standalone HTML file with all outputs, inputs, and metadata.

**User Benefit**:
- Client deliverables without manual document creation (can print to PDF from browser)
- Shareable without granting dashboard access
- Archival documentation with styled, readable formatting
- Works offline once downloaded

### View Prompts

**Functional Benefit**: Displays complete system prompt and user prompt sent to AI model.

**User Benefit**:
- Transparency (understand what AI saw)
- Learning (see how form inputs translate to prompts)
- Debugging (diagnose unexpected outputs)

---

## Copy Snap Features

### Three Operating Modes (Improve, Answer, Question)

**Functional Benefit**: Specialized interfaces for different text transformation tasks.

**User Benefit**:
- Task-appropriate controls (no irrelevant options)
- Faster selection than general-purpose interface
- Clear use case (users know which mode for which task)

### Improve Mode Controls

**Functional Benefit**: Goal, Platform, Length dropdowns adjust improvement focus.

**User Benefit**:
- Platform-specific optimization (X character limits vs. LinkedIn norms)
- Goal-specific output (punchier vs. clearer different approaches)
- Length control (fit into existing space or expand)

### Answer Mode Controls

**Functional Benefit**: Style, Stance, Length dropdowns adjust reply characteristics.

**User Benefit**:
- Consistent voice across social media replies
- Stance control (neutral for support, agree/disagree for engagement)
- Length appropriate to platform (Twitter brevity vs. LinkedIn depth)

### Question Mode Controls

**Functional Benefit**: Type, Count, Directness dropdowns adjust question strategy.

**User Benefit**:
- Lead generation (Convert questions)
- Engagement (Explore questions)
- Qualification (Challenge questions)
- Adjustable quantity (1 for quick, 5 for comprehensive)

### Best Result + 2 Alternatives (Improve/Answer Modes)

**Functional Benefit**: Returns 3 versions ranked by AI as best, second-best, third-best.

**User Benefit**:
- Options without "regenerate and hope"
- Backup choices if primary not suitable
- Style variety

### 3 Expert Tips (Improve Mode)

**Functional Benefit**: AI suggests 3 specific improvements beyond what it generated.

**User Benefit**:
- Learning tool (understand copywriting principles)
- Manual editing guidance
- Identify improvement areas for future briefs

### Human Tone Mode

**Functional Benefit**: Instructs AI to write more naturally, less polished/formal.

**User Benefit**: Social media copy sounds authentic, not AI-generated.

### Language Auto-Detection

**Functional Benefit**: Detects input text language, responds in same language.

**User Benefit**: Multi-language support without language selector, works globally.

### Special Instructions (Copy Snap)

**Functional Benefit**: Adds custom context to Copy Snap operations.

**User Benefit**: Edge cases covered (e.g., "mention our new product", "avoid humor").

### Clear Input Button

**Functional Benefit**: One-click reset of input field.

**User Benefit**: Faster than manual selection and deletion, especially on mobile.

### Replace Input with Output

**Functional Benefit**: Loads selected output back into input field.

**User Benefit**: Iterative refinement (improve → improve again) in Copy Snap without Copy Maker.

### Regenerate Button

**Functional Benefit**: Re-runs current mode with same settings.

**User Benefit**: Different variations without changing controls, faster than reconfiguring.

### Dual-Model Architecture (DeepSeek → GPT-4o Fallback)

**Functional Benefit**: Tries DeepSeek first (fast, cheap), falls back to GPT-4o if error.

**User Benefit**:
- Lower cost (5-10x cheaper when DeepSeek succeeds)
- Reliability (backup if primary fails)
- Transparency (toast shows which model used)

### Mobile Optimization

**Functional Benefit**: Sticky generate button, touch-friendly controls, simplified layout for narrow screens.

**User Benefit**: Usable on phone (social media managers working mobile-first).

---

## Template System

### 50+ System Templates (Public)

**Functional Benefit**: Pre-configured form states for common use cases, organized by 11 categories.

**User Benefit**:
- Faster setup than blank form (80% pre-filled)
- Learning tool (see recommended configurations)
- Standardization (consistent output format across campaigns)

### User-Created Templates (Private)

**Functional Benefit**: Save current form state as reusable template.

**User Benefit**:
- Standardize personal workflows
- Repetitive tasks faster (e.g., weekly newsletter, monthly product description)
- Team onboarding (share template link or make public)

### Template Search and Categorization

**Functional Benefit**: Dropdown with search filter and category grouping.

**User Benefit**: Find relevant template quickly (not scrolling through 50+ options alphabetically).

### Prefill Indicators

**Functional Benefit**: Visual badges on fields populated from template.

**User Benefit**: Know which fields to review (pre-filled may need customization) vs. which still empty.

### Placeholder Warning System

**Functional Benefit**: Detects `[text]` syntax in templates, shows warning modal before loading.

**User Benefit**: Users aware they must replace placeholders, prevents generating copy with "[your product name]" literally.

### Mode Compatibility Warning

**Functional Benefit**: Warns when template has populated fields that are hidden in current mode.

**User Benefit**:
- Users can switch to Advanced to see/edit hidden fields
- Informed decision (continue with visible fields only vs. review all)

### Template Update Operation

**Functional Benefit**: Overwrites existing template with current form state.

**User Benefit**: Refine templates over time without creating duplicates (e.g., update "Weekly Newsletter" template with improved configuration).

### Template Deletion

**Functional Benefit**: Hard delete from `pmc_public_saved_templates` table.

**User Benefit**: Remove unused templates (declutter dropdown), no permanent bloat.

---

## Brand Voice System

### 20+ Configuration Fields

**Functional Benefit**: Comprehensive brand voice profile storage (personality traits, tone, sentence style, vocabulary, punctuation rules, advanced style controls).

**User Benefit**: Entire brand guideline document reduced to single dropdown selection.

### AI Voice Analysis

**Functional Benefit**: Paste existing copy, AI extracts voice characteristics, populates all 20+ fields automatically.

**User Benefit**:
- Reverse-engineer competitor voices
- Formalize intuitive brand voice without manual analysis
- Faster than filling form manually

### AI Voice Generation

**Functional Benefit**: Describe brand (e.g., "luxury skincare for women 35-55"), AI generates complete voice profile.

**User Benefit**: Jumpstart new brand voice without copywriting expertise.

### Customer Association

**Functional Benefit**: Each brand voice linked to one customer, dropdown filtered by selected customer.

**User Benefit**:
- Agency users manage multiple client voices (no confusion)
- Correct voice auto-filtered (can't accidentally apply Client A voice to Client B content)

### Multiple Voices per Customer

**Functional Benefit**: Customers can have multiple brand voices (e.g., "Corporate", "Social Media", "Internal").

**User Benefit**: Channel-appropriate voice (LinkedIn professional vs. X casual) within same client.

### Punctuation Rules

**Functional Benefit**: Stores preferences for Oxford comma, contractions, sentence length, exclamation frequency.

**User Benefit**: Editorial guidelines enforced at generation time (no manual proofreading for style).

### Advanced Style Controls (20+ Sub-Fields)

**Functional Benefit**: Granular controls for sentence length, rhythm, formality (1-5 scale), emotional tone, persona, POV, figurative language level, detail depth, vocabulary complexity, structural rules, allowed/forbidden elements.

**User Benefit**:
- Precise voice control (not just "professional" but "professional at formality level 4")
- Complex brand voices captured accurately
- Consistency across different copywriters (AI follows guidelines exactly)

### Preferred/Forbidden Vocabulary

**Functional Benefit**: Arrays of encouraged and discouraged words/phrases.

**User Benefit**:
- Brand-specific terminology ("solutions" vs. "products")
- Avoid competitor language or outdated terms
- Consistent vocabulary across all content

### Prompt Injection

**Functional Benefit**: Entire brand voice profile injected as dedicated section in AI system prompt.

**User Benefit**: Multi-paragraph brand guidelines applied automatically without copy-paste or manual rewriting.

### Precedence Rules

**Functional Benefit**: Form field inputs override brand voice when conflicts exist (e.g., form says "Bold", voice says "Professional" → Bold wins).

**User Benefit**: Brand voice provides baseline, users can deviate for specific campaigns without editing voice configuration.

---

## Workflow Features

### Sequential Step Execution

**Functional Benefit**: Runs multiple operations in order (e.g., Generate → Apply Voice → Create Alternative), automatically.

**User Benefit**:
- Routine multi-step processes automated (no manual "Generate", wait, click "Apply Voice", wait, click "Create Alternative")
- Consistent results (same steps every time)
- Time savings (30 seconds to 2 minutes per generation)

### Three Step Types

**Functional Benefit**: Supports "create alternative copy", "apply voice style", "analyze/compare" operations.

**User Benefit**:
- Cover most common post-generation operations
- Flexible combinations (any order, any count)

### Target Content Selection

**Functional Benefit**: Each step specifies which content to transform (original, alt_1, alt_2, etc.).

**User Benefit**: Complex workflows possible (e.g., apply Voice A to original, apply Voice B to alt_1, compare both).

### Workflow Builder UI

**Functional Benefit**: Drag-and-drop interface for creating workflows without code.

**User Benefit**:
- Visual workflow construction (not text config files)
- Easy reordering (drag to rearrange steps)
- No technical skills required

### Workflow Reusability

**Functional Benefit**: Save workflows, apply to any future generation in Copy Maker.

**User Benefit**:
- One-time setup, unlimited reuse
- Standardize agency deliverables (e.g., "Client Deliverable Workflow" with 5 steps)

### Workflow Duplication

**Functional Benefit**: Copy existing workflow, edit copy without changing original.

**User Benefit**: Create variations of workflows (e.g., "Standard Workflow" vs. "Premium Workflow") without rebuilding from scratch.

### Public Workflows

**Functional Benefit**: Mark workflows as public for visibility to all users (not editable by others).

**User Benefit**:
- Share best practices within team
- New team members use proven workflows
- Future: Community workflow library

### Workflow Permissions (Prepared)

**Functional Benefit**: Grant view or edit access to specific users.

**User Benefit**: Team collaboration (workflow owner grants editor role to colleagues).

---

## Credit System

### Real-Time Token Tracking

**Functional Benefit**: Every API call logs tokens consumed to `pmc_user_tokens_used`, database trigger updates `tokens_remaining` atomically.

**User Benefit**:
- Accurate billing (no "estimated" charges)
- Real-time balance visibility
- No surprise overage charges (hard stop at 0)

### Per-Operation Tracking

**Functional Benefit**: 17 operation types tracked separately (generate_copy, geo_score, seo_metadata, etc.).

**User Benefit**:
- Understand cost breakdown (where tokens spent)
- Optimize workflows (e.g., skip GEO scoring if expensive)

### Model-Specific Cost Calculation

**Functional Benefit**: Different per-token costs for each of 10 AI models.

**User Benefit**: Choose cost/quality tradeoff consciously (DeepSeek 10x cheaper than GPT-4o, but may be sufficient).

### Session Grouping

**Functional Benefit**: All operations within one generation grouped by `session_id`.

**User Benefit**:
- See total cost per generation (not just per API call)
- Dashboard view shows cost per project/session

### Retry with Exponential Backoff

**Functional Benefit**: If token tracking API fails, retries 3 times (1s, 2s, 4s delay).

**User Benefit**: Transient network issues don't cause tracking failure, more reliable billing.

### Hard Stop on Tracking Failure

**Functional Benefit**: If all 3 tracking attempts fail, generation blocked.

**User Benefit**: No untracked usage (no unpaid consumption, clear billing).

### Balance Enforcement

**Functional Benefit**: `checkUserAccess()` verifies `tokens_remaining > 0` before every generation.

**User Benefit**:
- No overspending beyond quota
- Predictable costs (can't accidentally run up bill)

### Negative Balance Display

**Functional Benefit**: If race condition causes negative balance, dashboard shows actual negative number (not capped at 0).

**User Benefit**: Transparency (users see exact state, not hidden debt).

---

## Dashboard Features

### Token Usage Tab (Date Range Filtering)

**Functional Benefit**: Display token usage for selected date range (default 30 days, custom ranges supported).

**User Benefit**:
- Monthly usage review (understand spending patterns)
- Quarter-over-quarter comparison
- Isolate usage spikes (what caused high usage?)

### Session-Grouped Display

**Functional Benefit**: Groups API calls by `session_id`, shows aggregated stats per session.

**User Benefit**:
- Understand cost per generation (not lost in individual API call noise)
- Identify expensive generations

### Expandable Session Details

**Functional Benefit**: Click session to see individual API calls (model, operation type, tokens, cost).

**User Benefit**: Drill down into cost breakdown (why was this generation 5K tokens vs. usual 1K?).

### Usage Statistics Summary

**Functional Benefit**: Displays total tokens, total cost, API call count for selected range.

**User Benefit**: Quick overview without manual calculation.

### CSV Export

**Functional Benefit**: Export usage data as CSV file.

**User Benefit**:
- Import into Excel/Sheets for custom analysis
- Accounting records
- Invoice reconciliation

### Admin User Filter

**Functional Benefit**: Admins can view any user's usage (not just own).

**User Benefit**: Support troubleshooting, billing disputes, usage audits.

### Saved Outputs Tab (Search and Filters)

**Functional Benefit**: Search by title/description, filter by customer, date range, tags.

**User Benefit**:
- Find past outputs quickly (not scrolling through hundreds)
- Organize by client (agency use case)

### Saved Output View

**Functional Benefit**: Opens modal with complete input data, output data, all metadata.

**User Benefit**: Reference past briefs, learn from successful configurations.

### Saved Output Load

**Functional Benefit**: Restores saved output to Copy Maker form (all inputs, all outputs).

**User Benefit**:
- Edit and regenerate past outputs
- Start from proven configuration

### Favorite Flag

**Functional Benefit**: Toggle star icon to mark outputs as favorites, filter to show only favorites.

**User Benefit**: Bookmark best outputs, quickly access top-performing copy.

---

## Admin Features

### User Creation (Edge Function)

**Functional Benefit**: Create user accounts programmatically with email, password, credits, dates.

**User Benefit (Admin)**: Onboard clients or team members without waiting for self-service signup.

### User Update (Edge Function)

**Functional Benefit**: Modify user quotas, subscription dates, name, any field in `pmc_users`.

**User Benefit (Admin)**:
- Adjust quotas for high-usage clients
- Extend subscriptions
- Correct data entry errors

### All-Users Token Usage View

**Functional Benefit**: Admin dashboard shows usage across all users, not just admin's own.

**User Benefit (Admin)**:
- Monitor platform-wide usage
- Identify high-cost users (pricing tier candidates)
- Detect abuse or unusual patterns

### All-Users CSV Export

**Functional Benefit**: Export all users' usage data as single CSV.

**User Benefit (Admin)**:
- Platform usage reports for investors/stakeholders
- Aggregate billing for enterprise clients

### Beta Registrations Count

**Functional Benefit**: Display count of beta program signups from `beta_register` table.

**User Benefit (Admin)**: Track pre-launch interest, plan onboarding capacity.

### System Template Creation

**Functional Benefit**: Admins can create templates with `is_public = true`, visible to all users.

**User Benefit (Admin)**: Provide starter templates for entire user base, reduce support load.

### Pricing Table Management (Prepared)

**Functional Benefit**: CRUD operations on `llm_model_pricing` and `llm_billing_rules` tables.

**User Benefit (Admin)**: Adjust pricing dynamically as AI providers change rates, no code deploy needed.

---

## Technical Features

### Row Level Security (RLS)

**Functional Benefit**: Database-enforced access control on every table, every query.

**User Benefit**:
- Users cannot access other users' data (even via API manipulation)
- Security at database layer (not just application layer)

### Foreign Key Constraints

**Functional Benefit**: All relationships enforced in database schema (e.g., `session_id` must reference valid session).

**User Benefit**: Data integrity guaranteed, no orphaned records, reliable reporting.

### Database Triggers

**Functional Benefit**: `sync_tokens_remaining` trigger automatically updates balance after every token usage insert.

**User Benefit**: Balance always accurate, no manual synchronization, no stale data.

### Session Cleanup System

**Functional Benefit**: Scheduled job deletes empty sessions after 30 days (prepared, not actively running).

**User Benefit**: Database stays lean (faster queries), no accumulation of test sessions.

### URL Analysis Caching

**Functional Benefit**: Analyzed competitor URLs stored in `pmc_url_analysis_cache` with expiration.

**User Benefit**: Faster subsequent analyses of same URL, lower Firecrawl API costs.

### Orphaned Record Cleanup

**Functional Benefit**: Migration deleted token usage records with invalid `session_id` before adding constraint.

**User Benefit**: Clean data migration (no referential integrity errors), accurate historical reporting.

### Free Trial Auto-Start

**Functional Benefit**: On user creation, `start_date` and `until_date` automatically set for 30-day trial.

**User Benefit**: New users can immediately use product (no waiting for manual activation).

### Welcome Email Trigger

**Functional Benefit**: Database trigger calls Edge Function to send welcome email on user creation.

**User Benefit**: Automatic onboarding email (no manual sending), professional first impression.

### Google OAuth Integration

**Functional Benefit**: Users can sign up/login with Google account (optional).

**User Benefit**: Faster signup (no password to create/remember), fewer support tickets for password resets.

### Google OAuth Blocking

**Functional Benefit**: RLS policy prevents Google OAuth signups unless user pre-approved by admin.

**User Benefit (Admin)**: Controlled access (no random signups), invitation-only or closed beta mode.

### Supabase Edge Functions

**Functional Benefit**: Serverless API endpoints for admin operations, token tracking, email sending.

**User Benefit**: Reliable backend without managing servers, automatic scaling.

### Model Validation Modal

**Functional Benefit**: If user's quota doesn't cover selected model, shows modal listing available models.

**User Benefit**: Clear error (not just "insufficient credits"), actionable solution (switch to cheaper model).

### Token Limit Modal

**Functional Benefit**: When `tokens_remaining <= 0`, shows modal explaining limit reached.

**User Benefit**: Clear messaging (not generic error), call-to-action for upgrade or support contact.

---

## Summary

**Total benefits documented**: 150+

**Benefit categories**:
- Time savings (automation, templates, workflows)
- Cost optimization (model selection, token tracking)
- Quality improvement (scoring, comparison, brand voice)
- Consistency (templates, brand voices, workflows)
- Flexibility (multi-mode, multi-model, multi-variant)
- Transparency (prompt viewing, usage dashboard, real-time balance)
- Security (RLS, constraints, authentication)
- Usability (mobile optimization, language detection, fallback systems)

**Mapping methodology**: Every feature mapped to (1) what it does mechanically, (2) why that matters to users practically.

**No marketing language**: No "revolutionary", "game-changing", "best-in-class". Only mechanical benefits and practical value.

**No competitor comparisons**: Benefits stand on their own, not relative to other tools.

