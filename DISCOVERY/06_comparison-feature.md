# CopyZap Comparison/Blend Feature

Complete documentation of the Compare and Blend Best Version feature.

## User Perspective

1. **Select Versions**: User selects 2-5 generated copy variations via checkboxes
2. **Click Compare**: Press "Compare Selected" button
3. **View Comparison**: Side-by-side table showing:
   - All versions
   - Scores for each dimension
   - Delta (+ or -) vs. baseline
   - Winner highlighted
4. **View Details**: Click on version row to see full comparison analysis
5. **Blend Best**: Optional: Create hybrid version combining best sections

## Trigger Button

**Location**: `/src/components/results/ResultsSection.tsx`
- **Button Label**: "Compare Selected" or "Compare Versions"
- **Visibility**: Only shows if 2+ outputs selected
- **Handler**: `handleCompare()` function

## Function Call Chain

```
User clicks "Compare Selected"
  ↓
ResultsSection.handleCompare()
  ↓
/src/services/api/comprehensiveScoring.ts → generateComparisonResult()
  ↓
For each selected version:
  ├─ Score on all 10 dimensions (if not already scored)
  └─ Calculate delta vs. baseline
  ↓
Rank versions by final score
  ↓
Identify winner (highest score)
  ↓
Return ComparisonResult object
  ↓
Store in SessionContext
  ↓
Render ComparisonTable / ComprehensiveComparisonTable
```

## Input Data

```typescript
interface ComparisonRequest {
  selectedVersionIds: string[],       // IDs from generatedOutputCards
  baselineVersionId?: string,         // Version to compare against (default: first)
  dimensions?: string[]               // Which dimensions to compare (default: all 10)
}
```

## Processing Steps

### Step 1: Score All Versions

If version not already scored:
- Call comprehensive scoring pipeline
- Generate scores for all 10 dimensions
- Store scores in SessionContext

### Step 2: Calculate Deltas

For each dimension:
```typescript
delta = selectedVersionScore - baselineScore

if (delta > 5) → "Significantly Better" (green)
if (delta > 0) → "Better" (light green)
if (delta === 0) → "Equal" (gray)
if (delta < 0) → "Worse" (red)
```

### Step 3: Rank Versions

```typescript
const rankedVersions = selectedVersions.sort((a, b) => 
  b.finalScore - a.finalScore
)

const winner = rankedVersions[0]
const performanceGap = rankedVersions[0].finalScore - rankedVersions[1].finalScore
```

### Step 4: Analyze Winner

Generate winner analysis:
- Which dimensions made it win?
- Which dimensions it struggles with?
- Recommended next steps?

## Output Data

```typescript
interface ComparisonResult {
  baselineVersionId: string,
  selectedVersionIds: string[],
  timestamp: string,
  
  rows: ComparisonRow[],            // One per version
  
  winner: {
    versionId: string,
    finalScore: number,
    reasoning: string,
    strengths: string[],
    weaknesses: string[]
  },
  
  performanceGap: number,            // Score difference between top 2
  
  dimensionAnalysis: {
    [dimensionName: string]: {
      winningScore: number,
      losingScore: number,
      highVariance: boolean          // Is there big difference?
    }
  },
  
  blendRecommendation?: {
    suggestedSections: Array<{
      dimension: string,
      takeFrom: string,              // versionId
      reason: string
    }>
  }
}

interface ComparisonRow {
  versionId: string,
  content: string | StructuredCopyOutput,
  finalScore: number,
  dimensions: {
    [dimensionName: string]: {
      score: number,
      delta: number,
      deltaPercentage: number,
      improvement: 'better' | 'worse' | 'equal'
    }
  },
  rank: number,
  isWinner: boolean
}
```

## Comparison UI Display

**Files**:
- `/src/components/results/ComparisonTable.tsx` - 2-version comparison
- `/src/components/results/ComprehensiveComparisonTable.tsx` - Multi-version

**Display Elements**:

1. **Version Headers** (columns)
   - Copy preview (first 100 chars)
   - Final score (large)
   - Rank badge (#1, #2, etc.)

2. **Dimension Rows**
   - Dimension name
   - Score for each version
   - Delta indicator (↑ green, ↓ red, → gray)
   - Delta percentage

3. **Winner Card** (sticky)
   - Winner name/content
   - Winning score
   - Why it won (top 3 reasons)
   - Margin of victory

4. **Action Buttons**
   - "Blend Best Sections"
   - "Use as Final Copy"
   - "Re-score"
   - "Export Comparison"

## Blend Best Sections Feature

**Trigger**: User clicks "Blend Best Sections" button on comparison card

**Process**:
```
For each dimension in the winning version:
  ├─ Check if another version scores higher
  └─ If yes, suggest taking from that version instead

Create blend prompt:
  "Create a new version combining:
   - Problem section from Version A
   - Solution section from Version B
   - CTA from Version C
   ..."

Send to LLM for refinement/smoothing

Return new blended output

Add to generatedOutputCards[] with type = 'blended'
```

**Output**: New entry in `generatedOutputCards[]` that combines:
- Content type: `'blended'`
- Source versions: Array of source version IDs
- Blend instructions: JSON of section sources

## State Management

**Location**: `SessionContext`

```typescript
comparisonResult?: ComparisonResult,
selectedVersionsForComparison?: string[],
isComparisonOpen?: boolean
```

## Error Handling

**Scenarios**:
1. **Less than 2 versions selected** → Show info toast, disable button
2. **Scoring fails** → Show error toast, offer retry
3. **LLM call fails (blend)** → Show error, offer retry
4. **Network error** → Show error with retry option

## Credits Cost

**Comparison Cost**:
- Scoring cost: ~$0.02-$0.05 per version scored
- Blend cost: ~$0.02-$0.05 additional
- Total for 3-version comparison: ~$0.06-$0.15

Deducted before starting comparison:
```typescript
const comparisonCost = selectedVersions.length * averageScoringCost
if (creditsRemaining < comparisonCost) {
  showTokenLimitModal()
  return
}
```

## Example Comparison Flow

1. User generates 3 versions of homepage copy
2. Selects all 3 + clicks "Compare Selected"
3. System scores each version (if not already scored)
4. Displays table:
   ```
   | Dimension | V1 | V2 | V3 (WINNER) |
   | Clarity   | 75 | 82 | 88 ↑ |
   | Persuasiveness | 80 | 85 | 83 ↑ |
   | Engagement | 70 | 72 | 78 ↑ |
   ...
   ```
5. V3 highlighted as winner with score 85.2
6. User clicks "Blend Best Sections"
7. System creates hybrid: V3's clarity + V2's persuasiveness + V3's engagement
8. Returns new blended version with improved score

## Comparison vs. Batch Operations

**Comparison**: User manually selects specific versions
**Batch Operations**: Admin tool for comparing hundreds of versions automatically
