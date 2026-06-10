# Decision Layer — Example Output

Quick reference showing what the decision layer looks like in practice.

---

## Example Scenario

**User generates 3 versions**:
1. **Generated Copy 1** — business-focused, practical, includes specific examples
2. **Generated Copy 2** — conceptual, broader framing, more abstract
3. **Donald Miller's Voice** — story-led, warm tone, metaphor-heavy

**Comparative scoring results**:
- Generated Copy 1: Rank 1, Score 87
- Generated Copy 2: Rank 2, Score 79
- Donald Miller's Voice: Rank 3, Score 73

---

## Full Decision Layer Output

```json
{
  "decisionLayer": {
    "recommendedVersionId": "gen-1",
    "recommendedLabel": "Generated Copy 1",

    "recommendedUseCase": "Best choice for publishing when you want a practical, business-focused version with clear value early",

    "publishRecommendation": "Use this as the primary version if your goal is clarity, credibility, and immediate business relevance",

    "alternativeChoiceNote": "Choose Donald Miller's Voice instead if you want a softer, more story-led version for a warmer audience",

    "nextBestVersionId": "gen-2",
    "nextBestLabel": "Generated Copy 2",

    "nextImprovementAction": "Before publishing, strengthen the CTA in the final paragraph so the ending converts more clearly"
  }
}
```

---

## Field-by-Field Breakdown

### `recommendedVersionId` & `recommendedLabel`
**Value**: `"gen-1"`, `"Generated Copy 1"`
**Meaning**: The winner from the ranking
**Auto-populated**: Yes (matches `winnerVersionId`)

### `recommendedUseCase`
**Value**: `"Best choice for publishing when you want a practical, business-focused version with clear value early"`
**Answers**: "When should I use this version?"
**Tone**: Practical, specific
**Length**: 1 sentence

### `publishRecommendation`
**Value**: `"Use this as the primary version if your goal is clarity, credibility, and immediate business relevance"`
**Answers**: "Why should I publish this version?"
**Tone**: Action-oriented, decisive
**Length**: 1 sentence

