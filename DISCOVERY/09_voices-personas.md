# CopyZap Voices & Personas System

Complete documentation of the voice/persona system for restyling copy.

## What is Restyling?

**Restyling** = Taking generated copy and rewriting it in a specific voice/persona

Example:
- Original: "Professional business email"
- Restyled (Steve Jobs voice): "Magical, minimalist version of same message"
- Restyled (Elon Musk voice): "Edgy, ambitious version of same message"

## Available Voices/Personas

**Location**: `/src/config/brandVoicePresets.ts`

**Predefined Personas**:

| Label (UI Display) | ID | Description | Characteristics |
|---|---|---|---|
| Steve Jobs | steve-jobs | Visionary, minimalist, inspiring | Simple language, focus on "why", emotional appeal |
| Elon Musk | elon-musk | Ambitious, edgy, technical | Technical terms, ambitious goals, provocative |
| Oprah Winfrey | oprah-winfrey | Warm, personal, empowering | Personal stories, encouragement, relatability |
| Tony Robbins | tony-robbins | Motivational, action-oriented, energetic | Exclamation marks, action words, empowerment |
| Malcolm Gladwell | malcolm-gladwell | Analytical, storytelling, data-driven | Stories, research, insights, narrative flow |
| Seth Godin | seth-godin | Conversational, marketing-focused, practical | Purple cow thinking, practical advice, questions |
| Gary Vee | gary-vee | Direct, hustler mentality, authentic | Authenticity, work ethic, direct communication |
| Sheryl Sandberg | sheryl-sandberg | Professional, inclusive, empowering | Inclusion, data, professional tone, empowerment |
| Ryan Holiday | ryan-holiday | Philosophical, stoic, introspective | Wisdom, philosophy, deeper meaning, introspection |
| Michelle Obama | michelle-obama | Inspiring, personal, powerful | Personal journey, inspiration, authenticity |

**User-Created Custom Voices**:
- Stored in `/pmc_brand_voices` table
- Each user can create custom personas
- Include custom prompt instructions

## Data Structure

```typescript
interface BrandVoicePreset {
  id: string,                        // Unique ID (snake_case)
  label: string,                     // Display name (UI)
  description: string,               // What makes this voice unique
  systemPrompt: string,              // Instructions for LLM
  exampleOutput?: string,            // Example of voice in action
  keywords: string[],                // Key characteristics
  tone: string,                      // Dominant tone
  isPublic: boolean,                 // Available to all users or custom
  createdBy?: string,                // User ID if custom
  createdAt?: string                 // Timestamp
}
```

## Form Integration

### Voice Selection UI

**Location**: `/src/components/ui/BrandVoiceSelector.tsx`

**Trigger**: Optional dropdown/combobox in Copy Maker form
- **Label**: "Apply Persona" or "Voice Style"
- **State Variable**: `selectedPersona` in FormState
- **Visible When**: Advanced options expanded or explicitly enabled

### Voice Selection Flow

```
User selects voice from dropdown
  ↓
setFormState({ selectedPersona: 'steve-jobs' })
  ↓
Voice stored in SessionContext
  ↓
During generation or restyling, voice prompt injected
```

## Generation with Voice

**File**: `/src/services/api/brandVoiceGeneration.ts`

When `selectedPersona` is set:

1. **During Initial Generation** (optional):
   - Include voice in system prompt
   - Generate copy already in target voice
   
2. **During Restyling** (after generation):
   - Take existing copy
   - Create restyle prompt
   - Apply voice to existing content

### System Prompt for Voice

```
You are writing in the voice of [VOICE_LABEL].

[VOICE_DESCRIPTION]

Key characteristics of [VOICE_LABEL]:
- [Characteristic 1]
- [Characteristic 2]
- [Characteristic 3]

Examples of [VOICE_LABEL]'s writing:
- [Example 1]
- [Example 2]

Now rewrite the following copy in this voice:
```

### Restyle Prompt Structure

```typescript
const restylePrompt = `
Take this copy:
"[ORIGINAL_COPY]"

And rewrite it in the voice of ${voiceLabel}.

Guidelines:
1. Maintain the core message
2. Keep similar length and structure
3. Apply ${voiceLabel}'s characteristic style
4. Use ${voiceLabel}'s typical language patterns
5. Capture ${voiceLabel}'s emotional tone

Rewritten copy:
`;
```

## LLM Call for Restyling

**Function**: `generateRestyled()` in `/src/services/api/brandVoiceGeneration.ts`

```typescript
async function generateRestyled(
  originalCopy: string,
  voiceId: string,
  voicePreset: BrandVoicePreset
): Promise<string>

// 1. Build system prompt with voice instructions
const systemPrompt = buildVoiceSystemPrompt(voicePreset)

// 2. Build user prompt requesting restyle
const userPrompt = buildRestylePrompt(originalCopy, voicePreset.label)

// 3. Call LLM
const response = await callLLMWithFallback(
  'claude-opus-4-5',
  systemPrompt,
  userPrompt,
  { temperature: 0.8, maxTokens: 2000 }
)

// 4. Return restyled content
return response
```

