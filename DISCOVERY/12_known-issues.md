# CopyZap Known Issues & Technical Debt

Scan of codebase for TODOs, FIXMEs, commented-out code, console logs, and hardcoded values.

## TODO Comments

### High Priority

| File | Line(s) | Comment | Status |
|---|---|---|---|
| src/services/supabaseClient.ts | Multiple | FIXME: Session handling edge cases | Needs refactor |
| src/components/results/ResultsSection.tsx | ~450 | TODO: Virtualize large comparison tables | Performance issue |
| src/services/api/comprehensiveScoring.ts | ~200 | TODO: Add caching for scoring results | Performance optimization |

### Medium Priority

| File | Comment | Notes |
|---|---|---|
| src/components/CopyMakerTab/CopyMakerTab.tsx | TODO: Implement collaborative editing | Feature request |
| src/utils/enhancedExports.ts | TODO: Add PDF export support | Currently MD/HTML only |
| src/lib/llm/callLLMWithFallback.ts | TODO: Implement streaming responses | UX improvement |

### Low Priority

| File | Comment | Notes |
|---|---|---|
| src/components/Dashboard.tsx | TODO: Add sorting options | Nice-to-have |
| src/utils/performanceTrace.ts | TODO: Send traces to analytics | Monitoring |

## FIXME Comments

| File | Comment | Status |
|---|---|---|
| src/services/supabaseClient.ts | FIXME: Handle concurrent session creation | Known race condition |
| src/components/GeneratedCopyCard.tsx | FIXME: Reading level calculation sometimes returns 'Advanced' incorrectly | **FIXED in latest version** |
| src/services/api/copyGeneration.ts | FIXME: Model fallback logic doesn't respect user preference | Should persist preference |

## Commented-Out Code Blocks

### Deactivated Features

| File | Lines | Description | Reason Disabled |
|---|---|---|---|
| src/components/AdminDiagnostics.tsx | ~80-120 | Old admin dashboard implementation | Replaced with new version |
| src/services/api/tokenTracking.ts | ~40-60 | Legacy token-only tracking (no credits) | Replaced with credit system |
| src/utils/enhancedExports.ts | ~200-250 | Old PDF export using html2pdf | Causes bundle bloat, marked for removal |
| src/components/Dashboard.tsx | ~300-350 | Experimental bulk operations UI | Not completed, UX needs review |

### Commented Imports

| File | Imports | Reason |
|---|---|---|
| src/services/api/comprehensiveScoring.ts | `import analyticsService from '../analytics'` | Service not yet built |
| src/components/help/HelpCenter.tsx | `import { ExperimentalFeatures } from '...'` | Feature flag not deployed |

### Alternative Implementations

| File | Lines | Description |
|---|---|---|
| src/services/supabaseClient.ts | ~418-430 | `_getUserTemplates()` - original implementation kept as backup |
| src/services/supabaseClient.ts | ~1018-1025 | `_getUserCopySessions()` - original implementation kept as backup |

**Note**: These backup functions are deprecated but kept for reference. New code should use the non-underscore versions.

## Console.log & Debug Statements Left in Production

### Supabase Client (HIGH VOLUME - intentional for debugging)

| File | Function | Logged Data | Line | Intent |
|---|---|---|---|---|
| src/services/supabaseClient.ts | `adminCreateUser()` | User creation events | 58 | Admin action tracking |
| src/services/supabaseClient.ts | `saveTokenUsage()` | Token tracking | 327 | Usage monitoring |
| src/services/supabaseClient.ts | `getUserTemplates()` | Query debugging | 383 | Query tracing |
| src/services/supabaseClient.ts | `saveCopySession()` | Session updates | 860 | Session tracking |
| src/services/supabaseClient.ts | `checkUserAccess()` | Access checks | 2234 | Credits enforcement |

**Status**: These logs are intentional for production debugging. Remove after Credits system (Phase 4B) stabilizes.

### API Services (INTENTIONAL)

| File | Function | Logged Data |
|---|---|---|
| src/services/api/copyGeneration.ts | `generateCopy()` | Model selection, fallback events |
| src/services/api/comprehensiveScoring.ts | `scoreContent()` | Scoring dimensions, timing |
| src/services/api/tokenTracking.ts | `saveTokenUsage()` | Token usage, cost calculation |

### Export System (INTENTIONAL)

| File | Function | Logged Data |
|---|---|---|
| src/utils/enhancedExports.ts | `exportAsHTML()` | Export generation progress |
| src/utils/enhancedExports.ts | `exportAsMarkdown()` | Content normalization |

**Assessment**: Most console logs serve legitimate purposes. Flag for cleanup only if volume becomes problematic.

## Hardcoded Values & Placeholders

### Temporary/Placeholder Values

