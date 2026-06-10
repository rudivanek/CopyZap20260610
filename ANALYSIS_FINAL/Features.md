# CopyZap Features Documentation

**Document Type**: Technical Features Inventory
**Date**: 2026-01-30
**Purpose**: Exhaustive documentation of every feature, control, toggle, validation, and system behavior in CopyZap as currently implemented.

---

## Table of Contents

1. [Main Application Modules](#main-application-modules)
2. [Interface Modes](#interface-modes)
3. [Input Fields and Controls](#input-fields-and-controls)
4. [Generation Features](#generation-features)
5. [Output Actions](#output-actions)
6. [Copy Snap Module](#copy-snap-module)
7. [Template System](#template-system)
8. [Brand Voice System](#brand-voice-system)
9. [Workflow Automation](#workflow-automation)
10. [Credit System](#credit-system)
11. [Dashboard Features](#dashboard-features)
12. [Admin Features](#admin-features)
13. [Validation and Error Handling](#validation-and-error-handling)
14. [Data Persistence](#data-persistence)
15. [Authentication and Security](#authentication-and-security)

---

## Main Application Modules

### Copy Maker (Primary Module)

**Purpose**: Comprehensive AI copywriting tool with template-driven generation
**Location**: `/src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`

**Core capabilities**:
- Generate marketing copy from business descriptions
- Improve and refine existing marketing content
- Create 1-10 variants in single generation
- Apply 50+ pre-built templates
- Save and reuse custom configurations
- Export outputs as HTML or copy as Markdown
- Track all usage for billing

**Two operational modes**:
1. **Create Mode**: Generate entirely new copy from inputs
2. **Improve Mode**: Enhance and refine existing copy text

**What it solves**: Eliminates blank-page writer's block, ensures brand consistency, accelerates content production timelines.

### Copy Snap (Quick Transform Module)

**Purpose**: Single-field rapid text transformation tool
**Location**: `/src/components/CopySnap.tsx`

**Core capabilities**:
- Three transformation modes: Improve, Answer, Question
- Dual-model architecture (DeepSeek primary, GPT-4o fallback)
- Language-aware output (auto-detects input language)
- Mobile-optimized interface with sticky controls
- Returns best result + 2 alternatives

**What it solves**: Quick edits without full form configuration, rapid social media responses, on-the-fly content refinement.

**Constraint**: No template support, no brand voice application, no SEO generation.

---

## Interface Modes

### Quick Mode

**Visibility**: 10 fields only
**Target users**: First-time users, rapid generation
**Fields shown**: Project Description, Product/Service Name, Business Description/Original Copy, Target Audience, Language, Tone, Word Count, Key Message, Call to Action, Special Instructions

**What it solves**: Reduces cognitive load for new users, enables faster generation without advanced configuration.

**Constraint**: Brand voice, output structure, and 30+ advanced controls hidden but retained in state if previously populated.

### Standard Mode

**Visibility**: 20+ fields
**Target users**: Regular users needing brand consistency
**Additional fields**: Customer selection, Brand Voice, Keywords, Context, Competitor URLs, Optional Features (SEO, GEO, scoring)

**What it solves**: Balances power and simplicity, exposes brand voice for consistency, shows SEO controls.

**Constraint**: Industry/niche, reader funnel stage, tone level slider, and 20+ power-user fields remain hidden.

### Advanced Mode

**Visibility**: All 40+ fields
**Target users**: Power users, agencies, maximum control
**Additional fields**: Industry/Niche, Reader Funnel Stage, Tone Level slider, Competitor Copy Text, Reader Sophistication, Desired Emotion, Language Style Constraints, Preferred Writing Style

**What it solves**: Exposes all available controls for precise prompt engineering, enables complete customization.

**Constraint**: Interface complexity may overwhelm casual users (why other modes exist).

**Mode persistence**: User's mode selection stored in localStorage, retained across sessions.

---

## Input Fields and Controls

### Required Fields (Enforced by UI)

**Project Description**
- Type: Text input
- Purpose: Internal organization label for sessions
- Validation: No minimum length (LIGHT validation - stored but not enforced)
- Used in: Session naming, dashboard display
- Constraint: Not sent to AI model

**Product/Service Name**
- Type: Text input
- Purpose: Primary subject of marketing copy
- Validation: No minimum length
- Used in: Prompt construction, session naming
- Auto-populated: From Project Description if empty

**Business Description (Create Mode)**
- Type: Textarea
- Purpose: Core input describing business, product, or service
- Validation: No minimum length
- Used in: Primary prompt context
- Constraint: Only visible in Create Mode

**Original Copy (Improve Mode)**
- Type: Textarea
- Purpose: Existing copy text to improve
- Validation: No minimum length
- Used in: Primary prompt context
- Constraint: Only visible in Improve Mode, replaces Business Description

### Language Control

**Options**: English, Spanish, French, German, Italian, Portuguese
**Default**: English
**Implementation**: Dropdown select
**Effect**: Sets output language via system prompt instruction
**Constraint**: AI model must support target language (all supported models do)

### Tone Control

**Options**: Professional, Friendly, Bold, Minimalist, Creative, Persuasive
**Default**: Friendly
**Implementation**: Dropdown select
**Effect**: Injects tone instruction into system prompt
**Interaction**: Overrides brand voice tone if both specified
**Constraint**: Subjective interpretation by AI model

### Word Count Control

**Options**: Short (50-100), Medium (100-200), Long (200-400), Custom
**Default**: Medium (100-200)
**Custom range**: 1-100000 words
**Implementation**: Dropdown + number input
**Effect**: Sets target word count for generation
**Enforcement**: See Word Count Enforcement section

**AI Decide Word Count**
- Type: Checkbox
- Effect: Removes word count instruction from prompt, lets AI determine optimal length
- Constraint: Disables prioritize word count and tolerance settings
- Use case: When optimal length unknown or varies by section

### Target Audience

**Type**: Text input
**Purpose**: Define demographic, psychographic, or behavioral audience characteristics
**Validation**: No minimum length
**Used in**: Prompt construction for audience-appropriate messaging
**Examples**: "Small business owners", "Tech-savvy millennials", "Enterprise decision-makers"

### Key Message

**Type**: Text input
**Purpose**: Primary message or value proposition
**Validation**: No minimum length
**Used in**: Prompt emphasis on core communication goal
**Constraint**: Not enforced programmatically in output

### Call to Action (CTA)

**Type**: Text input
**Purpose**: Desired action for reader to take
**Validation**: No minimum length
**Used in**: Prompt instruction for CTA inclusion
**Examples**: "Sign up for free trial", "Request a demo", "Shop now"

### Brand Values

**Type**: Text input
**Purpose**: Core brand principles and ethos
**Validation**: No minimum length
**Used in**: Prompt context for value-aligned messaging
**Examples**: "Sustainability, Innovation, Customer-first"

### Keywords

**Type**: Text input
**Purpose**: SEO keywords to naturally integrate
**Validation**: No minimum length
**Used in**: Prompt instruction for keyword inclusion
**Constraint**: Integration is prompt-based, not programmatically enforced

**Force Keyword Integration Toggle**
- Effect: Strengthens prompt language to mandate keyword presence
- Constraint: Still not programmatically validated in output

### Context

**Type**: Textarea
**Purpose**: Additional situational or background information
**Validation**: No minimum length
**Used in**: Prompt context section
**Use cases**: Market conditions, competitive positioning, launch timing

### Page Type (Standard/Advanced)

**Options**: Homepage, About, Services, Contact, Other
**Default**: Homepage
**Purpose**: Tailor copy style to page type conventions
**Used in**: Prompt instruction for appropriate structure and tone

### Section (Standard/Advanced)

**Options**: Hero Section, Benefits, Features, Services, About, Testimonials, FAQ, Full Copy, Other
**Default**: Full Copy
**Purpose**: Focus generation on specific page section
**Used in**: Prompt instruction for section-appropriate content

### Customer Selection (Standard/Advanced)

**Type**: Dropdown with inline add
**Purpose**: Associate generation with specific client/customer
**Data source**: `pmc_customers` table
**Effects**:
- Filters brand voice dropdown
- Links session to customer
- Enables customer-filtered dashboard views
- Organizes outputs by client

**Default customers**: 8 seeded (General, Small Business, Enterprise, E-commerce, Education, Healthcare, Technology, Non-profit)

**Inline add**: Opens modal to create new customer without leaving form

### Brand Voice Selection (Standard/Advanced)

**Type**: Dropdown
**Purpose**: Apply pre-configured brand voice characteristics
**Data source**: `pmc_public_brand_voices` table filtered by selected customer
**Effect**: Injects comprehensive voice profile into system prompt
**Contents**: 20+ configuration parameters (see Brand Voice System section)
**Constraint**: Only shows voices for selected customer

### Output Structure (Standard/Advanced)

**Type**: Multi-select with drag-and-drop reordering
**Options**: 20 section types (Problem, Solution, Benefits, Features, Bullet Points, Numbered List, Q&A Format, FAQ JSON, Call to Action, Testimonial, Comparison Table, Statistics, Case Study, Quote, Summary, Introduction, Conclusion, Header 1, Header 2, Header 3)
**Purpose**: Define exact structure and order of output sections
**Implementation**: `react-beautiful-dnd` for drag-and-drop
**Per-section word count**: Optional word count per section
**Include Section Titles**: Checkbox to show/hide section headings in output

**What it solves**: Predictable output structure, consistent formatting across generations, precise control over content organization.

**Constraint**: AI may not perfectly adhere to structure if unrealistic (e.g., 10-word FAQ with 5 questions).

### Industry/Niche (Advanced)

**Type**: Dropdown
**Options**: 27 industries (SaaS, E-commerce, Healthcare, Finance, Education, Real Estate, Marketing Agency, Legal Services, Consulting, Non-Profit, Retail, Manufacturing, Technology, Travel & Hospitality, Food & Beverage, Fitness & Wellness, Entertainment, Construction, Automotive, Energy, Telecommunications, Insurance, Pharmaceuticals, Agriculture, Fashion & Apparel, Publishing, Other)
**Purpose**: Context for industry-specific language and conventions
**Used in**: Prompt context section

### Target Audience Pain Points (Advanced)

**Type**: Textarea
**Purpose**: Specific problems, frustrations, or challenges audience faces
**Validation**: No minimum length
**Used in**: Prompt emphasis on problem-solution framing

### Reader Funnel Stage (Advanced)

**Type**: Dropdown
**Options**: Awareness, Interest, Consideration, Decision, Retention
**Purpose**: Tailor messaging to buyer journey stage
**Used in**: Prompt instruction for stage-appropriate content depth and persuasion tactics

### Competitor URLs (Advanced)

**Type**: 3 text inputs
**Purpose**: Reference competitors for differentiation
**Validation**: No URL format validation
**Used in**: Prompt context (URLs listed as strings, not fetched)
**Constraint**: Not automatically analyzed or fetched

**URL Analysis Feature** (separate):
- Firecrawl integration for deep scraping
- Caches results in `pmc_url_analysis_cache`
- Extracts headlines, copy, structure
- Populates form fields automatically

### Competitor Copy Text (Advanced)

**Type**: Textarea
**Purpose**: Paste competitor copy for reference or contrast
**Validation**: No minimum length
**Used in**: Prompt context for differentiation

### Reader Sophistication (Advanced)

**Type**: Dropdown
**Options**: Unaware, Problem-Aware, Solution-Aware, Most-Aware
**Purpose**: Adjust copy complexity and depth based on audience knowledge
**Used in**: Prompt instruction for appropriate explanation level
**Framework**: Eugene Schwartz's awareness stages

### Preferred Writing Style (Advanced)

**Type**: Dropdown
**Options**: Storytelling, Direct & Concise, Educational, Conversational, Data-Driven, Emotional Appeal, Humorous, Authoritative
**Purpose**: Set narrative approach
**Used in**: System prompt style instruction
**Interaction**: Overrides brand voice writing style if both specified

### Language Style Constraints (Advanced)

**Type**: Multi-checkbox
**Options**: Avoid jargon, Avoid passive voice, Use short sentences, Use active voice, Include statistics, Include questions, Include power words, Conversational tone
**Purpose**: Fine-grained style controls
**Used in**: System prompt constraints section
**Effect**: Each selected constraint adds explicit instruction

### Tone Level Slider (Advanced)

**Type**: Range slider (0-100)
**Default**: 50
**Purpose**: Adjust intensity of selected tone (e.g., Professional 0 = formal, Professional 100 = ultra-professional)
**Used in**: Prompt instruction with numeric scale
**Constraint**: Subjective interpretation by AI

### Desired Emotion (Advanced)

**Type**: Text input
**Purpose**: Target emotional response from reader
**Validation**: No minimum length
**Used in**: Prompt instruction for emotional framing
**Examples**: "Excitement", "Trust", "Urgency", "Curiosity"

### Excluded Terms (Advanced)

**Type**: Textarea
**Purpose**: Words/phrases to avoid in output
**Validation**: No minimum length
**Used in**: System prompt constraint
**Constraint**: Not programmatically validated, prompt-based only

### Special Instructions

**Type**: Textarea
**Purpose**: Free-form custom instructions
**Validation**: No minimum length
**Used in**: Appended to end of user prompt
**Priority**: Highest (appears last, overrides earlier instructions)
**Use cases**: Specific requirements not covered by other fields, last-minute adjustments

---

## Generation Features

### AI Model Selection

**Available models**: 10 options
1. Claude Sonnet 4.5 (default)
2. Claude Haiku 4.5
3. Claude Opus 4.5
4. ChatGPT-4o Latest
5. GPT-4o
6. GPT-4 Turbo
7. GPT-3.5 Turbo
8. DeepSeek Chat
9. Grok 4 Latest
10. Gemini 2.0 Flash

**Selection interface**: Dropdown in form
**Effect**: Determines which API endpoint and model name used
**Fallback behavior**: If primary model fails, automatic fallback to alternative model with user notification

**Model-specific settings**:
- Max tokens: 8K-64K depending on model
- Temperature: 0.5 for ≤150 words, 0.7 for >150 words
- Response format: JSON for some operations, text for others

**Cost tracking**: Model actually used (including fallback) tracked for accurate billing

### Multi-Variant Generation

**Control**: "Create Variants" input (1-10)
**Default**: 1
**Implementation**: Single API call with `num_variants` parameter
**Effect**: Generates N different versions of same prompt in parallel
**Output**: N cards displayed in results, each independently actionable

**What it solves**: A/B testing, style variety, avoiding single-point-of-failure generations.

**Constraint**: All variants share same configuration, cannot vary inputs across variants.

### Word Count Enforcement

**Toggle**: "Prioritize Word Count"
**Default**: Disabled

**Strict Mode (Enabled)**:
- Tolerance: ±2% of target word count
- Max revisions: 2 attempts
- Process:
  1. Generate copy
  2. Count words
  3. If outside tolerance, generate revision prompt ("expand by X%" or "contract by Y%")
  4. Re-generate with revision instruction
  5. Repeat once if still outside tolerance
  6. Accept final result regardless

**Flexible Mode (Disabled)**:
- Tolerance: Configurable (default ±20% or ±30% depending on size)
- Revisions: None
- Process: Accept first generation regardless of word count

**Word Count Tolerance Percentage**:
- Type: Number input
- Default: 2% (strict) or 20-30% (flexible)
- Effect: Adjusts acceptable variance

**"Adhere to Little Word Count" Toggle**:
- Purpose: Special handling for very short content (<100 words)
- Effect: More aggressive tolerance settings
- Default: 20% tolerance for short content

**What it solves**: Length requirements for ad platforms, character limits, brief specifications.

**Constraint**: Revision prompts may conflict with other instructions, causing quality drift.

### SEO Metadata Generation

**Toggle**: "Generate SEO Metadata"
**Default**: Disabled

**When enabled, generates**:
- URL Slugs (1-5 variants)
- Meta Descriptions (1-5 variants)
- H1 Variants (1-5 variants)
- H2 Variants (1-10 variants)
- H3 Variants (1-10 variants)
- OG Titles (1-5 variants)
- OG Descriptions (1-5 variants)

**Variant count controls**: Individual number inputs for each element type

**Implementation**: Separate API call after primary generation completes
**Operation type**: `seo_metadata` (tracked separately)

**On-Demand Alternative**: "Generate SEO" button on output card to generate later without regenerating primary copy

**What it solves**: Complete SEO package in single generation, consistent metadata across elements.

**Constraint**: Not tailored to specific CMS or platform requirements.

### Content Scoring

**Toggle**: "Generate Scores"
**Default**: Disabled

**When enabled, scores copy on**:
- Clarity (1-10)
- Persuasiveness (1-10)
- Engagement (1-10)
- SEO Optimization (1-10)
- Overall Score (average)

**Implementation**: Separate API call with copy as input
**Operation type**: `content_scoring`

**On-Demand Alternative**: "Generate Score" button on output card

**Display**: Colored badges (red/yellow/green based on score thresholds)

**What it solves**: Objective quality assessment, identify weak areas for revision.

**Constraint**: Scores subjective, AI-generated (not algorithmic).

### GEO (Generative Engine Optimization) Score

**Toggle**: "Generate GEO Score"
**Default**: Disabled

**Purpose**: Assess copy optimization for AI search engines (ChatGPT, Perplexity, etc.)

**Scoring dimensions**:
- Citability (1-10): How likely AI cites your content
- Summarizability (1-10): How well AI can extract key points
- Factual Density (1-10): Information richness
- Authority Signals (1-10): Credibility indicators
- Structured Data Readiness (1-10): Machine-readable format
- Overall GEO Score (average)

**Implementation**: Separate API call
**Operation type**: `geo_score`

**Additional options when enabled**:
- "Enhance for GEO": Strengthen copy for AI search engines
- "Add TL;DR Summary": Prepend executive summary
- "GEO Regions": Target geographic markets
- "Location": Specific location context

**What it solves**: Future-proofs content for AI-driven search landscape.

**Constraint**: GEO best practices evolving, scoring criteria may change.

### FAQ Schema Generation

**Toggle**: "FAQ Schema Enabled"
**Default**: Disabled

**Purpose**: Generate structured FAQ JSON-LD for search engines

**Implementation**: Extracts or generates Q&A pairs from copy, formats as JSON-LD schema

**Output**: Displays in modal with copy button

**Use case**: Add to website `<head>` for rich search results

**Constraint**: Requires copy with identifiable questions/answers or Q&A structure.

### Quick Setup Wizard

**Trigger**: "Quick Prompt" button in header
**Purpose**: AI-assisted form configuration via natural language conversation

**Flow**:
1. Select mode (Create, Improve, Polish)
2. Answer 4-6 questions about project
3. AI generates complete form configuration
4. User reviews and edits
5. Apply to form or Apply & Generate

**What it solves**: Blank-page paralysis, unfamiliarity with all fields, faster configuration.

**Constraint**: Requires additional AI call for configuration generation (operation type: `template_suggestion`).

---

## Output Actions

### Primary Output Card Actions

**Copy to Clipboard**
- Format: Plain text with markdown
- Implementation: Browser Clipboard API
- Feedback: Toast notification

**Copy HTML**
- Format: HTML with styled headings, lists, paragraphs
- Implementation: Markdown-to-HTML conversion
- Use case: Paste into CMS or email editor

**Replace Input**
- Effect: Loads output text into "Original Copy" field, switches to Improve Mode
- Use case: Iterative refinement workflows
- Constraint: Overwrites current input (no undo)

**Generate Alternative Copy**
- Effect: Creates new variant with "create alternative version" instruction
- Implementation: Separate API call with original copy as context
- Operation type: `generate_alternative`
- Output: New card added to results

**Apply Voice Style**
- Options: 7+ voice personas (Humanize, Alex Hormozi, Steve Jobs, Seth Godin, Gary Vee, Donald Miller, Eugene Schwartz) + all brand voices
- Effect: Rewrites copy in selected voice style
- Implementation: Separate API call
- Operation type: `voice_style_analysis`
- Output: New card added with source link

**Generate Score**
- Effect: Generates content scores on-demand if not already present
- Implementation: Separate API call
- Operation type: `content_scoring`
- Display: Updates card with score badges

**Modify Content**
- Trigger: Button opens modal with instruction textarea
- Effect: Applies custom modification instruction to copy
- Implementation: Separate API call with modification prompt
- Operation type: `ai_content_modification`
- Output: New card added with "Modified" label

**Generate FAQ Schema**
- Effect: Extracts Q&A and formats as JSON-LD
- Implementation: Separate API call
- Display: Modal with JSON code and copy button

**Generate SEO Metadata**
- Effect: Generates all SEO elements on-demand
- Implementation: Separate API call
- Operation type: `seo_on_demand`
- Display: Expands card to show SEO section

### Comparison Features

**Compare Outputs (Grok Analysis)**
- Trigger: "Compare" button when 2+ outputs exist
- Effect: Sends all outputs to Grok for comparative analysis
- Implementation: Separate API call to Grok API
- Operation type: `grok_comparison`
- Output: Modal with detailed comparison table
- Analysis dimensions: Tone, Clarity, Persuasiveness, Target Audience Fit, SEO, Strengths/Weaknesses, Recommendations

**What it solves**: Objective multi-output comparison, data-driven selection.

**Constraint**: Requires Grok API access, additional token cost.

### Output Management

**Clear All Outputs**
- Effect: Removes all generated cards from results section
- Confirmation: Required
- State: Output data deleted from memory, not recoverable
- Constraint: Does not delete saved sessions (those persist in database)

**Save Output to Dashboard**
- Trigger: "Save" button on output card
- Effect: Opens modal to enter title, description, tags
- Storage: `pmc_saved_outputs` table
- Includes: All input_data (JSONB), all output_data (JSONB), session link
- Access: Dashboard > Saved Outputs tab

**Export Options**

**Copy as Markdown**
- Effect: Copies all outputs, inputs, and metadata as formatted Markdown to clipboard
- Format: Clean Markdown with headers, lists, code blocks
- Use case: Quick sharing to Notion, Slack, GitHub, documentation tools

**Export as HTML**
- Effect: Downloads standalone HTML file with all outputs, inputs, and metadata
- Format: Professional layout with inline CSS styling, headers, sections
- Use case: Client deliverables, documentation, archival (can print to PDF from browser)

**View Prompts**
- Effect: Opens modal showing complete system prompt and user prompt sent to AI
- Purpose: Transparency, debugging, learning prompt engineering
- Constraint: Shows final prompts (after all processing), not intermediate steps

---

## Copy Snap Module

### Improve Mode

**Purpose**: Enhance existing copy with specific goal and platform context

**Controls**:
- **Goal**: Clearer / More Persuasive / Shorter / Punchier
- **Platform**: General / X (Twitter) / LinkedIn / Email
- **Length**: Short / Same / Longer

**Output structure**:
- Best Result (primary output)
- Alternative 1
- Alternative 2
- 3 Expert Tips (improvement suggestions)

**What it solves**: Quick polishing without full form setup, platform-specific optimization.

### Answer Mode

**Purpose**: Generate replies to questions, comments, or posts

**Controls**:
- **Style**: Helpful / Friendly / Confident / Witty / Direct
- **Stance**: Neutral / Agree / Disagree
- **Length**: Short / Medium / Long

**Output structure**:
- Best Reply (primary)
- Alternative Reply 1
- Alternative Reply 2

**What it solves**: Social media engagement, customer support responses, comment moderation.

### Question Mode

**Purpose**: Generate strategic questions to ask about content

**Controls**:
- **Type**: Clarify / Challenge / Explore / Convert
- **Count**: 1 / 3 / 5 questions
- **Directness**: Soft / Direct

**Output structure**:
- Numbered list of questions

**What it solves**: Audience engagement, content ideation, sales qualification.

### Universal Copy Snap Features

**Special Instructions**
- Type: Textarea
- Purpose: Add custom context or requirements
- Priority: High (applied to all modes)

**Human Tone Mode**
- Type: Checkbox
- Effect: Instructs AI to write more naturally, less polished
- Use case: Social media, casual communication
- Constraint: "Natural" is subjective to AI interpretation

**Language Detection**
- Automatic: Detects input text language
- Effect: Responds in same language
- Supported: All languages AI models support
- Fallback: English if detection fails

**Mobile Optimization**
- Sticky Generate button (always visible during scroll)
- Touch-friendly button sizes
- Simplified layout for narrow screens

**Clear Input**
- Single-click to reset input field
- Does not clear outputs (those remain visible)

**Replace Input with Output**
- Effect: Loads selected output back into input field
- Use case: Iterative refinement
- Constraint: Overwrites current input

**Regenerate**
- Effect: Re-runs current mode with same settings
- Use case: Get different variations
- Constraint: Uses new tokens (separate API call)

**Copy Buttons**
- Present on all outputs (best + alternatives)
- Format: Plain text
- Feedback: Toast notification

### Copy Snap Architecture

**Dual-Model System**:
1. **Primary**: DeepSeek V3
   - Reason: 5-10x cheaper than GPT
   - Speed: Ultra-fast responses
   - Quality: Comparable for short-form content

2. **Fallback**: GPT-4o
   - Triggers: DeepSeek API errors, rate limits, or failures
   - Automatic: No user intervention required
   - Transparent: Toast shows which model used

**What it solves**: Cost optimization without sacrificing reliability, graceful degradation.

**Constraint**: Fallback adds latency (sequential, not parallel).

### Copy Snap Error Handling

**Parse Error Recovery**
- Scenario: AI returns malformed JSON
- Behavior: Display raw text output with "Retry" button
- User action: Can retry or use raw output
- What it solves: Prevents complete failure on edge-case AI responses

**Rate Limit Handling**
- Scenario: Model rate limit exceeded
- Behavior: Automatic fallback to alternative model
- Notification: Toast informs user of switch

**Network Error**
- Scenario: API unreachable
- Behavior: Error message with retry option
- Timeout: 120 seconds per request

---

## Template System

### System Templates (Public)

**Count**: 50+ templates
**Categories**: 11 (Advertising, Brand, Content Marketing, E-commerce, Email, Sales, SEO, Social Media, Tech/SaaS, Website Pages, Copywriting Frameworks)
**Storage**: `pmc_public_saved_templates` table with `is_public = true`
**Created by**: Admins
**Visibility**: All users

**Examples**:
- Google Search Ad
- Landing Page (Lead Gen)
- Email Newsletter
- Product Description
- SEO Article
- LinkedIn Post
- Cold Sales Email
- Homepage Copy
- Meta Ads (Primary Headline)
- Blog Post (How-To Guide)

**What each contains**:
- Complete FormState snapshot (all field values)
- Placeholders using `[text]` syntax for user customization
- Pre-configured toggles (SEO, scoring, word count)
- Output structure definitions
- Recommended AI model
- Category and description

### User Templates (Private)

**Creation**: "Save as Template" button in Copy Maker
**Storage**: `pmc_public_saved_templates` table with `is_public = false`, `user_id` set
**Visibility**: Only creator (unless shared via permissions - not implemented)

**Purpose**: Reuse custom configurations, standardize workflows, speed up repetitive tasks.

### Template Loading

**Interface**: Dropdown in header with search
**Loading flow**:
1. User selects template
2. If placeholders present, warning modal shown
3. User confirms awareness
4. Form populated with template data
5. Prefilled fields marked with badge
6. User edits as needed before generating

**Prefill Indicators**
- Visual badge on field label
- Shows which fields came from template
- Helps users know what to review

**Mode Compatibility**
- Templates created in Advanced mode may have fields invisible in Quick/Standard
- Warning modal shown if hidden fields populated
- User can: (a) Continue with visible fields only, (b) Switch to Advanced mode

**What it solves**: Consistency across projects, time savings, onboarding for new team members.

### Template Operations

**Save as New Template**
- Trigger: "Save as Template" button
- Modal: Name, description, category, public/private toggle
- Effect: Creates new row in `pmc_public_saved_templates`
- Constraint: No template versioning or update tracking

**Update Existing Template**
- Trigger: "Update Template" button (when template already loaded)
- Effect: Overwrites existing template with current form state
- Confirmation: Required
- Constraint: Irreversible (no version history)

**Delete Template**
- Trigger: Delete button in template management (not in main form)
- Confirmation: Required
- Effect: Hard delete from database
- Constraint: Cannot delete system templates (admin-only)

---

## Brand Voice System

**Table**: `pmc_public_brand_voices`
**Purpose**: Centralized brand voice configurations for consistent copywriting across all content

### Creation Methods

**1. AI Analysis**
- User pastes existing brand copy (ads, website, emails)
- AI extracts voice characteristics
- Generates complete brand voice profile
- User reviews and saves

**2. AI Generation**
- User describes brand (e.g., "Fun, youthful activewear brand")
- AI generates comprehensive voice profile
- User reviews and saves

**3. Manual Creation** (UI not implemented)
- User fills out all fields manually
- Use case: Import existing brand guidelines

### Core Configuration Fields

**Name and Description**
- Name: Label for voice (e.g., "Acme Corp - Corporate", "Acme Corp - Social")
- Description: Internal notes

**Personality Traits** (Array)
- Examples: Confident, Approachable, Innovative, Trustworthy, Bold, Playful, Professional
- Effect: Listed in system prompt as brand personality

**Tone Style**
- Overall tone description (e.g., "Professional yet warm", "Edgy and disruptive")
- Effect: Primary tone instruction

**Sentence Style**
- Sentence construction preferences (e.g., "Short and punchy", "Flowing and descriptive")
- Effect: Influences sentence length and structure

**Preferred Vocabulary** (Array)
- Words/phrases to favor (e.g., "Transform", "Empower", "Solution")
- Effect: Encourages usage in copy

**Forbidden Terms** (Array)
- Words/phrases to avoid (e.g., "Cheap", "Just", "Synergy")
- Effect: Discourages usage in copy
- Constraint: Not programmatically validated (prompt-based only)

**CTA Style**
- Call-to-action preferences (e.g., "Action-oriented and urgent", "Soft and inviting")
- Effect: Influences CTA phrasing

### Punctuation Rules (JSONB)

- `use_oxford_comma`: boolean
- `prefer_short_sentences`: boolean
- `max_sentence_length`: number (characters)
- `use_contractions`: boolean (e.g., "don't" vs "do not")
- `exclamation_frequency`: 'rare' | 'moderate' | 'frequent'

### Advanced Style Controls (JSONB)

**sentence_length**
- Options: 'short' | 'medium' | 'long' | 'varied'
- Effect: Average sentence length target

**rhythm**
- Options: 'staccato' | 'smooth' | 'energetic' | 'calm'
- Effect: Pacing and flow of prose

**formality**
- Scale: 1-5 (1 = very casual, 5 = highly formal)
- Effect: Language register and word choice

**emotional_tone** (Array)
- Examples: Inspiring, Reassuring, Exciting, Thoughtful
- Effect: Emotional coloring of copy

**persona**
- Options: 'mentor' | 'friend' | 'expert' | 'leader' | 'storyteller' | 'guide' | 'innovator'
- Effect: Voice perspective and relationship to reader

**pov (Point of View)**
- Options: 'first_person' | 'second_person' | 'third_person' | 'brand_voice'
- Effect: Narrative perspective
- Examples: "I/we" vs "you" vs "they" vs brand name

**figurative_level**
- Options: 'literal' | 'balanced' | 'metaphorical'
- Effect: Use of metaphors, analogies, figurative language

**detail_depth**
- Options: 'minimal' | 'balanced' | 'detailed' | 'highly_explanatory'
- Effect: Explanation thoroughness

**vocabulary_complexity**
- Options: 'simple' | 'basic_professional' | 'sophisticated' | 'highly_intellectual'
- Effect: Word difficulty and terminology usage

**content_structure_rules** (Object)
- Flags for structural preferences (e.g., use_bullet_points, include_statistics, start_with_question)

**allowed_elements** (Array)
- Content types permitted (e.g., "statistics", "testimonials", "case studies")

**forbidden_elements** (Array)
- Content types to avoid (e.g., "exclamation marks", "emojis", "slang")

### Brand Voice Application

**Injection point**: System prompt, dedicated "Brand Voice Guidelines" section

**Precedence rules**:
- Brand voice provides baseline characteristics
- Form field inputs override brand voice when conflicts exist
- Example: If brand voice says "Professional" but form says "Bold", Bold wins
- Special instructions always take highest priority

**Customer association**:
- Each brand voice linked to one customer
- Customer selector filters available brand voices
- Enables agency workflow: Multiple clients, each with multiple voices

**What it solves**: Consistent brand messaging across all content, multi-client agency management, reusable voice configurations.

**Constraint**: Complex configuration (20+ fields) may overwhelm casual users; AI-assisted creation mitigates this.

---

## Workflow Automation

**Table**: `workflows`
**Purpose**: Automate multi-step content transformation processes

### Workflow Structure

**Workflow Definition**:
- Name and description
- Customer association (optional)
- Public/private flag
- Ordered array of steps (JSONB)

**Step Types**:
1. **create_alternative_copy**: Generate alternative version
2. **apply_voice_style**: Apply voice persona or brand voice
3. **analyze_compare_copy**: Compare outputs (prepared, not fully implemented)

**Step Configuration**:
- `id`: Unique step identifier (for ordering)
- `type`: Step type enum
- `target`: Reference to content (e.g., 'original', 'alt_1', 'alt_2')
- `preset_voice_style`: For voice style steps (e.g., 'steve-jobs')
- `brand_voice_id`: For brand voice application
- `customInstructions`: For custom operations

### Workflow Execution

**Trigger**: Enabled via "Use Workflow" toggle in Copy Maker form + workflow selection

**Execution timing**: After primary copy generation completes

**Process**:
1. Fetch workflow definition from database
2. Initialize execution context with original content
3. Execute steps sequentially:
   - Resolve target content (original or previous step output)
   - Call appropriate API (alternativeCopy or voiceStyles)
   - Store result with new ID (alt_1, alt_2, etc.)
   - Report progress via callback
4. Add all generated items to output cards
5. Display completion notification

**Characteristics**:
- Sequential (not parallel): Step 2 waits for step 1, etc.
- Automatic: No user intervention during execution
- Non-persistent: Runs once per generation
- Source-linked: Each output tracks its origin step

**Error handling**:
- Workflow errors do not break primary generation
- Failed steps reported to user
- Partial results displayed (successful steps before failure)

**What it solves**: Automate repetitive multi-step processes, ensure consistent output transformations, save time on routine workflows.

**Use cases**:
- Generate copy → Apply brand voice → Create 2 alternatives
- Generate copy → Apply Steve Jobs voice → Apply Alex Hormozi voice → Compare
- Generate FAQ → Generate alternative FAQ → Apply corporate voice

### Workflow Builder

**Location**: `/manage-workflows` route
**Interface**: Drag-and-drop editor

**Features**:
- Action library (left panel): Available step types
- Workflow canvas (right panel): Ordered step list
- Drag from library to canvas to add step
- Drag within canvas to reorder
- Remove step button on each step
- Dynamic target dropdown (updates based on previous steps)
- Voice style selector (presets + brand voices)
- Save/Cancel buttons

**Validation**:
- Voice style steps require voice selection
- No validation on step order logic (user responsibility)

### Workflow Management

**Operations**:
- List all workflows (user's own + public)
- Create new workflow
- Edit existing workflow
- Duplicate workflow (copy with new name)
- Delete workflow

**Access control**:
- Users can CRUD their own workflows
- Public workflows visible to all (not editable by others)
- Workflow permissions table for sharing (view/edit levels)

**Constraint**: No workflow versioning, no execution history logging, no workflow templates.

---

## Credit System

**Purpose**: Track and enforce AI usage for billing and quota management

### Credit Tracking

**Unit**: Tokens (input + output tokens from AI API responses)

**Tracking table**: `pmc_user_tokens_used` (immutable log)

**Per-record data**:
- User ID
- Operation type (17 types: generate_copy, geo_score, seo_metadata, etc.)
- AI model used
- Tokens consumed
- Estimated cost (USD)
- Session ID (for grouping)
- Timestamp
- Unique tracking ID (prevents duplicates)

**Balance table**: `pmc_users.tokens_remaining`

**Update mechanism**: Database trigger `sync_tokens_remaining` fires AFTER INSERT on `pmc_user_tokens_used`, calls `update_tokens_remaining()` function to atomically decrement balance.

**Tracking flow**:
1. API call completes
2. Extract token count from response
3. Calculate cost via `calculateTokenCost(tokens, model)`
4. Call Edge Function `track-tokens` with metadata
5. Edge Function inserts row into `pmc_user_tokens_used`
6. Trigger updates `tokens_remaining`
7. If tracking fails, retry 3x with exponential backoff
8. If all retries fail, API call blocked (prevents untracked usage)

**What it solves**: Accurate billing data, usage analytics, fraud prevention, quota enforcement.

### Cost Calculation

**Current implementation**: Hardcoded in `src/services/api/utils.ts`

**Pricing per token** (USD):
- Claude Sonnet 4.5: $0.000003
- Claude Haiku 4.5: $0.000001
- Claude Opus 4.5: $0.000005
- GPT-4o: $0.000005
- GPT-4 Turbo: $0.000003
- GPT-3.5 Turbo: $0.0000015
- DeepSeek Chat: $0.0000025
- Grok 4 Latest: $0.000015
- Gemini 2.0 Flash: $0.0000001

**Calculation**: `tokens * per_token_cost = cost_usd`

**Future implementation** (prepared but inactive):
- `llm_model_pricing` table: Database-driven pricing
- `llm_billing_rules` table: USD → billable units conversion
- Cost multiplier support (e.g., 1.30x for margins)
- Rounding modes (ceil, floor, round)
- Minimum units per call

**Constraint**: Client-side calculation (not server-side), prices hardcoded, no dynamic pricing.

### Credit Enforcement

**Function**: `checkUserAccess()` in `supabaseClient.ts`

**Checks**:
1. Subscription validity: `until_date >= current_date` OR `until_date IS NULL`
2. Token balance: `tokens_remaining > 0`

**Enforcement point**: Before each generation API call

**Behavior on failure**:
- Toast error notification
- Token Limit Modal shown
- Generation blocked
- User cannot proceed

**No grace period**: Hard stop at `tokens_remaining <= 0`

**Constraint**: Potential race condition if multiple concurrent requests pass check before any complete (could go negative).

**Future enhancement**: Credits system with rollover, monthly resets, tiered plans (tables prepared).

### Dashboard Display

**Token Usage Tab**:
- Default date range: Last 30 days
- Date range picker (custom ranges)
- User filter (admin only): View any user's usage
- Session grouping: Displays per-session summaries via `pmc_session_token_summary` view
- Expandable details: Click session to see individual API calls
- Statistics: Total tokens, total cost, API call count
- CSV export: All usage data in selected range

**Admin capabilities**:
- View all users' usage (not just own)
- Export all usage data across all users
- View usage statistics dashboard (future: aggregate reports)

**What it solves**: Usage transparency, billing verification, usage pattern analysis, cost attribution by customer/project.

---

## Dashboard Features

### Saved Outputs Tab

**Purpose**: Access previously saved generation results

**Display**:
- Card grid layout
- Each card shows: Title, description, tags, customer, date
- Hover actions: View, Load, Delete

**Filters**:
- Search by title/description
- Filter by customer
- Filter by date range
- Filter by tags

**View action**:
- Opens modal with complete input and output data
- Shows all form fields used
- Displays all generated outputs

**Load action**:
- Restores saved output to Copy Maker form
- Populates all input fields
- Restores all outputs to results section
- Enables "edit and regenerate" workflow

**Delete action**:
- Confirmation required
- Hard delete from `pmc_saved_outputs`
- Does not delete session (session persists separately)

**Favorite flag**:
- Toggle via star icon
- Filters: Show only favorites
- Use case: Bookmark best outputs

**What it solves**: Output library, reference material, client presentation decks.

### Manage Workflows Tab

**Route**: `/manage-workflows`

**Display**: List view with workflow cards

**Per-workflow info**:
- Name
- Description
- Step count
- Customer (if associated)
- Public/private status
- Last updated date

**Actions**:
- Edit: Opens workflow builder
- Duplicate: Creates copy with "(Copy)" suffix
- Delete: Confirmation required, hard delete

**Create New**: Button opens workflow builder modal

**What it solves**: Workflow library, team collaboration, process standardization.

---

## Admin Features

### User Management Edge Functions

**admin-create-user**
- Inputs: email, password, name, credits, start_date, until_date
- Effect: Creates auth.users entry + pmc_users entry
- Returns: User ID and confirmation

**admin-update-user**
- Inputs: user_id, field updates (name, credits, dates, etc.)
- Effect: Updates pmc_users record
- Use case: Adjust quotas, extend subscriptions

**admin-get-users**
- Returns: All users with their quota and usage data
- Supports pagination (future enhancement)

**admin-get-token-stats**
- Returns: Aggregate token statistics (total tokens, cost, users, sessions)
- Date range filterable

**admin-get-token-usage**
- Inputs: user_id (optional), date_range
- Returns: Detailed token usage records
- Use case: Support, billing disputes, usage audits

**admin-export-token-usage**
- Inputs: user_id (optional), date_range
- Returns: CSV formatted usage data
- Use case: Accounting, invoicing, reports

**admin-get-beta-registrations-count**
- Returns: Count of beta program signups
- Source: `beta_register` table

**admin-delete-user** (not implemented but Edge Function exists)
- Inputs: user_id
- Effect: Would delete user and cascade to owned content
- Status: Edge Function created but not connected to UI

### Admin Dashboard Features

**Access**: Hardcoded email check (`currentUser?.email === 'rfv@datago.net'`)

**Capabilities**:
- View all users' token usage (not just own)
- Export all usage data (not just own)
- View beta registrations count
- Create public templates (others cannot)
- Manage system brand voices
- View and edit pricing tables (prepared but inactive)

**Constraint**: Admin access not centralized, email lists differ across files (RLS policies vs. UI checks).

### Template Management

**System templates**:
- Created by admins with `is_public = true`
- Visible to all users
- Non-editable by non-admins
- 50+ templates seeded via migrations

**User template conversion**:
- Users can make their templates public
- No moderation or approval flow
- Public templates visible to all but editable only by creator

---

## Validation and Error Handling

### Input Validation

**Current state**: LIGHT validation only

**What is validated**:
- Field presence (required fields marked but not enforced)
- Data types (TypeScript types, not runtime validation)
- Number ranges (e.g., custom word count 1-100000)

**What is NOT validated**:
- Field content (no regex, no format checks)
- URL formats (competitor URLs accepted as strings)
- Email formats (in user management)
- Word count feasibility (e.g., 10-word FAQ with 5 Q&As)
- Keyword presence in outputs
- Excluded terms absence in outputs

**Philosophy**: Trust user inputs, handle errors gracefully, validate at AI response stage if needed.

**Constraint**: Bad inputs may produce bad outputs (garbage in, garbage out), but won't break application.

### API Error Handling

**Network errors**:
- Timeout: 120 seconds per request
- Retry: 3 attempts for token tracking, 0 retries for generation (manual retry by user)
- Display: Toast error message + error modal

**AI model errors**:
- Fallback: Automatic switch to alternative model
- Notification: Toast shows which model used
- Tracking: Fallback model recorded for accurate billing

**Rate limit errors**:
- Behavior: Treated as regular error, fallback triggered
- Future: Queue system for rate-limited requests (not implemented)

**Parse errors** (Copy Snap):
- Detection: JSON.parse() fails on AI response
- Recovery: Display raw text output
- User action: Retry or use raw output

**Token tracking errors**:
- Retry: 3 attempts with exponential backoff (1s, 2s, 4s)
- If all fail: Block generation (prevents untracked usage)
- Display: Error toast + token limit modal

### Generation Errors

**Insufficient credits**:
- Check: Before generation starts
- Block: Prevent API call
- Display: Token limit modal with upgrade prompt

**Expired subscription**:
- Check: Before generation starts
- Block: Prevent API call
- Display: Subscription expired message

**Workflow execution errors**:
- Behavior: Graceful degradation (main generation unaffected)
- Display: Error toast with step that failed
- Result: Partial outputs shown (steps before failure)

**Word count revision errors**:
- Scenario: Revision attempts exceed max (2 attempts)
- Behavior: Accept final result regardless of word count
- Display: Warning toast "Word count may not match target"

### Session Errors

**Missing session ID**:
- Prevention: `ensureActiveSession()` creates session before any generation
- Fallback: Edge Function creates emergency session if tracking called without one
- Constraint: Should never happen in normal flow

**Orphaned token records**:
- Prevention: Foreign key constraint on `session_id`
- Cleanup: Migration deleted orphaned records before adding constraint
- Current state: All token records must link to valid session

---

## Data Persistence

### Session Persistence

**Table**: `pmc_copy_sessions`

**Saved data**:
- Complete `input_data` (JSONB): All 40+ form fields
- `improved_copy`: Primary generated output
- `alternative_copy`: Alternative outputs (array)
- `output_type`: Session type ('copy-maker', 'copy-snap', etc.)
- `brief_description`: Auto-generated summary
- `session_name`: User-editable label
- `customer_id`: Customer association
- `scope_key`: Scope identifier (future use)

**Creation**: Automatically when generation completes

**Lifecycle**:
- Created on first generation
- Updated on subsequent generations in same session
- Persists indefinitely (no auto-deletion)
- User can delete from dashboard

**Loading**: Users can load saved sessions from dashboard to restore form state

**Foreign key constraint**: All `pmc_user_tokens_used` records must link to valid session

### Template Persistence

**Table**: `pmc_public_saved_templates`

**Saved data**:
- `form_state_snapshot` (JSONB): Complete FormState object
- All 40+ form fields as individual columns (for querying)
- `category`: Template categorization
- `is_public`: Public/private flag
- `template_name`, `description`: Metadata

**Lifecycle**:
- Created when user saves template
- Updated when user updates template
- Deleted when user deletes template (or admin for system templates)
- No versioning or history

### Brand Voice Persistence

**Table**: `pmc_public_brand_voices`

**Saved data**: 20+ configuration fields (see Brand Voice System section)

**Lifecycle**:
- Created via AI analysis, AI generation, or manual (not implemented)
- Updated when user edits voice
- Deleted when user deletes voice
- Linked to customer (soft delete customer would orphan voices - no cascade)

### Output Persistence

**Table**: `pmc_saved_outputs`

**Saved data**:
- `input_data` (JSONB): All form fields at generation time
- `output_data` (JSONB): All generated outputs, scores, SEO data
- `tags`: Array for categorization
- `session_id`: Link back to session
- `is_favorite`: Bookmark flag

**Lifecycle**:
- Created when user explicitly saves output
- Persists indefinitely
- Deleted when user deletes from dashboard
- Session deletion does not cascade to saved outputs

### Workflow Persistence

**Table**: `workflows`

**Saved data**:
- `name`, `description`: Metadata
- `steps` (JSONB): Ordered array of step definitions
- `customer_id`: Customer association
- `is_public`: Sharing flag

**Lifecycle**:
- Created when user creates workflow
- Updated when user edits workflow
- Deleted when user deletes workflow
- No execution history stored

### State Management

**Form state**: React state + localStorage
- Persists across browser sessions
- Survives page refresh
- Mode selection persists
- Hidden fields retain values when switching modes

**Copy result state**: React state only (not localStorage)
- Lost on page refresh
- Must save to dashboard for persistence

**User preferences**: `user_preferences` table
- Start Hub visibility toggle
- Future: Theme, language, other preferences

---

## Authentication and Security

### Authentication Flow

**Supabase Auth**:
- Provider: Supabase built-in auth
- Table: `auth.users` (Supabase-managed)
- Custom table: `pmc_users` (FK to `auth.users.id`)

**Supported methods**:
1. Email/password
2. Google OAuth (configured, not required)

**Email verification**: Optional (configured in Supabase dashboard, not enforced)

**Registration flow**:
1. User signs up (email/password or Google)
2. `auth.users` entry created automatically
3. Trigger creates `pmc_users` entry with default quotas
4. Welcome email sent via Edge Function (optional)
5. 30-day trial starts (start_date and until_date set)

**Login flow**:
1. User logs in
2. Supabase returns JWT token
3. Token stored in browser (httpOnly cookie)
4. All API requests include token in Authorization header
5. RLS policies verify token on every query

**Session management**:
- JWT expiry: Configurable (default 1 hour)
- Refresh token: Automatic (Supabase handles)
- Logout: Clears token and session

### Row Level Security (RLS)

**Enabled on all tables**: Yes (strict policy)

**Policy patterns**:

**Standard user policies** (`pmc_copy_sessions` example):
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

**Admin policies** (`pmc_user_tokens_used` example):
- SELECT: `auth.uid() = user_id OR email IN (admin_emails)`
- INSERT: None (only Edge Functions via service role)
- UPDATE: None
- DELETE: None

**Public read policies** (`pmc_public_saved_templates` example):
- SELECT: `is_public = true OR user_id = auth.uid()`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

**Constraint**: Admin email lists inconsistent across policies (3 different lists found).

### Google OAuth Blocking

**Purpose**: Prevent unauthorized signups via Google OAuth

**Implementation**: RLS policy on `auth.users` INSERT blocks registrations unless user exists in pre-approved list

**Function**: `check_user_exists(email)` returns boolean

**Effect**: Google OAuth users must be pre-created by admin before they can log in

**Use case**: Closed beta, enterprise deployments, invitation-only access

### Free Trial System

**Trigger**: Automatic on user creation
**Duration**: 30 days from `start_date`
**Credits**: Configurable via admin (default in code)
**Welcome email**: Auto-sent via Edge Function using pg_net

**Expiration**: At `until_date`, user blocked from generation until subscription extended

### Security Best Practices Implemented

**Secrets management**: Environment variables, not in code
**RLS enforcement**: All tables secured
**JWT validation**: Automatic via Supabase
**SQL injection prevention**: Parameterized queries
**XSS prevention**: React escapes by default
**CSRF prevention**: Supabase handles
**Rate limiting**: Not implemented (rely on AI provider rate limits)

**Security gaps**:
- Admin access via hardcoded email (not role-based)
- Client-side cost calculation (could be manipulated)
- No API key rotation policy
- No audit logging for admin actions

---

## Edge Cases and Constraints

### Edge Cases Handled

**1. Concurrent generations**:
- Each generation creates separate session
- Token tracking links to correct session
- No interference between concurrent operations

**2. Empty form submission**:
- Validation prevents submission (UI disabled state)
- If bypassed, AI model handles gracefully (may return error or generic output)

**3. Extremely long inputs**:
- No character limits enforced (UI side)
- AI model context window limits apply (8K-64K tokens)
- Truncation handled by model (older tokens dropped)

**4. Unsupported languages**:
- Language dropdown limited to 6 options
- User can override via Special Instructions
- AI models support 50+ languages beyond dropdown

**5. Negative token balance**:
- Possible via race condition
- User blocked on next generation attempt
- Balance displayed accurately (can show negative)

**6. Deleted customer with brand voices**:
- No cascade delete (brand voices orphaned)
- Brand voices still selectable (no FK constraint prevents)

**7. Deleted workflow mid-execution**:
- Workflow fetched at start of execution
- Deletion during execution doesn't affect running workflow

**8. Session ID missing**:
- `ensureActiveSession()` creates emergency session
- Edge Function safety net creates session if needed
- Foreign key constraint prevents orphaned token records

### Known Constraints

**1. No real-time collaboration**:
- Sessions single-user only
- No simultaneous editing of same form
- No live updates when other user modifies shared workflow

**2. No output versioning**:
- Regeneration overwrites previous output (if in same session)
- No history of output changes
- Must manually save to dashboard to preserve

**3. No template versioning**:
- Template updates overwrite completely
- No rollback or version history
- No "revert to previous" functionality

**4. No undo/redo**:
- Form changes not undoable
- Output deletions not recoverable (unless saved)
- Template deletions permanent

**5. Prompt-based enforcement only**:
- Excluded terms not validated in output
- Forbidden brand voice terms not checked
- Keyword integration not verified
- Word count enforcement requires separate revision call

**6. Single currency (USD)**:
- All costs calculated in USD
- No currency conversion
- Future credits system may support multiple currencies

**7. Client-side cost calculation**:
- Pricing hardcoded in frontend
- Not validated server-side (trust client)
- Opens potential for manipulation (mitigated by Edge Function also calculating)

**8. No streaming responses**:
- All generations wait for complete response
- No progressive output display
- Longer generations have longer wait times

**9. Limited export formats**:
- HTML and Markdown only
- No DOCX, no RTF export
- HTML formatting not customizable (uses fixed styling)
- Users can print HTML to PDF from browser if needed

**10. No A/B test tracking**:
- Multi-variant generation creates variants
- No built-in A/B test result tracking
- No conversion tracking integration

---

## Summary

CopyZap is a feature-rich, production-ready AI copywriting platform with:

- **2 main modules**: Copy Maker (comprehensive) + Copy Snap (quick transforms)
- **3 interface modes**: Quick (10 fields), Standard (20 fields), Advanced (40+ fields)
- **50+ templates**: Across 11 categories
- **10 AI models**: Anthropic, OpenAI, DeepSeek, Grok, Gemini
- **40+ input fields**: Basic to power-user controls
- **20+ output actions**: Copy, HTML, Markdown, alternative, voice style, scoring, SEO, comparison
- **Brand voice system**: 20+ configuration fields
- **Workflow automation**: 3 step types, sequential execution
- **Credit system**: Real-time token tracking, balance enforcement, usage analytics
- **Dashboard**: Token usage, saved outputs, workflow management
- **Admin tools**: User management, quota adjustment, usage export

**All features documented**: This document covers every implemented feature, control, toggle, validation rule, error handler, and system behavior as of 2026-01-30.

**Scope**: Technical features inventory for internal documentation, not marketing material.

