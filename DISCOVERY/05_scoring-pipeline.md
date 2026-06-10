# CopyZap Scoring Pipeline

Complete trace of the 10-dimension scoring system.

## Scoring Triggers

**Manual Trigger**:
- User clicks "Score" button on individual output card
- Located in `GeneratedCopyCard.tsx`

**Auto Trigger**:
- If `generateScores = true` in form, scoring runs automatically after generation
- Optional feature, not required

**Batch Scoring**:
- User selects multiple outputs and clicks "Compare"
- All selected versions scored together via `generateComparisonResult()`

## Function Call Chain

```
User clicks "Score" or auto-score triggered
  ↓
/src/components/results/GeneratedCopyCard.tsx → scoreOutput()
  ↓
/src/services/api/comprehensiveScoring.ts → scoreContent()
  ↓
For each of 10 dimensions:
  ├─ Heuristic score (if applicable)
  └─ LLM score (if applicable)
  ↓
Aggregate scores into final result
  ↓
Store in SessionContext.generatedOutputCards[index].scores
  ↓
Render scores in UI via ScoreCard, MultiScoreDisplay, SubScoreChips
```

## 10 Scoring Dimensions

**File**: `/src/services/api/comprehensiveScoring.ts` (142 KB file, massive implementation)

### 1. Clarity
- **Type**: LLM + Heuristic
- **LLM Prompt**:
  ```
  Rate the clarity of this copy on a scale of 0-100.
  How easy is it to understand the message?
  Consider: sentence structure, word choice, jargon usage.
  ```
- **Heuristic**:
  - Flesch-Kincaid grade level (lower = clearer)
  - Average sentence length (optimal: 15-17 words)
  - Passive voice percentage (lower is better)
  - Complex word count
- **Score Range**: 0-100

### 2. Persuasiveness
- **Type**: LLM + Heuristic
- **LLM Prompt**:
  ```
  How persuasive is this copy for the target audience?
  Does it motivate action? Rate 0-100.
  Consider: emotional language, CTA strength, specificity.
  ```
- **Heuristic**:
  - Presence of CTA (0-20 points)
  - Urgency markers ("limited time", "act now", etc.)
  - Power words count
  - Emotional language intensity
  - Specificity of claims
- **Score Range**: 0-100

### 3. Engagement
- **Type**: LLM
- **LLM Prompt**:
  ```
  How engaging and compelling is this copy?
  Would the target audience want to continue reading?
  Rate 0-100 on hook quality and story flow.
  ```
- **Score Range**: 0-100

### 4. Tone Match
- **Type**: Heuristic
- **Logic**:
  ```
  Compare detected tone against user's selected tone.
  Professional → Check for formal language, passive voice (negative)
  Creative → Check for metaphors, varied sentence structure
  Friendly → Check for contractions, casual language
  Bold → Check for strong claims, exclamation marks
  Persuasive → Check for power words, emotional language
  ```
- **Score Range**: 0-100

### 5. Professionalism
- **Type**: Heuristic
- **Metrics**:
  - Grammar score (using language patterns)
  - Formal vocabulary percentage
  - Absence of slang/casual language (if Professional tone)
  - Structure and formatting
- **Score Range**: 0-100

### 6. Readability
- **Type**: Heuristic
- **Metrics**:
  - Flesch Reading Ease score (converted to 0-100 scale)
  - Line length distribution
  - Paragraph length (optimal: 3-4 sentences)
  - Bullet point usage
  - White space usage
- **Score Range**: 0-100

### 7. CTA Strength
- **Type**: Heuristic
- **Metrics**:
  - Presence of CTA (yes/no)
  - CTA specificity (vague vs. specific)
  - Urgency language markers
  - Action verbs in CTA
  - Multiple CTAs (bonus)
- **Score Range**: 0-100

### 8. Audience Fit
- **Type**: LLM
- **LLM Prompt**:
  ```
  How well does this copy fit the target audience: "[audience]"?
  Does it speak to their needs, language, values?
  Rate 0-100 on alignment.
  ```
- **Score Range**: 0-100

### 9. Differentiation
- **Type**: LLM
- **LLM Prompt**:
  ```
  How unique and differentiated is this copy?
  Does it avoid generic sales language?
  Rate 0-100 on originality.
  ```
- **Score Range**: 0-100

### 10. Emotional Impact
- **Type**: LLM
- **LLM Prompt**:
  ```
  What is the emotional impact of this copy?
  Does it resonate emotionally with the target audience?
  Desired emotion: "[desiredEmotion]"
  Rate 0-100.
  ```
