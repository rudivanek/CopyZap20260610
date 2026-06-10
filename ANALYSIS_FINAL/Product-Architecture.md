# CopyZap Product Architecture

**Document Type**: Technical Architecture Documentation
**Date**: 2026-01-30
**Purpose**: System design, logic flows, assumptions, and constraints. No marketing, no positioning, no speculation.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Credit System Architecture](#credit-system-architecture)
3. [AI Model Selection and Routing](#ai-model-selection-and-routing)
4. [Output Validation and Retry Logic](#output-validation-and-retry-logic)
5. [Session Management Architecture](#session-management-architecture)
6. [Security Architecture](#security-architecture)
7. [Data Architecture](#data-architecture)
8. [Billing Boundaries](#billing-boundaries)
9. [Performance Considerations](#performance-considerations)
10. [Failure Modes and Recovery](#failure-modes-and-recovery)
11. [Known Limitations](#known-limitations)
12. [Assumptions and Dependencies](#assumptions-and-dependencies)

---

## System Overview

### Technology Stack

**Frontend**:
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.21 (build tool)
- TailwindCSS 3.4.1 (styling)
- React Router 6.22.2 (routing)
- React Beautiful DND (drag-and-drop)

**Backend**:
- Supabase (PostgreSQL 15)
- Supabase Auth (authentication)
- Supabase Edge Functions (Deno runtime, TypeScript)
- Row Level Security (RLS) for access control

**AI Providers**:
- Anthropic Claude (Sonnet 4.5, Haiku 4.5, Opus 4.5)
- OpenAI GPT (4o, 4 Turbo, 3.5 Turbo, ChatGPT-4o Latest)
- DeepSeek (deepseek-chat)
- xAI Grok (grok-4-latest)
- Google Gemini (gemini-2.0-flash)

**Infrastructure**:
- Hosting: Netlify (frontend static hosting)
- Database: Supabase Cloud (managed PostgreSQL)
- Edge Functions: Supabase Edge Runtime (Deno Deploy)
- Storage: Supabase Storage (for blog images, future user uploads)

### Architecture Pattern

**Type**: Serverless + JAMstack
- Static React frontend (SPA)
- API calls to Supabase Edge Functions
- Database operations via Supabase client SDK
- No traditional backend server

**Data Flow**:
1. User interacts with React UI
2. React calls Edge Functions or Supabase SDK directly
3. Edge Functions make external API calls (AI providers)
4. Edge Functions write to database
5. Database triggers execute business logic
6. React re-fetches data via Supabase SDK or receives via subscription

**State Management**:
- React Context API (theme, mode, session)
- React hooks with localStorage (form state)
- No Redux, no Zustand, no external state library

---

## Credit System Architecture

### Dual-Tracking System

**Primary**: Token-based tracking (currently active)
- Unit: AI API tokens (input + output + reasoning)
- Granularity: Per API call
- Storage: `pmc_user_tokens_used` table (immutable log)
- Balance: `pmc_users.tokens_remaining` field (mutable)

**Future**: Credits-based system (prepared, not active)
- Unit: Credits (abstract currency)
- Conversion: Database-driven (USD → credits via `llm_billing_rules`)
- Pricing: Database-driven (model → USD via `llm_model_pricing`)
- Storage: Same `pmc_user_tokens_used` table (fields prepared)
- Balance: `pmc_users.credits_allowed`, `credits_rollover_enabled` (fields prepared)

**Current implementation status**: Token system fully active, credits system schema ready but logic not implemented.

### Token Tracking Flow (Detailed)

**Initiation**:
```
API Call Completes
  → Extract token count from response.usage.total_tokens
  → Extract model from response.model_used (may differ from requested if fallback)
  → Extract timestamp
```

**Cost Calculation**:
```
calculateTokenCost(tokenCount, model)
  → Lookup hardcoded per-token price for model (src/services/api/utils.ts:499-523)
  → Multiply: tokenCount * per_token_price = cost_usd
  → Return cost_usd (6 decimal places)
```

**Tracking Call**:
```
trackTokenUsage(user, tokens, model, operationType, sessionId, trackingId, tokenBreakdown)
  → Validate: sessionId must exist (strict enforcement)
  → Generate tracking ID: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
  → Call Edge Function: /functions/v1/track-tokens
  → Payload: {user_id, email, model, operation_type, tokens_used, cost_usd, session_id, tracking_id, token_breakdown}
  → Timeout: 10 seconds per attempt
  → Retry: 3 attempts with exponential backoff (1s, 2s, 4s)
```

**Edge Function Processing**:
```
track-tokens Edge Function receives payload
  → INSERT INTO pmc_user_tokens_used (user_id, operation_type, model, tokens_used, cost_usd, session_id, ...)
  → Database trigger "sync_tokens_remaining" fires AFTER INSERT
  → Trigger calls update_tokens_remaining(NEW.user_id, NEW.tokens_used)
  → Function: UPDATE pmc_users SET tokens_remaining = tokens_remaining - tokens_used WHERE id = user_id
  → Atomic operation (row-level lock during update)
```

**Success Response**:
```
Edge Function returns 200 OK
  → Frontend logs success
  → Continue with next operation
```

**Failure Response**:
```
Edge Function returns error (500, timeout, network error)
  → Frontend retries (up to 3 total attempts)
  → If all fail: Throw error, block generation, show error to user
  → Rationale: Prevent untracked (free) usage
```

### Balance Enforcement Logic

**Check Function**: `checkUserAccess()`

**Location**: `src/services/supabaseClient.ts:1866-1994`

**Invocation Points**:
- Before every Copy Maker generation
- Before every Copy Snap operation
- Before every on-demand operation (SEO, score, alternative, voice style, modify)
- Implicitly before workflow steps (via operations above)

**Logic**:
```typescript
async function checkUserAccess() {
  // Fetch user record
  const user = await supabase
    .from('pmc_users')
    .select('tokens_remaining, until_date')
    .eq('id', currentUserId)
    .single();

  // Check 1: Subscription validity
  if (user.until_date !== null && user.until_date < current_date) {
    throw new Error('Subscription expired');
  }

  // Check 2: Token balance
  if (user.tokens_remaining <= 0) {
    throw new Error('Insufficient tokens');
  }

  // Both checks pass
  return true;
}
```

**Enforcement Behavior**:
- Hard stop: At `tokens_remaining <= 0`, no generation allowed
- No grace period, no warnings, no "soft limit"
- Modal shown: Token Limit Modal with current balance and contact info

**Race Condition**:
- Scenario: Two concurrent requests both check balance (e.g., 100 tokens remaining)
- Both pass check (100 > 0)
- Both execute (consume 80 tokens each)
- Final balance: 100 - 80 - 80 = **-60** (negative)
- Next request: Blocked (balance <= 0)
- Mitigation: None currently implemented (database-level locking could prevent, but adds latency)

### Balance Synchronization

**Mechanism**: Database trigger + function

**Trigger Definition**:
```sql
CREATE TRIGGER sync_tokens_remaining
AFTER INSERT ON pmc_user_tokens_used
FOR EACH ROW
EXECUTE FUNCTION update_tokens_remaining();
```

**Function Logic**:
```sql
CREATE OR REPLACE FUNCTION update_tokens_remaining()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pmc_users
  SET tokens_remaining = tokens_remaining - NEW.tokens_used
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Characteristics**:
- Atomic: UPDATE happens within trigger transaction
- Synchronous: INSERT doesn't complete until trigger finishes
- Idempotent: Re-running same INSERT would double-decrement (duplicate tracking ID prevents this)

**Edge Cases**:
- User deleted mid-generation: FK constraint prevents orphaned token record, transaction rolls back
- Token tracking fails: INSERT doesn't occur, balance not decremented, user not charged (safe failure mode)

### Session Grouping

**Purpose**: Group related token usage records for reporting and cost attribution

**Implementation**:
- All operations within single generation share `session_id`
- Primary copy generation: Creates new session or reuses existing
- On-demand operations: Use session ID from form state
- Workflow operations: Use session ID from primary generation

**View**: `pmc_session_token_summary`
```sql
SELECT
  session_id,
  user_id,
  COUNT(*) as api_calls_count,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost,
  ARRAY_AGG(DISTINCT model) as models_used,
  ARRAY_AGG(DISTINCT operation_type) as operations_performed,
  MIN(created_at) as session_start,
  MAX(created_at) as session_end
FROM pmc_user_tokens_used
GROUP BY session_id, user_id;
```

**Usage**: Dashboard Token Usage tab displays session-grouped rows, user drills down to see individual API calls

---

## AI Model Selection and Routing

### Model Inventory

**10 AI Models** across 5 providers:

| Model | Provider | Primary Use Case | Cost (per token) | Max Tokens |
|-------|----------|------------------|------------------|------------|
| Claude Sonnet 4.5 | Anthropic | Default (quality+speed) | $0.000003 | 64K |
| Claude Haiku 4.5 | Anthropic | Fast, simple tasks | $0.000001 | 64K |
| Claude Opus 4.5 | Anthropic | Maximum quality | $0.000005 | 64K |
| ChatGPT-4o Latest | OpenAI | Latest GPT-4o | $0.000005 | 16K |
| GPT-4o | OpenAI | High quality | $0.000005 | 16K |
| GPT-4 Turbo | OpenAI | Fast GPT-4 | $0.000003 | 16K |
| GPT-3.5 Turbo | OpenAI | Low cost | $0.0000015 | 16K |
| DeepSeek Chat | DeepSeek | Ultra low cost | $0.0000025 | 8K |
| Grok 4 Latest | xAI | Comparison analysis | $0.000015 | configurable |
| Gemini 2.0 Flash | Google | Lowest cost | $0.0000001 | 8K |

**Selection Interface**: Dropdown in Copy Maker form, user chooses model before generation

**Default Model**: Claude Sonnet 4.5 (balances quality and cost)

### Model Routing Logic

**Primary-Fallback Pattern**:
```
User selects Model A
  → System attempts Model A API
  → If success: Return result, track Model A usage
  → If failure (error, timeout, rate limit): Proceed to fallback
  → System attempts Model B (predetermined fallback)
  → If success: Return result, track Model B usage, notify user
  → If failure: Return error to user, no more fallbacks
```

**Copy Snap Specific Routing**:
```
User triggers Copy Snap operation
  → System always tries DeepSeek first (hardcoded primary)
  → If DeepSeek fails: Fallback to GPT-4o (hardcoded fallback)
  → If GPT-4o fails: No further fallback, error to user
  → Rationale: DeepSeek 5-10x cheaper for short-form tasks, GPT-4o reliable backup
```

**Fallback Model Mapping** (Copy Maker):
- Claude models → GPT-4o (cross-provider fallback)
- GPT models → Claude Sonnet 4.5 (cross-provider fallback)
- DeepSeek → GPT-4o
- Grok → Claude Sonnet 4.5
- Gemini → GPT-3.5 Turbo (similar cost tier)

**No Fallback Scenarios**:
- User explicitly disabled fallbacks (not implemented, feature not available)
- All providers down (edge case, no solution)

### API Request Construction

**Function**: `makeApiRequestWithFallback()`

**Inputs**:
- `systemPrompt`: System role and instructions
- `userPrompt`: User content and context
- `model`: Requested AI model
- `maxTokens`: Output token limit
- `responseFormat`: 'text' or 'json_object'
- `userEmail`: For logging

**Process**:
```
1. Determine provider from model name:
   - claude-* → Anthropic
   - gpt-*, chatgpt-* → OpenAI
   - deepseek-* → DeepSeek
   - grok-* → xAI
   - gemini-* → Google

2. Construct provider-specific request payload:
   Anthropic format:
   {
     model: "claude-sonnet-4-5",
     max_tokens: 64000,
     temperature: 0.7,
     system: [systemPrompt],
     messages: [{role: "user", content: userPrompt}]
   }

   OpenAI format:
   {
     model: "gpt-4o",
     max_tokens: 16000,
     temperature: 0.7,
     messages: [
       {role: "system", content: systemPrompt},
       {role: "user", content: userPrompt}
     ],
     response_format: {type: "json_object"} // if JSON requested
   }

3. Set API key from environment:
   - Anthropic: process.env.ANTHROPIC_API_KEY
   - OpenAI: process.env.OPENAI_API_KEY
   - DeepSeek: process.env.DEEPSEEK_API_KEY
   - xAI: process.env.XAI_API_KEY
   - Google: process.env.GOOGLE_API_KEY

4. Make HTTP POST to provider endpoint:
   - Anthropic: https://api.anthropic.com/v1/messages
   - OpenAI: https://api.openai.com/v1/chat/completions
   - DeepSeek: https://api.deepseek.com/v1/chat/completions
   - xAI: https://api.x.ai/v1/chat/completions
   - Google: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

5. Handle response:
   - Success: Extract content and usage
   - Error: Catch, log, trigger fallback
```

**Temperature Logic**:
```typescript
const wordCount = getEstimatedWordCount(prompt);
const temperature = wordCount <= 150 ? 0.5 : 0.7;
// Rationale: Short content needs precision (low temp), long content benefits from variety (higher temp)
```

### Multi-Variant Generation

**Implementation**: Single API call with higher output token limit

**Example**:
```
User requests 5 variants
  → Prompt includes: "Generate 5 distinctly different versions..."
  → Max tokens: 16000 (normal) → 80000 (5x, but capped by model limit)
  → API returns single response with 5 versions embedded
  → Parser extracts 5 versions (regex or section parsing)
  → Token usage: ~2.5x single variant (input tokens shared across variants)
```

**Cost Efficiency**:
- Single variant: 1000 input + 500 output = 1500 tokens
- Five variants (separate calls): 1000 input * 5 + 500 output * 5 = 7500 tokens
- Five variants (single call): 1000 input + 2500 output = 3500 tokens
- Savings: 53% fewer tokens for same output

---

## Output Validation and Retry Logic

### Word Count Enforcement

**Toggle**: "Prioritize Word Count" (boolean)

**Modes**:
1. **Strict Mode (Toggle ON)**:
   - Tolerance: ±2% of target
   - Max revisions: 2 attempts
   - Revision prompt: Explicit expansion/contraction instruction

2. **Flexible Mode (Toggle OFF)**:
   - Tolerance: ±20-30% (configurable)
   - Max revisions: 0 (accept first result)

**Strict Mode Logic**:
```
Target: 200 words
Tolerance: ±2% = 196-204 words

Generation 1: 180 words
  → Outside tolerance (180 < 196)
  → Calculate gap: (196 - 180) / 180 = 8.9% needed
  → Revision prompt: "Expand this copy by approximately 9%. Add more detail to [identified thin sections]. Maintain overall structure and tone."
  → Max tokens: Same as original

Generation 2 (Revision 1): 195 words
  → Outside tolerance (195 < 196)
  → Calculate gap: (196 - 195) / 195 = 0.5% needed
  → Revision prompt: "Expand this copy slightly by approximately 0.5%. Add 1-2 sentences to enhance [specific section]."

Generation 3 (Revision 2): 198 words
  → Within tolerance (196 <= 198 <= 204)
  → Accept result, stop revisions

If Generation 3 still outside tolerance:
  → Accept result anyway (max revisions reached)
  → Show warning: "Word count may not exactly match target (got 185, target 200)"
```

**Token Cost**: Each revision = full generation cost (input + output tokens)

**Constraint**: Revision prompts may conflict with other instructions (e.g., "add more detail" vs. "be concise"), causing quality drift.

### JSON Parsing (Copy Snap)

**Expected Format**:
```json
{
  "bestResult": "...",
  "alternative1": "...",
  "alternative2": "...",
  "expertTips": ["...", "...", "..."]
}
```

**Parsing Logic**:
```typescript
try {
  const parsed = JSON.parse(response);
  // Validate structure
  if (!parsed.bestResult || !parsed.alternative1) {
    throw new Error('Missing required fields');
  }
  return parsed;
} catch (error) {
  // Parse error recovery
  return {
    rawOutput: response,
    parseError: true
  };
}
```

**Recovery UI**:
- Display raw text output in card
- Show warning badge: "Parse Error"
- Provide "Retry" button
- User can use raw output or retry for properly formatted response

**Frequency**: Rare (<1% of responses) due to AI model improvements, but handled defensively

### SEO Metadata Extraction

**Format**: Structured text (not JSON)

**Example Output**:
```
URL SLUGS:
1. taskflow-ai-task-management
2. ai-powered-task-manager
3. automated-task-tracking-software

META DESCRIPTIONS:
1. TaskFlow AI automates task management for tech teams. Track progress, collaborate seamlessly, and hit deadlines with AI-powered insights. Try free for 30 days.
2. ...
```

**Parsing Logic**:
```typescript
const sections = response.split(/(?=URL SLUGS:|META DESCRIPTIONS:|H1 VARIANTS:)/);
sections.forEach(section => {
  if (section.startsWith('URL SLUGS:')) {
    const slugs = section.match(/\d+\.\s+(.+)/g);
    // Extract and store slugs
  }
  // Repeat for other sections
});
```

**Validation**: None (accepts any output AI returns, displays in UI)

**Edge Case**: If AI doesn't follow format, regex fails, empty arrays returned, UI shows "No SEO metadata generated"

### Output Structure Validation

**User-Defined Structure**: Array of section types (Problem, Solution, Benefits, etc.)

**Expected Output**: Markdown with H2 headings matching section types

**Validation**: None (prompt-based enforcement only)

**Example Prompt Section**:
```
OUTPUT STRUCTURE (CRITICAL - follow exactly):
Generate copy in this exact order:
1. Problem (150 words)
2. Solution (100 words)
3. Benefits (200 words)
4. Call to Action (50 words)

Use ## Heading for each section. Do not add extra sections.
```

**Reality**: AI may deviate (e.g., add Introduction section not requested), no programmatic enforcement, user edits manually if needed.

---

## Session Management Architecture

### Session Lifecycle

**Creation**:
```
ensureActiveSession(userId, operationType, briefDescription, customerId)
  → Check if formState.sessionId exists AND is valid
  → If yes: Return existing session_id
  → If no: Create new session
    → Generate session_id: uuid_v4()
    → Generate session_name: Auto from brief description + timestamp + pattern detection
    → INSERT INTO pmc_copy_sessions (id, user_id, customer_id, input_data, brief_description, session_name, output_type)
    → Return session_id
```

**Usage**:
- Primary generation: Session created or reused
- On-demand operations: Reuse session from formState
- Workflow operations: Reuse session from formState
- Token tracking: All usage records link to session_id (FK constraint enforces validity)

**Persistence**:
- Session persists after generation completes
- Session updated with `improved_copy`, `alternative_copy` if operations performed
- Session never automatically deleted (user deletes manually from dashboard, or future cleanup job runs)

**Constraint**: Foreign key `pmc_user_tokens_used.session_id` → `pmc_copy_sessions.id` prevents orphaned token records, ensures referential integrity

### Session Naming

**Auto-Generated Name Logic**:
```typescript
function generateSessionName(briefDescription: string, operationType: string): string {
  // Pattern detection
  if (operationType === 'copy-snap') {
    return `Copy Snap - ${timestamp}`;
  }

  // Extract key terms from brief description
  const keywords = extractKeywords(briefDescription); // NLP or keyword extraction

  // Format: "Keyword1 + Keyword2 - Timestamp"
  return `${keywords.slice(0, 2).join(' + ')} - ${formatTimestamp()}`;
}
```

**Examples**:
- "Homepage Hero - 2026-01-30 15:42"
- "Product Launch + Email Campaign - 2026-01-30 16:20"
- "Copy Snap - 2026-01-30 17:05"

**User Editing**: User can rename session from dashboard (updates `session_name` column)

### Scope Key (Recent Addition)

**Column**: `pmc_copy_sessions.scope_key`

**Purpose**: Group sessions by scope (e.g., project, campaign, client)

**Current Status**: Added in migration 20260129235702, not actively used in UI

**Future Use**: Filter dashboard by scope, organize sessions hierarchically

---

## Security Architecture

### Authentication

**Provider**: Supabase Auth (built-in)

**Methods**:
- Email/password (always available)
- Google OAuth (optional, configured)

**JWT Token**:
- Issued by Supabase on successful login
- Stored in browser (httpOnly cookie via Supabase client SDK)
- Expiry: 1 hour (configurable)
- Refresh: Automatic via Supabase SDK
- Validation: Every database query validates JWT via RLS policies

**Session Management**:
- Supabase handles session lifecycle
- Frontend checks `supabase.auth.getSession()` on mount
- If no session: Redirect to `/login`
- If session exists: Proceed to app

### Row Level Security (RLS)

**Enforcement**: Database-level, every query

**Policy Pattern** (Standard User Data):
```sql
-- Example: pmc_copy_sessions table
CREATE POLICY "Users can read own sessions"
ON pmc_copy_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON pmc_copy_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON pmc_copy_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON pmc_copy_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**Admin Policies** (Token Usage Data):
```sql
-- Users can read own usage
CREATE POLICY "Users can read own token usage"
ON pmc_user_tokens_used FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all usage
CREATE POLICY "Admins can read all token usage"
ON pmc_user_tokens_used FOR SELECT
TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'info@sharpen.studio',
    'thijs@readspeaker.com',
    'thijs.vanopstal@gmail.com'
  )
);

-- NO INSERT/UPDATE/DELETE policies for users (only Edge Functions via service role)
```

**Public Data Policies** (Templates):
```sql
-- All users can read public templates
CREATE POLICY "Users can read public templates"
ON pmc_public_saved_templates FOR SELECT
TO authenticated
USING (is_public = true OR user_id = auth.uid());

-- Only owner can update
CREATE POLICY "Users can update own templates"
ON pmc_public_saved_templates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Security Guarantees**:
- User A cannot read User B's sessions, outputs, templates (unless public)
- User cannot modify `tokens_remaining` directly (no UPDATE policy)
- User cannot insert fake token usage records (no INSERT policy, only Edge Functions with service role)
- Admin status checked via JWT email (not forgeable, JWT signed by Supabase)

### API Key Security

**Storage**: Environment variables (not in code, not in database)

**Access**:
- Frontend: No AI API keys (only Supabase anon key)
- Edge Functions: Read from `Deno.env.get()` at runtime
- Deployment: Keys set in Supabase Edge Function secrets (encrypted at rest)

**Rotation**: Manual (admin updates environment variables, redeploys Edge Functions)

**Constraint**: No automated key rotation, no key expiry alerts

### Input Sanitization

**User Inputs**: No server-side sanitization

**Rationale**: AI models handle arbitrary text, no SQL injection risk (parameterized queries via Supabase SDK), no XSS risk (React escapes by default)

**Constraint**: Malicious prompts can be sent to AI (e.g., prompt injection), but AI providers handle this, no direct system compromise

**Example Non-Issue**:
```
User enters: "<script>alert('xss')</script>"
→ Stored as plain text in database
→ Sent to AI as plain text
→ AI returns copy referencing script tag (as text)
→ Displayed in React (escaped automatically)
→ No script execution
```

### Data Privacy

**User Data**:
- Inputs, outputs, prompts stored in database (plaintext)
- No encryption at rest beyond database-level encryption (PostgreSQL default)
- No PII beyond email address
- No credit card data (payment handling outside scope)

**AI Provider Data Sharing**:
- All user inputs sent to AI providers
- Providers may log requests (per their policies)
- No opt-out for data sharing with AI providers (inherent to service)

**Compliance**: Not documented (GDPR, CCPA compliance not verified in codebase)

---

## Data Architecture

### Database Schema Summary

**17 Primary Tables**:
1. `auth.users` (Supabase-managed, authentication)
2. `pmc_users` (app-managed, quotas and subscriptions)
3. `pmc_copy_sessions` (generated copy sessions)
4. `pmc_user_tokens_used` (immutable usage log)
5. `pmc_customers` (customer/client organizations)
6. `pmc_public_brand_voices` (brand voice configurations)
7. `pmc_public_saved_templates` (templates and prefills)
8. `pmc_saved_outputs` (saved generation results)
9. `workflows` (workflow definitions)
10. `workflow_permissions` (workflow sharing)
11. `llm_model_pricing` (database-driven pricing, prepared)
12. `llm_billing_rules` (USD to credits conversion, prepared)
13. `pmc_url_analysis_cache` (competitor URL analysis cache)
14. `help_page_feedback` (help documentation feedback)
15. `beta_register` (beta program signups)
16. `user_preferences` (user preferences storage)
17. `pmc_special_instructions_suggestions`, `pmc_extrasuggestions`, `template_prompt_suggestions`, `modify_content_suggestions` (AI suggestions cache)

**1 Primary View**:
- `pmc_session_token_summary` (aggregated token usage per session)

**Relationships**:
- `pmc_users.id` ← FK from most tables (owner relationship)
- `pmc_customers.id` ← FK from sessions, brand voices, workflows (customer association)
- `pmc_copy_sessions.id` ← FK from token usage (session grouping)
- `auth.users.id` ← FK from `pmc_users` (auth linkage)

### JSONB Usage

**Heavy JSONB fields**:
- `pmc_copy_sessions.input_data`: Complete FormState snapshot
- `pmc_saved_outputs.input_data`, `output_data`: Full generation context
- `pmc_public_saved_templates.form_state_snapshot`: Template configuration
- `workflows.steps`: Workflow step definitions
- `pmc_public_brand_voices.punctuation_rules`, `advanced_style`: Voice configuration

**Rationale**: Flexible schema for evolving form fields, no migrations needed for new fields

**Constraint**: JSONB querying slower than indexed columns, but acceptable for user-scale data

### Indexes

**Performance-critical indexes**:
- `pmc_user_tokens_used`: (user_id, created_at), (session_id), (user_id, model), (user_id, operation_type)
- `pmc_copy_sessions`: (user_id, created_at), (customer_id), (scope_key)
- `pmc_public_saved_templates`: (user_id), (category), (is_public)

**Query optimization**: Composite indexes cover common filtering patterns (user + date, user + customer, etc.)

### Data Retention

**Current**: Indefinite retention (no automatic deletion)

**Prepared (Not Active)**:
- Session cleanup: Delete sessions with no outputs after 30 days (migration 20251127163553 creates job, not scheduled)
- Token usage: No planned deletion (permanent log for billing)

**Constraint**: Database size grows unbounded, no archival strategy

---

## Billing Boundaries

### What Is Tracked (Charged)

**All AI API Calls**:
- Primary copy generation
- Multi-variant generation (all variants in single call)
- Alternative copy generation
- Voice style application
- Content scoring
- GEO scoring
- SEO metadata generation
- FAQ schema generation
- Prompt evaluation
- Content modification
- Template suggestion (Quick Setup Wizard)
- Modification suggestions
- Output comparison (Grok)
- URL analysis (AI-powered)
- Brand voice analysis/generation

**Total**: 17 distinct operation types, all tracked

### What Is NOT Tracked (Free)

**UI Operations**:
- Form field interactions
- Mode switching
- Template loading
- Brand voice selection
- Workflow creation/editing
- Dashboard viewing
- Saved output viewing
- CSV export
- HTML export and Markdown copy (no AI involved, client-side only)

**Database Operations**:
- Reading templates, sessions, saved outputs
- Creating customers, brand voices (manual entry)
- Updating user preferences

**No Usage**: No token consumption if no AI API call made

### Billing Granularity

**Per API Call**: Each AI request tracked separately

**Example Scenario**:
```
User generates copy with workflow (5 steps)
  → Generation: 1 API call (1250 tokens)
  → Workflow Step 1 (Alternative): 1 API call (950 tokens)
  → Workflow Step 2 (Voice Style): 1 API call (720 tokens)
  → Workflow Step 3 (Voice Style): 1 API call (680 tokens)
  → Workflow Step 4 (Voice Style): 1 API call (690 tokens)
  → Total: 5 API calls, 4290 tokens, 5 rows in pmc_user_tokens_used
```

**Session Grouping**: All 5 calls share `session_id`, dashboard shows as single session with 4290 total tokens

### Cost Attribution

**By Session**: Total cost per session (sum of all operations)

**By Customer**: Filter dashboard by customer, see all costs for that client

**By Operation Type**: Filter/group by operation type, see cost breakdown (e.g., 60% on generation, 20% on scoring, 10% on workflows, 10% on alternatives)

**By Model**: Track which models used most, identify high-cost models

**Use Case**: Agency billing clients per session or per customer, internal cost analysis

### Billable Events (Future Credits System)

**Prepared Schema** (`llm_billing_rules`):
```sql
cost_multiplier: 1.30 (add 30% margin)
usd_per_unit: 0.010000 ($0.01 per credit)
min_units_per_call: 1 (minimum 1 credit per call, even if tokens only $0.002)
rounding_mode: 'ceil' (always round up)
```

**Conversion Logic (Not Active)**:
```
Tokens consumed: 1250
Model: Claude Sonnet 4.5 ($0.000003 per token)
Cost in USD: 1250 * 0.000003 = $0.00375

Apply multiplier: $0.00375 * 1.30 = $0.004875
Convert to credits: $0.004875 / $0.01 per credit = 0.4875 credits
Round: ceil(0.4875) = 1 credit

User charged: 1 credit
```

**Future Balance**: `credits_allowed` decremented, `tokens_remaining` no longer used

---

## Performance Considerations

### Bottlenecks

**1. AI API Latency**:
- Claude Sonnet 4.5: 5-15 seconds for 200-word copy
- DeepSeek: 2-5 seconds for short Copy Snap operations
- Grok comparison: 10-20 seconds for detailed analysis
- No caching (every request fresh)

**2. Sequential Workflow Execution**:
- Each step waits for previous step to complete
- 5-step workflow: 30-60 seconds total
- No parallelization (architectural choice for simplicity)

**3. Token Tracking Latency**:
- Edge Function call: 200-500ms
- Database INSERT + trigger: 50-100ms
- Retry on failure: +3-7 seconds (exponential backoff)
- Blocks generation completion (user waits for tracking to finish)

**4. Database Queries**:
- Dashboard token usage: Query `pmc_session_token_summary` view (pre-aggregated), fast (<500ms)
- Saved outputs list: Query `pmc_saved_outputs` with filters, fast (<300ms)
- Template dropdown: Query `pmc_public_saved_templates`, cached in memory after first load

### Optimization Strategies

**Implemented**:
- Multi-variant generation (single API call for N variants, not N calls)
- Session grouping (reduces dashboard query complexity)
- Indexes on high-traffic queries
- URL analysis caching (repeat analyses skip AI call)

**Not Implemented**:
- Prompt caching (AI providers support, not utilized)
- Response streaming (progressive output display)
- Parallel workflow execution
- Client-side output caching (regenerate always calls API)
- Database connection pooling (Supabase handles)

### Scalability Limits

**Current Architecture**:
- Serverless (Supabase + Edge Functions) scales automatically to request volume
- No hardcoded concurrency limits
- Potential bottleneck: AI provider rate limits (handled by fallback system)

**Database**:
- PostgreSQL scales to millions of rows (current usage: thousands)
- RLS adds query overhead (5-10% slower than no RLS)
- JSONB queries slower than indexed columns (acceptable for user-scale data)

**Edge Function Cold Starts**:
- First invocation after idle: 2-5 seconds (Deno runtime startup)
- Subsequent invocations: <100ms
- Mitigation: Supabase keeps functions warm for active projects

---

## Failure Modes and Recovery

### AI API Failure

**Scenario**: Primary AI model returns error (500, 503, timeout)

**Recovery**: Automatic fallback to alternative model

**User Impact**: Slight delay (2-5 seconds for fallback attempt), notification of model switch, potentially different cost

**Data Impact**: None (failure before token tracking)

### Token Tracking Failure (All Retries Exhausted)

**Scenario**: Edge Function `track-tokens` returns error 3 times

**Recovery**: Block generation, show error to user

**User Impact**: Generation not displayed (even though API succeeded), no token charge, must retry manually

**Data Impact**: AI API consumed tokens (charged by provider), but user not charged (internal cost absorption)

**Rationale**: Prefer user not charged over provider not charged (user trust > cost optimization)

### Database Unavailable

**Scenario**: Supabase database offline or unreachable

**Recovery**: None (hard failure)

**User Impact**: All operations fail (auth, generation, dashboard)

**Data Impact**: No data loss (reads fail, writes fail), system fully offline

**Mitigation**: Supabase SLA (99.9% uptime), no app-level mitigation

### Negative Token Balance (Race Condition)

**Scenario**: Two concurrent generations pass access check, both execute, balance goes negative

**Recovery**: Next generation blocked (balance <= 0 check)

**User Impact**: User charged for negative balance (expected), blocked until admin adjusts quota

**Data Impact**: Accurate usage tracking (negative balance reflects actual consumption)

**Mitigation**: None currently (database locking would prevent, but adds latency and complexity)

### Session ID Missing

**Scenario**: `formState.sessionId` undefined or invalid when calling token tracking

**Recovery**: `ensureActiveSession()` creates new session automatically

**User Impact**: None (transparent to user)

**Data Impact**: New session created, token usage linked to new session (not original session if one existed)

**Constraint**: Should not happen in normal flow (session always created before first generation), but defensive check prevents errors

### Workflow Step Failure

**Scenario**: Workflow Step 3 fails (API error, insufficient tokens, etc.)

**Recovery**: Graceful degradation (Steps 1-2 results displayed, Step 3+ not executed)

**User Impact**: Partial workflow results, error notification

**Data Impact**: Token usage for successful steps recorded, failed step not charged

---

## Known Limitations

### 1. No Streaming Responses

**Limitation**: All AI responses wait for complete generation before displaying

**Impact**: User waits 5-15 seconds with no feedback beyond "Generating..."

**Workaround**: None (architectural limitation, would require WebSocket or SSE)

### 2. No Prompt Caching

**Limitation**: Every API call sends full prompt (no cache key)

**Impact**: Higher token costs (input tokens charged every time)

**Example**: Brand voice prompt (2000 tokens) sent with every generation, even if unchanged

**Potential Savings**: 30-50% input token reduction if caching enabled

### 3. No Undo/Redo

**Limitation**: Form changes, output deletions, template deletions not undoable

**Impact**: User mistakes irreversible (must regenerate or re-create)

**Workaround**: User manually saves outputs before making destructive changes

### 4. No Real-Time Collaboration

**Limitation**: Sessions single-user only, no simultaneous editing

**Impact**: Teams cannot collaborate on same form in real-time

**Workaround**: Users share via saved outputs or templates (async collaboration)

### 5. No Output Versioning

**Limitation**: Regeneration overwrites previous output (if in same session)

**Impact**: No history of output changes, cannot compare v1 vs. v2

**Workaround**: User saves each version manually to dashboard

### 6. Client-Side Cost Calculation

**Limitation**: Token costs calculated in frontend (hardcoded prices)

**Impact**: Prices not dynamically updated (requires code deploy), potential manipulation (trust-based)

**Mitigation**: Edge Function also calculates cost (server-side validation), database stores both (audit trail)

### 7. No Admin Role System

**Limitation**: Admin status checked via hardcoded email lists (not role-based)

**Impact**: Adding admin requires code change, email lists inconsistent across files

**Constraint**: Cannot grant temporary admin, cannot revoke without code change

### 8. Race Condition in Balance Enforcement

**Limitation**: Multiple concurrent requests can bypass access check

**Impact**: User balance can go negative (see Failure Modes section)

**Mitigation**: None (database locking would prevent, but adds complexity)

### 9. No Automated Testing

**Observation**: No test files identified in codebase

**Impact**: Changes may introduce regressions, manual QA required

**Constraint**: Rapid iteration prioritized over test coverage

---

## Assumptions and Dependencies

### Assumptions

**User Behavior**:
- Users refresh browser after major updates (no in-app update notifications)
- Users have stable internet (no offline mode)
- Users work on desktop/laptop (mobile supported but not primary)

**Data Volumes**:
- <10,000 users (single-tenant Supabase instance)
- <1M token usage records (dashboard queries optimized for this scale)
- <100K sessions (cleanup job prepared but not active)

**AI Provider Reliability**:
- Claude API uptime >99% (fallback system handles <1% downtime)
- OpenAI API uptime >99% (fallback system)
- DeepSeek API uptime >95% (primary for Copy Snap, fallback to GPT-4o)

**Pricing Stability**:
- AI provider prices change infrequently (hardcoded prices updated manually)
- No dynamic pricing from providers

**Security**:
- Supabase JWT tokens not compromised
- API keys not leaked
- Database credentials secure

### External Dependencies

**Critical (Outage = System Down)**:
- Supabase (database, auth, Edge Functions)
- At least one AI provider (Claude or OpenAI)

**Important (Outage = Feature Degraded)**:
- DeepSeek (Copy Snap slower, uses GPT-4o fallback)
- Grok (comparison feature unavailable)
- Gemini (ultra-low-cost generation unavailable)

**Optional (Outage = No Impact)**:
- Google OAuth (email/password still works)
- Firecrawl (URL analysis, not core feature)
- Email service (welcome emails, not critical)

### Technical Debt

**Identified**:
- Admin email lists inconsistent across files
- No automated tests
- No output versioning
- Client-side cost calculation (prepared DB solution not active)
- No API key rotation policy
- No session cleanup job scheduled
- Negative balance possible via race condition

**Prioritization**: Functional completeness prioritized over architectural perfection (MVP-first approach)

---

## Summary

**Architecture Type**: Serverless JAMstack with PostgreSQL backend

**Key Strengths**:
- Automatic scaling (serverless)
- Strong security (RLS + JWT)
- Accurate billing (immutable usage log)
- Reliable token tracking (retry + strict enforcement)
- Flexible data model (JSONB for evolving schema)

**Key Constraints**:
- No streaming (wait for full response)
- No real-time collaboration
- Client-side cost calculation (trust-based)
- Race condition in balance enforcement
- No output versioning

**Design Philosophy**: Reliability > Performance, Security > Convenience, Accuracy > Speed

**Scale**: Suitable for 100s-1000s of users, millions of API calls, not yet validated at 10K+ users

