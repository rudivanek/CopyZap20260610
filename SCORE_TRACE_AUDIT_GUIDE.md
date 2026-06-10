# Score Trace Audit System — Diagnostic Guide

## Purpose

This trace system diagnoses whether the scoring engine evaluates each variant independently or reuses/falls back to shared results.

**Suspected Issues:**
- Materially different variants end up with the same final score
- Repeated sub-scores appear across different versions
- Repeated insight text appears across multiple cards
- Some versions show "Narrative analysis was not generated for this version"

**Hypothesis:** The scoring engine may be evaluating only one variant and then reusing/defaulting results for the others.

## Quick Start (30 seconds)

### 1. Enable Tracing
```javascript
// Open browser console (F12) and run:
localStorage.setItem('copyzap_scoreTrace', '1')
```

Then refresh the page.

### 2. Run a Comparison
- Generate 3-4 copy variants
- Click "Compare" to run scoring
- Wait for completion

### 3. Check Results
Look for console logs marked with 🔍:
```
🔍 [SCORE TRACE] Run run-1234567890-abc started
🔍 [SCORE TRACE] Scoring 3 version(s)
🔍 [SCORE TRACE] Generated Copy 1 (abc12345): { llmCalled: true, parseOK: true, ... }
🔍 [SCORE TRACE] Original Copy (def67890): { llmCalled: true, parseOK: true, ... }
🔍 [SCORE TRACE] Run run-1234567890-abc completed: { totalVersions: 3, ... }
```

### 4. Access Full Trace Data
```javascript
// In console:
window.__copyzapScoreTrace
```

### 5. Disable Tracing
```javascript
localStorage.removeItem('copyzap_scoreTrace')
```

---

## What Gets Traced

Each variant gets a complete trace entry with:

### Identification
- `runId` — unique ID for this comparison run
- `versionId` — database ID
- `optionLabel` — display name (e.g., "Generated Copy 1")
- `index` — position in scoring order (0, 1, 2...)
- `contentHash` — fingerprint of content text

### Execution Tracking
- `enteredScoreVersion` — did the function start?
- `llmCallAttempted` — was LLM scoring call made?
- `rawModelUsed` — which model (e.g., "gpt-4o")

### Parse/Repair Tracking
- `parseSuccess` — did JSON parse succeed?
- `repairRetryAttempted` — was repair attempted?
- `repairRetrySuccess` — did repair succeed?

### Fallback Detection
- `fallbackTriggered` — did it fall back to default?
- `fallbackReason` — why? (e.g., "Parse and repair both failed")

### Score Data
- `conversionScore` — conversion heuristic (0-100)
- `trustScore` — trust heuristic (0-100)
- `riskLevel` — Low/Medium/High
- `baseScoreCore` — core score before adjustment
- `tieBreaker` — tie-breaking component
- `baseFinalScore` — final score before LLM adjustment
- `adjustment` — LLM adjustment (-10 to +10)
- `adjustedFinalScore` — final score after adjustment
- `displayedScore` — rounded display score

### Narrative Tracking
- `narrativeGenerated` — were insight/action generated?
- `insightHash` — hash of insight text
- `actionHash` — hash of action text

---

## Diagnostic Checks

### Check 1: All Variants Entered Scoring Loop?
```javascript
const trace = window.__copyzapScoreTrace.filter(e => e.runId === 'run-XXX');
trace.every(e => e.enteredScoreVersion) // Should be true
```

### Check 2: All Variants Attempted LLM Call?
```javascript
trace.every(e => e.llmCallAttempted) // Should be true
```

If `false` → **Bug: loop execution failure or conditional skip**

### Check 3: All Variants Parsed Successfully?
```javascript
trace.filter(e => e.parseSuccess).length === trace.length
```

If not all parsed → check fallback reasons:
```javascript
trace.filter(e => !e.parseSuccess).map(e => ({
  label: e.optionLabel,
  reason: e.fallbackReason
}))
```

### Check 4: Unique Content Hashes?
```javascript
const contentHashes = trace.map(e => e.contentHash);
new Set(contentHashes).size === contentHashes.length
```

If `false` → **Bug: same content evaluated multiple times**

### Check 5: Unique Insight Hashes?
```javascript
const insightHashes = trace.map(e => e.insightHash);
new Set(insightHashes).size === insightHashes.length
```

If `false` → **Bug: shared insight/recommendation text (object reuse)**