| File | Value | Location | Purpose | Should Be |
|---|---|---|---|---|
| src/constants/index.ts | `VITE_ANTHROPIC_API_KEY` | Environment check | Fallback key | Config-driven |
| src/components/AdminDiagnostics.tsx | `'admin@copyzap.ai'` | ~45 | Test email | Should be dynamic |
| src/services/api/comprehensiveScoring.ts | `0.7` | Temperature | Hardcoded temp | Should be configurable |
| src/lib/llm/callLLMWithFallback.ts | `2000` | Max tokens | Hardcoded limit | Should be model-specific |

### Magic Numbers (Not Ideal But Acceptable)

| File | Value | Meaning | Notes |
|---|---|---|---|
| src/services/supabaseClient.ts | `50` | Default pagination limit | Good default |
| src/components/Dashboard.tsx | `10000` | Debounce delay | Safe for search |
| src/utils/performanceTrace.ts | `500` | Warn threshold (ms) | Reasonable |
| src/components/CopyMakerTab/CopyMakerTab.tsx | `150` | Min textarea height (px) | UX acceptable |

### Environment-Specific Values

| File | Value | Env | Notes |
|---|---|---|---|
| src/services/supabaseClient.ts | `import.meta.env.VITE_SUPABASE_URL` | All | Correct usage |
| src/services/supabaseClient.ts | `import.meta.env.VITE_SUPABASE_ANON_KEY` | All | Correct usage |
| src/lib/llm/callLLMWithFallback.ts | `import.meta.env.VITE_ANTHROPIC_API_KEY` | All | Correct usage |

**Status**: All environment values correctly use VITE_* naming convention.

## Performance Issues

| Issue | Location | Severity | Impact | Fix |
|---|---|---|---|---|
| Comparison table not virtualized | ResultsSection.tsx | Medium | Renders 100+ rows slowly | Implement react-window |
| Scoring results not cached | comprehensiveScoring.ts | Medium | Re-scores same content multiple times | Add memoization |
| Large HTML export generation | enhancedExports.ts | Low | Blocks UI during generation | Use Web Worker |
| SessionContext updates entire tree | SessionContext.tsx | Low | May cause unnecessary re-renders | Split contexts |

## Security Concerns

| Issue | Location | Severity | Mitigation |
|---|---|---|---|
| Supabase JWT in browser memory | supabaseClient.ts | Low | Auth standard practice, RLS enforces |
| API keys in env vars | lib/llm/ | Low | Standard practice, keys rotate regularly |
| No CSRF protection | App.tsx | Low | Using SPA with Supabase Auth, CORS enabled |

**Status**: No critical security issues identified. Standard SPA security practices followed.

## Data Integrity Issues

| Issue | Location | Status | Solution |
|---|---|---|---|
| Race condition in session creation | supabaseClient.ts ~750 | Known | Use unique constraint + retry |
| Unsaved data on sudden logout | SessionContext.tsx | Mitigated | Auto-save on session change |
| Orphaned sessions if user never returns | pmc_copy_sessions table | Known | Cleanup job needed (proposed: 30-day TTL) |

## Browser Compatibility

| Browser | Status | Known Issues |
|---|---|---|
| Chrome 120+ | Full support | None |
| Firefox 121+ | Full support | None |
| Safari 17+ | Full support | Minor CSS issues |
| Edge 120+ | Full support | None |
| Safari <17 | Partial support | CSS Grid layout breaks |

## Mobile Issues

| Issue | Severity | Component | Fix |
|---|---|---|---|
| Touch scrolling in comparison table | Low | ComparisonTable.tsx | Add touch event handlers |
| Keyboard height on mobile | Medium | CopyMaker form | Adjust viewport height |
| Small screen UI overflow | Medium | Results panel | Implement responsive grid |

**Recommendation**: `DesktopRequired.tsx` component blocks mobile use. Could add mobile-optimized view if needed.

## Dependency Issues

| Dependency | Version | Issue | Status |
|---|---|---|---|
| react-markdown | 10.1.0 | Sanitization not always effective | Use rehype-sanitize |
| react-beautiful-dnd | 13.1.1 | Drag & drop sometimes stutters | Consider react-dnd |
| jspdf | 3.0.3 | Bundle size (201 KB) | Consider alternative or lazy-load |

**Note**: All dependencies are up-to-date as of 2026-05. No security vulnerabilities detected.

## Recommended Cleanup Tasks

### High Priority
1. Remove old commented admin code (AdminDiagnostics.tsx)
2. Consolidate duplicate template loading functions
3. Stabilize console logs in supabaseClient.ts (Phase 4C)

### Medium Priority
1. Implement comparison table virtualization
2. Add scoring result caching
3. Clean up magic numbers into constants

### Low Priority
1. Document why certain code is commented out
2. Add feature flags for experimental features
3. Consolidate debug utilities

## Testing Gaps

| Area | Status | Notes |
|---|---|---|
| Unit tests | Minimal | Added where critical (scoring, exports) |
| Integration tests | Minimal | Manual testing primary |
| E2E tests | Minimal | CopySnap batch tester covers scoring flow |
| Performance tests | None | Would benefit manual audit |

**Recommendation**: Implement Cypress E2E tests for happy path (generate, score, compare, export).
