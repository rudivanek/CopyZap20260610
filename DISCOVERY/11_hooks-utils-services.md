# CopyZap Hooks, Utils & Services

Complete inventory of all custom hooks, utilities, and services.

## Custom Hooks (`/src/hooks/`)

| Hook Name | File | Purpose | Returns |
|---|---|---|---|
| `useAuth` | useAuth.ts | Authentication state management | { user, loading, error, signUp, signIn, signOut } |
| `useFormState` | useFormState.ts | Form state for Copy Maker | { formState, setFormState, resetForm } |
| `useBrandVoices` | useBrandVoices.ts | Fetch and manage brand voices | { voices, loading, error, createVoice } |
| `useCreditsBalance` | useCreditsBalance.ts | Get user's credits info | { credits, remaining, loading, error } |
| `useIsAdmin` | useIsAdmin.ts | Check if user is admin | boolean |
| `useIsSmallScreen` | useIsSmallScreen.ts | Responsive design helper | boolean |
| `useLastRoute` | useLastRoute.ts | Track and restore last route | { lastRoute, saveRoute, clearRoute } |
| `useActiveCard` | useActiveCard.ts | Track active output card | { activeCardId, setActiveCardId } |
| `useInputField` | useInputField.ts | Input field state management | { value, onChange, clearValue } |
| `useMode` | N/A (from context) | Get current app mode | 'copyMaker' \| 'quickPolish' |
| `useSession` | N/A (from context) | Get session context | { sessionId, setSessionId, ... } |

## Services (`/src/services/`)

### Main Services

| Service | File | Purpose | Key Functions |
|---|---|---|---|
| Supabase Client | supabaseClient.ts | Database operations | 312 functions including: signUp, signIn, saveCopySession, getSavedOutput, checkUserAccess, getCreditsBalance |
| Session Service | sessionService.ts | Session management utilities | saveSessionMetadata, loadSession, updateSessionName |
| Workflow Service | workflowService.ts | Workflow management | getWorkflows, createWorkflow, executeWorkflow |
| Workflow Engine | workflowExecutionEngine.ts | Workflow execution logic | executeStep, handleConditionals, aggregateResults |
| Admin Service | adminService.ts | Admin-only operations | validateAdmin, checkAdminAccess |
| Blog Service | blogService.ts | Blog operations | getBlogPosts, getBlogPost, createBlogPost |

### API Services (`/src/services/api/`)

| Service | File | Purpose | Key Functions |
|---|---|---|---|
| Copy Generation | copyGeneration.ts | Generate copy via LLM | generateCopy, generateImproved, generateAlternative |
| Content Scoring | contentScoring.ts | LLM-based scoring | scoreDimension, evaluateContent |
| Comprehensive Scoring | comprehensiveScoring.ts | 10-dimension scoring | scoreContent, generateComparisonResult |
| Comparative Scoring | comparativeScoring.ts | Compare versions | compareVersions, calculateDeltas, identifyWinner |
| Alternative Copy | alternativeCopy.ts | Generate alternatives | generateAlternativeCopy |
| Humanized Copy | humanizedCopy.ts | Humanize content | generateHumanized, adjustTone |
| Blended Copy | blendedCopy.ts | Blend versions | blendSections, mergeBest |
| Brand Voice | brandVoiceGeneration.ts | Apply voices/personas | generateRestyled, applyVoice |
| Content Modification | contentModification.ts | Modify content | changeLength, changeTone, changePerspective |
| Content Refinement | contentRefinement.ts | Refine existing copy | refineForClarity, refineForPersuasiveness |
| Performance Boost | performanceBoost.ts | Iterative improvement | boostScore, iterateImprovement |
| GEO Generation | geoGeneration.ts | Geographic content | generateGeoVariations, localizeContent |
| GEO Scoring | geoScoring.ts | GEO performance scores | scoreGeoRelevance |
| SEO Generation | seoGeneration.ts | Generate SEO metadata | generateMetaTitle, generateMetaDescription |
| URL Analysis | urlAnalysis.ts | Analyze URL content | extractUrlContent, analyzeUrl |
| URL Analysis (Firecrawl) | urlAnalysisFirecrawl.ts | Firecrawl integration | crawlUrl, extractContent |
| URL Brand Voice | urlBrandVoiceExtraction.ts | Extract voice from URL | extractBrandVoice, analyzeTone |
| Voice Styles | voiceStyles.ts | Voice style variations | getVoiceStyles, applyStyle |
| Suggestions | suggestions.ts | Generate suggestions | getSuggestions, suggestImprovements |
| Template Suggestions | templateSuggestions.ts | Suggest templates | suggestTemplates, recommendTemplate |
| Modification Suggestions | modificationSuggestions.ts | Suggest modifications | suggestChanges, recommendModifications |
| Prompt Evaluation | promptEvaluation.ts | Evaluate quality | evaluatePrompt, assessQuality |
| Model Validation | modelValidation.ts | Validate model selection | validateModel, checkAvailability |
| Token Tracking | tokenTracking.ts | Track token usage | saveTokenUsage, computeCost |
| Unified Comparison | unifiedComparison.ts | Unified comparison logic | compareAll, generateReport |
| Version Deep Analysis | versionDeepAnalysis.ts | Detailed version analysis | analyzeDeep, generateAnalysis |
| API Utils | utils.ts | Shared API utilities | formatPrompt, parseResponse, handleError |

## Utilities (`/src/utils/`)

