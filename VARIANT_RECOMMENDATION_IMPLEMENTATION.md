# Purpose Writer Variant Recommendation Implementation

## Overview
Implemented a safe, minimal recommendation system for Purpose Writer (Quick Polish) variants that helps users quickly identify the best variant to use as a foundation for Copy Form.

## Implementation Date
February 11, 2026

## Changes Made

### 1. New File: `src/features/quickPolish/variantRecommendation.ts`
**Purpose:** Contains all recommendation logic (deterministic, no AI calls)

**Key Functions:**
- `selectRecommendedVariant(variants, userGoal?)` - Selects the best variant based on heuristic analysis
- `getRecommendationReason(variant)` - Returns human-readable explanation for why the variant was recommended
- `runRecommendationTests()` - Built-in test cases to validate logic

**Selection Criteria (in priority order):**
1. **Structure Analysis**: Prefers variants with both headline AND body (headline < 150 chars, body >= 50 chars)
2. **Strategic Language**: Counts strategic words (process, parameters, measure, aligned, specific, etc.) - +5 points each
3. **Vagueness Penalty**: Counts vague words (glance, core, concise, basically, simply, etc.) - -10 points each
4. **Substantive Length**: +50 points for variants >= 200 characters
5. **Refinement Bonus**: +20 points for refined variants (shows iteration)
6. **Stable Tiebreaker**: If scores are equal, prefers first variant (deterministic behavior)

**Design Principles:**
- 100% deterministic (no randomness, no AI calls)
- Consistent results for the same input
- Fast computation (< 1ms)
- No database calls or persistence

### 2. Updated File: `src/features/quickPolish/QuickPolishPage.tsx`

**Imports Added:**
```typescript
import { Award } from 'lucide-react'; // Icon for recommendation badge
import { selectRecommendedVariant, getRecommendationReason } from './variantRecommendation';
```

**State Added:**
```typescript
const [recommendedVariantIndex, setRecommendedVariantIndex] = useState<number>(0);
```

**useEffect Hook Added:**
```typescript
// Compute recommended variant whenever results change
useEffect(() => {
  if (results.length > 0) {
    const recommendedIndex = selectRecommendedVariant(results, goal);
    setRecommendedVariantIndex(recommendedIndex);
  }
}, [results, goal]);
```

**UI Changes:**
1. **Badge on Recommended Variant:**
   - Shows green Award icon + "Recommended base version" text
   - Only displayed when multiple variants exist (hidden for single variant)
   - Positioned below the variant title

2. **Recommendation Reason Box:**
   - Green-tinted callout box with "Why pick this one?" heading
   - Contains the specific reason for recommendation
   - Appears only on the recommended variant

3. **Deemphasized "Why This Version":**
   - For recommended variant: gray background instead of blue
   - For recommended variant: muted text colors
   - For non-recommended variants: unchanged (blue background, normal colors)
   - This maintains backward compatibility while highlighting the recommendation

## Safety Guarantees Met

✅ **No AI Model Calls**: All logic is deterministic heuristic analysis
✅ **No Generation Changes**: Variant generation prompt and output structure unchanged
✅ **No Routing Changes**: No new routing logic added
✅ **No Behavior Changes**: "Refine", "Copy", and "Continue in Copy Form" work exactly as before
✅ **No Session/Save Changes**: Saved outputs and sessions unchanged
✅ **No Scoring Numbers in UI**: Only shows "Recommended" badge, no numerical scores
✅ **No Ordering Changes**: Variants remain in original order
✅ **No Auto-Selection**: User still must manually select variant for "Continue in Copy Form"
✅ **Backward Compatible**: Works with existing saved outputs (recomputes on load)
✅ **Graceful Fallback**: If variants are missing fields, falls back to first variant

## User Experience

### Before
- User sees multiple variants with "Why This Version" explanations
- No guidance on which is best for Copy Form
- User must read and compare all variants manually

### After
- One variant shows green "Recommended base version" badge
- Clear reason explaining why it's recommended
- User can still choose any variant, but has intelligent guidance
- "Why This Version" text still visible but deemphasized for recommended variant

## Testing Acceptance Criteria

✅ **Generating variants works exactly as before**
✅ **Refine/Copy still works**
✅ **Continue in Copy Form uses user-selected variant (no auto-selection)**
✅ **Recommended badge appears on exactly one variant**
✅ **No crashes when variants are missing fields**
✅ **Deterministic: Same variants = same recommendation**
✅ **Build passes without errors**

## Technical Details

**Data Model:**
- `recommendedVariantIndex: number` - Local state only, not persisted
- Recomputed on every results load (including from saved sessions)
- No database schema changes required

**Performance:**
- Computation time: < 1ms for typical variant sets (1-3 variants)
- No network calls
- No additional database queries

**Accessibility:**
- Uses semantic HTML
- Color is not the only indicator (icon + text badge)
- Maintains existing keyboard navigation

## Future Enhancements (Not Implemented)
- Could add user feedback: "Was this recommendation helpful?"
- Could track which recommendations users follow vs. ignore
- Could learn from user patterns (but would require server-side logic)
- Could expose test mode to developers via URL param

## Code Quality

- **Modularity**: Recommendation logic isolated in separate file
- **Testability**: Built-in test function for validation
- **Maintainability**: Clear variable names, well-commented
- **Type Safety**: Full TypeScript typing throughout
- **No Side Effects**: Pure functions, deterministic behavior

## Files Changed Summary

| File | Lines Added | Lines Modified | Purpose |
|------|-------------|----------------|---------|
| `src/features/quickPolish/variantRecommendation.ts` | 233 | 0 | New recommendation engine |
| `src/features/quickPolish/QuickPolishPage.tsx` | ~30 | ~20 | UI integration |

**Total Impact:** Minimal, isolated change focused on UX enhancement only.
