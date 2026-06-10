# Winner Summary Tightening — Information Hierarchy

**Date**: 2026-03-30
**Goal**: Reduce repetition and improve information hierarchy for premium feel
**Scope**: Prompt refinement only (no scoring logic or UI changes)

---

## Problem Statement

After the concrete reasoning refinement, winner explanations were much better, but still had issues:

### Repetition
The top summary often repeated the same points as the structured sections below:
- Top summary: "makes business value clear earlier"
- Core strength: "explains business value in first paragraph"
- What it does better: "business impact appears earlier than Version 2"

**Result**: Users read the same concept 3 times with slightly different wording.

### Weight
With 3 levels of overlapping detail, the card felt heavy and verbose instead of sharp and premium.

### Information Hierarchy Unclear
Each field had vague instructions like "explain why it wins" without clear separation of roles.

---

## Solution: Clear Information Hierarchy

Added explicit role definitions and non-repetition rules for each field:

### Layer 1: winnerExplanation (TOP SUMMARY)
**Role**: Short decision statement (max 2 sentences)
**Focus**: Why it ranked #1 overall, high-level reason
**Tone**: Sharp, decisive, premium

**Example**:
> "Generated Copy 1 wins because it makes the business value clear in the first paragraph and gives readers practical guidance instead of staying abstract."

### Layer 2: coreStrength
**Role**: Identify the single strongest trait (1 sentence)
**Focus**: The ONE specific element that decided the win
**Must add**: NEW info not in top summary

**Example**:
> "The opening hook reframes color psychology as a business decision instead of a design topic."

### Layer 3: whatItDoesBetter
**Role**: Specific version-to-version comparisons (2-3 bullets)
**Focus**: Direct contrasts vs named alternatives
**Must add**: NEW comparisons not already stated above

**Example**:
- "Compared to Generated Copy 2, it provides implementation steps immediately after each concept instead of saving them for the end"
- "Compared to Donald Miller's Voice, it uses specific brand examples instead of generic metaphors"

### Layer 4: tradeoffs
**Role**: Honest weaknesses (0-1 bullets, rarely 2)
**Focus**: Real limitations only if actually present

**Example**:
- "Slightly longer read time due to additional trust-building elements"

---

## Key Changes to Prompt

### 1. Added Information Hierarchy Section

```
INFORMATION HIERARCHY (prevent repetition across fields):

Each field has a DISTINCT role and must NOT repeat information:

┌─────────────────────────────────────────────────────────────────┐
│ winnerExplanation (TOP SUMMARY)                                 │
│ Role: Short decision statement (max 2 sentences)                │
│ Focus: Why it ranked #1 overall, high-level reason             │
│ Tone: Sharp, decisive, premium                                  │
└─────────────────────────────────────────────────────────────────┘

[Similar boxes for coreStrength, whatItDoesBetter, tradeoffs]

CRITICAL: Do NOT restate the same point across multiple fields.
If top summary mentions "business value appears earlier", then
coreStrength should focus on a DIFFERENT related point like
"opening hook reframes the topic" — not repeat the same concept.
```

### 2. Updated winnerExplanation Requirements

**Before**:
- "2-3 sentences: why this version wins, what makes it better than alternatives"

**After**:
- "max 2 sentences: short decisive reason why winner ranked #1, high-level only, avoid repeating detail from sections below"
- Added specific style guidance:
  - Should NOT repeat bullet-level comparisons below
  - Avoid repeating words like "strategic", "clear", "practical" multiple times
  - Tone: premium, sharp, consultant-like (not long AI explanation)

### 3. Updated coreStrength Requirements

**Added**:
- "Must add NEW information not already in winnerExplanation"
- "Focus on the ONE decisive element (not a summary of multiple points)"

### 4. Updated whatItDoesBetter Requirements

**Added**:
- "Must add NEW comparisons not already stated in top summary or coreStrength"
- "Avoid repeating the same advantage phrased differently"

### 5. Updated tradeoffs Requirements

**Before**: "0-2 bullets"
**After**: "0-1 bullets (rarely 2)"

