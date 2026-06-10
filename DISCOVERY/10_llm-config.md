# CopyZap LLM Configuration

Complete documentation of LLM integration and configuration.

## Integrated Providers

1. **Anthropic** (Claude models) - PRIMARY
   - Claude Opus 4.5
   - Claude Sonnet 4.5
   - Claude Haiku 4.5

2. **OpenAI** - SECONDARY
   - GPT-4o
   - GPT-4 Turbo
   - GPT-3.5 Turbo

3. **DeepSeek** - ALTERNATIVE
   - DeepSeek Chat

## API Key Storage

**Environment Variables**:
- `VITE_ANTHROPIC_API_KEY` - Anthropic API key
- `VITE_OPENAI_API_KEY` - OpenAI API key
- `VITE_DEEPSEEK_API_KEY` - DeepSeek API key (if used)

**Location in Code**:
```typescript
// In src/lib/llm/callLLMWithFallback.ts
const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY
const openaiKey = import.meta.env.VITE_OPENAI_API_KEY

// Initialize clients
const anthropic = new Anthropic({ apiKey: anthropicKey })
const openai = new OpenAI({ apiKey: openaiKey })
```

**Security**:
- Keys never logged or stored in code
- Only in browser environment variables
- Passed to API calls securely
- Edge functions use Supabase service role key

## Model Registry

**File**: `/src/lib/llm/modelRegistry.ts`

```typescript
const modelRegistry: Record<string, ModelConfig> = {
  'claude': {
    provider: 'anthropic',
    modelId: 'claude-opus-4-5',
    displayName: 'Claude Opus (Recommended)',
    costPer1MInputTokens: 0.003,
    costPer1MOutputTokens: 0.015,
    maxTokens: 4000,
    temperature: 0.7,
    tier: 'premium'
  },
  'claude-sonnet': {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-5',
    displayName: 'Claude Sonnet (Fast)',
    costPer1MInputTokens: 0.003,
    costPer1MOutputTokens: 0.015,
    maxTokens: 4000,
    temperature: 0.7,
    tier: 'standard'
  },
  'openai': {
    provider: 'openai',
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    costPer1MInputTokens: 0.005,
    costPer1MOutputTokens: 0.015,
    maxTokens: 4000,
    temperature: 0.7,
    tier: 'premium'
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    modelId: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo (Budget)',
    costPer1MInputTokens: 0.0005,
    costPer1MOutputTokens: 0.0015,
    maxTokens: 4000,
    temperature: 0.7,
    tier: 'budget'
  },
  'deepseek': {
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    costPer1MInputTokens: 0.0014,
    costPer1MOutputTokens: 0.0042,
    maxTokens: 4000,
    temperature: 0.7,
    tier: 'budget'
  }
}
```

## User Model Selection

### UI Component

**Location**: `/src/components/ui/AiEngineSelector.tsx`

**Display**:
- Dropdown/combobox in Copy Maker header
- Shows available models
- Default: "Claude" (Opus)
- Label: "AI Engine" or "Model"

**HTML**:
```html
<select>
  <option value="claude">Claude Opus (Recommended)</option>
  <option value="claude-sonnet">Claude Sonnet (Fast)</option>
  <option value="openai">GPT-4o</option>
  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
</select>
```

### Selection Storage

```typescript
// Stored in FormState
FormState.aiEngine = 'claude'    // 'claude' | 'openai' | 'deepseek'
FormState.model = 'claude-opus-4-5'  // Full model ID (deprecated)

// Also stored in SessionContext
SessionContext.selectedModel = 'claude-opus-4-5'
```

### Selection Flow

```
User selects model from dropdown
  ↓
setFormState({ aiEngine: 'claude' })
  ↓
Model stored in SessionContext
  ↓
On generation, callLLMWithFallback() uses aiEngine to lookup modelId
  ↓
LLM called with appropriate API client
```

## Default Models

| Operation | Default Model | Fallback | Reason |
|---|---|---|---|
| Copy Generation | Claude Opus | Claude Sonnet | Best quality, moderate cost |
| Scoring | Claude Opus | Claude Sonnet | Highest consistency |
| Restyling | Claude Opus | Claude Sonnet | Nuanced writing required |
| URL Analysis | Claude Haiku | Claude Sonnet | Simple task, fast |
| Brand Voice Extraction | Claude Opus | Claude Sonnet | Complex analysis |

## Temperature & Parameters

**Tuning by Operation**:

| Operation | Temperature | Max Tokens | Top P | Frequency Penalty |
|---|---|---|---|---|
| Copy Generation | 0.7 | 2000 | 0.9 | 0.1 |
| Scoring | 0.5 | 1500 | 0.8 | 0.0 |
| Restyling | 0.8 | 2000 | 0.9 | 0.1 |
| URL Analysis | 0.3 | 1000 | 0.7 | 0.0 |
| Headline Generation | 0.9 | 1500 | 1.0 | 0.2 |

