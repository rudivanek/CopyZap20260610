# Quick Start: Testing Scoring Validation

## Enable Trace (One-time Setup)

1. Open your browser and go to https://copyzap.app
2. Open the browser console (F12 or Cmd+Option+I)
3. Run this command:

```javascript
localStorage.setItem('copyzap_scoreTrace', '1')
```

4. Refresh the page

**To disable later:**
```javascript
localStorage.removeItem('copyzap_scoreTrace')
```

## Run a Test

### Option 1: Quick Test with Existing Session

1. Go to Dashboard
2. Click on any saved session with multiple variants
3. Click "Score" button
4. **Check console for POST-FIX VALIDATION report**

### Option 2: Generate New Test Content

1. Go to Copy Maker
2. Enter test content:
   - **What you're creating**: Product description
   - **Target Audience**: Tech-savvy millennials
   - **Original Copy**: Paste ~100 words of marketing copy
3. Click "Generate Copy" (generates 2 variants)
4. Click "Apply Voice Style" → Choose "Alex Hormozi's Voice"
5. Click "Score" button
6. **Check console for POST-FIX VALIDATION report**

## What You Should See

```
📊 [POST-FIX VALIDATION] Scoring Quality Audit for run-1774899805675-oudt
═══════════════════════════════════════════════════════════════

📋 DETAILED SCORE BREAKDOWN:
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ Version           │ Conv │ Trust│ Risk  │ Base │ Tie │ Final│ Adj │ Display│ Fallback │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ Original Copy     │   65 │    70│ Medium│   72 │   1 │    73│  +2 │     75 │ NO       │
│ Generated Copy 1  │   78 │    81│ Low   │   79 │   2 │    81│  +1 │     82 │ NO       │
│ Generated Copy 2  │   62 │    68│ Medium│   68 │   0 │    68│  -3 │     65 │ NO       │
│ Alex Hormozi's... │   70 │    75│ Low   │   74 │   1 │    75│  +2 │     77 │ NO       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

🔍 PROBLEM ANALYSIS:
   Fallback Rate: 0/4 (0.0%)
   Display Score Spread: 17 points (82 → 65)
   Internal Score Spread: 17.00 points (before rounding)
   Max LLM Adjustment: ±3 points
   Clustered Pairs: 1/3 (within 2 points)

📊 DISCRIMINATION CHECK:
   Can distinguish original vs generated: YES
   Can distinguish voice-styled variants: YES
   Original vs Generated separation: 7.0 points

🎯 ROOT CAUSE DIAGNOSIS:
   ✅ NO MAJOR ISSUES DETECTED - Scoring appears healthy

💡 RECOMMENDATIONS:
   ✅ System is functioning well - consider A/B testing with users

═══════════════════════════════════════════════════════════════
```

## What to Check

### ✅ Success Indicators

- **Fallback Rate**: 0%
- **Display Score Spread**: ≥10 points
- **Clustered Pairs**: <50%
- **Discrimination**: Clear separation between categories

### ⚠️ Warning Signs

- **Fallback Rate > 0%**: Some versions failed to parse
- **Display Score Spread < 5 points**: Severe compression
- **Clustered Pairs > 50%**: Scores too close together
- **No category separation**: Can't distinguish different types

## Interpreting Results

### Scenario 1: Scoring Healthy ✅

```
🎯 ROOT CAUSE DIAGNOSIS:
   ✅ NO MAJOR ISSUES DETECTED

💡 RECOMMENDATIONS:
   ✅ System is functioning well
```

**Action**: The bug fixes worked! No further changes needed.

### Scenario 2: Score Compression Persists ⚠️

```
🎯 ROOT CAUSE DIAGNOSIS:
   ⚠️  ISSUES FOUND:
      1. b) SEVERE SCORE COMPRESSION: Only 4 point spread
      2. e) HEURISTIC GRANULARITY TOO LOW: Base scores vary by 3 points

💡 RECOMMENDATIONS:
   2. [HIGH] Increase heuristic score granularity
```

**Action**: The bug fixes helped, but heuristics need more sensitivity. See detailed guide.

### Scenario 3: Fallbacks Still Occurring ❌

```
🎯 ROOT CAUSE DIAGNOSIS:
   ⚠️  ISSUES FOUND:
      1. a) FALLBACK CONTAMINATION: 2 version(s) using fallback score (78)

💡 RECOMMENDATIONS:
   1. [CRITICAL] Fix remaining parse errors causing fallback
```

**Action**: Check for OpenAI moderation refusals or JSON parsing issues.

## Common Issues

### Issue: No Output in Console

**Cause**: Trace not enabled
**Fix**: Run `localStorage.setItem('copyzap_scoreTrace', '1')` and refresh

### Issue: All Scores Show 78

**Cause**: Fallback triggered (parse error or OpenAI refusal)
**Fix**: Check previous console errors for "Parse/score error"

### Issue: Scores Too Close (75-78 range)

**Cause**: Heuristic scores too similar
**Fix**: This is the remaining compression problem - see detailed guide

## Next Steps

1. **Test with 3-4 different content types** (original, generated, voice-styled, shortened)
2. **Take screenshots of validation reports**
3. **Share results** with development team
4. **Follow prioritized recommendations** from the report

## Advanced: Accessing Full Trace

```javascript
// Get all trace data
window.__copyzapScoreTrace

// Filter by specific run
const runId = 'run-1774899805675-oudt'; // Copy from console output
window.__copyzapScoreTrace.filter(e => e.runId === runId)

// Export to JSON
console.log(JSON.stringify(window.__copyzapScoreTrace, null, 2))
```

## Need Help?

If validation results are unclear:
1. Copy the entire POST-FIX VALIDATION section from console
2. Include the scores from the UI
3. Describe what you expected vs what you got
4. Share with the development team

---

**Last Updated**: 2026-03-30