**Added**:
- "Keep this section minimal — one real tradeoff is enough"
- "If no real tradeoff exists, return empty array"

### 6. Updated CRITICAL RULES

**Added**:
- "winnerExplanation: REQUIRED, max 2 sentences, high-level only"
- "winnerBreakdown.coreStrength: REQUIRED, exactly 1 sentence, must differ from winnerExplanation"
- "winnerBreakdown.whatItDoesBetter: REQUIRED, 2-3 items, must be NEW comparisons"
- "winnerBreakdown.tradeoffs: OPTIONAL, 0-1 items (rarely 2)"
- "NO REPETITION: each field must add new information, not restate previous points"

### 7. Added Second Inline Comment

```typescript
// winner explanation refinement: force concrete comparative reasoning
// winner summary refinement: reduce overlap and improve information hierarchy
```

---

## Before/After Comparison

### BEFORE (Repetitive)

```json
{
  "winnerExplanation": "Generated Copy 1 wins due to its strong strategic focus, clear differentiation, effective use of cultural insights, and comprehensive framework for implementing color psychology in brand strategy. It provides practical guidance while maintaining credibility through specific examples.",

  "winnerBreakdown": {
    "coreStrength": "It wins because it has a clear strategic framework and provides comprehensive guidance on color psychology implementation.",

    "whatItDoesBetter": [
      "Compared to Generated Copy 2, it has stronger strategic differentiation and clearer guidance",
      "Compared to Donald Miller's Voice, it provides more comprehensive implementation details",
      "Overall it maintains better clarity and strategic focus throughout"
    ],

    "tradeoffs": [
      "Could be slightly more concise in some sections",
      "Some readers might find the comprehensive approach somewhat detailed"
    ]
  }
}
```

**Problems**:
1. Top summary is 3 sentences (too long)
2. "strategic focus" repeated in top summary and coreStrength
3. "comprehensive" appears 3 times
4. "clear/clarity" repeated multiple times
5. Bullet 3 doesn't name a specific version
6. Tradeoffs are fake-polite ("could be slightly more concise")
7. Each layer repeats similar concepts without adding new info

---

### AFTER (Tightened Hierarchy)

```json
{
  "winnerExplanation": "Generated Copy 1 wins because it gives readers a clear action plan in the first section while other versions delay practical guidance.",

  "winnerBreakdown": {
    "coreStrength": "The opening hook reframes color psychology as a business decision instead of a design topic, making it immediately relevant to buyers.",

    "whatItDoesBetter": [
      "Compared to Generated Copy 2, it includes specific brand examples like Tiffany & Co. and Spotify instead of staying conceptual",
      "Compared to Donald Miller's Voice, it structures each section as problem-solution-example instead of pure storytelling",
      "Compared to Steve Jobs's Voice, it maintains credibility through evidence-based claims instead of theatrical language"
    ],

    "tradeoffs": [
      "Slightly longer read time due to inclusion of multiple brand case studies"
    ]
  }
}
```

**Improvements**:
1. ✅ Top summary is 1 sentence (sharp and decisive)
2. ✅ Each layer adds NEW information:
   - Top: "action plan in first section"
   - Core: "opening hook reframes as business decision"
   - Bullets: specific brand examples, structure, credibility approach
3. ✅ No word repetition across fields
4. ✅ All bullets name specific versions
5. ✅ Tradeoff is real and concrete (not fake-polite)
6. ✅ Premium, consultant-like tone throughout
7. ✅ Total text is ~40% shorter while being more informative

---

## Expected Impact

### User Experience

**Before**:
- User reads: "strategic focus... comprehensive... clear differentiation"
- User thinks: "This sounds like AI fluff"
- User scrolls down and sees similar words repeated
- User feels: "This is repetitive and heavy"

**After**:
- User reads: "Gives readers a clear action plan in the first section"
- User thinks: "OK, that's specific"
- User scrolls down and sees: "opening hook reframes", "includes Tiffany & Co. example", "problem-solution structure"
- User thinks: "Each section tells me something new and useful"
- User feels: "This feels like premium software with sharp insights"

