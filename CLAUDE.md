# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CopyZap** (internally: sharpen-copy-assistant) is a React-based SaaS web application for AI-powered copy generation, scoring, and refinement. Users input business context and receive generated copy variations scored across multiple dimensions (clarity, persuasiveness, engagement, etc.), with the ability to compare, blend, export, and save outputs.

## Build & Development

```bash
# Development server (auto-opens at http://localhost:5173)
npm run dev

# Build for production (runs prebuild task to generate search index)
npm run build

# Code quality
npm lint

# Preview production build locally
npm preview

# Special utilities
npm run test:batch          # Run CopySnap batch tests
npm run check:hardcoded-admins  # Scan for hardcoded admin credentials
```

**Key config files:**
- `vite.config.ts` — Dev server runs on port 5173 with HMR overlay disabled; build chunks capped at 1000 KB
- `tailwind.config.js` — Styling; uses @tailwindcss plugins for forms, animation
- `tsconfig.json` — Strict mode enabled; `@` path alias resolves to `/src`
- `.eslintrc.js` — TypeScript + React hooks linting

## Architecture Layers

### Frontend State Management

**Four layers of state** manage the app flow:

1. **Global context** (`/src/context/`)
   - `SessionContext.tsx` — Current copy session (form inputs, generated outputs, comparison state)
   - `ModeContext.tsx` — Quick Polish vs. regular Copy Maker mode toggle
   - `ThemeContext.tsx` — Dark/light theme
   - `GuidanceHintContext.tsx` — Contextual help hints in Copy Maker

2. **Custom hooks** (`/src/hooks/`)
   - `useFormState()` — Hydrate form from templates/prefills; holds all Copy Maker form inputs
   - `useAuth()` — Auth state (user, loading, error) from Supabase
   - `useSession()` — Session ID and workspace context
   - `useBrandVoices()`, `useCreditsBalance()` — Domain-specific data fetching

3. **Page-level components** (`/src/components/`)
   - `CopyMakerTab` — Main interface for copy generation (form + results side-by-side)
   - `Dashboard` — Session history list with metadata queries
   - `QuickPolishPage` — Alternative UX for polish-mode workflows
   - `CopySnap` — Copy scoring-only feature

4. **Supabase client** (`/src/services/supabaseClient.ts`)
   - Singleton instance; auth via PKCE flow
   - Helper functions for templates, sessions, saved outputs, prefills, user preferences, credits

### Copy Generation & Scoring Pipeline

**Copy generation flow** (triggered by Copy Maker generate button):

1. Form inputs collected in `SessionContext`
2. `generateCopy()` → calls `/services/api/copyGeneration.ts`
3. Determines AI engine (Claude, OpenAI) from user selection or defaults to Claude
4. System + user prompts constructed with form context (language, tone, business description, etc.)
5. LLM call via `/src/lib/llm/callLLMWithFallback.ts` (wraps Anthropic SDK or OpenAI SDK)
6. Output structured (StructuredCopyOutput: headline + sections) or plain text
7. Stored in `SessionContext.generatedOutputCards` array
8. Optionally auto-scored via `/services/api/comprehensiveScoring.ts` (10 dimensions)

**Scoring dimensions** (computed by heuristic or LLM):
- Clarity, Persuasiveness, Engagement, Tone Match, Professional, Readability, etc.
- Each dimension 0–100; final score weighted average
- Score breakdown includes persuasion sub-dimensions + risk factors

**Key LLM config files:**
- `/src/lib/llm/modelRegistry.ts` — Maps model names → API provider + cost
- `/src/lib/llm/callLLMWithFallback.ts` — Handles model fallback, token tracking
- `/src/services/api/contentScoring.ts` — LLM-based scoring vs. heuristics

### Comparison & Ranking

**Compare/Blend feature** (CopyMakerTab → Results section):

1. User selects 2–5 versions to compare
2. `generateComparisonResult()` called (in `/src/services/api/comprehensiveScoring.ts`)
3. Scores all versions on same dimensions
4. Calculates delta vs. baseline (original or selected reference)
5. Ranks by final score; marks winner
6. UI displays side-by-side comparison table + detailed winner analysis
7. Option to blend best sections into new hybrid version

### Export System

**Three export formats** (in `/src/utils/enhancedExports.ts`):

