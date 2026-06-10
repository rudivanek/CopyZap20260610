# CopyZap Generation Pipeline

Complete trace of copy generation flow from user click to LLM and back to UI.

## Generation Trigger

**Button**: "Generate Copy" button in CopyMaker header
- **Location**: `/src/components/GenerateButton.tsx`
- **Component**: `CopyMakerTab.tsx` contains the trigger logic
- **Handler Function**: `handleGenerate()` in `useGeneration.ts` hook

## Function Call Chain

```
User clicks "Generate Copy"
  ↓
CopyMakerTab.handleGenerate()
  ↓
useGeneration hook → generateCopy()
  ↓
/src/services/api/copyGeneration.ts → generateCopy()
  ↓
Determine LLM model via /src/lib/llm/modelRegistry.ts
  ↓
callLLMWithFallback() in /src/lib/llm/callLLMWithFallback.ts
  ↓
Either:
  - Anthropic SDK (for Claude models)
  - OpenAI SDK (for OpenAI models)
  ↓
LLM Response
  ↓
Parse response → StructuredCopyOutput or string
  ↓
Store in SessionContext.generatedOutputCards[]
  ↓
If generateScores = true:
  ↓
comprehensiveScoring.ts → Score all 10 dimensions
  ↓
Render results in UI
```

## LLM Model Selection

**Logic**: `/src/lib/llm/modelRegistry.ts`

```typescript
const modelRegistry = {
  'claude': {
    provider: 'anthropic',
    modelId: 'claude-opus-4-5',  // or claude-sonnet-4-5, claude-haiku-4-5
    costPer1MTokInput: 0.003,    // Input token cost
    costPer1MTokOutput: 0.015    // Output token cost
  },
  'openai': {
    provider: 'openai',
    modelId: 'gpt-4o',           // or gpt-3.5-turbo, gpt-4-turbo
    costPer1MTokInput: 0.005,
    costPer1MTokOutput: 0.015
  }
}
```

**Selection Logic**:
1. User selects AI Engine in UI dropdown (stored in `FormState.aiEngine`)
2. Defaults to 'claude' if not set
3. Falls back to cheaper model if selected model unavailable
4. Cost calculated based on model registry

## System Prompt Construction

**Location**: `/src/services/api/copyGeneration.ts`

System prompt structure:
```
You are an expert copywriter specializing in [INDUSTRY].

Your task: Generate compelling [OUTPUT_TYPE] copy for [AUDIENCE].

Guidelines:
- Tone: [TONE] (Professional, Creative, etc.)
- Language: [LANGUAGE]
- Word count target: [WORD_COUNT]
- Format: [OUTPUT_STRUCTURE if specified]

Brand Context:
- Brand values: [brandValues]
- Key message: [keyMessage]
- Desired emotion: [desiredEmotion]

Do NOT:
- Use excluded terms: [excludedTerms]
- Use passive voice: [if specified in constraints]
- Include jargon: [if specified]

Include:
- Keywords: [keywords to use]
- Strong CTA
- Emotional resonance for [targetAudience]
```

## User Prompt Construction

**Location**: `/src/services/api/copyGeneration.ts`

User prompt structure:
```
Business: [businessDescription]
Target audience: [targetAudience]
Current copy to improve: [originalCopy if in improve mode]
Competitor research: [competitorUrls analysis]
Specific instructions: [specialInstructions]

Please generate [NUMBER] variations of [OUTPUT_TYPE] that:
1. Address [targetAudiencePainPoints]
2. Emphasize [brandValues]
3. Use [preferredWritingStyle] style
4. Target [readerFunnelStage] stage
```

## LLM Call Execution

**File**: `/src/lib/llm/callLLMWithFallback.ts`