- **Score Range**: 0-100

## Scoring Result Object Structure

```typescript
interface ScoringResult {
  finalScore: number,                    // Weighted average of all dimensions (0-100)
  dimensions: {
    clarity: {
      score: number,
      reasoning: string,
      type: 'llm' | 'heuristic' | 'both'
    },
    persuasiveness: {
      score: number,
      reasoning: string,
      breakdown: {
        emotionalLanguage: number,
        ctaStrength: number,
        specificity: number,
        urgency: number
      }
    },
    engagement: { score: number, reasoning: string },
    toneMatch: { score: number, reasoning: string },
    professionalism: { score: number, reasoning: string },
    readability: { score: number, reasoning: string },
    ctaStrength: { score: number, reasoning: string },
    audienceFit: { score: number, reasoning: string },
    differentiation: { score: number, reasoning: string },
    emotionalImpact: { score: number, reasoning: string }
  },
  subDimensions?: {
    persuasion: {
      hooks: number,
      painPoints: number,
      benefits: number,
      socialProof: number,
      urgency: number
    }
  },
  riskFactors?: string[],               // Things that might reduce effectiveness
  strengths?: string[],                 // What works well
  improvements?: string[],              // What could be better
  timestamp: string,
  model: string                          // Which LLM did scoring
}
```

## State Storage

**Location**: `SessionContext`

```typescript
generatedOutputCards[index].scores = ScoringResult
```

Persisted to database in:
- `/pmc_saved_outputs.output_data.scores` (if output is saved)
- `/pmc_copy_sessions.input_data` (session snapshot)

## Scoring Display in UI

**Files**: 
- `/src/components/results/ScoreCard.tsx` - Individual score display
- `/src/components/results/MultiScoreDisplay.tsx` - Multi-score visualization
- `/src/components/results/SubScoreChips.tsx` - Score breakdown chips

**Display elements**:
1. **Final Score** (large, center) - 0-100 with color coding
   - 0-39: Red (poor)
   - 40-69: Yellow (fair)
   - 70-84: Light green (good)
   - 85-100: Dark green (excellent)

2. **Dimension Bars** (radial chart or linear bars)
   - Each dimension displayed as separate bar/segment
   - Color indicates performance in that dimension

3. **Sub-dimensions** (expandable chips)
   - Persuasiveness breakdown (emotional language, CTA, etc.)
   - Shows detailed scoring rationale

4. **Risk Factors** (warnings)
   - Displayed as alert badges
   - Examples: "No CTA present", "Passive voice heavy", etc.

5. **Strengths & Improvements**
   - Bullet list of what works
   - Suggestions for improvement

## Comparison Scoring

**File**: `/src/services/api/comparativeScoring.ts`

When comparing 2+ versions:
1. Score all versions on same 10 dimensions
2. Calculate delta vs. baseline (winner highlighted)
3. Show relative performance for each dimension
4. Identify which dimension caused version to win/lose

**Output**: `ComparisonResult` structure with array of `ComparisonRow` objects

## Cost Tracking for Scoring

**File**: `/src/services/api/tokenTracking.ts`

Scoring cost tracked separately:
```typescript
const scoringData = {
  user_id: currentUser.id,
  model: 'claude-opus-4-5',        // Always Claude for scoring
  tokens_used: response.usage.total_tokens,
  cost_usd: computeScoreCost(tokens),
  billable_units: Math.ceil(cost_usd * 100),
  operation_type: 'score_output',  // Distinct from 'generate_copy'
  created_at: new Date().toISOString(),
  session_id: sessionContext.sessionId
}
```

## Credits Enforcement

Before scoring:
1. `checkUserAccess()` verifies user has credits remaining
2. If `creditsRemaining <= 0` → show `TokenLimitModal` and block scoring
3. Cost deducted from `creditsRemaining` after scoring completes
4. Next billing period resets `creditsUsed` to 0

## LLM Model Used for Scoring

- **Always Claude Opus** (`claude-opus-4-5`)
- Fallback to Claude Sonnet if Opus unavailable
- OpenAI models NOT used for scoring (Anthropic SDK preferred)

## Performance Notes

**Scoring is expensive**:
- Each output = 10 LLM calls (one per dimension, approximately)
- Typical cost: $0.02-$0.05 per scored output
- Typical tokens: 800-1500 tokens per score
- Typical duration: 3-8 seconds

**Optimization**:
- Heuristic-only scoring available (no LLM cost)
- Async scoring with progress indicator
- Batch scoring optimized for comparison scenarios