1. **Markdown** — Table layout with scores, metadata, full copy text, import-ready for future sessions
2. **HTML** — Premium document format with charts, color-coded scores, comparison rankings, styled for printing/archival
3. **EVAL Markdown** — Extended format with LLM evaluation context (hidden from print) for advanced re-scoring

**Export trigger points:**
- Dashboard → save individual output
- CopyMaker Results → export session (all versions)
- Saved Outputs → download previously saved session

Each export includes:
- Input metadata (language, tone, target audience, brief description)
- Generated copy + scores
- Comparison data (if available)
- Metadata (model, date, version info)

### Database (Supabase)

**Key tables** (see migration files in `/supabase/migrations/`):

- `pmc_users` — Auth user profile + subscription (start_date, until_date, credits_allowed, credit_plan_id)
- `pmc_copy_sessions` — Session container; holds session_name, input_data, customer_id, scope_key (e.g., 'copy-maker')
- `pmc_saved_outputs` — Persisted user-created outputs (title, description, input_data JSONB, output_data JSONB, is_favorite)
- `pmc_templates` — Reusable prompt templates (user-created or public); stores form defaults + special instructions
- `pmc_prefills` — Predefined form value sets (e.g., "SaaS Lead Gen", "E-commerce Product Page")
- `pmc_customers` — CRM customer records (for multi-tenant support)
- `pmc_user_tokens_used` — Token/credit usage tracking (model, cost_usd, billable_units, operation_type)
- `pmc_brand_voices` — Custom voice profiles (user-created personas for restyling)

**Authentication:** Supabase Auth (email/password) via PKCE flow; uses Supabase JWT for RLS.

**Row-Level Security (RLS):** All tables require auth; users see only own records or public items.

**Credits system (Phase 4B-2):**
- `credits_allowed` — Monthly credit limit from assigned credit plan
- `credits_period_start_day` — Day of month when credits reset (computed as rolling 30-day window)
- `billable_units` — Cost of operation in abstract units (computed from token count + pricing tier)
- `checkUserAccess()` — Enforces credits_remaining > 0 before allowing operations

### Edge Functions (Supabase)

**Deployed at `supabase/functions/`:**

- `ai-completion` — Internal LLM call handler (fallback from client when needed)
- `analyze-url`, `analyze-url-firecrawl` — Firecrawl integration for URL content extraction
- `extract-brand-voice-from-url` — Extract tone/style from competitor URLs
- `send-welcome-email`, `send-copydeck-email`, `send-help-email` — Email templates (transactional)
- `admin-*` — Admin-only operations (create user, update user, export token usage, get users, etc.)
- `register-beta-user` — Onboarding flow (creates auth user + pmc_users + sends welcome email)
- `track-tokens` — Logs LLM token usage to `pmc_user_tokens_used` table

**Authentication:** Edge functions require valid Supabase JWT (Bearer token) in Authorization header.

## Form & Generation

### Form State Structure

**Main form model** (`/src/types/index.ts` → `FormState`):

```typescript
language: 'English' | 'Spanish' | 'French' | ...
tone: 'Professional' | 'Friendly' | 'Bold' | 'Creative' | 'Persuasive' | 'Minimalist'
wordCount: 'Short: 50-100' | 'Medium: 100-200' | 'Long: 200-400' | 'Custom'
customWordCount?: number
competitorUrls: string[]
businessDescription?: string
targetAudience?: string
keyMessage?: string
desiredEmotion?: string
briefDescription?: string
outputStructure?: StructuredOutputElement[] // Custom section layout
generateScores?: boolean
generateHeadlines?: boolean
selectedPersona?: string // For restyling (voice adaptation)
// + many more optional fields for advanced features
```

**Form persists across sessions** via:
1. `useFormState()` hook → loads from `SessionContext`
2. Templates save/load form snapshots
3. Prefills provide quick-start form values

### AI Model Selection

**User-facing model selection** (if enabled in UI):
- Dropdown in CopyMaker header
- Options: Claude, OpenAI (if API key provided)
- Defaults to Claude (more economical)

**Behind the scenes** (`/src/lib/llm/modelRegistry.ts`):
- Maps friendly name → specific model ID (e.g., "Claude" → "claude-opus-4-5")
- Defines cost per 1M tokens (input/output separate)
- Falls back to cheaper model if selected model unavailable