## State Management for Restyled Outputs

**Location**: `SessionContext`

```typescript
// In generatedOutputCards array, add new entries:
generatedOutputCards.push({
  id: uuid(),
  type: 'restyled_improved',      // or 'restyled_alternative'
  content: restyledCopy,
  sourceId: originalVersionId,
  voiceId: 'steve-jobs',
  sourcedVoice: voicePreset,
  wordCount: restyledCopy.split(/\s+/).length,
  scores?: undefined,             // Not auto-scored, optional manual score
  timestamp: new Date().toISOString()
})
```

## UI Display of Restyled Outputs

**Location**: `/src/components/GeneratedCopyCard.tsx`

Each restyled output card displays:
1. **Header**: "[Voice] - [Original Type]"
   - Example: "Steve Jobs - Improved Copy"
2. **Subtitle**: "Restyled in the voice of [Voice]"
3. **Content**: Restyled copy text
4. **Badge**: "Restyled" badge to distinguish from generated
5. **Actions**: Copy, Save, Score, Share (same as regular outputs)

## Restyling Triggers

**Manual Restyle**:
- User selects voice in form BEFORE generation
- Copy generated directly in target voice

**Post-Generation Restyle**:
- User selects voice AFTER seeing generated copy
- Click "Restyle in [Voice]" button on output card
- System creates new restyled version

**Batch Restyle**:
- Select multiple outputs
- Click "Restyle All as [Voice]"
- System restyled each one (batched LLM calls)

## Custom Brand Voices

**User-Created Voices**:

Users can create custom voices via form:
- **Voice Name**: "Our Brand Voice"
- **Description**: "Modern, friendly, tech-savvy"
- **System Instructions**: Custom prompt text
- **Example Output**: Show what this voice sounds like

**Storage**: `/pmc_brand_voices` table

```typescript
interface CustomBrandVoice {
  id: string,                    // UUID
  user_id: string,               // Owner
  name: string,                  // "Our Brand Voice"
  description: string,
  system_instructions: string,   // Custom prompt
  example_output: string,
  keywords: string[],
  is_public: boolean,            // Share with team?
  created_at: string,
  updated_at: string
}
```

## Available Voices Display

**Location**: `BrandVoiceModal.tsx`

Shows:
1. **Predefined Personas** (read-only)
   - Grid of persona cards
   - Each card shows label, description, example
2. **Custom Voices** (user-created)
   - Editable custom voices
   - Can create new custom voice
3. **Search/Filter**
   - Search by name or keywords
   - Filter by tone or category

## Scoring Impact

**Question**: Do voices affect scoring?

**Answer**: No, scoring is voice-agnostic
- Scores measure quality of MESSAGE
- Not quality of VOICE
- Restyled copy rated on same 10 dimensions as original

Example:
- "Steve Jobs" version scores 82 (good structure, clear message)
- "Gary Vee" version scores 79 (same content, different delivery)
- Difference in score reflects message quality, not voice preference

## Cost of Restyling

**Per restyle operation**:
- LLM call: Claude Opus
- Typical tokens: 500-1200
- Typical cost: $0.01-$0.03
- Deducted from user's credits before operation

## Keywords for Each Voice

**Steve Jobs**: innovation, simple, focus, why, inspiration, magic, perfection
**Elon Musk**: ambitious, technical, future, disruption, bold, possibility, edge
**Oprah Winfrey**: personal, authentic, empowerment, heart, journey, real
**Tony Robbins**: action, potential, energy, momentum, breakthrough, power
**Malcolm Gladwell**: insight, story, research, pattern, surprise, unexpected
**Seth Godin**: marketing, remarkable, permission, tribe, practical, question
**Gary Vee**: hustle, authentic, authentic, content, gratitude, daily
**Sheryl Sandberg**: leadership, inclusion, lean-in, data, professional
**Ryan Holiday**: wisdom, philosophy, stoic, meaning, growth, truth
**Michelle Obama**: inspiration, personal, journey, powerful, grace

## Voice Prompt Templates

Each voice has a stored template in `/src/config/brandVoicePresets.ts`:

```typescript
const brandVoicePresets: Record<string, BrandVoicePreset> = {
  'steve-jobs': {
    systemPrompt: `You write like Steve Jobs...
      - Use simple, poetic language
      - Focus on "why" not "how"
      - Create emotional resonance
      ...`,
    exampleOutput: "Technology and humanity intersect at..."
  },
  // ... more voices
}
```

## Testing Voices

**URL Param Debug**:
- `?testVoice=steve-jobs` - Force test voice
- `?showVoiceDebug=1` - Show voice prompt in UI

These help developers test voice functionality.
