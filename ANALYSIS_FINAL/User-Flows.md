# CopyZap User Flows

**Document Type**: User Journey Documentation
**Date**: 2026-01-30
**Purpose**: Step-by-step flows for all major user journeys, including success paths, error states, and decision points.

---

## Table of Contents

1. [Signup and Onboarding](#signup-and-onboarding)
2. [First Generation (Copy Maker)](#first-generation-copy-maker)
3. [First Generation (Copy Snap)](#first-generation-copy-snap)
4. [Template Usage Flow](#template-usage-flow)
5. [Brand Voice Creation and Usage](#brand-voice-creation-and-usage)
6. [Workflow Creation and Execution](#workflow-creation-and-execution)
7. [Multi-Variant Generation and Selection](#multi-variant-generation-and-selection)
8. [Iterative Refinement Flow](#iterative-refinement-flow)
9. [Credit Usage and Exhaustion](#credit-usage-and-exhaustion)
10. [Paywall Trigger Points](#paywall-trigger-points)
11. [Saved Output Management](#saved-output-management)
12. [Error and Retry States](#error-and-retry-states)
13. [Admin User Management](#admin-user-management)

---

## Signup and Onboarding

### Flow A: Email/Password Signup

**Step 1**: User navigates to `/create-account`

**Step 2**: User enters email, password, name

**Step 3**: User clicks "Create Account"

**Step 4**: System creates `auth.users` entry

**Step 5**: Database trigger creates `pmc_users` entry with:
- `tokens_allowed`: 999999 (default)
- `tokens_remaining`: 999999
- `start_date`: Current date
- `until_date`: Current date + 30 days (30-day trial)
- Other default values

**Step 6**: Database trigger calls `send-welcome-email` Edge Function (via pg_net HTTP request)

**Step 7**: Welcome email sent to user's email address

**Step 8**: User redirected to `/dashboard` (logged in automatically)

**Step 9**: Start Hub modal appears (if `show_start_hub` preference is true, default true)

**Step 10**: User can:
- **Option A**: Click "Quick Prompt Wizard" → Proceeds to wizard flow (see Template Usage Flow)
- **Option B**: Click "Copy Maker" → Closes modal, shows empty Copy Maker form
- **Option C**: Click "Copy Snap" → Closes modal, switches to Copy Snap tab
- **Option D**: Check "Don't show this again" → Updates `user_preferences.show_start_hub = false`

**Outcome**: User has account with 30-day trial, 999999 tokens, access to all features

### Flow B: Google OAuth Signup (When Allowed)

**Step 1**: User navigates to `/login`

**Step 2**: User clicks "Continue with Google"

**Step 3**: Google OAuth popup opens

**Step 4**: User authenticates with Google

**Step 5**: Google returns to callback URL with auth code

**Step 6**: Supabase exchanges code for JWT token

**Step 7**: System checks if user exists in `pmc_users`:
- **If exists**: Proceeds to Step 10
- **If not exists and email in approved list**: Creates `pmc_users` entry (Step 8)
- **If not exists and email NOT in approved list**: Shows error "Registration not allowed. Contact admin." → **ENDS**

**Step 8**: Database trigger creates `pmc_users` entry (same as Flow A Step 5)

**Step 9**: Welcome email sent (same as Flow A Step 7)

**Step 10**: User redirected to `/dashboard`

**Step 11**: Start Hub modal appears (same as Flow A Step 9-10)

**Outcome**: Same as Flow A, but authentication via Google

### Flow C: Google OAuth Signup (When Blocked)

**Step 1-6**: Same as Flow B

**Step 7**: RLS policy on `auth.users` INSERT blocks creation because email not in `check_user_exists()` approved list

**Step 8**: Error returned to user: "You must be invited to create an account. Contact administrator."

**Step 9**: User remains on login page, not authenticated

**Outcome**: Signup prevented (invitation-only mode)

---

## First Generation (Copy Maker)

### Flow A: Quick Mode First Generation (Success Path)

**Step 1**: User on Copy Maker tab in Quick Mode (default for new users)

**Step 2**: User fills required fields:
- Project Description: "Homepage redesign"
- Product/Service Name: "TaskFlow AI"
- Business Description: "AI-powered task management for teams"

**Step 3**: User adjusts optional fields:
- Target Audience: "Tech startups with 10-50 employees"
- Tone: Changes from "Friendly" to "Professional"
- Word Count: Keeps "Medium: 100-200"

**Step 4**: User clicks "Generate" button

**Step 5**: System validates:
- User authenticated: YES
- Required fields populated: YES
- Proceeds to Step 6

**Step 6**: System calls `checkUserAccess()`:
- Check 1: `until_date >= current_date` OR `until_date IS NULL`: PASS (30-day trial active)
- Check 2: `tokens_remaining > 0`: PASS (999999 tokens)
- Proceeds to Step 7

**Step 7**: System calls `ensureActiveSession()`:
- Check if `formState.sessionId` exists: NO (first generation)
- Creates new session with `uuid_v4()`: e.g., `abc-123-def-456`
- Inserts row into `pmc_copy_sessions` with `input_data` JSONB snapshot
- Returns `session_id`
- Updates `formState.sessionId = 'abc-123-def-456'`

**Step 8**: Processing modal displays "Preparing your request..."

**Step 9**: System constructs prompts:
- **System Prompt**: 19 sections assembled (role, output format, language, tone, word count, audience, etc.)
- **User Prompt**: 8 sections assembled (business description, key message, context, etc.)

**Step 10**: System calls `makeApiRequestWithFallback()`:
- Primary model: Claude Sonnet 4.5 (from form state)
- Max tokens: 64000
- Temperature: 0.7 (word count 100-200, >150 words)
- Response format: Text (not JSON)

**Step 11**: Processing modal updates: "Generating copy with Claude Sonnet 4.5..."

**Step 12**: API returns response:
- Generated copy: 180 words
- Token usage: 1250 tokens (950 input + 300 output)
- Model used: `claude-sonnet-4-5`

**Step 13**: System calls `trackTokenUsage()`:
- User ID: Current user
- Tokens: 1250
- Model: `claude-sonnet-4-5`
- Operation type: `generate_copy`
- Session ID: `abc-123-def-456`
- Calculate cost: 1250 * $0.000003 = $0.00375

**Step 14**: System calls Edge Function `track-tokens` with payload

**Step 15**: Edge Function inserts row into `pmc_user_tokens_used`

**Step 16**: Database trigger `sync_tokens_remaining` fires

**Step 17**: Trigger updates `pmc_users.tokens_remaining`: 999999 - 1250 = 998749

**Step 18**: Processing modal closes

**Step 19**: Output card appears in results section with:
- Generated copy (180 words, markdown formatted)
- Actions: Copy, Copy HTML, Replace Input, Generate Alternative, Apply Voice Style, Generate Score, Modify Content, etc.
- Model badge: "Claude Sonnet 4.5"

**Step 20**: Success toast: "Copy generated successfully!"

**Outcome**: User has generated copy, balance reduced by 1250 tokens, session saved in database

### Flow B: First Generation with SEO Metadata (Success Path)

**Steps 1-6**: Same as Flow A

**Step 7**: Before clicking Generate, user toggles "Generate SEO Metadata" ON

**Step 8**: User sets SEO variant counts:
- URL Slugs: 3
- Meta Descriptions: 3
- H1 Variants: 3
- Leaves others at default (1)

**Steps 9-19**: Same as Flow A Steps 7-18 (primary copy generation)

**Step 20**: Processing modal updates: "Generating SEO metadata..."

**Step 21**: System constructs SEO metadata prompt with generated copy as context

**Step 22**: System calls API again:
- Same model: Claude Sonnet 4.5
- Prompt requests: 3 URL slugs, 3 meta descriptions, 3 H1s, etc.
- Response format: Structured text (not JSON)

**Step 23**: API returns SEO metadata (token usage: 850 tokens)

**Step 24**: System calls `trackTokenUsage()` again:
- Operation type: `seo_metadata`
- Tokens: 850
- Session ID: Same `abc-123-def-456`

**Step 25**: Token tracking completes (balance now 998749 - 850 = 997899)

**Step 26**: Output card updates with SEO section showing:
- 3 URL slugs with copy buttons
- 3 meta descriptions with copy buttons
- 3 H1 variants with copy buttons
- Other SEO elements as configured

**Step 27**: Success toast: "Copy and SEO metadata generated successfully!"

**Outcome**: User has generated copy + SEO metadata, balance reduced by 2100 tokens total (1250 + 850)

### Flow C: First Generation with Insufficient Credits

**Steps 1-5**: Same as Flow A

**Step 6**: System calls `checkUserAccess()`:
- Check 1: `until_date >= current_date`: PASS
- Check 2: `tokens_remaining > 0`: FAIL (`tokens_remaining = 0` or negative)
- **STOP** - Does not proceed to Step 7

**Step 7**: Token Limit Modal appears with message:
- "You've reached your token limit"
- "Current balance: 0 tokens"
- "Contact support to upgrade your plan"
- Button: "Close"

**Step 8**: User clicks "Close", modal dismisses

**Step 9**: User remains on Copy Maker form, generation not executed

**Outcome**: Generation blocked, no API call made, no tokens consumed

### Flow D: First Generation with Expired Subscription

**Steps 1-5**: Same as Flow A

**Step 6**: System calls `checkUserAccess()`:
- Check 1: `until_date >= current_date`: FAIL (`until_date = yesterday`)
- **STOP** - Does not proceed to Check 2

**Step 7**: Error toast: "Your subscription has expired. Contact support to renew."

**Step 8**: Token Limit Modal appears (same as Flow C)

**Outcome**: Same as Flow C, subscription expiration blocks access

---

## First Generation (Copy Snap)

### Flow A: Copy Snap Improve Mode (Success Path)

**Step 1**: User switches to "Copy Snap" tab

**Step 2**: Copy Snap interface loads with default mode: Improve

**Step 3**: User pastes text into input field:
```
Check out our new product. It's really great and you should buy it now.
```

**Step 4**: User configures controls:
- Goal: "More Persuasive" (default was "Clearer")
- Platform: "LinkedIn" (default was "General")
- Length: "Same" (default)

**Step 5**: User clicks "Generate" button (sticky, always visible)

**Step 6**: System validates:
- User authenticated: YES
- Input field not empty: YES
- Proceeds to Step 7

**Step 7**: System calls `checkUserAccess()` (same as Copy Maker Flow A Step 6): PASS

**Step 8**: System calls `ensureActiveSession()` with `scope_key = 'copy-snap'`:
- Creates new session or reuses existing Copy Snap session
- Returns `session_id`

**Step 9**: Loading spinner replaces Generate button, displays "Processing..."

**Step 10**: System detects input language: English

**Step 11**: System constructs Copy Snap Improve prompt:
- System prompt: Copy Snap role + Improve mode instructions + Goal (More Persuasive) + Platform (LinkedIn) + Length (Same)
- User prompt: Original text + instruction

**Step 12**: System calls DeepSeek API (primary model for Copy Snap):
- Model: `deepseek-chat`
- Max tokens: 8000
- Temperature: 0.7

**Step 13**: DeepSeek API returns response (token usage: 420 tokens):
```json
{
  "bestResult": "Discover our game-changing product...",
  "alternative1": "Transform your workflow with...",
  "alternative2": "Ready to elevate your results?...",
  "expertTips": ["Add specific benefits...", "Include social proof...", "End with clear CTA..."]
}
```

**Step 14**: System calls `trackTokenUsage()`:
- Model: `deepseek-chat`
- Tokens: 420
- Operation type: `generate_copy`
- Session ID: [Copy Snap session ID]

**Step 15**: Token tracking completes (balance reduced by 420 tokens)

**Step 16**: Output section displays:
- **Best Result** card with copy button
- **Alternative 1** card with copy button
- **Alternative 2** card with copy button
- **3 Expert Tips** section

**Step 17**: Toast notification: "Improved with DeepSeek" (shows model used)

**Step 18**: Loading spinner changes back to "Generate" button

**Outcome**: User has 3 improved versions + tips, balance reduced by 420 tokens

### Flow B: Copy Snap with DeepSeek Fallback to GPT-4o

**Steps 1-11**: Same as Flow A

**Step 12**: System calls DeepSeek API

**Step 13**: DeepSeek API returns error (rate limit exceeded or server error)

**Step 14**: System catches error, initiates fallback

**Step 15**: Toast notification: "DeepSeek unavailable, using GPT-4o as fallback"

**Step 16**: System calls OpenAI GPT-4o API (same prompt):
- Model: `gpt-4o`
- Max tokens: 16000
- Temperature: 0.7

**Step 17**: GPT-4o API returns response (token usage: 520 tokens)

**Step 18**: System calls `trackTokenUsage()`:
- Model: `gpt-4o` (actual model used, not requested)
- Tokens: 520
- Operation type: `generate_copy`

**Step 19**: Token tracking completes (balance reduced by 520 tokens)

**Step 20**: Output section displays (same as Flow A Step 16)

**Step 21**: Toast notification: "Improved with GPT-4o (fallback)" (transparency about model switch)

**Outcome**: Same as Flow A, but used fallback model (higher cost: 520 tokens vs. 420 tokens with DeepSeek)

### Flow C: Copy Snap Parse Error Recovery

**Steps 1-17**: Same as Flow A Steps 1-13 (API returns response)

**Step 18**: API returns malformed JSON (AI didn't follow format):
```
Here's the improved copy: Discover our game-changing product...
```

**Step 19**: System attempts `JSON.parse()`: FAIL (SyntaxError)

**Step 20**: System catches parse error

**Step 21**: Output section displays:
- **Raw Output** card with AI's text response
- Warning badge: "Parse Error - Showing raw output"
- "Retry" button

**Step 22**: Toast notification: "AI returned unexpected format. Showing raw output. Click Retry."

**Outcome**: User sees raw output (usable but not structured), can retry for properly formatted response

---

## Template Usage Flow

### Flow A: Loading System Template

**Step 1**: User clicks "Templates" dropdown in Copy Maker header

**Step 2**: Dropdown opens with 50+ templates, grouped by category

**Step 3**: User types in search field: "landing page"

**Step 4**: Dropdown filters to matching templates: "Landing Page (Lead Gen)", "SaaS Feature Page", etc.

**Step 5**: User clicks "Landing Page (Lead Gen)" template

**Step 6**: System loads template from `pmc_public_saved_templates`

**Step 7**: System detects placeholders in template: `[your product name]`, `[key benefit]`

**Step 8**: Placeholder Warning Modal appears:
- Message: "This template contains placeholders like [your product name]. Replace them before generating."
- Button: "I Understand"

**Step 9**: User clicks "I Understand", modal closes

**Step 10**: Form populates with template data:
- Project Description: "Landing Page - Lead Generation"
- Product/Service Name: "[your product name]" (placeholder)
- Business Description: "A landing page designed to capture leads with clear value proposition..."
- Output Structure: [Problem, Solution, Benefits, Features, Call to Action]
- Generate SEO Metadata: ON
- Word Count: "Long: 200-400"
- All other fields as saved in template

**Step 11**: Prefill indicator badges appear on populated fields

**Step 12**: User edits placeholder fields:
- Changes "[your product name]" to "TaskFlow AI"
- Changes "[key benefit]" to "Automated task tracking"

**Step 13**: User clicks "Generate"

**Steps 14+**: Same as First Generation Flow A

**Outcome**: User generated copy faster using template (80% pre-filled), only edited placeholders

### Flow B: Loading Template with Hidden Fields (Quick Mode)

**Step 1-5**: Same as Flow A

**Step 6**: User currently in Quick Mode (10 fields visible)

**Step 7**: Template loaded has populated fields that are hidden in Quick Mode:
- Industry/Niche: "SaaS"
- Reader Funnel Stage: "Consideration"
- Tone Level: 65

**Step 8**: Mode Compatibility Warning Modal appears:
- Message: "This template has 3 fields populated that are hidden in Quick Mode. You can:"
- Option A button: "Continue (use visible fields only)"
- Option B button: "Switch to Advanced Mode (see all fields)"

**Step 9**: User clicks "Continue"

**Step 10**: Form populates with template data, hidden fields remain in state but not visible

**Step 11**: User clicks "Generate"

**Step 12**: System uses ALL template data (including hidden fields) in prompt construction

**Outcome**: User benefits from template's hidden configurations without seeing them (unless switched to Advanced)

### Flow C: Saving Current Form as Template

**Step 1**: User fills out Copy Maker form completely with custom configuration

**Step 2**: User clicks "Save as Template" button in header

**Step 3**: Save Template Modal appears with fields:
- Template Name: [empty]
- Description: [empty]
- Category: [dropdown with 11 options]
- Make Public: [checkbox, default OFF]

**Step 4**: User fills modal:
- Template Name: "Weekly Product Update Email"
- Description: "Standard format for Friday product update emails to customers"
- Category: "Email"
- Make Public: OFF (keep private)

**Step 5**: User clicks "Save"

**Step 6**: System creates row in `pmc_public_saved_templates`:
- `user_id`: Current user
- `template_name`: "Weekly Product Update Email"
- `description`: [as entered]
- `category`: "Email"
- `is_public`: false
- `form_state_snapshot`: Complete FormState object as JSONB
- All 40+ form fields as individual columns (for querying)

**Step 7**: Success toast: "Template saved successfully!"

**Step 8**: Template now appears in user's Templates dropdown (bottom of list, or in "My Templates" section if implemented)

**Outcome**: User can reload this exact configuration anytime from dropdown

---

## Brand Voice Creation and Usage

### Flow A: Creating Brand Voice via AI Analysis

**Step 1**: User navigates to Customer Selector in Copy Maker (Standard or Advanced mode)

**Step 2**: User selects customer: "Acme Corp"

**Step 3**: Brand Voice Selector shows "[No brand voice selected]"

**Step 4**: User clicks "+ Add Brand Voice" button next to selector

**Step 5**: Brand Voice Modal opens with 3 tabs:
- AI Analysis (default)
- AI Generation
- Manual (not implemented)

**Step 6**: User stays on AI Analysis tab

**Step 7**: User pastes existing brand copy into textarea (e.g., homepage copy, email, ad):
```
At Acme Corp, we don't just build software—we partner with you to transform your business.
Our approach is collaborative, transparent, and results-driven. We believe in empowering teams,
not just providing tools. Ready to elevate your operations? Let's talk.
```

**Step 8**: User clicks "Analyze Brand Voice" button

**Step 9**: Loading spinner displays "Analyzing voice characteristics..."

**Step 10**: System calls `analyze-brand-voice` Edge Function:
- Input: Pasted copy
- AI Model: GPT-4o
- Prompt: Extract voice characteristics

**Step 11**: API returns analysis (token usage: 780 tokens):
```json
{
  "name": "Acme Corporate Voice",
  "personality_traits": ["Collaborative", "Transparent", "Empowering", "Results-driven"],
  "tone_style": "Professional yet warm, partnership-focused",
  "sentence_style": "Medium-length sentences with occasional fragments for emphasis",
  "preferred_vocabulary": ["Transform", "Empower", "Partner", "Elevate"],
  "cta_style": "Soft call-to-action with invitation ('Let's talk' rather than 'Buy now')",
  "punctuation_rules": {
    "use_contractions": true,
    "prefer_short_sentences": false,
    "use_oxford_comma": true
  },
  "advanced_style": {
    "formality": 4,
    "persona": "partner",
    "pov": "first_person",
    ...
  }
}
```

**Step 12**: System tracks token usage (operation type: `voice_style_analysis`)

**Step 13**: Modal updates with extracted characteristics displayed in form

**Step 14**: User reviews and edits name: "Acme Corporate Voice" → "Acme - Corporate Blog"

**Step 15**: User clicks "Save Brand Voice"

**Step 16**: System inserts row into `pmc_public_brand_voices`:
- `customer_id`: Acme Corp ID
- `owner_user_id`: Current user
- All voice fields as extracted + edited

**Step 17**: Success toast: "Brand voice saved!"

**Step 18**: Modal closes, Brand Voice Selector now shows "Acme - Corporate Blog"

**Outcome**: User has brand voice configured, can apply to any future generation for Acme Corp

### Flow B: Using Brand Voice in Generation

**Step 1**: User in Copy Maker with Customer "Acme Corp" selected

**Step 2**: User selects Brand Voice: "Acme - Corporate Blog"

**Step 3**: User fills other form fields and clicks "Generate"

**Step 4**: System constructs prompts:
- System prompt includes dedicated "Brand Voice Guidelines" section with ALL 20+ voice parameters
- Example section:
  ```
  BRAND VOICE GUIDELINES:
  Voice Name: Acme - Corporate Blog

  Personality Traits: Collaborative, Transparent, Empowering, Results-driven
  Tone Style: Professional yet warm, partnership-focused
  Sentence Style: Medium-length sentences with occasional fragments for emphasis

  Preferred Vocabulary: Transform, Empower, Partner, Elevate
  Forbidden Terms: [if any]
  CTA Style: Soft call-to-action with invitation

  Punctuation Rules:
  - Use contractions (e.g., "don't" not "do not")
  - Use Oxford comma
  - Do not prefer short sentences

  Advanced Style:
  - Formality level: 4/5
  - Persona: Partner
  - Point of view: First person (we/our)
  ...
  ```

**Step 5**: API generates copy following brand voice guidelines

**Outcome**: Copy matches brand voice automatically without manual style edits

---

## Workflow Creation and Execution

### Flow A: Creating Simple Workflow

**Step 1**: User navigates to `/manage-workflows`

**Step 2**: Workflow management page loads with list of existing workflows (empty for new user)

**Step 3**: User clicks "Create Workflow" button

**Step 4**: Workflow Builder Modal opens with:
- Left panel: Action Library
- Right panel: Workflow Canvas (empty)
- Form fields: Name, Description, Customer (optional), Public toggle

**Step 5**: User fills form:
- Name: "Standard Client Deliverable"
- Description: "Generate copy, apply brand voice, create alternative"
- Customer: [Leave empty for universal workflow]

**Step 6**: User drags "Generate Alternative Copy" from Action Library to Canvas

**Step 7**: Step 1 appears in canvas:
- Type: create_alternative_copy
- Target dropdown: "Original" (only option for first step)

**Step 8**: User drags "Apply Voice Style" from Action Library to Canvas

**Step 9**: Step 2 appears in canvas:
- Type: apply_voice_style
- Target dropdown: "Original", "Alternative 1" (options include previous steps' outputs)
- User selects: "Original"
- Voice Style dropdown: Shows presets (Steve Jobs, Alex Hormozi, etc.) + user's brand voices
- User selects: "Humanize"

**Step 10**: User drags "Apply Voice Style" again (for second voice style)

**Step 11**: Step 3 appears:
- Target: User selects "Alternative 1"
- Voice Style: User selects "Alex Hormozi"

**Step 12**: User clicks "Save Workflow"

**Step 13**: System validates:
- Name populated: YES
- All voice style steps have voice selected: YES
- Proceeds to save

**Step 14**: System inserts row into `workflows` table:
```json
{
  "id": "uuid-xyz",
  "user_id": "user-abc",
  "customer_id": null,
  "name": "Standard Client Deliverable",
  "description": "...",
  "steps": [
    {"id": "step-1", "type": "create_alternative_copy", "target": "original"},
    {"id": "step-2", "type": "apply_voice_style", "target": "original", "preset_voice_style": "humanize"},
    {"id": "step-3", "type": "apply_voice_style", "target": "alt_1", "preset_voice_style": "alex-hormozi"}
  ],
  "is_public": false
}
```

**Step 15**: Success toast: "Workflow saved!"

**Step 16**: Modal closes, workflow appears in list

**Outcome**: User has reusable 3-step workflow

### Flow B: Executing Workflow

**Step 1**: User in Copy Maker, fills form

**Step 2**: User toggles "Use Workflow" ON

**Step 3**: Workflow Selector dropdown appears

**Step 4**: User selects "Standard Client Deliverable" workflow

**Step 5**: User clicks "Generate"

**Steps 6-19**: Primary copy generation (same as First Generation Flow A Steps 6-19)

**Step 20**: Primary copy appears in output card (card ID: "original")

**Step 21**: Processing modal updates: "Executing workflow: Step 1 of 3..."

**Step 22**: Workflow engine fetches workflow definition from database

**Step 23**: Engine executes Step 1 (create_alternative_copy):
- Target: "original"
- Resolves target content from output card "original"
- Calls `generateAlternativeCopy()` API function
- Token usage: 950 tokens
- Tracks token usage (operation type: `generate_alternative`)
- Returns alternative copy

**Step 24**: Engine stores result in context: `{ alt_1: [alternative copy content] }`

**Step 25**: New output card appears with alternative copy (card ID: "alt_1"), labeled "Alternative (Workflow)"

**Step 26**: Processing modal updates: "Executing workflow: Step 2 of 3..."

**Step 27**: Engine executes Step 2 (apply_voice_style to original):
- Target: "original"
- Resolves content from "original" card
- Calls `applyVoiceStyle()` with "humanize" preset
- Token usage: 720 tokens
- Tracks token usage (operation type: `voice_style_analysis`)
- Returns humanized copy

**Step 28**: Engine stores result: `{ alt_1: [...], voice_humanize_original: [humanized copy] }`

**Step 29**: New output card appears (card ID: "voice_humanize_original"), labeled "Humanized (Workflow)"

**Step 30**: Processing modal updates: "Executing workflow: Step 3 of 3..."

**Step 31**: Engine executes Step 3 (apply_voice_style to alt_1):
- Target: "alt_1"
- Resolves content from "alt_1" card
- Calls `applyVoiceStyle()` with "alex-hormozi" preset
- Token usage: 680 tokens
- Tracks token usage
- Returns Hormozi-style copy

**Step 32**: Engine stores result

**Step 33**: New output card appears (card ID: "voice_hormozi_alt1"), labeled "Alex Hormozi (Workflow)"

**Step 34**: Processing modal closes

**Step 35**: Toast: "Workflow completed! 3 additional outputs generated."

**Step 36**: User now has 4 output cards:
1. Original (1250 tokens)
2. Alternative (950 tokens)
3. Humanized (720 tokens)
4. Alex Hormozi (680 tokens)

**Total tokens consumed**: 1250 + 950 + 720 + 680 = 3600 tokens

**Outcome**: User has 4 outputs from single "Generate" click, workflow automated 3 extra steps

---

## Multi-Variant Generation and Selection

### Flow A: Generating 5 Variants

**Step 1**: User in Copy Maker, fills form

**Step 2**: User sets "Create Variants" to 5

**Step 3**: User clicks "Generate"

**Steps 4-12**: Same as First Generation Flow A (up to API call preparation)

**Step 13**: System calls API with `num_variants: 5`

**Step 14**: API generates 5 different versions in single call (token usage: 3200 tokens - 800 input shared, 2400 output for 5 variants)

**Step 15**: System tracks token usage: 3200 tokens, single operation

**Step 16**: System creates 5 output cards:
- Variant 1 (labeled "Version 1")
- Variant 2 (labeled "Version 2")
- Variant 3 (labeled "Version 3")
- Variant 4 (labeled "Version 4")
- Variant 5 (labeled "Version 5")

**Step 17**: All 5 cards appear simultaneously in results section

**Outcome**: User has 5 options, consumed tokens for 5 outputs but saved on repeated input token costs

### Flow B: Scoring and Comparing 5 Variants

**Steps 1-17**: Same as Flow A (5 variants generated)

**Step 18**: User clicks "Generate Score" on Variant 1 card

**Step 19**: System calls scoring API (token usage: 420 tokens)

**Step 20**: Variant 1 card updates with scores:
- Clarity: 8/10 (green)
- Persuasiveness: 7/10 (green)
- Engagement: 6/10 (yellow)
- SEO: 5/10 (yellow)
- Overall: 6.5/10

**Step 21**: User repeats for all 5 variants (4 more scoring calls, 420 tokens each)

**Total scoring tokens**: 420 * 5 = 2100 tokens

**Step 22**: User now has scores on all 5 cards

**Step 23**: User clicks "Compare" button (appears when 2+ outputs exist)

**Step 24**: System calls Grok API with all 5 outputs for comparison

**Step 25**: Grok returns comparative analysis (token usage: 1800 tokens):
- Comparison table across 6 dimensions
- Strengths and weaknesses of each
- Recommendation: "Variant 3 best for your use case because..."

**Step 26**: Comparison Modal displays analysis

**Step 27**: User reviews, decides on Variant 3

**Step 28**: User clicks "Copy to Clipboard" on Variant 3 card

**Total tokens for entire flow**: 3200 (generation) + 2100 (scoring) + 1800 (comparison) = 7100 tokens

**Outcome**: User has data-driven selection, not guessing which variant best

---

## Iterative Refinement Flow

### Flow A: Generate → Improve → Improve Again

**Step 1**: User generates initial copy in Create Mode (180 words)

**Step 2**: User reviews output, decides it's too salesy

**Step 3**: User clicks "Replace Input" button on output card

**Step 4**: System:
- Loads output text into "Original Copy" field (Improve Mode)
- Switches tab to "Improve" automatically
- Clears output cards (or keeps them, depending on implementation)

**Step 5**: User adds to Special Instructions: "Make less salesy, more educational"

**Step 6**: User clicks "Generate"

**Step 7**: System generates improved version (token usage: 1100 tokens)

**Step 8**: Improved copy appears (now 185 words, less salesy tone)

**Step 9**: User reviews, decides it needs more statistics

**Step 10**: User clicks "Replace Input" again (loads improved copy back into Original Copy)

**Step 11**: User changes Special Instructions: "Add relevant statistics and data points"

**Step 12**: User clicks "Generate"

**Step 13**: System generates second improvement (token usage: 1150 tokens)

**Step 14**: Final copy appears with statistics integrated

**Total tokens**: 1250 (initial) + 1100 (first improvement) + 1150 (second improvement) = 3500 tokens

**Outcome**: User refined copy through 3 generations, each building on previous

### Flow B: Generate → Modify Content (Targeted Edit)

**Step 1**: User generates initial copy

**Step 2**: User happy with structure but wants one specific change: add a customer testimonial quote

**Step 3**: User clicks "Modify Content" button on output card

**Step 4**: Modify Content Modal opens with textarea

**Step 5**: User enters instruction: "Add a customer testimonial quote after the benefits section"

**Step 6**: User clicks "Apply Modification"

**Step 7**: System calls API with:
- Original copy as context
- Modification instruction
- Operation type: `ai_content_modification`

**Step 8**: API returns modified copy (token usage: 650 tokens)

**Step 9**: New output card appears labeled "Modified"

**Outcome**: Targeted edit without full regeneration (saved ~400-500 tokens vs. regenerating from scratch)

---

## Credit Usage and Exhaustion

### Flow A: Normal Usage Until Low Balance Warning

**Step 1**: User starts with 999999 tokens (30-day trial)

**Step 2-50**: User generates copy multiple times over days:
- 20 Copy Maker generations: ~25000 tokens (avg 1250/generation)
- 30 Copy Snap operations: ~12000 tokens (avg 400/operation)
- 10 Workflow executions: ~36000 tokens (avg 3600/workflow)
- 5 Comparison analyses: ~9000 tokens (avg 1800/comparison)

**Total consumed**: 82000 tokens

**Step 51**: User checks dashboard Token Usage tab, sees:
- Total tokens: 82000
- Total cost: ~$250 (estimated)
- Remaining: 917999 tokens

**Step 52**: User continues usage

**Outcome**: Transparent usage tracking, user aware of consumption rate

### Flow B: Approaching Zero Balance

**Step 1**: User balance: 1500 tokens remaining (after extensive usage)

**Step 2**: User attempts to generate copy (estimated 1250 tokens)

**Step 3**: System calls `checkUserAccess()`:
- `tokens_remaining > 0`: PASS (1500 > 0)
- Generation proceeds

**Step 4**: Generation completes, uses 1300 tokens

**Step 5**: Balance updated: 1500 - 1300 = 200 tokens

**Step 6**: User attempts another generation (estimated 1250 tokens)

**Step 7**: System calls `checkUserAccess()`:
- `tokens_remaining > 0`: PASS (200 > 0)
- Generation proceeds (no warning about low balance)

**Step 8**: Generation completes, uses 1250 tokens

**Step 9**: Balance updated: 200 - 1250 = **-1050 tokens** (negative due to race condition - check passed before generation, but generation used more than remaining)

**Step 10**: User attempts another generation

**Step 11**: System calls `checkUserAccess()`:
- `tokens_remaining > 0`: FAIL (-1050 <= 0)
- Generation BLOCKED

**Step 12**: Token Limit Modal appears: "You've reached your token limit. Current balance: -1050 tokens."

**Outcome**: User blocked after going negative, no warning before hitting zero (constraint: no pre-emptive low-balance warning system)

### Flow C: Token Tracking Failure (All Retries Exhausted)

**Step 1**: User generates copy successfully

**Step 2**: API returns (token usage: 1250 tokens)

**Step 3**: System calls `trackTokenUsage()`

**Step 4**: Edge Function `track-tokens` called (Attempt 1)

**Step 5**: Network error (500 Internal Server Error)

**Step 6**: Retry after 1 second (Attempt 2)

**Step 7**: Network error again

**Step 8**: Retry after 2 seconds (Attempt 3)

**Step 9**: Network error again

**Step 10**: All 3 attempts failed

**Step 11**: System throws error: "Failed to track token usage after 3 attempts"

**Step 12**: Error toast: "Generation failed: Unable to track usage. Please try again."

**Step 13**: Output NOT displayed to user (even though API returned successfully)

**Step 14**: User's balance NOT decremented (no tracking = no usage recorded)

**Outcome**: Generation blocked to prevent untracked usage (prevents free consumption), user must retry

---

## Paywall Trigger Points

### Trigger Point 1: Before Every Generation

**Location**: Copy Maker "Generate" button click

**Check**: `checkUserAccess()` function

**Conditions**:
- `until_date < current_date` → BLOCK (subscription expired)
- `tokens_remaining <= 0` → BLOCK (no credits)

**Paywall**: Token Limit Modal

### Trigger Point 2: Before Every Copy Snap Operation

**Location**: Copy Snap "Generate" button click

**Check**: Same `checkUserAccess()` function

**Conditions**: Same as Trigger Point 1

**Paywall**: Token Limit Modal

### Trigger Point 3: Before Every On-Demand Operation

**Location**: "Generate SEO", "Generate Score", "Generate Alternative", "Apply Voice Style", "Modify Content" buttons

**Check**: `checkUserAccess()` before each operation

**Conditions**: Same as Trigger Point 1

**Paywall**: Token Limit Modal

### Trigger Point 4: Before Workflow Execution (Implicit)

**Location**: Workflow engine before each step

**Check**: Each workflow step calls API functions, which internally check access

**Conditions**: Same as Trigger Point 1

**Behavior**: Workflow stops at step that fails access check, partial results displayed

**Paywall**: Token Limit Modal

### No Paywall Trigger Points (Free Operations)

- Viewing dashboard
- Loading templates
- Creating templates
- Viewing saved outputs
- Creating brand voices (manual - not implemented)
- Editing brand voices
- Creating workflows
- Editing workflows
- Viewing token usage
- Exporting data
- Editing form fields
- Switching modes
- All UI interactions that don't call AI APIs

---

## Saved Output Management

### Flow A: Saving Output to Dashboard

**Step 1**: User generates copy successfully

**Step 2**: User happy with output, clicks "Save" button on output card

**Step 3**: Save Output Modal appears with fields:
- Title: [empty]
- Description: [empty]
- Tags: [tag input with autocomplete]

**Step 4**: User fills modal:
- Title: "Homepage Hero - TaskFlow AI Launch"
- Description: "Final approved version for launch campaign"
- Tags: ["homepage", "launch", "approved"]

**Step 5**: User clicks "Save to Dashboard"

**Step 6**: System inserts row into `pmc_saved_outputs`:
```json
{
  "user_id": "user-abc",
  "title": "Homepage Hero - TaskFlow AI Launch",
  "description": "Final approved version for launch campaign",
  "tags": ["homepage", "launch", "approved"],
  "input_data": { [all form fields as JSONB] },
  "output_data": { [all outputs, scores, SEO data as JSONB] },
  "session_id": "session-xyz",
  "is_favorite": false
}
```

**Step 7**: Success toast: "Output saved to dashboard!"

**Outcome**: Output persists in database, accessible from dashboard

### Flow B: Loading Saved Output

**Step 1**: User navigates to Dashboard > Saved Outputs tab

**Step 2**: List of saved outputs displayed (cards with title, description, date, customer)

**Step 3**: User searches: "homepage"

**Step 4**: List filters to matching outputs (3 results)

**Step 5**: User clicks "Load" button on "Homepage Hero - TaskFlow AI Launch" card

**Step 6**: System reads `input_data` and `output_data` from saved output

**Step 7**: User redirected to Copy Maker

**Step 8**: Form populates with all saved `input_data` fields

**Step 9**: Output section populates with all saved outputs from `output_data`

**Step 10**: Prefill indicator badges appear (all fields came from saved output)

**Step 11**: User can now:
- Edit inputs and regenerate
- Apply voice styles to saved outputs
- Compare saved outputs
- Export as HTML or copy as Markdown

**Outcome**: User restored complete state from saved output, can continue work

### Flow C: Favoriting and Filtering

**Step 1**: User in Dashboard > Saved Outputs tab

**Step 2**: User clicks star icon on "Homepage Hero" output card

**Step 3**: System updates `pmc_saved_outputs.is_favorite = true` for that row

**Step 4**: Star icon fills (visual feedback)

**Step 5**: User clicks "Favorites Only" filter toggle

**Step 6**: List filters to show only outputs where `is_favorite = true`

**Outcome**: User has quick access to best outputs, reduces scrolling through library

---

## Error and Retry States

### Error State 1: Network Timeout

**Scenario**: API call takes >120 seconds (timeout threshold)

**Step 1**: User clicks "Generate"

**Step 2**: Processing modal displays "Generating copy with Claude Sonnet 4.5..."

**Step 3**: 120 seconds pass with no response

**Step 4**: System aborts request with timeout error

**Step 5**: Processing modal closes

**Step 6**: Error toast: "Request timed out. Please try again."

**Step 7**: User clicks "Generate" again (manual retry)

**Outcome**: No tokens consumed (API didn't complete), user retries manually

### Error State 2: Model Fallback (Success Path)

**Scenario**: Primary model fails, fallback succeeds

**Step 1**: User generates with Claude Sonnet 4.5

**Step 2**: Claude API returns 500 error

**Step 3**: System catches error, logs to console

**Step 4**: Toast: "Claude unavailable, using GPT-4o as fallback"

**Step 5**: System calls GPT-4o API with same prompt

**Step 6**: GPT-4o returns successfully (token usage: 1400 tokens)

**Step 7**: System tracks token usage with model: `gpt-4o` (not `claude-sonnet-4-5`)

**Step 8**: Output displays with badge: "GPT-4o (Fallback)"

**Outcome**: Generation succeeds despite primary failure, accurate billing (GPT-4o tokens tracked)

### Error State 3: All Models Fail

**Scenario**: Primary and fallback both fail

**Step 1**: User generates with DeepSeek (Copy Snap)

**Step 2**: DeepSeek API returns 503 error

**Step 3**: System attempts GPT-4o fallback

**Step 4**: GPT-4o API also returns 503 error

**Step 5**: System catches error, no more fallback options

**Step 6**: Error toast: "All AI services unavailable. Please try again later."

**Step 7**: User sees no outputs

**Outcome**: Generation fails completely, no tokens consumed (APIs didn't complete)

### Error State 4: Invalid API Key (Config Error)

**Scenario**: API key invalid or expired

**Step 1**: User generates

**Step 2**: API returns 401 Unauthorized

**Step 3**: System catches error

**Step 4**: Error toast: "API authentication failed. Contact support."

**Step 5**: User cannot proceed (no retry will succeed)

**Outcome**: System-level error, requires admin intervention to update API keys

---

## Admin User Management

### Flow A: Creating New User (Admin)

**Step 1**: Admin user navigates to `/manage-users` (not visible to non-admins)

**Step 2**: User management page loads with list of all users

**Step 3**: Admin clicks "Add User" button

**Step 4**: Create User Modal appears with fields:
- Email
- Password
- Name
- Tokens Allowed (default: 999999)
- Start Date (default: today)
- Until Date (default: today + 30 days)

**Step 5**: Admin fills modal:
- Email: "newuser@example.com"
- Password: [generated or manual]
- Name: "John Doe"
- Tokens Allowed: 500000 (custom limit)
- Start Date: 2026-02-01
- Until Date: 2026-03-01

**Step 6**: Admin clicks "Create User"

**Step 7**: System calls `admin-create-user` Edge Function with form data

**Step 8**: Edge Function creates `auth.users` entry (Supabase Auth)

**Step 9**: Edge Function creates `pmc_users` entry with specified quotas

**Step 10**: Success response returned to UI

**Step 11**: Toast: "User created successfully!"

**Step 12**: New user appears in user list

**Step 13**: Welcome email sent to newuser@example.com (automatic trigger)

**Outcome**: New user can log in immediately with 500000 tokens, 30-day access

### Flow B: Adjusting User Quota (Admin)

**Step 1**: Admin in user management page, viewing user list

**Step 2**: Admin searches for user: "john@example.com"

**Step 3**: Admin clicks "Edit" button on John's row

**Step 4**: Edit User Modal appears with current values:
- Email: john@example.com (read-only)
- Name: John Doe
- Tokens Allowed: 500000
- Tokens Remaining: 123000
- Until Date: 2026-03-01

**Step 5**: Admin adjusts:
- Tokens Allowed: 500000 → 1000000 (doubled)
- Until Date: 2026-03-01 → 2026-06-01 (extended 3 months)

**Step 6**: Admin clicks "Save Changes"

**Step 7**: System calls `admin-update-user` Edge Function

**Step 8**: Edge Function updates `pmc_users` row:
- `tokens_allowed = 1000000`
- `until_date = 2026-06-01`
- `tokens_remaining` unchanged (admin didn't adjust, though could)

**Step 9**: Success toast: "User updated successfully!"

**Step 10**: User list refreshes with new values

**Step 11**: John's next generation attempt will pass access check (extended subscription)

**Outcome**: Admin granted more tokens and time to user without user action

---

## Summary

**Total flows documented**: 30+ distinct flows across 13 categories

**Flow types**:
- Success paths (happy path, all steps succeed)
- Error paths (failures at various points)
- Fallback paths (primary fails, backup succeeds)
- Decision points (user choices that fork flow)
- Retry paths (manual and automatic retries)

**Key characteristics**:
- No ambiguity: Every step explicitly documented
- No hand-waving: Actual system behavior, not idealized flow
- Includes edge cases: Race conditions, negative balances, parse errors
- Includes constraints: What blocks progression, what doesn't

**Scope**: All user-facing flows as implemented, not roadmap features.