### `alternativeChoiceNote`
**Value**: `"Choose Donald Miller's Voice instead if you want a softer, more story-led version for a warmer audience"`
**Answers**: "When would I NOT want to use the winner?"
**Mentions**: Specific alternative version (Donald Miller's Voice)
**Tone**: Honest, context-aware
**Length**: 1 sentence

### `nextBestVersionId` & `nextBestLabel`
**Value**: `"gen-2"`, `"Generated Copy 2"`
**Meaning**: The runner-up (rank #2)
**Auto-populated**: Yes (from ranking)
**Purpose**: Backup option if winner doesn't fit

### `nextImprovementAction`
**Value**: `"Before publishing, strengthen the CTA in the final paragraph so the ending converts more clearly"`
**Answers**: "What should I fix first before publishing?"
**Tone**: Specific, actionable
**Avoids**: Vague advice like "polish the copy" or "improve clarity"
**Length**: 1 sentence

---

## How Users Interact With This Data

### Question: "Which version should I publish?"
**Answer from**: `recommendedLabel`
→ **"Generated Copy 1"**

### Question: "Why this one specifically?"
**Answer from**: `publishRecommendation`
→ **"Use this as the primary version if your goal is clarity, credibility, and immediate business relevance"**

### Question: "When should I use it?"
**Answer from**: `recommendedUseCase`
→ **"Best choice for publishing when you want a practical, business-focused version with clear value early"**

### Question: "Are there situations where I shouldn't use it?"
**Answer from**: `alternativeChoiceNote`
→ **"Choose Donald Miller's Voice instead if you want a softer, more story-led version for a warmer audience"**

### Question: "What's my backup option?"
**Answer from**: `nextBestLabel`
→ **"Generated Copy 2"**

### Question: "What should I improve before publishing?"
**Answer from**: `nextImprovementAction`
→ **"Before publishing, strengthen the CTA in the final paragraph so the ending converts more clearly"**

---

## Tone Comparison

### ❌ BAD (AI Analysis Tone)

```json
{
  "recommendedUseCase": "This version demonstrates superior strategic positioning and clear differentiation",
  "publishRecommendation": "The recommended version exhibits higher quality across multiple dimensions",
  "alternativeChoiceNote": "Alternative versions may be considered depending on specific requirements",
  "nextImprovementAction": "Continue to refine and optimize the content for improved performance"
}
```

**Problems**:
- Sounds like AI analysis, not expert recommendation
- Generic phrases ("strategic positioning", "higher quality", "multiple dimensions")
- Not actionable ("continue to refine", "depending on requirements")
- Doesn't mention specific versions or improvements

### ✅ GOOD (Expert Editor Tone)

```json
{
  "recommendedUseCase": "Best choice for publishing when you want a practical, business-focused version with clear value early",
  "publishRecommendation": "Use this as the primary version if your goal is clarity, credibility, and immediate business relevance",
  "alternativeChoiceNote": "Choose Donald Miller's Voice instead if you want a softer, more story-led version for a warmer audience",
  "nextImprovementAction": "Before publishing, strengthen the CTA in the final paragraph so the ending converts more clearly"
}
```

**Why it works**:
- Sounds like an expert making a recommendation
- Specific about what makes each version different
- Mentions exact alternative (Donald Miller's Voice) and why
- Specific improvement (CTA in final paragraph)
- Actionable and direct

---

## More Examples

### Example 2: Email Copy

```json
{
  "recommendedVersionId": "gen-2",
  "recommendedLabel": "Generated Copy 2",
  "recommendedUseCase": "Use this when your audience responds better to curiosity-driven hooks than immediate value propositions",
  "publishRecommendation": "Publish this if you want to build intrigue before revealing the offer in the middle section",
  "alternativeChoiceNote": "Choose Original Copy if you need a more direct approach that states benefits upfront",
  "nextBestVersionId": "original",
  "nextBestLabel": "Original Copy",
  "nextImprovementAction": "Add one concrete example in paragraph 2 to support the claim about time savings"
}
```

### Example 3: Landing Page

```json
{
  "recommendedVersionId": "steve-jobs",
  "recommendedLabel": "Steve Jobs's Voice",
  "recommendedUseCase": "Best for consumer-facing landing pages where emotional impact and memorable phrasing drive conversions",
  "publishRecommendation": "Use this as primary when your brand prioritizes bold, distinctive messaging over measured business language",
  "alternativeChoiceNote": "Choose Generated Copy 1 if your buyers are B2B decision-makers who expect evidence-based claims",
  "nextBestVersionId": "gen-1",
  "nextBestLabel": "Generated Copy 1",
  "nextImprovementAction": "Replace the metaphor in the headline with a more concrete benefit statement to boost clarity"
}
```

### Example 4: Blog Post

```json
{
  "recommendedVersionId": "gen-1",
  "recommendedLabel": "Generated Copy 1",
  "recommendedUseCase": "Ideal for publishing when you need an authoritative how-to guide with step-by-step implementation details",
  "publishRecommendation": "Publish this if your readers are looking for practical guidance they can apply immediately after reading",
  "alternativeChoiceNote": "Choose Donald Miller's Voice if you're targeting readers who prefer narrative flow over instructional structure",
  "nextBestVersionId": "donald-miller",
  "nextBestLabel": "Donald Miller's Voice",
  "nextImprovementAction": "Add transition sentences between sections 2 and 3 to improve flow and reduce abruptness"
}
```

---

## Field Length Guidelines

Each field must be **max 1 sentence**. Here are length targets:

| Field | Target Length | Max Length |
|-------|--------------|-----------|
| `recommendedUseCase` | 15-20 words | 25 words |
| `publishRecommendation` | 15-20 words | 25 words |
| `alternativeChoiceNote` | 15-20 words | 25 words |
| `nextImprovementAction` | 12-18 words | 22 words |

**Why strict length limits?**
- Forces clarity and precision
- Prevents rambling AI explanations
- Makes recommendations scannable
- Ensures fast decision-making

---

## Console Output

When the decision layer is generated, you'll see:

```
[comparative-scoring] decision layer generated
[comparative-scoring] recommended: Generated Copy 1
[comparative-scoring] next best: Generated Copy 2
[comparative-scoring] use case: Best choice for publishing when you want a practical, business-focused versi...
```

This confirms:
1. Decision layer was successfully generated
2. The recommended version is identified
3. The runner-up version is identified
4. The use case field is populated (truncated at 80 chars in log)

---

## TypeScript Usage

```typescript
import { DecisionLayer } from './services/api/comparativeScoring';

// Access the decision layer from comparison result
const result = await performComparativeScoring(versions, context);

if (result.decisionLayer) {
  const decision: DecisionLayer = result.decisionLayer;

  console.log('✅ Recommended:', decision.recommendedLabel);
  console.log('📌 When to use:', decision.recommendedUseCase);
  console.log('🚀 Why publish:', decision.publishRecommendation);
  console.log('🔄 Alternative:', decision.alternativeChoiceNote);
  console.log('🎯 Improvement:', decision.nextImprovementAction);
  console.log('🥈 Runner-up:', decision.nextBestLabel);
}
```

**Type Safety**: Full TypeScript support via the `DecisionLayer` interface

---

## Summary

The decision layer provides **6 pieces of actionable information**:

1. ✅ **Which version to use** (`recommendedLabel`)
2. ✅ **When to use it** (`recommendedUseCase`)
3. ✅ **Why to publish it** (`publishRecommendation`)
4. ✅ **When to choose something else** (`alternativeChoiceNote`)
5. ✅ **What the backup option is** (`nextBestLabel`)
6. ✅ **What to improve first** (`nextImprovementAction`)

**All in 4 sentences** (max 100 words total)

**Tone**: Expert editor making a recommendation
**Style**: Practical, specific, actionable
**Goal**: Help users make confident publishing decisions