**API calls**:
- Anthropic SDK (`@anthropic-ai/sdk`) for Claude models
- OpenAI SDK (`openai`) for GPT-4o, GPT-3.5-turbo, etc.
- Credentials from environment variables (VITE_ANTHROPIC_API_KEY, VITE_OPENAI_API_KEY)

## Critical Patterns

### Saved Outputs Data Contract

**Two-tier loading strategy** (to minimize payload):

1. **Metadata only** — Dashboard listing
   ```typescript
   getUserSavedOutputsMeta(userId, limit=50)
   // Returns: id, title, description, tags, created_at, is_favorite (NO input_data, output_data)
   // ~2KB per record
   ```

2. **Full detail** — Opening a saved output
   ```typescript
   getSavedOutputDetail(outputId)
   // Returns: ALL fields including input_data (50-100KB), output_data (500KB–2MB)
   // Should only be called for single outputs
   ```

**Why:** Dashboard with 50 saved outputs would be 25+ MB if loading all data; metadata query reduces to ~100 KB.

### Abort Signal Support

**Many database query functions support AbortSignal** for cancellation:
```typescript
getCopySession(sessionId, signal?)
getLatestCopySession(userId, signal?)
getTemplate(templateId, signal?)
getSavedOutput(outputId, signal?)
```

**Usage:** CopyMaker uses abort signals to cancel pending queries if user navigates away.

### Credits Enforcement

**Access check** happens at login and before generation:

```typescript
checkUserAccess(userId, userEmail)
// Returns:
// - hasAccess: boolean
// - creditsAllowed, creditsUsedInPeriod, creditsRemaining
// - periodStart, periodEnd (30-day billing window)
// - creditsGraceUnits (buffer for over-usage)
```

**Generation blocked if** `creditsRemaining + creditsGraceUnits <= 0`.

**Billing period** is rolling 30-day window anchored to user's subscription start_date day-of-month.

## Scoring Dimensions & Heuristics

**10 main dimensions** (in `/src/services/api/comprehensiveScoring.ts`):

| Dimension | Type | Inputs |
|-----------|------|--------|
| Clarity | LLM + heuristic | Text readability, sentence structure |
| Persuasiveness | LLM + heuristic | Emotional language, CTA strength, specificity |
| Engagement | LLM | Hook quality, audience alignment |
| Tone Match | Heuristic | Matches user's selected tone (Professional, Creative, etc.) |
| Professionalism | Heuristic | Formality level, grammar, jargon usage |
| Readability | Heuristic | Flesch-Kincaid score, word familiarity |
| CTA Strength | Heuristic | Presence + urgency of call-to-action |
| Audience Fit | LLM | Alignment with stated target audience |
| Differentiation | LLM | Uniqueness vs. generic copy patterns |
| Emotional Impact | LLM | Emotional resonance for stated audience |

**Heuristic scoring** (no LLM call):
- Count sentences, average length, passive voice %
- Flesch-Kincaid grade level
- Presence of CTAs, urgency markers
- Keyword frequency

**LLM scoring** (calls Claude/GPT):
- Descriptive evaluation (why is this effective?)
- 0–100 scale per dimension
- Used for abstract qualities (tone match, emotional impact)

## Common Tasks & File Locations

| Task | Files |
|------|-------|
| Add form field | `/src/hooks/useFormState.ts`, `/src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`, `/src/types/index.ts` |
| Change scoring dimension | `/src/services/api/comprehensiveScoring.ts` (dimension function) + `/src/utils/scoreColors.ts` (display) |
| Add export format | `/src/utils/enhancedExports.ts` (template builder) + export button in results component |
| Add voice/persona | `/src/config/brandVoicePresets.ts` (presets) + `/src/services/api/brandVoiceGeneration.ts` (prompt injection) |
| Fix UI bug | `/src/components/` + lint & test in relevant component + check Tailwind classes |
| Database query | `/src/services/supabaseClient.ts` (add query function) → use in hook → pass to component |
| Token tracking | `/src/services/api/tokenTracking.ts` + track cost in model registry |

## Debugging & Logging

**Debug helpers:**