### Core Utilities

| Utility | File | Purpose | Key Functions |
|---|---|---|---|
| Enhanced Exports | enhancedExports.ts | Export functionality | exportAsMarkdown, exportAsHTML, exportEvalMarkdown |
| Copy Formatter | copyFormatter.ts | Format copy text | formatAsMarkdown, formatAsPlainText, cleanCopy |
| Score Colors | scoreColors.ts | Score visualization | getScoreColor, getScoreLabel, getScoreGrade |
| Score Interpretation | scoreInterpretation.ts | Interpret scores | interpretScore, getRecommendation |
| Multi-Score Display | multiScoreDisplay.ts | Display multiple scores | computeWordCountAndReadingLevel, formatScores |
| Markdown Utils | markdownUtils.ts | Markdown utilities | parseMarkdown, stripMarkdown, sanitizeMarkdown |
| Date Formatting | dateFormatting.ts | Date formatting | formatDate, formatTime, getRelativeTime |
| Content Analysis for Export | contentAnalysisForExport.ts | Export analysis | analyzeContent, summarizeContent |
| Placeholder Detection | placeholderDetection.ts | Detect placeholders | detectPlaceholders, replacePlaceholders |
| Performance Trace | performanceTrace.ts | Performance monitoring | traceOperation, logDuration, reportMetrics |
| Debug Logger | debugLogger.ts | Debug logging | logDebug, logWarn, logError |
| Saved Output Guards | savedOutputGuards.ts | Validation | validateSavedOutput, checkIntegrity |
| Session Contract | sessionContract.ts | Session validation | validateSession, checkContract |
| Session Errors | sessionErrors.ts | Error handling | handleSessionError, reportError |

### Additional Utilities

| Utility | File | Purpose |
|---|---|---|
| Form Utils | formUtils.ts | Form validation & helpers |
| HTML to Text | htmlToText.ts | Convert HTML to plain text |
| Input Highlight | inputHighlight.ts | Highlight input text |
| Language Detection | languageDetection.ts | Detect language |
| Model Migration | modelMigration.ts | Migrate model preferences |
| Operation Labels | operationLabels.ts | UI labels for operations |
| Optimization Restore | optimizationRestorePolicy.ts | Handle optimization rollback |
| Pricing Resolver | pricingResolver.ts | Resolve pricing info |
| Sample Data | sampleData.ts | Sample/mock data |
| Sound Effects | soundEffects.ts | Sound effect triggers |
| Template Loader | templateLoader.ts | Load templates |
| Version Score Cache | versionScoreCache.ts | Cache version scores |
| Field Visibility | fieldVisibility.ts | Conditional field visibility |
| Decision Badges | decisionBadges.ts | Display decision badges |
| Evidence Analyzer | evidenceAnalyzer.ts | Analyze evidence |
| FAQ Schema Utils | faqSchemaUtils.ts | FAQ schema generation |
| Guidance Hint Service | guidanceHintService.ts | Guidance hints |

## LLM Library (`/src/lib/llm/`)

| Module | File | Purpose | Key Functions |
|---|---|---|---|
| Model Registry | modelRegistry.ts | Model definitions | getModelConfig, listModels, validateModel |
| LLM Fallback | callLLMWithFallback.ts | LLM orchestration | callLLMWithFallback, callAnthropic, callOpenAI |

## Context/State (`/src/context/`)

| Context | File | Purpose | Provides |
|---|---|---|---|
| Session Context | SessionContext.tsx | Main session state | sessionId, generatedOutputCards, formState, results |
| Mode Context | ModeContext.tsx | App mode (Maker vs Polish) | mode, switchMode |
| Theme Context | ThemeContext.tsx | Dark/light theme | isDark, toggleTheme |
| Guidance Hint Context | GuidanceHintContext.tsx | Contextual help | hints, showHint, dismissHint |

## AI Pipeline Utilities (`/src/utils/ai-pipeline/`)

| Utility | File | Purpose |
|---|---|---|
| Enhanced Pipeline | enhancedPipeline.ts | Advanced generation pipeline |
| Expand Inputs | expandInputs.ts | Expand input parameters |
| Model Settings | modelSettings.ts | Model configuration |
| Refine Output | refineOutput.ts | Refine generated output |

## Usage Patterns

### Using a Hook

```typescript
import { useFormState } from '@/hooks/useFormState'

function MyComponent() {
  const { formState, setFormState } = useFormState()
  return <input value={formState.businessDescription} />
}
```

### Using a Service

```typescript
import { supabase } from '@/services/supabaseClient'
import * as apiService from '@/services/api/copyGeneration'

async function generateCopy(formData) {
  const result = await apiService.generateCopy(formData)
  return result
}
```

### Using a Utility

```typescript
import { scoreColors } from '@/utils/scoreColors'

function ScoreDisplay({ score }) {
  const color = scoreColors.getScoreColor(score)
  return <div style={{ color }}>{score}</div>
}
```

## Code Organization Principles

1. **Hooks** - Encapsulate component-level state and side effects
2. **Services** - Encapsulate business logic and external API calls
3. **Utils** - Pure utility functions with no side effects
4. **Context** - Global app state (minimal, only truly global)

## Size Analysis

Largest files:
- supabaseClient.ts: 2600+ lines
- comprehensiveScoring.ts: 142 KB
- copyGeneration.ts: 67 KB
- contentRefinement.ts: 57 KB
- comparativeScoring.ts: 38 KB
