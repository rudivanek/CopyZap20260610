# Score Trace Audit — Quick Start

## 30-Second Setup

### 1. Enable
```javascript
localStorage.setItem('copyzap_scoreTrace', '1')
// Then refresh page
```

### 2. Run Comparison
Generate 3-4 variants → Click "Compare"

### 3. Check Console
Look for 🔍 logs showing each variant's execution

### 4. Run Diagnostic
```javascript
// Copy/paste this entire block into console:
const allTrace = window.__copyzapScoreTrace || [];
const latestRunId = allTrace[allTrace.length - 1]?.runId;
const trace = allTrace.filter(e => e.runId === latestRunId);

console.log('=== QUICK DIAGNOSIS ===');
console.log('Variants:', trace.length);
console.log('All called LLM:', trace.every(e => e.llmCallAttempted));
console.log('All parsed OK:', trace.every(e => e.parseSuccess));

const insightHashes = trace.map(e => e.insightHash);
const actionHashes = trace.map(e => e.actionHash);
console.log('Unique insights:', new Set(insightHashes).size, '/', insightHashes.length);
console.log('Unique actions:', new Set(actionHashes).size, '/', actionHashes.length);

const scores = trace.map(e => e.displayedScore);
console.log('Score spread:', Math.max(...scores) - Math.min(...scores));

if (trace.every(e => e.llmCallAttempted && e.parseSuccess) &&
    new Set(insightHashes).size === trace.length &&
    new Set(actionHashes).size === trace.length) {
  console.log('✅ HEALTHY: All variants scored independently');
} else if (new Set(insightHashes).size < trace.length) {
  console.log('❌ BUG: Shared insight/action text (object reuse)');
} else if (!trace.every(e => e.llmCallAttempted)) {
  console.log('❌ BUG: Some variants skipped LLM call');
} else {
  console.log('⚠️  MIXED: Some parse failures');
}
```

### 5. Disable
```javascript
localStorage.removeItem('copyzap_scoreTrace')
```

---

## What to Look For

### ✅ Healthy System
```
All called LLM: true
All parsed OK: true
Unique insights: 3 / 3
Unique actions: 3 / 3
✅ HEALTHY: All variants scored independently
```

### ❌ Bug: Shared Text
```
All called LLM: true
All parsed OK: true
Unique insights: 1 / 3  ← PROBLEM!
Unique actions: 1 / 3   ← PROBLEM!
❌ BUG: Shared insight/action text
```
**Root Cause:** Objects reused by reference

### ❌ Bug: Skipped Variants
```
All called LLM: false  ← PROBLEM!
❌ BUG: Some variants skipped LLM call
```
**Root Cause:** Loop execution failure

### ⚠️ Calibration Issue (Not a Bug)
```
All called LLM: true
All parsed OK: true
Unique insights: 3 / 3
Unique actions: 3 / 3
Score spread: 2  ← Low spread
```
**Root Cause:** Scoring rubric too conservative (calibration, not code bug)

---

## Full Documentation

See `SCORE_TRACE_AUDIT_GUIDE.md` for:
- Complete diagnostic procedures
- Detailed trace data structure
- Per-bug-type analysis
- Export/analysis tools
- Rollback instructions
