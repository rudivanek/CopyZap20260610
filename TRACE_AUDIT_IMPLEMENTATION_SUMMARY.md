# Score Trace Audit Implementation Summary

## Task Completed

**Objective:** Instrument the scoring pipeline to verify whether each variant is evaluated independently or if results are being reused/shared.

**Status:** ✅ **COMPLETE** — Full trace system operational

---

## What Was Implemented

### 1. Per-Variant Trace System
Every scored variant now generates a complete trace entry tracking:
- Execution flow (entered function, LLM call attempted)
- Parse success/failure and repair attempts
- Fallback detection with reasons
- Score data (conversion, trust, risk, base, adjustment, final)
- Narrative generation (insight/action hashes)

### 2. Run-Level Tracking
Each comparison run gets a unique ID linking all variant traces together, making it easy to analyze one complete run.

### 3. Debug Console Logs
Real-time console output showing:
- Run start/completion
- Per-variant summary (LLM called, parse OK, fallback, score, hashes)
- Run summary (parse rate, fallback count, hash uniqueness, score spread)

### 4. Global Trace Storage
All traces stored in `window.__copyzapScoreTrace` for programmatic analysis.

### 5. Opt-In Design
Gated behind localStorage flag — zero overhead when disabled.

---

## Files Modified

### `src/services/api/comprehensiveScoring.ts`
**Lines Added:** ~250 lines
**Sections Modified:**
1. **Top of file:** Trace helper functions (isTraceEnabled, simpleHash, logTrace, etc.)
2. **scoreVersion function:**
   - Added trace entry initialization at start
   - Updated after LLM call
   - Updated after parse success/failure
   - Updated after repair attempt
   - Finalized before return (success and fallback cases)
3. **scoreAndCompareVersions function:**
   - Generate run ID at start
   - Pass run ID and index to each scoreVersion call
   - Log run completion after all variants scored

**Key Features:**
- **No permanent noise:** Only logs when enabled
- **No functional changes:** Scoring logic untouched
- **Type-safe:** Full TypeScript interfaces
- **Zero performance impact when disabled**

---

## How to Use

### Enable Tracing
```javascript
localStorage.setItem('copyzap_scoreTrace', '1')
// Refresh page
```

### Run Comparison
Generate 3-4 variants → Click "Compare"

### Check Results
**Console output:**
```
🔍 [SCORE TRACE] Run run-1234567890-abc started
🔍 [SCORE TRACE] Scoring 3 version(s)
🔍 [SCORE TRACE] Generated Copy 1 (abc12345): { llmCalled: true, parseOK: true, ... }
🔍 [SCORE TRACE] Run run-1234567890-abc completed: { totalVersions: 3, fallbacks: 0 }
```

**Programmatic access:**
```javascript
window.__copyzapScoreTrace
```

### Disable Tracing
```javascript
localStorage.removeItem('copyzap_scoreTrace')
```

---

## Diagnostic Capabilities

The trace system can detect:

### ✅ **Independent Scoring** (Healthy)
- Each variant calls LLM
- Each variant parses successfully
- Each variant gets unique insight/action text
- Each variant gets unique content hash
→ **Any identical scores are due to calibration, not bugs**

### ❌ **Shared Narrative Bug**
- Multiple variants share same `insightHash`
- Multiple variants share same `actionHash`
→ **Objects are being reused by reference**

### ❌ **Loop Execution Bug**
- Some variants have `llmCallAttempted: false`
→ **Loop is not awaiting all variants**

### ❌ **Parse Failure Cascade**
- Multiple variants have `parseSuccess: false`
- All failed variants triggered fallback
→ **LLM response format issue or parsing logic bug**

### ⚠️ **Score Compression** (Not a Bug)
- All execution flags healthy
- All narratives unique
- But score spread < 5 points
→ **Calibration issue in scoring rubric, not code bug**

---

## What Happens Next

### You Need To:
1. **Enable tracing** in your browser
2. **Run a comparison** with 3-4 variants
3. **Run the diagnostic script** (in `TRACE_AUDIT_QUICK_START.md`)
4. **Share the results** with me

### I Will:
1. Analyze the trace data
2. Determine if it's a code bug or calibration issue
3. Identify the exact failure point
4. Recommend the fix

---

## Expected Outcomes

### Scenario A: Code Bug Found
**If shared narratives detected:**
- Root cause: Object reuse by reference
- Fix: Clone objects for each variant
- Location: Where insight/action are created

**If loop execution failure:**
- Root cause: Async/await issue or conditional skip
- Fix: Verify Promise.all awaits all variants
- Location: scoreAndCompareVersions loop

**If parse failures:**
- Root cause: LLM response format or parser
- Fix: Adjust prompt or parser logic
- Location: scoreVersion try/catch block

### Scenario B: Calibration Issue (No Code Bug)
**If all execution healthy but scores compressed:**
- Root cause: Scoring rubric too conservative
- Fix: Adjust dimension weights or rubric instructions
- Location: Prompt instructions in scoreVersion

---

## Trace Data Sample

```json
{
  "runId": "run-1234567890-abc",
  "versionId": "v123",
  "optionLabel": "Generated Copy 1",
  "index": 0,
  "contentHash": "a1b2c3d4",
  "enteredScoreVersion": true,
  "llmCallAttempted": true,
  "rawModelUsed": "gpt-4o",
  "parseSuccess": true,
  "repairRetryAttempted": false,
  "repairRetrySuccess": false,
  "fallbackTriggered": false,
  "fallbackReason": null,
  "conversionScore": 85,
  "trustScore": 78,
  "riskLevel": "Low",
  "baseScoreCore": 81.5,
  "tieBreaker": 1.2,
  "baseFinalScore": 82.7,
  "adjustment": 3,
  "adjustedFinalScore": 85.7,
  "displayedScore": 86,
  "narrativeGenerated": true,
  "insightHash": "f3a2b1c4",
  "actionHash": "9d8e7f6a",
  "timestamp": 1234567890123
}
```

---

## Performance Impact

### When Disabled (Default)
- **Zero overhead:** All trace functions short-circuit at first check
- **No logs:** Console stays clean
- **No storage:** window.__copyzapScoreTrace undefined

### When Enabled
- **Minimal overhead:** Simple hashing and logging only
- **No LLM calls:** Trace doesn't call any external APIs
- **Bounded storage:** One entry per variant per run

---

## Rollback Instructions

If trace system needs to be removed:

1. Search for `// SCORE TRACE AUDIT:` comments
2. Remove all marked sections
3. Remove trace helper functions at top of file
4. Remove `__traceRunId` and `__traceIndex` params
5. Rebuild: `npm run build`

---

## Documentation Files

1. **SCORE_TRACE_AUDIT_GUIDE.md** — Complete diagnostic guide
2. **TRACE_AUDIT_QUICK_START.md** — 30-second quick start
3. **TRACE_AUDIT_IMPLEMENTATION_SUMMARY.md** — This file

---

## Ready to Run

The instrumentation is **live and operational**.

**Next step:** You run the trace and share results. I'll diagnose the root cause.
