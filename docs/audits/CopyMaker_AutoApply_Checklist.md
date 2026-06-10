# Copy Maker Auto-Apply QA Checklist

**Version:** 1.0
**Created:** 2026-02-10
**Purpose:** Manual testing scenarios to validate auto-apply behavior with debug logging

---

## How to Use This Checklist

1. **Enable debug mode:** Add `?debugAutoApply=1` to any Copy Maker URL
2. **Open browser console:** Look for `🔄 [AutoApply]` log entries
3. **Follow test scenarios:** Complete each scenario and verify expected logs
4. **Check results:** Mark ✅ if behavior matches expected, ❌ if not
5. **Report issues:** Note any unexpected behavior in "Actual Result" column

---

## Test Scenarios

### Group A: URL Parameter Loading

#### A1: Load Session from URL

**Setup:**
1. Create or find existing session ID
2. Navigate to: `/app/copy-maker?sessionId=<UUID>&debugAutoApply=1`

**Expected Behavior:**
- [ ] Form clears before loading
- [ ] Session data loads into all fields
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-001", target: "session", ... }`
- [ ] Session name displays in UI
- [ ] Intent context updated
- [ ] URL param removed after load

**Actual Result:**
```
(Fill in after testing)
```

---

#### A2: Load Template from URL

**Setup:**
1. Find existing template ID
2. Navigate to: `/app/copy-maker?templateId=<UUID>&debugAutoApply=1`

**Expected Behavior:**
- [ ] Form clears before loading
- [ ] Template data loads into fields
- [ ] Mode switches to "Advanced"
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-002", target: "template", ... }`
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-007", target: "mode", after: "advanced", ... }`
- [ ] Populated sections expand
- [ ] Toast shows field count
- [ ] URL param removed after load

**Actual Result:**
```
(Fill in after testing)
```

---

#### A3: Load Saved Output from URL (Non-CopySnap)

**Setup:**
1. Find saved output ID (NOT from CopySnap feature)
2. Navigate to: `/app/copy-maker?savedOutputId=<UUID>&debugAutoApply=1`

**Expected Behavior:**
- [ ] Form clears before loading
- [ ] Input data loads
- [ ] Generated output displays
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-003", target: "saved_output", ... }`
- [ ] Tab switches based on operation type
- [ ] URL param removed after load

**Actual Result:**
```
(Fill in after testing)
```

---

#### A4: Load CopySnap Saved Output (Redirect)

**Setup:**
1. Find saved output ID from CopySnap feature
2. Navigate to: `/app/copy-maker?savedOutputId=<UUID>&debugAutoApply=1`

**Expected Behavior:**
- [ ] Immediately redirects to `/app/copy-snap`
- [ ] Does NOT load data into Copy Maker form
- [ ] Console shows detection log (if any)

**Actual Result:**
```
(Fill in after testing)
```

---

#### A5: Edit Prefill from URL

**Setup:**
1. Find existing prefill ID
2. Navigate to: `/app/copy-maker?prefillMode=edit&prefillId=<UUID>&debugAutoApply=1`

**Expected Behavior:**
- [ ] Prefill data loads (merges, does NOT clear form)
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-004", target: "prefill", ... }`
- [ ] Edit mode UI appears
- [ ] URL params remain (not removed)
- [ ] Existing form data preserved where no conflict

**Actual Result:**
```
(Fill in after testing)
```

---

### Group B: Intent Polish Handoff

#### B1: Intent Polish Prefill via Router State

**Setup:**
1. Go to Quick Polish feature
2. Generate polished output
3. Click "Continue in Copy Maker" or similar
4. Add `&debugAutoApply=1` to URL

**Expected Behavior:**
- [ ] Tab switches to "Improve"
- [ ] Selected output loads into "Original Copy" field
- [ ] Special instructions populate
- [ ] Intent fields map correctly (section, audience, tone, CTA)
- [ ] Language converts correctly
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-005", source: "router-state", ... }`
- [ ] Banner shows for 2 seconds
- [ ] Project Description field auto-focuses
- [ ] Router state cleared
- [ ] SessionStorage cleared

**Actual Result:**
```
(Fill in after testing)
```

---

#### B2: Intent Polish Prefill via SessionStorage

**Setup:**
1. Manually set sessionStorage:
   ```javascript
   sessionStorage.setItem('CZ_PREFILL_TO_COPY_MAKER_V1', JSON.stringify({
     source: 'intent_polish',
     original_input: 'Test input',
     selected_output: 'Test polished output',
     intent: { label: 'Clarity', audience: 'Professionals', tone: 'professional', cta: 'Learn more' },
     language: 'en'
   }));
   ```