### Check 6: Unique Action Hashes?
```javascript
const actionHashes = trace.map(e => e.actionHash);
new Set(actionHashes).size === actionHashes.length
```

If `false` → **Bug: shared action text (object reuse)**

### Check 7: Score Spread
```javascript
const scores = trace.map(e => e.displayedScore);
Math.max(...scores) - Math.min(...scores)
```

If spread < 5 → **Potential calibration issue** (not a code bug)

---

## Automated Diagnostic Script

Run this in console after a comparison:

```javascript
// Get most recent run
const allTrace = window.__copyzapScoreTrace || [];
const latestRunId = allTrace[allTrace.length - 1]?.runId;
const trace = allTrace.filter(e => e.runId === latestRunId);

console.log('=== SCORE TRACE AUDIT RESULTS ===');
console.log('Run ID:', latestRunId);
console.log('Total Variants:', trace.length);
console.log('');

// Test 1: Loop Execution
console.log('✓ Test 1: Loop Execution');
console.log('  All entered scoreVersion:', trace.every(e => e.enteredScoreVersion));
console.log('  All attempted LLM call:', trace.every(e => e.llmCallAttempted));
console.log('');

// Test 2: Parse Success
console.log('✓ Test 2: Parse Success');
console.log('  Parsed successfully:', trace.filter(e => e.parseSuccess).length, '/', trace.length);
console.log('  Repair retries:', trace.filter(e => e.repairRetryAttempted).length);
console.log('  Repair successes:', trace.filter(e => e.repairRetrySuccess).length);
console.log('  Fallbacks:', trace.filter(e => e.fallbackTriggered).length);
console.log('');

// Test 3: Unique Content
console.log('✓ Test 3: Unique Content');
const contentHashes = trace.map(e => e.contentHash);
console.log('  Unique content hashes:', new Set(contentHashes).size, '/', contentHashes.length);
console.log('');

// Test 4: Unique Narratives
console.log('✓ Test 4: Unique Narratives');
const insightHashes = trace.map(e => e.insightHash);
const actionHashes = trace.map(e => e.actionHash);
console.log('  Unique insights:', new Set(insightHashes).size, '/', insightHashes.length);
console.log('  Unique actions:', new Set(actionHashes).size, '/', actionHashes.length);
console.log('  Insight hashes:', insightHashes);
console.log('  Action hashes:', actionHashes);
console.log('');

// Test 5: Score Distribution
console.log('✓ Test 5: Score Distribution');
const scores = trace.map(e => e.displayedScore);
console.log('  Scores:', scores);
console.log('  Min:', Math.min(...scores));
console.log('  Max:', Math.max(...scores));
console.log('  Spread:', Math.max(...scores) - Math.min(...scores));
console.log('  Unique scores:', new Set(scores).size);
console.log('');

// Diagnosis
console.log('=== DIAGNOSIS ===');
const allLLMCalled = trace.every(e => e.llmCallAttempted);
const allParsed = trace.every(e => e.parseSuccess);
const uniqueInsights = new Set(insightHashes).size === trace.length;
const uniqueContent = new Set(contentHashes).size === trace.length;

if (allLLMCalled && allParsed && uniqueInsights && uniqueContent) {
  console.log('✅ HEALTHY: All variants scored independently');
  console.log('   Each variant called LLM, parsed successfully, got unique narratives');
  if (Math.max(...scores) - Math.min(...scores) < 5) {
    console.log('   ⚠️  Score compression detected (spread < 5 points)');
    console.log('   → This is a CALIBRATION issue, not a code bug');
  }
} else if (!uniqueInsights) {
  console.log('❌ BUG: Shared narrative text detected');
  console.log('   → Insight/action objects may be reused by reference');
} else if (!allLLMCalled) {
  console.log('❌ BUG: Some variants skipped LLM call');
  console.log('   → Loop execution or conditional logic error');
} else {
  console.log('⚠️  MIXED: Some variants fell back, others OK');
  console.log('   → Check fallback reasons for parse errors');
  trace.filter(e => e.fallbackTriggered).forEach(e => {
    console.log('   ', e.optionLabel, ':', e.fallbackReason);
  });
}

console.log('');
console.log('Full trace available at: window.__copyzapScoreTrace');
console.table(trace.map(e => ({
  Label: e.optionLabel,
  LLM: e.llmCallAttempted ? '✓' : '✗',
  Parse: e.parseSuccess ? '✓' : '✗',
  Fallback: e.fallbackTriggered ? '✓' : '✗',
  Score: e.displayedScore,
  InsightHash: e.insightHash.slice(0, 6),
})));
```