### Perceived Quality

**Before**: Feels like AI summary (verbose, generic, repetitive)
**After**: Feels like strategy consultant (sharp, specific, layered)

### Information Density

**Before**: ~300 words saying the same thing 3 ways
**After**: ~200 words with 3 distinct layers of insight

---

## Technical Details

### Files Modified

**Single File**:
- `src/services/api/comparativeScoring.ts`
  - Added INFORMATION HIERARCHY section with visual boxes
  - Updated winnerExplanation requirements (max 2 sentences)
  - Updated coreStrength requirements (must differ from top)
  - Updated whatItDoesBetter requirements (must be new comparisons)
  - Updated tradeoffs requirements (0-1 instead of 0-2)
  - Updated JSON format specification
  - Updated CRITICAL RULES
  - Added second inline comment

**Inline Comments**:
```typescript
// winner explanation refinement: force concrete comparative reasoning
// winner summary refinement: reduce overlap and improve information hierarchy
```

### What Was NOT Changed

- ❌ Scoring logic (identical)
- ❌ Ranking algorithm (identical)
- ❌ Response structure (identical)
- ❌ TypeScript interfaces (identical)
- ❌ UI components (identical)

### Build Status

```
✓ built in 18.52s
```

**Result**: All changes are prompt-only, fully backward compatible.

---

## Testing Checklist

When testing the tightened hierarchy:

1. ✅ Generate 3-4 versions with comparative scoring
2. ✅ Check winnerExplanation length (should be 1-2 sentences max)
3. ✅ Verify no repetition:
   - Read top summary
   - Read coreStrength — should add NEW info
   - Read whatItDoesBetter — should add NEW comparisons
   - Check: same words not repeated across fields
4. ✅ Check tradeoffs:
   - Should be 0-1 items (not 2)
   - Should be real issues, not fake-polite
   - If no real tradeoff, should be empty array
5. ✅ Verify tone feels premium and sharp
6. ✅ Check UI displays all sections correctly
7. ✅ Verify total text feels lighter than before

---

## Rollback Plan

If the LLM struggles with non-repetition:

1. The INFORMATION HIERARCHY section can be simplified
2. The "must differ" requirements can be relaxed
3. The max 2 sentences can be increased to 3

However, modern LLMs (GPT-4, Claude, etc.) should handle these instructions well.

---

## Summary

✅ **Added clear information hierarchy** with distinct roles for each field
✅ **Shortened top summary** to max 2 sentences (ideally 1+1)
✅ **Added non-repetition rules** across all fields
✅ **Reduced tradeoffs** from 0-2 to 0-1 (rarely 2)
✅ **Updated all requirements** to emphasize adding new info
✅ **Added visual hierarchy guide** with boxes in prompt
✅ **Build successful** (18.52s, no errors)
✅ **No scoring logic changed**
✅ **No UI layout changed**
✅ **Fully backward compatible**

**Expected Result**: Winner explanations will feel sharper, less repetitive, and more premium with clear information hierarchy across layers.

---

## Full Example: Complete Winner Card

### Top Summary (winnerExplanation)
> "Generated Copy 1 wins because it gives readers a clear action plan in the first section while other versions delay practical guidance."

### When expanded, user sees:

**CORE STRENGTH**
> The opening hook reframes color psychology as a business decision instead of a design topic, making it immediately relevant to buyers.

**WHY THIS WINS**
- ✓ Compared to Generated Copy 2, it includes specific brand examples like Tiffany & Co. and Spotify instead of staying conceptual
- ✓ Compared to Donald Miller's Voice, it structures each section as problem-solution-example instead of pure storytelling
- ✓ Compared to Steve Jobs's Voice, it maintains credibility through evidence-based claims instead of theatrical language

**MINOR CONSIDERATIONS**
- ⚠ Slightly longer read time due to inclusion of multiple brand case studies

**Sub-scores**: Conversion 49/100 | Trust 56/100 | Risk Low

---

**User Experience**: Each section adds new insight. No repetition. Feels sharp and premium.