2. Navigate to: `/app/copy-maker?debugAutoApply=1`
3. Refresh page

**Expected Behavior:**
- [ ] Same as B1, but source is "sessionStorage"
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-005", source: "sessionStorage", ... }`

**Actual Result:**
```
(Fill in after testing)
```

---

### Group C: Start Hub Handoff

#### C1: Start Hub → Open Wizard

**Setup:**
1. Clear all user preferences to show Start Hub on mount
2. Navigate to: `/app/copy-maker?debugAutoApply=1`
3. Click "Quick Wizard" option in Start Hub

**Expected Behavior:**
- [ ] Start Hub closes
- [ ] Wizard modal opens
- [ ] Tab may switch based on wizard mode
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-006", target: "tab", ... }`
- [ ] Wizard initializes with correct mode and step

**Actual Result:**
```
(Fill in after testing)
```

---

#### C2: Start Hub → Open Form with Mode

**Setup:**
1. Same as C1
2. Click "Open Form" with specific UI level (e.g., "Quick mode")

**Expected Behavior:**
- [ ] Start Hub closes
- [ ] Form stays visible
- [ ] Mode switches to selected level
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-006", target: "mode", after: "quick", ... }`
- [ ] Specified field focuses (if provided)

**Actual Result:**
```
(Fill in after testing)
```

---

### Group D: Template & Prefill Selection

#### D1: Select Template from Dropdown

**Setup:**
1. Navigate to: `/app/copy-maker?debugAutoApply=1`
2. Open template dropdown
3. Select any template

**Expected Behavior:**
- [ ] Form clears before loading
- [ ] Template data populates fields
- [ ] Mode switches to "Advanced"
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-002", ... }`
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-007", target: "mode", after: "advanced", ... }`
- [ ] Populated sections expand
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-008", target: "accordion", ... }`
- [ ] Toast shows field count
- [ ] Placeholder warning if applicable

**Actual Result:**
```
(Fill in after testing)
```

---

#### D2: User Manually Switches Mode After Template Load

**Setup:**
1. Complete D1
2. Manually click mode toggle to switch to "Quick" or "Standard"

**Expected Behavior:**
- [ ] Mode switches successfully
- [ ] Template data preserved
- [ ] Some fields may be hidden based on mode
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-012", target: "localStorage", ... }`
- [ ] Mode preference saved to localStorage

**Actual Result:**
```
(Fill in after testing)
```

---

### Group E: Wizard Handoff

#### E1: Wizard "Apply to Form"

**Setup:**
1. Navigate to: `/app/copy-maker?debugAutoApply=1`
2. Open QuickSetupWizard (via Start Hub or button)
3. Fill in wizard steps
4. Click "Apply to Form"

**Expected Behavior:**
- [ ] Wizard closes
- [ ] Form fields populate with wizard data
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-009", target: "field", ... }`
- [ ] Existing non-conflicting fields preserved
- [ ] Conflicting fields overwritten by wizard
- [ ] No generation triggered

**Actual Result:**
```
(Fill in after testing)
```

---

#### E2: Wizard "Generate Now"

**Setup:**
1. Same as E1
2. Click "Generate Now" instead

**Expected Behavior:**
- [ ] Wizard closes
- [ ] Form fields populate with wizard data
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-010", target: "field", ... }`
- [ ] Generation triggers immediately
- [ ] Processing modal appears

**Actual Result:**
```
(Fill in after testing)
```

---

### Group F: Auto-Session Creation

#### F1: Complete Form Triggers Session Creation

**Setup:**
1. Navigate to: `/app/copy-maker?debugAutoApply=1`
2. Ensure you're logged in
3. Fill in required fields to make form "complete":
   - Project Description (required)
   - Product/Service Name + Business Description OR Original Copy
4. Wait 1-2 seconds

**Expected Behavior:**
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-011", target: "session", ... }`
- [ ] Session ID appears in form state (check React DevTools)
- [ ] Session appears in Dashboard
- [ ] No visible UI change (silent operation)

**Actual Result:**
```
(Fill in after testing)
```

---

### Group G: Conflict Scenarios

#### G1: Multiple URL Params (Session + Template)

**Setup:**
1. Navigate to: `/app/copy-maker?sessionId=<UUID1>&templateId=<UUID2>&debugAutoApply=1`

**Expected Behavior:**
- [ ] Only ONE loads (first param processed)
- [ ] Console shows only one CM-AUTO rule fire
- [ ] Second param ignored

**Actual Result:**
```
(Fill in after testing)
Which loaded? Session or Template?
```

---