- URL param `?debugSavedOutputs=1` — Enables verbose logging for saved outputs queries
- Console logs prefixed with emoji (✅ success, ❌ error, 📊 metric, 💳 credits, etc.)
- React DevTools for context/hook inspection
- Vite HMR error overlay disabled (see `vite.config.ts`)

**Performance tracing** (`/src/utils/performanceTrace.ts`):
- Tracks API call timings
- Logs to console in dev mode

**Known console.log statements left in production:**
- `supabaseClient.ts` — User auth & session logging
- `enhancedExports.ts` — Export generation debug output
- Various API services — Model fallback & token tracking

## Known Patterns & Gotchas

### 1. Multiple Model Support
- App defaults to Claude but can use OpenAI
- Model selection stored in `FormState.aiEngine` or `FormState.model`
- Cost calculation depends on selected model (see `modelRegistry.ts`)

### 2. Structured vs. Plain Text Output
- Some templates generate `StructuredCopyOutput` (headline + sections)
- Others return plain string
- Export code checks `typeof content === 'object'` to distinguish

### 3. Voice/Persona System
- Restyling = taking generated copy + rewriting in a specific voice (Steve Jobs, etc.)
- Requires TWO LLM calls: generate first, then restyle
- Results stored as separate card type: `RestyledImproved`, `RestyledAlternative`

### 4. Session vs. Saved Output
- **Session**: Temporary workspace (cleared when user navigates away or logs out)
- **Saved Output**: Permanently persisted in DB with metadata (title, description, favorite flag)
- Exports can save from either session or saved output

### 5. Comparison Result Structure
- `ComparisonResult` contains array of `ComparisonRow` objects
- Each row = one generated version with scores + delta vs. baseline
- Baseline = original copy or user-selected reference
- Winner = highest final score (unless user overrides in UI)

## Security & RLS

**Row-Level Security enforced on all tables:**
- Users can read/write only own records
- Admins (in `app_admins` allowlist) have elevated privileges
- Public templates/prefills marked `is_public = true`

**Secrets management:**
- API keys in environment variables (VITE_*)
- Supabase JWT from auth context (never hardcoded)
- Edge functions validate JWT before proceeding

**No hardcoded credentials, but check with:**
```bash
npm run check:hardcoded-admins
```

## Deployment Notes

**Vercel/Netlify:**
- `npm run build` creates `/dist` folder (Vite output)
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_OPENAI_API_KEY`
- Search index pre-built during `npm run build` (via `build-search-index.cjs`)
- No manual build required; CI/CD runs build script

**Database migrations:**
- All DDL in `/supabase/migrations/` as SQL files
- Timestamps in filename (e.g., `20260117013931_add_credits_tracking.sql`)
- Never modify applied migrations; create new files for changes

## Testing & Validation

**Type checking:**
```bash
npx tsc --noEmit
```

**Linting:**
```bash
npm run lint
```

**Batch testing (CopySnap):**
```bash
npm run test:batch
```

**Manual testing checklist:**
1. Form validation (all required fields)
2. Generation succeeds + output displays
3. Scoring calculates + displays correctly
4. Comparison works (select 2+ versions, compare button)
5. Export renders (HTML, MD, PDF if supported)
6. Saved outputs persist + can be reopened
7. Templates save/load correctly
8. Credits/access checks work
9. Dark mode toggle functions
10. Mobile responsiveness (if relevant)

## Performance Considerations

**Large output rendering:**
- Markdown rendering via `react-markdown` (with remark-gfm, rehype-raw, rehype-sanitize)
- Export HTML generation can be slow for 50+ variations (batched in loops)
- Comparison table uses virtualization for large datasets (if implemented)

**Database query optimization:**
- Cursor-based pagination for lists (not offset-based)
- Metadata queries exclude heavy JSONB columns (input_data, output_data)
- Indexes on user_id, created_at, scope_key (see migration files)

**Bundle size:**
- Main libs: React, React Router, Supabase, Anthropic SDK, OpenAI SDK, Lucide icons, Tailwind
- Chunk size warning limit: 1000 KB (see `vite.config.ts`)
- Lazy-loaded routes for Dashboard, Help, Blog (see `App.tsx`)

---

**Last updated:** 2026-05-13  
**Project:** CopyZap / sharpen-copy-assistant  
**Version:** 0.0.0 (pre-release)