**Temperature Rationale**:
- Copy Generation: 0.7 (good balance of creativity and coherence)
- Scoring: 0.5 (consistent, factual analysis)
- Restyling: 0.8 (higher creativity for voice variation)
- Headlines: 0.9 (maximum variety)

## LLM Call Execution

**File**: `/src/lib/llm/callLLMWithFallback.ts`

```typescript
async function callLLMWithFallback(
  model: string,              // 'claude-opus-4-5', 'gpt-4o', etc.
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number,     // Default: 0.7
    maxTokens?: number,       // Default: 2000
    topP?: number,            // Default: 0.9
    retryOnFailure?: boolean  // Default: true
  }
): Promise<string>

// 1. Lookup model in registry
const modelConfig = modelRegistry[model]

// 2. Determine provider
if (modelConfig.provider === 'anthropic') {
  return callAnthropic(model, systemPrompt, userPrompt, options)
} else if (modelConfig.provider === 'openai') {
  return callOpenAI(model, systemPrompt, userPrompt, options)
}
```

### Anthropic Call

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5',
  max_tokens: options.maxTokens || 2000,
  temperature: options.temperature || 0.7,
  system: systemPrompt,
  messages: [{
    role: 'user',
    content: userPrompt
  }]
})

return response.content[0].type === 'text' ? response.content[0].text : ''
```

### OpenAI Call

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  max_tokens: options.maxTokens || 2000,
  temperature: options.temperature || 0.7,
  system_prompt: systemPrompt,
  messages: [{
    role: 'user',
    content: userPrompt
  }],
  top_p: options.topP || 0.9
})

return response.choices[0].message.content || ''
```

## Fallback Strategy

**Automatic Fallback** if model unavailable:

```
Request Claude Opus
  ↓ [Fails: rate limit or unavailable]
  ↓
Fallback to Claude Sonnet
  ↓ [Fails]
  ↓
Fallback to Claude Haiku
  ↓ [Fails]
  ↓
Show error to user: "AI service temporarily unavailable"
```

**Retry Logic**:
- Exponential backoff: 1s, 2s, 4s
- Max retries: 3
- If all retries fail: return error

## Cost Tracking Integration

**File**: `/src/services/api/tokenTracking.ts`

After each LLM call:

```typescript
const cost = computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number
) => {
  const modelConfig = modelRegistry[model]
  const inputCost = (inputTokens / 1_000_000) * modelConfig.costPer1MInputTokens
  const outputCost = (outputTokens / 1_000_000) * modelConfig.costPer1MOutputTokens
  return inputCost + outputCost
}

// Example:
// Model: Claude Opus
// Input: 500 tokens @ $0.003/1M = $0.0000015
// Output: 300 tokens @ $0.015/1M = $0.0000045
// Total: $0.000006
```

**Billing Units**:
```typescript
const billableUnits = Math.ceil(totalCostUsd * 100)
// $0.000006 * 100 = 0 units (rounded)
// $0.01 * 100 = 1 unit
// Minimum 1 unit per operation if any cost
```

## Model-Specific Notes

### Claude Opus (Primary)
- **Strengths**: Best reasoning, nuanced writing, consistency
- **Weaknesses**: Slower, most expensive
- **Use**: Copy generation, scoring, restyling
- **Cost**: ~$0.01-0.03 per operation

### Claude Sonnet
- **Strengths**: Good balance of speed and quality
- **Weaknesses**: Slightly less nuanced than Opus
- **Use**: Fallback for Opus, headlines
- **Cost**: ~$0.005-0.015 per operation

### Claude Haiku
- **Strengths**: Fastest, cheapest
- **Weaknesses**: Limited nuance
- **Use**: Simple tasks, URL analysis
- **Cost**: ~$0.001-0.005 per operation

### GPT-4o
- **Strengths**: Good all-around, multimodal
- **Weaknesses**: Slower than Claude, more expensive
- **Use**: Alternative to Claude, especially if user prefers OpenAI
- **Cost**: ~$0.01-0.03 per operation

### GPT-3.5-Turbo
- **Strengths**: Very fast and cheap
- **Weaknesses**: Lower quality, inconsistent scoring
- **Use**: Budget tier, less critical tasks
- **Cost**: ~$0.001-0.005 per operation

## Model Availability

**Status Checks**:
- No explicit availability check before calling
- Handled via fallback on error
- User sees error if all models fail

**Future Improvement**: Could add `/admin/model-status` endpoint to check provider status

## Streaming (Future)

**Currently**: All calls are non-streaming (wait for full response)

**Potential Future**: Could implement streaming for better UX during generation
- Long-running calls could show partial results
- Would require UI component redesign

## Environment-Specific Configuration

**Development**: 
- Can use test API keys
- Rate limits more lenient

**Production**:
- Uses deployed secrets
- Strict rate limiting
- Error handling critical

**Testing**:
- Mock LLM responses
- No actual API calls (except integration tests)