#### G2: Intent Polish Prefill + Existing Form Data

**Setup:**
1. Navigate to: `/app/copy-maker?debugAutoApply=1`
2. Manually fill in some fields
3. Set Intent Polish prefill in sessionStorage (see B2)
4. Navigate to `/app/copy-maker?debugAutoApply=1` (refresh)

**Expected Behavior:**
- [ ] Prefill applies
- [ ] Conflicting fields overwritten
- [ ] Non-conflicting fields preserved
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-005", ... }`
- [ ] No confirmation dialog (current behavior)

**Actual Result:**
```
(Fill in after testing)
Note which fields were overwritten vs preserved
```

---

#### G3: User in Quick Mode Loads Complex Template

**Setup:**
1. Navigate to: `/app/copy-maker?debugAutoApply=1`
2. Switch to "Quick" mode manually
3. Load a complex template with many fields

**Expected Behavior:**
- [ ] Mode switches to "Advanced" automatically
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-007", before: "quick", after: "advanced", ... }`
- [ ] User must manually switch back to Quick if desired
- [ ] Hidden fields notification may appear

**Actual Result:**
```
(Fill in after testing)
```

---

### Group H: Edge Cases

#### H1: React StrictMode Double-Mount

**Setup:**
1. Ensure dev environment with StrictMode enabled
2. Navigate to: `/app/copy-maker?sessionId=<UUID>&debugAutoApply=1`
3. Check console for duplicate logs

**Expected Behavior:**
- [ ] Only ONE auto-apply fires (one-shot guards work)
- [ ] No duplicate data loading
- [ ] Console may show two effect runs but only one actual apply

**Actual Result:**
```
(Fill in after testing)
```

---

#### H2: Wizard Data with outputStructure from URL Extraction

**Setup:**
1. Use wizard with URL extraction feature
2. Extract structured content from a URL
3. Click "Apply to Form"

**Expected Behavior:**
- [ ] `outputStructure` field preserved (has content)
- [ ] Console shows: `🔄 [AutoApply] { ruleId: "CM-AUTO-009", context: { hasOutputStructure: true }, ... }`

**Actual Result:**
```
(Fill in after testing)
```

---

#### H3: Invalid Prefill Data (Missing required fields)

**Setup:**
1. Set invalid Intent Polish prefill:
   ```javascript
   sessionStorage.setItem('CZ_PREFILL_TO_COPY_MAKER_V1', JSON.stringify({
     source: 'intent_polish',
     original_input: 'Test',
     // Missing selected_output (required)
   }));
   ```
2. Navigate to: `/app/copy-maker?debugAutoApply=1`

**Expected Behavior:**
- [ ] Prefill rejected
- [ ] Error toast appears
- [ ] SessionStorage cleared
- [ ] Router state cleared
- [ ] Form remains empty

**Actual Result:**
```
(Fill in after testing)
```

---

## Debug Log Inspection

### View All Auto-Apply Events

In browser console:
```javascript
// View all logged events
window.__autoApplyEvents

// Export as JSON
exportAutoApplyEvents()

// Clear events
clearAutoApplyEvents()
```

### Expected Log Format

Each log should contain:
```javascript
{
  ruleId: "CM-AUTO-XXX",
  target: "mode" | "accordion" | "field" | "tab" | "session",
  before: <previous value>,
  after: <new value>,
  source: "template_load" | "session_restore" | etc.,
  context: { /* relevant metadata */ },
  timestamp: 1707580800000
}
```

---

## Summary Checklist

- [ ] All Group A tests pass (URL parameter loading)
- [ ] All Group B tests pass (Intent Polish handoff)
- [ ] All Group C tests pass (Start Hub handoff)
- [ ] All Group D tests pass (Template & prefill selection)
- [ ] All Group E tests pass (Wizard handoff)
- [ ] All Group F tests pass (Auto-session creation)
- [ ] All Group G tests pass (Conflict scenarios)
- [ ] All Group H tests pass (Edge cases)
- [ ] All expected debug logs appear
- [ ] No unexpected auto-applies occur
- [ ] User overrides are respected where expected
- [ ] Confirmation dialogs appear where expected (currently: none)

---

## Known Issues to Watch For

1. **Mode always switches to Advanced on template load** - No complexity check
2. **No confirmation when overwriting user data** - Wizard, prefill, and session loads
3. **Timing-dependent race conditions** - Multiple useEffect blocks
4. **No user-edited field tracking** - Can't detect if user modified a field
5. **localStorage mode persists forever** - No reset to default

---

## Notes Section

Use this space for additional observations:

```
(Fill in during testing)
```

---

**End of Checklist**