---

## What Each Bug Type Looks Like

### Bug Type 1: Loop Execution Failure
**Symptoms:**
- Some variants have `llmCallAttempted: false`
- Some variants have `enteredScoreVersion: false`

**Root Cause:** Loop is not awaiting each variant independently, or conditional logic skips some variants.

**Evidence:**
```javascript
trace.filter(e => !e.llmCallAttempted)
// → Shows which variants were skipped
```

---

### Bug Type 2: Shared Fallback/State Reuse
**Symptoms:**
- Multiple variants have identical `insightHash`
- Multiple variants have identical `actionHash`
- Parse succeeded but narratives are duplicated

**Root Cause:** Insight/action objects are reused by reference across variants instead of being cloned.

**Evidence:**
```javascript
const insightHashes = trace.map(e => e.insightHash);
new Set(insightHashes).size < insightHashes.length
// → true means duplicates exist
```

---

### Bug Type 3: Parse Failures Leading to Shared Fallback
**Symptoms:**
- Most variants have `parseSuccess: false`
- All failed variants have same fallback values
- `fallbackTriggered: true` for multiple variants

**Root Cause:** JSON parsing fails, repair fails, then all fall back to shared default object.

**Evidence:**
```javascript
trace.filter(e => e.fallbackTriggered).map(e => e.fallbackReason)
// → Shows why each fallback occurred
```

---

### Bug Type 4: Score Compression (NOT a code bug)
**Symptoms:**
- All variants have different `insightHash` and `actionHash`
- All variants have `parseSuccess: true`
- But final scores are within 1-3 points of each other

**Root Cause:** This is a **calibration issue** in the scoring rubric, not a code execution bug.

**Evidence:**
```javascript
const spread = Math.max(...scores) - Math.min(...scores);
spread < 5 // → Calibration issue, not bug
```

---

## Export Trace for Analysis

```javascript
// Export trace as JSON
const runId = 'run-XXX'; // Replace with actual run ID
const trace = window.__copyzapScoreTrace.filter(e => e.runId === runId);
console.log(JSON.stringify(trace, null, 2));

// Or copy to clipboard
copy(JSON.stringify(trace, null, 2));
```

---

## Trace Data Structure

```typescript
interface VariantTraceEntry {
  // Identification
  runId: string;
  versionId: string;
  optionLabel: string;
  index: number;
  contentHash: string;

  // Execution flags
  enteredScoreVersion: boolean;
  llmCallAttempted: boolean;
  rawModelUsed: string;

  // Parse/repair tracking
  parseSuccess: boolean;
  repairRetryAttempted: boolean;
  repairRetrySuccess: boolean;

  // Fallback detection
  fallbackTriggered: boolean;
  fallbackReason: string | null;

  // Score data
  conversionScore: number | null;
  trustScore: number | null;
  riskLevel: string | null;
  baseScoreCore: number | null;
  tieBreaker: number | null;
  baseFinalScore: number | null;
  adjustment: number | null;
  adjustedFinalScore: number | null;
  displayedScore: number | null;

  // Narrative tracking
  narrativeGenerated: boolean;
  insightHash: string;
  actionHash: string;

  // Timestamp
  timestamp: number;
}
```

---

## Next Steps After Diagnosis

### If Bug Found: Shared Narrative Text
1. Search for where `insight` and `action` are created
2. Check if objects are reused by reference
3. Ensure each version gets its own object (deep clone if needed)

### If Bug Found: Loop Execution Failure
1. Check `scoreAndCompareVersions` function
2. Verify `Promise.all` is awaiting all variants
3. Check for conditional logic that might skip variants

### If Bug Found: Parse Failures
1. Review LLM prompt format
2. Check JSON parsing logic
3. Verify repair logic works correctly

### If Calibration Issue (No Code Bug)
1. Review scoring rubric weights
2. Adjust dimension weights for more separation
3. Review prompt instructions for score spread enforcement

---

## Files Modified

- `src/services/api/comprehensiveScoring.ts` — Added complete trace instrumentation

## Rollback Instructions

If trace system needs to be removed:

1. Remove all code marked with `// SCORE TRACE AUDIT:`
2. Remove the trace helper functions at the top of the file
3. Remove `__traceRunId` and `__traceIndex` parameters from `scoreVersion`
4. Rebuild: `npm run build`