```typescript
async function callLLMWithFallback(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number,    // Default: 0.7
    maxTokens?: number,      // Default: 2000
    retryOnFailure?: boolean // Default: true
  }
): Promise<string>

// For Claude (Anthropic)
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5',
  max_tokens: options.maxTokens || 2000,
  system: systemPrompt,
  messages: [{
    role: 'user',
    content: userPrompt
  }]
})

// For OpenAI
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  max_tokens: options.maxTokens || 2000,
  system_prompt: systemPrompt,
  messages: [{
    role: 'user',
    content: userPrompt
  }]
})
```

## Response Parsing

**File**: `/src/services/api/copyGeneration.ts`

Two parsing modes:

### 1. Structured Output
If `outputStructure` is defined:
```typescript
// Parse JSON-formatted response with sections:
{
  headline: "...",
  sections: [
    { label: "Problem", content: "..." },
    { label: "Solution", content: "..." }
  ]
}

// Store as StructuredCopyOutput type
type StructuredCopyOutput = {
  headline?: string,
  sections: Array<{ label: string, content: string }>
}
```

### 2. Plain Text Output
If no structure specified:
```typescript
// Return raw string response
const output: string = response.content[0].text
```

## State Storage

**Location**: `SessionContext` in `/src/context/SessionContext.tsx`

```typescript
generatedOutputCards: Array<{
  id: string,                    // UUID
  content: string | StructuredCopyOutput,
  type: GeneratedContentItemType,
  scores?: ScoringResult,
  wordCount?: number,
  timestamp: string,
  model: string,
  tokens_used: number,
  cost_usd: number,
  metadata?: {
    fromTemplate?: string,
    fromPrefill?: string,
    // ... other metadata
  }
}>
```

## Token & Cost Tracking

**File**: `/src/services/api/tokenTracking.ts`

Tokens tracked:
```typescript
const tokenData = {
  user_id: currentUser.id,
  model: selectedModel,
  tokens_used: response.usage.input_tokens + response.usage.output_tokens,
  cost_usd: computeCost(model, inputTokens, outputTokens),
  billable_units: Math.ceil(cost_usd * 100), // Convert USD to units
  operation_type: 'generate_copy',
  created_at: new Date().toISOString(),
  session_id: sessionContext.sessionId
}

// Stored in pmc_user_tokens_used table
await saveTokenUsage(tokenData)
```

## Auto-Scoring (Optional)

If `generateScores = true`:

**File**: `/src/services/api/comprehensiveScoring.ts`

Calls scoring pipeline automatically:
- Scores 10 dimensions (Clarity, Persuasiveness, Engagement, etc.)
- Results stored in `generatedOutputCards[index].scores`
- Displayed alongside copy in UI

## Rendering in UI

**Location**: `/src/components/results/ResultsSection.tsx` → `GeneratedCopyCard.tsx`

1. Each card in `generatedOutputCards` rendered via `GeneratedCopyCard` component
2. Card displays:
   - Headline (if structured output)
   - Copy content (rendered via `react-markdown`)
   - Word count
   - Reading level (newly fixed)
   - Scores (if generated) via `ScoreCard` components
   - Action buttons (Copy, Share, Save, Edit, etc.)

## Error Handling

**Fallback Logic**:
1. If selected model unavailable → fallback to Claude Opus
2. If API rate-limited → retry with exponential backoff
3. If network error → show error toast and allow retry
4. If parsing fails → store raw response as plain text

**Error States**:
- `TokenLimitModal` if user out of credits
- `AiModelValidationModal` if model validation fails
- Toast notification with retry option for network errors

## Special Handling: Alternative Outputs

**Generate Variants**: By calling generation pipeline multiple times with variations:
- `generateAlternativeCopy()` - Different angle/approach
- `generateHumanizedCopy()` - More conversational tone
- `generateHeadlines()` - Multiple headline options
- `generateRestyled()` - Apply selected persona/voice

Each creates new entry in `generatedOutputCards[]` with type:
- 'improved', 'alternative', 'humanized', 'headlines', 'restyled_improved', etc.
