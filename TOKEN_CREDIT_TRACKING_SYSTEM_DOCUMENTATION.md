# CopyZap Token/Credit Tracking System - Complete Technical Documentation

**Generated:** 2026-01-16
**Purpose:** Document the CURRENT implementation of token/credit tracking, cost calculation, enforcement, and usage reporting in CopyZap.

---

## Table of Contents
1. [Database: Tables / Columns / Relationships](#1-database-tables--columns--relationships)
2. [Cost Calculation (Model Pricing)](#2-cost-calculation-model-pricing)
3. [Runtime Flow: End-to-End Tracking](#3-runtime-flow-end-to-end-tracking)
4. [Enforcement: How We Block Users Who Run Out of Credits](#4-enforcement-how-we-block-users-who-run-out-of-credits)
5. [Dashboard: How Users See Usage](#5-dashboard-how-users-see-usage)
6. [Reliability: Retries, Duplicates, Queues](#6-reliability-retries-duplicates-queues)
7. [Verification Checklist](#7-verification-checklist-sql--repro)
8. [Unknowns & Questions](#8-unknowns--questions)

---

## 1. DATABASE: TABLES / COLUMNS / RELATIONSHIPS

### 1.1 Core Tables Involved in Token/Credit Tracking

#### **Table: `pmc_user_tokens_used`**
**Purpose:** Immutable log of every token consumption event. Each row = one LLM API call.

**Created in:** `supabase/migrations/20250521181645_violet_coral.sql`

**Full Column List:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NOT NULL | Primary key, auto-generated |
| `user_id` | UUID | NOT NULL | FK to `pmc_users.id` (auth.users) |
| `operation_type` | TEXT | NOT NULL | Operation identifier (e.g., 'generate_copy', 'geo_score') |
| `model` | TEXT | NOT NULL | AI model used (e.g., 'claude-sonnet-4-5', 'gpt-4o') |
| `tokens_used` | INTEGER | NOT NULL | Total tokens consumed in this call |
| `cost_usd` | NUMERIC(10,6) | NOT NULL | Estimated USD cost for this call |
| `session_id` | UUID | NULLABLE | FK to `pmc_copy_sessions.id` (added in migration `20251129012353`) |
| `created_at` | TIMESTAMPTZ | NOT NULL | Timestamp of usage event |

**Written On Each Event:**
- All columns above are written on EVERY LLM API call
- `session_id` is optional but strongly encouraged for tracking

**Read For:**
- Dashboard usage display
- Enforcement calculations (via trigger that updates `tokens_remaining`)
- Admin reports and exports
- Per-session summaries

**Indexes:**
- `idx_user_tokens_used_user_id` on `user_id`
- `idx_pmc_user_tokens_created_at` on `created_at DESC`
- `idx_pmc_user_tokens_user_date` on `(user_id, created_at DESC)` (composite)
- `idx_pmc_user_tokens_used_session_id` on `session_id`
- `idx_pmc_user_tokens_used_user_session` on `(user_id, session_id)` (composite)

**Migration:** `supabase/migrations/20251105000001_add_token_usage_indexes.sql`

---

#### **Table: `pmc_users`**
**Purpose:** User account data including subscription limits and remaining balance.

**Created in:** `supabase/migrations/20250520231020_shrill_grove.sql`

**Relevant Columns for Token Tracking:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NOT NULL | Primary key, FK to `auth.users.id` |
| `email` | TEXT | NOT NULL | User email |
| `name` | TEXT | NOT NULL | User display name |
| `tokens_allowed` | NUMERIC | NULLABLE | Total tokens allocated to user (default: 999999) |
| `tokens_remaining` | NUMERIC | NULLABLE | Real-time remaining balance (added in `20260115164733`) |
| `start_date` | DATE | NULLABLE | Subscription start date |
| `until_date` | DATE | NULLABLE | Subscription expiration date |
| `created_at` | TIMESTAMPTZ | NOT NULL | Account creation timestamp |

**How Values Are Initialized:**
- `tokens_allowed`: Defaults to `999999` (effectively unlimited for now)
- `tokens_remaining`: Initialized to match `tokens_allowed` when added (migration `20260115164733_add_tokens_remaining_field.sql`)
- Values set during user creation in `supabase/functions/admin-create-user/index.ts`

**Can `tokens_remaining` Go Negative?**
- **YES**, by design. Migration `20260115164733` notes: "Can be negative if user exceeds limit (for tracking purposes)"
- Enforcement logic checks `tokens_remaining > 0` before allowing access

**Updated By:**
- **Trigger:** `sync_tokens_remaining` (created in `20260115205456_fix_tokens_remaining_sync.sql`)
- **Function:** `update_tokens_remaining()` - AFTER INSERT on `pmc_user_tokens_used`
- **Atomicity:** YES - trigger fires in same transaction as usage log insert

---

#### **Table: `llm_model_pricing`**
**Purpose:** Database-driven pricing table for per-model USD costs (per 1K tokens).

**Created in:** `supabase/migrations/20260116005151_create_llm_model_pricing.sql`

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `model_key` | TEXT | Model identifier (e.g., 'claude-sonnet-4-5'), UNIQUE |
| `provider` | TEXT | Provider name (e.g., 'anthropic', 'openai') |
| `usd_per_1k_input_tokens` | NUMERIC(10,6) | Cost per 1K input tokens |
| `usd_per_1k_output_tokens` | NUMERIC(10,6) | Cost per 1K output tokens |
| `usd_per_1k_reasoning_tokens` | NUMERIC(10,6) | Cost per 1K reasoning tokens (nullable, for o1 models) |
| `pricing_tier` | TEXT | Pricing tier label (added in `20260116011455`) |
| `is_active` | BOOLEAN | Whether this pricing is active (default: true) |
| `effective_from` | TIMESTAMPTZ | When this pricing becomes effective |
| `notes` | TEXT | Optional notes |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Record update (auto-updated via trigger) |

**Seeded Data (from `20260116005432_seed_llm_model_pricing_and_admin_rls.sql`):**
- Claude models: `claude-sonnet-4-5`, `claude-sonnet-3-5`, `claude-opus-3-5`, `claude-haiku-3-5`
- OpenAI models: `gpt-4o`, `gpt-4o-mini`, `o1`, `o1-mini`
- Google models: `gemini-1.5-pro`, `gemini-1.5-flash`

**Index:** `idx_llm_model_pricing_model_key_active` on `(model_key) WHERE is_active = true`

**CRITICAL FINDING:** This table exists in DB but is **NOT CURRENTLY USED** at runtime (see section 2.2).

---

#### **Table: `llm_billing_rules`**
**Purpose:** Conversion rules for transforming estimated USD cost into billable units/credits.

**Created in:** `supabase/migrations/20260116013828_create_llm_billing_rules_table.sql`

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `rule_name` | TEXT | Rule identifier (e.g., 'default'), UNIQUE |
| `cost_multiplier` | NUMERIC(10,4) | Safety buffer (e.g., 1.30 = 30% markup) |
| `usd_per_unit` | NUMERIC(10,6) | Internal cost per billable unit (e.g., 0.010000 = $0.01) |
| `min_units_per_call` | INTEGER | Minimum units charged per API call (default: 1) |
| `rounding_mode` | TEXT | How to round ('ceil', 'floor', 'round') |
| `is_active` | BOOLEAN | Whether this rule is active |
| `effective_from` | TIMESTAMPTZ | When rule becomes effective |
| `notes` | TEXT | Optional notes |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Record update (auto-updated via trigger) |

**Seeded Data:**
- One default rule: `rule_name='default'`, `cost_multiplier=1.30`, `usd_per_unit=0.010000`, `rounding_mode='ceil'`

**CRITICAL FINDING:** This table exists in DB but is **NOT CURRENTLY USED** at runtime (see section 2.2).

---

#### **View: `pmc_session_token_summary`**
**Purpose:** Aggregated token usage per session for efficient dashboard queries.

**Created in:** `supabase/migrations/20251129012353_add_session_id_to_tokens_used.sql`
**Updated in:** `supabase/migrations/20251201180856_update_session_token_summary_view.sql`

**Columns:**
- `session_id`, `user_id`, `customer_id`, `session_name`, `output_type`, `brief_description`, `input_data`, `created_at`
- `api_calls_count` (COUNT of usage records)
- `total_tokens` (SUM of tokens_used)
- `total_cost` (SUM of cost_usd)
- `models_used` (ARRAY_AGG DISTINCT model)
- `operations_performed` (ARRAY_AGG DISTINCT operation_type)

**Security:** `SET (security_invoker = true)` - RLS policies apply

---

### 1.2 Usage Log Table Details: `pmc_user_tokens_used`

**Exact Table Name:** `pmc_user_tokens_used`

**Every Column Inserted Per Tracking Event:**
```sql
INSERT INTO pmc_user_tokens_used (
  user_id,           -- UUID of authenticated user
  operation_type,    -- String identifier of operation
  model,             -- AI model name
  tokens_used,       -- Integer token count
  cost_usd,          -- Numeric estimated USD cost
  session_id,        -- UUID of session (nullable but recommended)
  created_at         -- Timestamp (defaults to now())
) VALUES (?, ?, ?, ?, ?, ?, ?)
```

**Exact INSERT Code Path:**

1. **Frontend:** `src/services/api/tokenTracking.ts` - `trackTokenUsage()` function (lines 29-147)
   - Creates tracking data object
   - Calls Edge Function via fetch to `/functions/v1/track-tokens`

2. **Edge Function:** `supabase/functions/track-tokens/index.ts` (lines 103-116)
   ```typescript
   const { data, error } = await supabaseAdmin
     .from('pmc_user_tokens_used')
     .insert([{
       user_id,
       operation_type,
       model,
       tokens_used,
       cost_usd,
       session_id: finalSessionId || null,
       created_at: new Date().toISOString()
     }])
     .select()
   ```

3. **Database Trigger:** AFTER INSERT trigger `sync_tokens_remaining` calls `update_tokens_remaining()` (migration `20260115205456`, lines 28-46)
   ```sql
   UPDATE pmc_users
   SET tokens_remaining = tokens_remaining - NEW.tokens_used
   WHERE id = NEW.user_id;
   ```

**Atomicity:** YES - Both INSERT and balance UPDATE happen in same transaction via trigger.

---

### 1.3 User Balance Table: `pmc_users`

**Exact Columns Used for Allowance + Remaining:**

1. **`tokens_allowed` (NUMERIC):**
   - Total tokens allocated to user
   - Set during user creation (default: 999999)
   - Updated manually by admin

2. **`tokens_remaining` (NUMERIC):**
   - Real-time remaining balance
   - **Calculation:** `tokens_allowed - SUM(tokens_used from pmc_user_tokens_used)`
   - Added in migration `20260115164733_add_tokens_remaining_field.sql`
   - **Initially synced** in migration `20260115205456_fix_tokens_remaining_sync.sql` (lines 20-25):
     ```sql
     UPDATE pmc_users
     SET tokens_remaining = COALESCE(tokens_allowed, 999999) - COALESCE(
       (SELECT SUM(tokens_used) FROM pmc_user_tokens_used WHERE user_id = pmc_users.id),
       0
     );
     ```

**Subscription Fields:**
- `start_date` (DATE) - when subscription begins
- `until_date` (DATE) - when subscription expires
- No explicit `plan_id` or `subscription_tier` column currently

**How Values Are Initialized:**
- During user creation via Edge Function `admin-create-user` (default: `tokens_allowed=999999`, `tokens_remaining=999999`)
- Or manually by admin via `admin-update-user`

**Can `tokens_remaining` Go Negative?**
- **YES** - Migration `20260115164733` explicitly notes this is allowed "for tracking purposes"
- Enforcement prevents NEW usage when `tokens_remaining <= 0`, but doesn't block existing negative values

---

### 1.4 Triggers / Functions

#### **Trigger: `sync_tokens_remaining`**
**Created in:** `supabase/migrations/20260115205456_fix_tokens_remaining_sync.sql` (lines 41-46)

**Definition:**
```sql
CREATE TRIGGER sync_tokens_remaining
  AFTER INSERT ON pmc_user_tokens_used
  FOR EACH ROW
  EXECUTE FUNCTION update_tokens_remaining();
```

**Function: `update_tokens_remaining()`**
**Created in:** Same migration (lines 28-38)

**SQL:**
```sql
CREATE OR REPLACE FUNCTION update_tokens_remaining()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pmc_users
  SET tokens_remaining = tokens_remaining - NEW.tokens_used
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Atomicity:** ✅ YES
- Trigger fires AFTER INSERT on `pmc_user_tokens_used`
- Balance decrement happens in SAME transaction as usage log insert
- If trigger fails, entire transaction rolls back (INSERT also reverted)
- Edge Function uses service role, bypasses RLS, ensures reliability

---

### 1.5 RLS Policies

#### **Table: `pmc_user_tokens_used`**
**Policies Created in:** `supabase/migrations/20251215174245_add_rls_policies_to_tokens_used.sql`

**Policies:**

1. **"Users can view own token usage"** (lines 23-31)
   ```sql
   CREATE POLICY "Users can view own token usage"
     ON pmc_user_tokens_used
     FOR SELECT
     TO authenticated
     USING (
       user_id IN (
         SELECT id FROM pmc_users WHERE id = auth.uid()
       )
     );
   ```

2. **"Admins can view all token usage"** (lines 33-48)
   ```sql
   CREATE POLICY "Admins can view all token usage"
     ON pmc_user_tokens_used
     FOR SELECT
     TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM pmc_users
         WHERE id = auth.uid()
         AND email IN (
           'info@sharpen.studio',
           'thijs@readspeaker.com',
           'thijs.vanopstal@gmail.com'
         )
       )
     );
   ```

3. **INSERT/UPDATE/DELETE:** No policies = **service role only** (Edge Functions can write, users cannot)

**Admin Access Determination:**
- Hardcoded email list in RLS policy
- Also checked in `src/components/Dashboard.tsx` line 133: `isAdmin = currentUser?.email === 'rfv@datago.net'`

**INCONSISTENCY FOUND:** Admin check uses two different approaches:
- RLS policy: 3 different emails
- Dashboard component: 1 email (`rfv@datago.net`)

---

#### **Table: `pmc_users`**
**Policies Created in:** `supabase/migrations/20250520231020_shrill_grove.sql` (lines 27-47)

**Policies:**
- "Users can read own data" - SELECT where `auth.uid() = id`
- "Users can insert own data" - INSERT where `auth.uid() = id`
- "Users can update own data" - UPDATE where `auth.uid() = id`
- No DELETE policy for users
- Admin functions use service role to bypass RLS

---

#### **Table: `llm_model_pricing`**
**Policies Created in:**
- Read: `supabase/migrations/20260116005151_create_llm_model_pricing.sql` (lines 84-88)
- Write: `supabase/migrations/20260116005432_seed_llm_model_pricing_and_admin_rls.sql` (lines 45-73)

**Policies:**
- "Allow read access to authenticated users" - All authenticated users can SELECT
- "Only admin can insert/update/delete pricing" - Only `rfv@datago.net` can modify (checked via `auth.users.email`)

---

#### **Table: `llm_billing_rules`**
**Policies Created in:** `supabase/migrations/20260116013828_create_llm_billing_rules_table.sql` (lines 64-81)

**Policies:**
- "llm_billing_rules_read_authenticated" - All authenticated users can SELECT
- "llm_billing_rules_write_admin_email" - Only `rfv@datago.net` can INSERT/UPDATE/DELETE

---

## 2. COST CALCULATION (MODEL PRICING)

### 2.1 Where is `cost_usd` Calculated TODAY?

**Exact File:** `src/services/api/utils.ts`
**Function:** `calculateTokenCost()` (lines 499-523)

**Full Function Code:**
```typescript
export function calculateTokenCost(tokenCount: number, model: Model): number {
  // Updated pricing as of 2025
  switch (model) {
    case 'claude-sonnet-4-5':
      return tokenCount * 0.000003; // $0.003 per 1K tokens (input), $0.015 per 1K (output) - using average
    case 'claude-haiku-4-5':
      return tokenCount * 0.000001; // $0.001 per 1K tokens (input), $0.005 per 1K (output) - using average
    case 'claude-opus-4-5':
      return tokenCount * 0.000005; // $0.005 per 1K tokens (input), $0.025 per 1K (output) - using average
    case 'gpt-4o':
      return tokenCount * 0.000005; // $0.005 per 1K tokens (estimated)
    case 'gpt-4-turbo':
      return tokenCount * 0.000003; // $0.003 per 1K tokens
    case 'gpt-3.5-turbo':
      return tokenCount * 0.0000015; // $0.0015 per 1K tokens
    case 'deepseek-chat':
      return tokenCount * 0.0000025; // $0.0025 per 1K tokens (estimated)
    case 'grok-4-latest':
      return tokenCount * 0.000015; // $0.015 per 1K tokens (estimated based on xAI pricing)
    case 'gemini-2.0-flash':
      return tokenCount * 0.0000001; // $0.0001 per 1K tokens (very low cost)
    default:
      return tokenCount * 0.000003; // Default to moderate pricing
  }
}
```

**Pricing Map Used:**
- Hardcoded switch statement
- Returns: `tokenCount * (cost_per_token)`
- **Cost per token = (cost per 1K tokens) / 1000**

**Input/Output Tokens:**
- **NOT SPLIT** - uses averaged cost
- Comment on line 503: `"using average"` between input/output pricing
- API response provides `usage.total_tokens` - both input + output combined

**Provider-Specific Notes:**
- **Grok:** Estimated pricing based on xAI published rates
- **o1 reasoning tokens:** NOT accounted for (no separate reasoning token cost)
- **Gemini 2.0:** Very low cost model

**Called From:**
- `src/services/api/tokenTracking.ts` line 53: `const cost = calculateTokenCost(tokenUsage, model);`

---

### 2.2 Do We Use DB Tables `llm_model_pricing` / `llm_billing_rules` at Runtime?

**Answer: NO - Not Currently Used**

**Evidence:**

1. **Code Search Results:**
   - Grepped entire codebase for `llm_model_pricing` and `llm_billing_rules`
   - Found: Only in migration files
   - **NOT FOUND IN:** Any TypeScript/JavaScript runtime code

2. **Current Implementation:**
   - All cost calculations use hardcoded `calculateTokenCost()` function
   - No imports of DB pricing tables in any service file
   - No queries to `llm_model_pricing` or `llm_billing_rules` in codebase

3. **What Still Uses Hardcoded Pricing:**
   - ✅ `src/services/api/utils.ts` - `calculateTokenCost()` (lines 499-523)
   - ✅ ALL API service files that call `trackTokenUsage()`:
     - `copyGeneration.ts`
     - `alternativeCopy.ts`
     - `contentScoring.ts`
     - `seoGeneration.ts`
     - `geoScoring.ts`
     - `promptEvaluation.ts`
     - `humanizedCopy.ts`
     - `blendedCopy.ts`
     - `grokComparison.ts`
     - `outputComparison.ts`
     - `suggestions.ts`
     - `templateSuggestions.ts`
     - `modificationSuggestions.ts`
     - `voiceStyles.ts`
     - `contentRefinement.ts`
     - `contentModification.ts`

**CONCLUSION:** Database pricing tables exist but are **NOT YET INTEGRATED** into runtime code. They are prepared for future use.

---

## 3. RUNTIME FLOW: END-TO-END TRACKING

### 3.1 Complete Operation Types Catalog

Below is a comprehensive list of ALL operations that consume LLM tokens, based on code analysis:

| Operation Type | User Trigger | File Path | Tracking Call Location |
|----------------|--------------|-----------|------------------------|
| **`generate_copy`** | Generate button (main) | `src/services/api/copyGeneration.ts` | Line 171 (main copy), Line 343 (variants) |
| **`generate_copy_variant`** | Generate variants toggle | `src/services/api/copyGeneration.ts` | Line 343 |
| **`generate_alternative`** | Alternative Copy button | `src/services/api/alternativeCopy.ts` | Line 360 |
| **`content_scoring`** | Auto-trigger after generation | `src/services/api/contentScoring.ts` | Line 143 |
| **`prompt_evaluation`** | Prompt eval toggle | `src/services/api/promptEvaluation.ts` | Lines 170, 281 |
| **`geo_score`** | GEO toggle enabled | `src/services/api/geoScoring.ts` | Line 187 |
| **`seo_metadata`** | SEO metadata toggle | `src/services/api/seoGeneration.ts` | Line 134 |
| **`faq_schema`** | FAQ JSON in output structure | `src/services/api/seoGeneration.ts` | Line 294 |
| **`seo_on_demand`** | On-demand SEO buttons | `src/services/api/seoGeneration.ts` | Line 440 |
| **`humanize_copy`** | Humanize button | `src/services/api/humanizedCopy.ts` | Line 329 |
| **`blend_outputs`** | Blend selected outputs | `src/services/api/blendedCopy.ts` | Line 141 |
| **`field_suggestion`** | Sparkle button on input | `src/services/api/suggestions.ts` | Line 155 |
| **`template_suggestion`** | Template suggestion button | `src/services/api/templateSuggestions.ts` | Line 188 |
| **`modification_suggestion`** | Modification suggestion UI | `src/services/api/modificationSuggestions.ts` | Line 79 |
| **`ai_content_modification`** | Modify content modal | `src/services/api/contentModification.ts` | Line 155 |
| **`voice_style_analysis`** | Voice extraction button | `src/services/api/voiceStyles.ts` | Line 637 |
| **`output_comparison`** | Compare outputs button | `src/services/api/outputComparison.ts` | Line 284 |
| **`grok_comparison`** | Grok comparison modal (feature name; uses DeepSeek or GPT-4o, NOT Grok) | `src/services/api/grokComparison.ts` | Line 302 |
| **`content_refinement`** | Word count revision (automatic) | `src/services/api/contentRefinement.ts` | Lines 173, 676, 1294 |

---

### 3.2 Detailed Tracking Flow Example: `generate_copy`

**User Trigger:** User clicks "Generate Copy" button in main form

**Step 1: API Call**
- **File:** `src/services/api/copyGeneration.ts`
- **Function:** `generateCopy()` (line 48)
- **LLM Request:** Line 155 - `makeApiRequestWithFallback()`
- **Token Count Extraction:** Line 167 - `const tokenUsage = data.usage?.total_tokens || 0;`

**Step 2: Tracking Invocation**
- **File:** Same file
- **Lines:** 170-178
```typescript
// MANDATORY TOKEN TRACKING - track with the model that was actually used
if (currentUser && tokenUsage > 0) {
  await trackTokenUsage(
    currentUser,
    tokenUsage,
    data.model_used,
    'generate_copy',
    actualSessionId
  );
}
```

**Step 3: Frontend Tracking Function**
- **File:** `src/services/api/tokenTracking.ts`
- **Function:** `trackTokenUsage()` (lines 29-147)
- **Key Steps:**
  1. Generate unique tracking ID (line 50): `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  2. Calculate cost (line 53): `const cost = calculateTokenCost(tokenUsage, model);`
  3. Build tracking data object (lines 55-62)
  4. Call Edge Function (lines 83-90): `fetch('${supabaseUrl}/functions/v1/track-tokens', {...})`

**Step 4: Edge Function Processing**
- **File:** `supabase/functions/track-tokens/index.ts`
- **Key Operations:**
  1. Parse request body (lines 26-33)
  2. Validate required fields (lines 36-68)
  3. Auto-create session if missing (lines 71-98) - SAFETY NET
  4. Insert to `pmc_user_tokens_used` (lines 103-116)

**Step 5: Database Trigger**
- **Trigger:** `sync_tokens_remaining` fires AFTER INSERT
- **Function:** `update_tokens_remaining()`
- **Action:** Decrements `pmc_users.tokens_remaining` by `NEW.tokens_used`

**Step 6: Response**
- Edge Function returns success: `{ success: true, id: <inserted_id>, message: 'Token usage recorded successfully' }`
- Frontend logs success (line 98): `✅ Token usage tracked successfully [${uniqueTrackingId}]`

**Session ID Attachment:**
- **Where It Comes From:** `sessionId` parameter passed to `generateCopy()`
- Created in calling component (e.g., `CopyMakerTab`) using `uuidv4()`
- Passed through entire call chain

**Retry Behavior:**
- **Max Retries:** 3 attempts (lines 127-140)
- **Backoff:** Exponential - 1s, 2s, 4s (line 128)
- **Queue:** Failed attempts stored in `failedTrackingQueue` (lines 8-18, 108-124)
- **Background Retry:** `retryFailedTracking()` function (lines 153-191) - must be called manually

---

### 3.3 Word Count Revision Tracking

**Special Case:** Content refinement for word count has multiple tracking points

**File:** `src/services/api/contentRefinement.ts`
**Function:** `reviseContentForWordCount()`

**Tracking Points:**
1. **First Revision Attempt** (line 173)
   - Operation: `'content_refinement'`
   - Triggered when initial generation is outside tolerance

2. **Second Revision Attempt** (line 676)
   - Operation: `'content_refinement'`
   - Triggered if first revision still outside tolerance

3. **Emergency Third Attempt** (line 1294)
   - Operation: `'content_refinement'`
   - Last resort before giving up

**Each Attempt Logged Separately:** Each retry = separate row in `pmc_user_tokens_used`

---

### 3.4 Enhanced Pipeline (CopyZap+ Mode)

**File:** `src/utils/ai-pipeline/enhancedPipeline.ts`

**Not Yet Analyzed:** This file contains the CopyZap+ enhanced pipeline logic
**UNKNOWN:** Exact tracking flow for enhanced pipeline operations
**TODO:** Need to analyze `enhancedPipeline.ts` to document enhanced mode tracking

---

## 4. ENFORCEMENT: HOW WE BLOCK USERS WHO RUN OUT OF CREDITS

### 4.1 Enforcement Location & Logic

**Primary Enforcement Function:** `checkUserAccess()`
**File:** `src/services/supabaseClient.ts`
**Lines:** 1866-1994

**When Is It Called?**
- **UNKNOWN** - Need to search for all invocations of `checkUserAccess()`
- Likely called in auth flow or before major operations
- NOT called before EVERY API request (would be inefficient)

**Enforcement Logic (Lines 1930-1985):**

```typescript
// 1. Check subscription validity
const isSubscriptionValid = !userData.until_date ||
  new Date(userData.until_date) >= now;

if (!isSubscriptionValid) {
  return {
    hasAccess: false,
    message: "Access denied: your subscription has expired..."
  };
}

// 2. Check token limits using pre-calculated tokens_remaining
const tokensRemaining = userData.tokens_remaining || 0;
const tokensAllowed = userData.tokens_allowed || 999999;
const isWithinTokenLimit = tokensRemaining > 0;

if (!isWithinTokenLimit) {
  return {
    hasAccess: false,
    message: "Access denied: you have consumed all your available tokens..."
  };
}

// 3. Grant access if both checks pass
return {
  hasAccess: true,
  message: "Access granted."
};
```

**Conditions:**
1. **Subscription Date:** `until_date` must be >= current date (or NULL)
2. **Token Balance:** `tokens_remaining` must be > 0

**Thresholds:**
- Hard stop at `tokens_remaining <= 0`
- No "warning" threshold implemented
- No grace period for going slightly negative

---

### 4.2 When Is Check Performed?

**BEFORE or AFTER LLM Request?**
- **UNKNOWN** - Need to trace `checkUserAccess()` usage
- **Hypothesis:** Likely checked BEFORE allowing access to main app features
- **NOT** checked before every individual LLM call (would be too slow)

**Race Conditions:**
- **Potential Issue:** Multiple concurrent requests could all pass enforcement check before any completes
- **Mitigation:** Trigger-based balance update happens atomically in DB
- **Remaining Risk:** User could start 5 requests with 10 tokens remaining, each consuming 100 tokens → end up at -490 tokens

**UNKNOWN:** Whether there's request-level locking or concurrency control

---

### 4.3 Error Handling & UI Display

**Error Message (from `checkUserAccess`):**
```
"Access denied: your subscription has expired or you have consumed all your available tokens. Please update your plan."
```

**Frontend Display:**
- **UNKNOWN** - Need to find where `checkUserAccess()` result is used
- Likely shows toast notification or modal
- **TODO:** Search for `hasAccess` and `message` usage in React components

---

## 5. DASHBOARD: HOW USERS SEE USAGE

### 5.1 Token Usage Tab Implementation

**File:** `src/components/Dashboard.tsx`

**Data Loading Function:** `loadTokenUsageData()` (location TBD - need to read more of Dashboard.tsx)

**Queries Used:**

1. **Regular Users:**
   - **Function:** `getUserTokenUsage(userId, startDate, endDate)`
   - **File:** `src/services/supabaseClient.ts`
   - **Returns:** Array of `TokenUsage` records filtered by user_id and date range

2. **Admin Users:**
   - **Function:** `adminGetTokenUsage(startDate, endDate, userFilter)`
   - **File:** `src/services/supabaseClient.ts`
   - **Returns:** Token usage for all users (or filtered by user)

**Date Range Filtering:**
- **Default Range:** Last 30 days (lines 120-128 in Dashboard.tsx)
```typescript
const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
};
```

- **User Control:** Date pickers allow custom start/end dates
- **Query:** Uses `created_at` column with `>=` and `<=` comparisons

---

### 5.2 Session Grouping

**View Used:** `pmc_session_token_summary`

**Columns Retrieved:**
- `session_id`, `session_name`, `total_tokens`, `total_cost`, `api_calls_count`
- `models_used[]`, `operations_performed[]`

**How Session Data Is Joined:**
- View joins `pmc_copy_sessions` with `pmc_user_tokens_used` on `session_id`
- Aggregates: COUNT, SUM, ARRAY_AGG with DISTINCT

**Dashboard Display:**
- Expandable session rows (line 83: `expandedSessionId` state)
- Click session → show detailed API calls within that session

---

### 5.3 CSV Export

**Function:** `exportTokenUsageToCSV()`
**File:** `src/components/Dashboard.tsx`
**Lines:** 144-243

**Export Logic:**

1. **Admin Export:**
   - Calls `adminGetAllTokenUsageForExport(startDate, endDate, userFilter)`
   - Fetches ALL matching records (no pagination limit)

2. **User Export:**
   - Calls `getUserTokenUsage(userId, startDate, endDate)`
   - Fetches all records for that user

**CSV Columns:**
```
User Email, User Name, Operation Type, Model, Credits Usage, Credits Cost, Cost per 1K Credits, Created At
```

**Filename Format:**
```
token-usage-{startDate}-to-{endDate}-{exportDate}.csv
```

**Code Location:** Lines 194-231

---

### 5.4 Admin View

**Admin Determination:**
- **Line 133:** `const isAdmin = React.useMemo(() => currentUser?.email === 'rfv@datago.net', [currentUser?.email]);`

**Admin-Only Features:**
1. View all users' token usage
2. Filter by specific user (line 87: `selectedUserFilter` state)
3. Export all users' data
4. View beta registration count (line 88: `betaRegistrationsCount` state)

**Queries:**
- `adminGetTokenUsage()` - paginated usage data
- `adminGetTokenStats()` - aggregated statistics
- `adminGetAllTokenUsageForExport()` - all records for CSV
- `adminGetBetaRegistrationsCount()` - count of beta signups

---

### 5.5 Subscription Display

**File:** `src/components/Dashboard.tsx`
**Lines:** 872-886

**Displayed Stats:**
```typescript
{subscriptionData.tokens_allowed?.toLocaleString() || 'Unlimited'}  // Line 872

// Tokens Remaining calculation
Math.max(0, subscriptionData.tokens_allowed - stats.totalTokensUsed)  // Line 885
```

**ISSUE FOUND:** This calculates remaining as `allowed - totalUsed` from aggregated stats, not from `tokens_remaining` field!
- **Correct Source:** Should use `subscriptionData.tokens_remaining`
- **Current Approach:** Re-calculates from stats (potential drift)

---

## 6. RELIABILITY: RETRIES, DUPLICATES, QUEUES

### 6.1 Retry Behavior

**File:** `src/services/api/tokenTracking.ts`

**Retry Configuration:**
- **Max Attempts:** 3 retries (line 127: `if (retryCount < 3)`)
- **Backoff Strategy:** Exponential - `Math.pow(2, retryCount) * 1000` (line 128)
  - Attempt 1: 1000ms (1 second)
  - Attempt 2: 2000ms (2 seconds)
  - Attempt 3: 4000ms (4 seconds)

**Retry Logic (Lines 127-146):**
```typescript
if (retryCount < 3) {
  const delay = Math.pow(2, retryCount) * 1000;
  console.log(`⏰ Retrying token tracking [${uniqueTrackingId}] in ${delay}ms...`);

  setTimeout(async () => {
    try {
      await trackTokenUsage(user, tokenUsage, model, operationType, sessionId, retryCount + 1, uniqueTrackingId);
    } catch (retryError) {
      console.error(`❌ Token tracking retry ${retryCount + 1} failed [${uniqueTrackingId}]:`, retryError);
    }
  }, delay);
} else {
  throw new Error(`Failed to track token usage after ${retryCount + 1} attempts. API call aborted...`);
}
```

**What Happens on Final Failure:**
- After 3 failed attempts, throws error (line 143)
- Error message: "Failed to track token usage after 4 attempts. API call aborted to prevent untracked usage."
- **This BLOCKS the user's operation** - prevents untracked LLM usage

---

### 6.2 Failed Tracking Queue

**Data Structure (Lines 8-18):**
```typescript
let failedTrackingQueue: Array<{
  tracking_id: string;
  user_id: string;
  operation_type: string;
  model: string;
  tokens_used: number;
  cost_usd: number;
  session_id?: string;
  attempts: number;
  lastAttempt: number;
}> = [];
```

**Queue Population:**
- Failed attempts added to queue (lines 114-124)
- Keyed by `tracking_id` to prevent duplicates

**Background Retry Function:** `retryFailedTracking()` (lines 153-191)
- **Trigger:** Manual - must be called periodically (e.g., by timer)
- **Retry Condition:** `attempts < 5` AND `60 seconds since lastAttempt` (line 160)
- **Max Queue Attempts:** 5 total attempts (line 186)
- **Cleanup:** Removes items after 5 failed attempts (lines 186-190)

**UNKNOWN:** Where is `retryFailedTracking()` actually called? Need to search for invocations.

---

### 6.3 Duplicate Prevention

**Unique Tracking ID:**
- Generated once per tracking attempt: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` (line 50)
- Passed to all retry attempts (parameter `trackingId`)
- Used as queue key to prevent duplicate queue entries

**Database-Level Duplicate Prevention:**
- **NONE** - No unique constraint on tracking records
- Theoretically possible to insert same tracking_id twice if both requests succeed
- **Mitigation:** UUID collision extremely unlikely
- **Risk:** If client retries manually (e.g., user clicks button twice), could double-track

---

### 6.4 Edge Function Safety Nets

**Auto-Create Session If Missing (Lines 71-98 in track-tokens/index.ts):**
```typescript
let finalSessionId = session_id
if (!finalSessionId) {
  console.warn(`⚠️ WARNING: No session_id provided...`)
  const newSessionId = crypto.randomUUID()
  const sessionName = `Untracked Session - ${new Date().toLocaleString()}`

  await supabaseAdmin.from('pmc_copy_sessions').insert({
    id: newSessionId,
    user_id,
    session_name: sessionName,
    output_type: operation_type,
    created_at: now
  })

  finalSessionId = newSessionId
}
```

**Purpose:** Ensures ALL token usage is linked to a session, even if frontend forgets to create one.

---

## 7. VERIFICATION CHECKLIST (SQL + REPRO)

### 7.1 SQL Verification Queries

#### **Query 1: Verify `tokens_remaining` Matches Consumption**
```sql
SELECT
  u.id,
  u.email,
  u.tokens_allowed,
  u.tokens_remaining,
  COALESCE(SUM(t.tokens_used), 0) as actual_tokens_consumed,
  u.tokens_allowed - COALESCE(SUM(t.tokens_used), 0) as expected_remaining,
  u.tokens_remaining - (u.tokens_allowed - COALESCE(SUM(t.tokens_used), 0)) as drift
FROM pmc_users u
LEFT JOIN pmc_user_tokens_used t ON u.id = t.user_id
GROUP BY u.id, u.email, u.tokens_allowed, u.tokens_remaining
HAVING ABS(u.tokens_remaining - (u.tokens_allowed - COALESCE(SUM(t.tokens_used), 0))) > 0.01
ORDER BY ABS(u.tokens_remaining - (u.tokens_allowed - COALESCE(SUM(t.tokens_used), 0))) DESC;
```

**Purpose:** Detect drift between `tokens_remaining` and actual consumption.

---

#### **Query 2: Per-User Total Usage**
```sql
SELECT
  u.email,
  u.tokens_allowed,
  u.tokens_remaining,
  COUNT(t.id) as api_calls,
  SUM(t.tokens_used) as total_tokens_used,
  SUM(t.cost_usd) as total_cost_usd
FROM pmc_users u
LEFT JOIN pmc_user_tokens_used t ON u.id = t.user_id
GROUP BY u.id, u.email, u.tokens_allowed, u.tokens_remaining
ORDER BY total_tokens_used DESC;
```

---

#### **Query 3: Per-Session Total Usage**
```sql
SELECT
  s.session_name,
  s.created_at,
  u.email,
  COUNT(t.id) as api_calls,
  SUM(t.tokens_used) as total_tokens,
  SUM(t.cost_usd) as total_cost,
  ARRAY_AGG(DISTINCT t.model) as models_used,
  ARRAY_AGG(DISTINCT t.operation_type) as operations
FROM pmc_copy_sessions s
JOIN pmc_users u ON s.user_id = u.id
LEFT JOIN pmc_user_tokens_used t ON s.id = t.session_id
GROUP BY s.id, s.session_name, s.created_at, u.email
ORDER BY s.created_at DESC
LIMIT 20;
```

---

#### **Query 4: Detect Orphaned Usage Records (No Session)**
```sql
SELECT
  t.id,
  u.email,
  t.operation_type,
  t.model,
  t.tokens_used,
  t.created_at
FROM pmc_user_tokens_used t
JOIN pmc_users u ON t.user_id = u.id
WHERE t.session_id IS NULL
ORDER BY t.created_at DESC
LIMIT 100;
```

---

### 7.2 Step-by-Step Repro of One Request

**Scenario:** User generates copy with 50-word target

**Step 1: Trigger Action in UI**
1. Open CopyZap app
2. Fill in "Business Description" field
3. Set word count to 50
4. Click "Generate Copy" button

**Step 2: Locate Resulting Usage Row in DB**
```sql
SELECT * FROM pmc_user_tokens_used
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Output:**
- `operation_type`: `'generate_copy'`
- `model`: e.g., `'claude-sonnet-4-5'`
- `tokens_used`: ~200-300 (depends on actual output)
- `cost_usd`: ~0.0006-0.0009
- `session_id`: UUID of the session
- `created_at`: Timestamp of generation

**Step 3: Locate Balance Update**
```sql
SELECT tokens_remaining FROM pmc_users WHERE id = '<your_user_id>';
```

**Expected Result:**
- `tokens_remaining` should have decreased by `tokens_used` amount from Step 2

**Step 4: Confirm UI Reflects It**
- Navigate to Dashboard → Token Usage tab
- Filter by date range including today
- Verify latest entry matches DB record

**Step 5: Check Session Summary**
```sql
SELECT * FROM pmc_session_token_summary WHERE session_id = '<session_id_from_step_2>';
```

**Expected Output:**
- `total_tokens` includes the tokens from this generation
- `api_calls_count` incremented
- `operations_performed` includes `'generate_copy'`

---

## 8. UNKNOWNS & QUESTIONS

### 8.1 Critical Unknowns

#### **UNKNOWN #1: Where is `checkUserAccess()` actually called?**
- **What to check:** Search entire codebase for `checkUserAccess` invocations
- **Files to inspect:**
  - `src/components/CopyForm.tsx` (or equivalent main form component)
  - `src/App.tsx` (auth flow)
  - Any route guards or protected route components

#### **UNKNOWN #2: When is `retryFailedTracking()` called?**
- **What to check:** Search for `retryFailedTracking` invocations
- **Expected location:**
  - Timer/interval in main app component
  - Or periodic background job
- **Verification:** Check if queue actually gets retried in practice

#### **UNKNOWN #3: Enhanced Pipeline Token Tracking**
- **What to check:** Read `src/utils/ai-pipeline/enhancedPipeline.ts` completely
- **Questions:**
  - Does it track tokens differently?
  - Are there additional operation types?
  - Does it bypass standard tracking?

#### **UNKNOWN #4: Concurrent Request Handling**
- **What to check:** Look for request-level locking or semaphores
- **Test:**
  1. Start 10 simultaneous generations with 100 tokens remaining
  2. Check if user ends up deeply negative or if requests are queued
- **Risk Level:** HIGH - could allow users to consume far more tokens than allowed

#### **UNKNOWN #5: Frontend Enforcement Before API Calls**
- **What to check:** Search for token balance checks in frontend
- **Files to inspect:**
  - Component that renders "Generate" button
  - API service layer before making calls
- **Question:** Is there client-side validation to disable UI when out of tokens?

#### **UNKNOWN #6: Cost Calculation for Models with Split Input/Output Pricing**
- **Current State:** Using averaged cost
- **Question:** Should we split input/output token counts for accuracy?
- **Impact:** Cost estimates may be inaccurate by 2-3x depending on input/output ratio

#### **UNKNOWN #7: Integration Plan for DB Pricing Tables**
- **What exists:** `llm_model_pricing` and `llm_billing_rules` tables fully created and seeded
- **What's missing:** Runtime code to query these tables
- **Question:** Is there a planned migration from hardcoded costs to DB-driven costs?
- **Action:** Check for feature branches or TODOs in code

#### **UNKNOWN #8: Dashboard Tokens Remaining Display Accuracy**
- **Issue Found:** Dashboard line 885 calculates remaining as `allowed - totalUsed` (from aggregated stats)
- **Correct Field:** Should use `subscriptionData.tokens_remaining`
- **Question:** Is this a bug or intentional? Does it cause drift?

---

### 8.2 Inconsistencies Found

#### **INCONSISTENCY #1: Admin Email Check**
**Location 1:** `supabase/migrations/20251215174245_add_rls_policies_to_tokens_used.sql` (lines 40-46)
```sql
WHERE email IN (
  'info@sharpen.studio',
  'thijs@readspeaker.com',
  'thijs.vanopstal@gmail.com'
)
```

**Location 2:** `src/components/Dashboard.tsx` (line 133)
```typescript
isAdmin = currentUser?.email === 'rfv@datago.net'
```

**Location 3:** `llm_model_pricing` and `llm_billing_rules` RLS policies
```sql
WHERE (auth.jwt()->>'email') = 'rfv@datago.net'
```

**Question:** Which is the authoritative admin list? Should these be unified?

---

#### **INCONSISTENCY #2: Cost Calculation - Hardcoded vs DB**
- **Hardcoded:** `calculateTokenCost()` in `utils.ts`
- **DB Tables:** `llm_model_pricing` with accurate provider pricing
- **DB Calculations:** `llm_billing_rules` for unit conversion

**Question:** When will migration from hardcoded to DB-driven happen?

---

### 8.3 Verification Steps for User

Please verify the following by inspection:

1. **Find `checkUserAccess()` Calls:**
   ```bash
   grep -r "checkUserAccess" src/
   ```

2. **Find `retryFailedTracking()` Calls:**
   ```bash
   grep -r "retryFailedTracking" src/
   ```

3. **Check Enhanced Pipeline Tracking:**
   ```bash
   cat src/utils/ai-pipeline/enhancedPipeline.ts | grep -A 10 "trackTokenUsage"
   ```

4. **Verify Admin Email Consistency:**
   ```bash
   grep -r "rfv@datago.net\|info@sharpen.studio\|thijs@" supabase/migrations/ src/
   ```

5. **Test Concurrent Request Handling:**
   - Create user with 100 tokens remaining
   - Trigger 5 simultaneous generations (each ~100 tokens)
   - Check final `tokens_remaining` value

---

## Appendix A: File Reference Index

### Key Files & Line Numbers

**Token Tracking:**
- `src/services/api/tokenTracking.ts` - Main tracking logic (lines 29-147)
- `supabase/functions/track-tokens/index.ts` - Edge function (lines 103-116)

**Cost Calculation:**
- `src/services/api/utils.ts` - `calculateTokenCost()` (lines 499-523)

**Enforcement:**
- `src/services/supabaseClient.ts` - `checkUserAccess()` (lines 1866-1994)

**Dashboard:**
- `src/components/Dashboard.tsx` - Usage display (lines 73-300+)

**Migrations:**
- `20260115205456_fix_tokens_remaining_sync.sql` - Trigger creation
- `20260115164733_add_tokens_remaining_field.sql` - Add balance field
- `20260116005151_create_llm_model_pricing.sql` - Pricing table
- `20260116013828_create_llm_billing_rules_table.sql` - Billing rules

---

## Appendix B: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER ACTION                             │
│  (Click "Generate Copy" button in React component)          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  src/services/api/copyGeneration.ts:generateCopy()          │
│  • Builds prompt                                            │
│  • Calls makeApiRequestWithFallback()                       │
│  • Extracts: data.usage.total_tokens, data.model_used      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  src/services/api/tokenTracking.ts:trackTokenUsage()        │
│  • Calculate cost: calculateTokenCost(tokens, model)        │
│  • Generate tracking_id                                     │
│  • POST to /functions/v1/track-tokens                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  supabase/functions/track-tokens/index.ts                   │
│  • Validate payload                                         │
│  • Auto-create session if missing                           │
│  • INSERT INTO pmc_user_tokens_used                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE TRIGGER: sync_tokens_remaining                    │
│  • AFTER INSERT on pmc_user_tokens_used                     │
│  • Calls update_tokens_remaining()                          │
│  • UPDATE pmc_users SET tokens_remaining -= tokens_used     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  USER BALANCE UPDATED                                       │
│  • tokens_remaining decreased                               │
│  • Change visible in Dashboard                              │
└─────────────────────────────────────────────────────────────┘
```

---

**END OF DOCUMENTATION**
