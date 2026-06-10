# Copy Maker Auto-Apply Behavior Audit

**Version:** 1.0
**Created:** 2026-02-10
**Status:** Complete
**Purpose:** Document all automatic form value setting, mode switching, and UI state changes in Copy Maker Form

---

## Executive Summary

Copy Maker Form automatically sets values, switches modes, and adjusts UI state based on multiple data sources. This audit maps **all auto-apply rules**, their triggers, precedence, and runtime behavior.

### Key Findings

1. **12 distinct auto-apply rules** identified
2. **8 data sources** compete for form control
3. **Precedence is order-dependent** based on useEffect execution and timing
4. **No explicit override detection** - user edits can be silently overwritten
5. **Mode auto-switching** happens on template load only
6. **Accordion expansion** is deterministic based on populated fields

### High-Risk Areas

- **Session restoration** can overwrite user edits if triggered after manual input
- **Intent Polish handoff** uses one-shot guard but no user confirmation
- **Wizard handoff** merges data without preserving user overrides
- **Multiple useEffect blocks** may fire in unpredictable order during hydration

---

## Data Sources (Priority Order)

The following data sources can auto-apply values to Copy Maker Form, listed in approximate precedence order (subject to timing):

1. **URL Parameters** (`?sessionId=`, `?templateId=`, `?savedOutputId=`, `?prefillMode=`, `?prefillId=`)
2. **Router State** (location.state from navigation)
3. **SessionStorage** (`CZ_PREFILL_TO_COPY_MAKER_V1`)
4. **Intent Polish Handoff** (sessionStorage or router state)
5. **Start Hub Config** (opens wizard or sets mode)
6. **Template Load** (user selects template from dropdown)
7. **Prefill Load** (user selects prefill or URL param)
8. **Session Restoration** (loads saved session)
9. **Saved Output Load** (loads previously saved output)
10. **Wizard Handoff** (applies wizard data on "Apply to Form" or "Generate Now")
11. **Auto-Session Creation** (creates session when form becomes complete)
12. **Mode Context** (persisted in localStorage as `copyZap_formMode`)

---

## Auto-Apply Rules

### Rule CM-AUTO-001: RestoreSessionFromURL

**File:** `src/components/UrlParamLoader.tsx` (lines 39-81)

**Trigger:** Component mount when `?sessionId=UUID` in URL

**Condition:**
```typescript
const sessionId = searchParams.get('sessionId');
if (sessionId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sessionId))
```

**Data Sources:**
- URL query parameter
- Database: `copy_maker_sessions` table via `getSessionById()`

**Outputs Applied:**
- Clears all form inputs first (`handleClearAllInputs()`)
- Calls `loadFormStateFromSession(session)` which sets:
  - All `input_data` fields
  - Session metadata (`sessionId`, `loadedSessionName`)
  - Intent context via `setCurrentSession()`

**Precedence:** High (runs on mount, before other rules)

**Can User Override?** Yes, but no detection - user edits can be lost if another rule fires

**Cleanup:** Removes `sessionId` param from URL after load

**Risks:**
- If session fetch fails, shows error but leaves URL param
- No confirmation if form already has user input

---

### Rule CM-AUTO-002: LoadTemplateFromURL

**File:** `src/components/UrlParamLoader.tsx` (lines 82-119)

**Trigger:** Component mount when `?templateId=UUID` in URL

**Condition:**
```typescript
const templateId = searchParams.get('templateId');
if (templateId && /^[0-9a-fA-F]{8}-.../.test(templateId))
```

**Data Sources:**
- URL query parameter
- Database: `pmc_saved_templates` table via `getTemplateById()`

**Outputs Applied:**
- Clears all form inputs first
- Calls `loadFormStateFromTemplate(template)` which sets:
  - All template fields (40+ possible fields)
  - Mode to "advanced" (via CM-AUTO-007)
  - Accordion sections to expand (via CM-AUTO-008)
  - Template metadata (`loadedTemplateId`, `loadedTemplateName`, `loadedTemplateCategory`)

**Precedence:** High (runs on mount)

**Can User Override?** Yes, but mode switch is automatic

**Cleanup:** Removes `templateId` param from URL after load

**Risks:**
- Always switches to Advanced mode regardless of template complexity
- Shows placeholder warning but doesn't block generation

---

### Rule CM-AUTO-003: LoadSavedOutputFromURL

**File:** `src/components/UrlParamLoader.tsx` (lines 120-182)

**Trigger:** Component mount when `?savedOutputId=UUID` in URL

**Condition:**
```typescript
const savedOutputId = searchParams.get('savedOutputId');
if (savedOutputId && /^[0-9a-fA-F]{8}-.../.test(savedOutputId))
```

**Data Sources:**
- URL query parameter
- Database: `pmc_saved_outputs` table via `getSavedOutputById()`

**Outputs Applied:**
- Clears all form inputs first
- Calls `loadFormStateFromSavedOutput(savedOutput)` which sets:
  - All `input_data` fields
  - Remaps `versionId` to ensure uniqueness
  - Sets `copyResult` with generated output
  - Sets tab to appropriate mode (create/improve based on `operation` field)

**Precedence:** High (runs on mount)

**Special Behavior:**
- **CopySnap Detection:** If `feature === 'copy_snap'`, redirects to `/app/copy-snap` instead of loading
- Prevents CopySnap outputs from loading into Copy Maker Form

**Can User Override?** N/A (redirects away if CopySnap output)

**Cleanup:** Removes `savedOutputId` param from URL after load

**Risks:**
- Version ID collision if same output loaded multiple times
- No warning if form already has data

---

### Rule CM-AUTO-004: InitPrefillEditModeFromURL

**File:** `src/components/copy-maker/CopyMakerTab/hooks/usePrefillEditing.ts` (lines 63-79)

**Trigger:** Component mount when `?prefillMode=add|edit|clone&prefillId=UUID` in URL

**Condition:**
```typescript
const mode = searchParams.get('prefillMode');
const id = searchParams.get('prefillId');
if ((mode === 'edit' || mode === 'clone') && id) {
  loadPrefillData(id, mode === 'clone');
} else if (mode === 'add') {
  setEditingPrefillId(null);
  setPrefillMode('add');
}
```

**Data Sources:**
- URL query parameters (`prefillMode`, `prefillId`)
- Database: `pmc_copy_prefills` table

**Outputs Applied:**
- Sets `prefillMode` state ('add', 'edit', 'clone')
- Sets `editingPrefillId` if editing/cloning
- Calls `mapPrefillToFormState()` which merges prefill data into form state
- Preserves existing form state (does NOT clear first)

**Precedence:** Medium (runs on mount, but doesn't clear form)

**Can User Override?** Yes, prefill merges with existing data

**Cleanup:** URL params remain until save/cancel

**Risks:**
- Prefill can overwrite user edits silently
- No confirmation when entering edit mode with existing form data

---

### Rule CM-AUTO-005: ApplyIntentPolishPrefill

**File:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` (lines 660-776)

**Trigger:** Component mount when:
- `location.state.prefill` exists OR
- `sessionStorage.getItem('CZ_PREFILL_TO_COPY_MAKER_V1')` exists

**Condition:**
```typescript
if (prefill?.source === 'intent_polish' &&
    prefill.original_input &&
    prefill.selected_output) {
  // Apply once using hasAppliedPrefillRef guard
}
```

**Data Sources:**
- Router location state (`location.state.prefill`)
- SessionStorage (`CZ_PREFILL_TO_COPY_MAKER_V1`)
- Prefill from Intent Polish / Quick Polish feature

**Outputs Applied:**
```typescript
setFormState(prev => ({
  ...prev,
  tab: 'improve',
  originalCopy: prefill.selected_output,
  specialInstructions: prefill.special_instructions || prev.specialInstructions,
  section: prefill.intent?.label || prev.section,
  targetAudience: prefill.intent?.audience || prev.targetAudience,
  tone: prefill.intent?.tone || prev.tone,
  callToAction: prefill.intent?.cta || prev.callToAction,
  language: convertLanguageCodeToFormDataLanguage(prefill.language) || prev.language
}));
```

**Precedence:** High (runs on mount with one-shot guard)

**Can User Override?** No - one-shot guard prevents re-application

**Cleanup:**
- Removes sessionStorage key immediately
- Clears router state immediately

**Special Behavior:**
- Shows banner for 2 seconds: "Content loaded from Purpose Rewrite"
- Auto-focuses on Project Description field
- Does NOT trigger auto-generation or auto-scoring

**Risks:**
- If user navigates away and back, prefill is lost (one-shot only)
- No confirmation if form already has data
- Language code conversion may fail for unsupported languages

---

### Rule CM-AUTO-006: HandleStartHubSelection

**File:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` (lines 543-579)

**Trigger:**
- Direct call from StartHubModal when user selects an option
- Custom event listener for `startHubConfigSelected` (lines 631-643)
- Router location state `startHubConfig` (lines 645-654)

**Condition:**
```typescript
if (config.openFeature === 'copy_wizard') {
  // Open wizard with specific mode and step
} else if (config.openFeature === 'copy_form') {
  // Set mode and focus field
}
```

**Data Sources:**
- StartHubModal user selection
- Custom DOM event
- Router location state

**Outputs Applied:**
- If `openFeature === 'copy_wizard'`:
  - Sets `tab` to 'create' or 'improve' based on `wizardMode`
  - Opens QuickSetupWizard with initial mode and step
- If `openFeature === 'copy_form'`:
  - Sets `mode` (quick/standard/advanced) based on `config.uiLevel`
  - Focuses specified field after 300ms delay

**Precedence:** Medium (user-initiated)

**Can User Override?** Yes, this is user choice

**Cleanup:** No cleanup needed

**Risks:**
- Mode switch without confirmation
- Focus behavior may fail if field not yet rendered

---

### Rule CM-AUTO-007: SwitchToAdvancedOnTemplateLoad

**File:** `src/components/copy-maker/CopyMakerTab/hooks/useTemplates.ts` (lines 170-176)

**Trigger:** User selects template from dropdown

**Condition:**
```typescript
if (setMode && currentMode !== 'advanced') {
  setMode('advanced');
}
```

**Data Sources:**
- Template selection from dropdown
- Current mode from ModeContext

**Outputs Applied:**
- **Always** switches mode to 'advanced'
- Shows toast: "Template loaded: X fields. Switched to Advanced mode."

**Precedence:** Immediate (synchronous during template load)

**Can User Override?** Yes, user can manually switch back to Quick/Standard after load

**Cleanup:** None

**Risks:**
- **ALWAYS** switches to Advanced mode regardless of template complexity
- No way to load simple templates without mode switch
- May confuse users who prefer Quick/Standard mode

**Recommendation:** Consider checking template complexity first:
```typescript
const hiddenFields = findHiddenPopulatedFields(templateData, currentMode);
const recommendedMode = getRecommendedMode(hiddenFields);
if (recommendedMode !== currentMode) {
  setMode(recommendedMode);
}
```

---

### Rule CM-AUTO-008: ExpandAccordionSectionsOnTemplateLoad

**File:** `src/utils/templateLoader.ts` (lines 131-165)
**Used by:** `useTemplates.ts` (line 179)

**Trigger:** After template is loaded into form state

**Condition:** Checks if any field in each section group is populated

**Logic:**
```typescript
export function getSectionsToExpand(templateData: Partial<FormState>): string[] {
  const sectionsToExpand: string[] = [];

  // Section 1: What You're Creating
  if (['projectDescription', 'productServiceName', 'businessDescription',
       'originalCopy', 'section', 'excludedTerms'].some(field => isFieldPopulated(templateData[field]))) {
    sectionsToExpand.push('what-youre-creating');
  }

  // Section 2: Audience & Targeting
  if (['industryNiche', 'targetAudience', 'readerFunnelStage',
       'competitorUrls', 'targetAudiencePainPoints', 'competitorCopyText'].some(field => isFieldPopulated(templateData[field]))) {
    sectionsToExpand.push('audience-targeting');
  }

  // Section 3: Tone & Style
  if (['language', 'tone', 'wordCount', 'customWordCount', 'toneLevel',
       'preferredWritingStyle', 'languageStyleConstraints', 'outputStructure',
       'includeSectionTitles'].some(field => isFieldPopulated(templateData[field]))) {
    sectionsToExpand.push('tone-style');
  }

  // Section 4: Strategic Messaging
  if (['keyMessage', 'desiredEmotion', 'callToAction', 'brandValues',
       'keywords', 'context', 'specialInstructions'].some(field => isFieldPopulated(templateData[field]))) {
    sectionsToExpand.push('strategic-messaging');
  }

  // Section 5: Optimization & Optional Features
  if (['generateSeoMetadata', 'generateScores', 'generateGeoScore',
       'prioritizeWordCount', 'forceKeywordIntegration', 'forceElaborationsExamples',
       'enhanceForGEO', 'addTldrSummary', 'geoRegions'].some(field => isFieldPopulated(templateData[field]))) {
    sectionsToExpand.push('optimization-optional');
  }

  return sectionsToExpand;
}
```

**Data Sources:**
- Template data (all fields)

**Outputs Applied:**
- Array of section IDs to expand in accordion
- Passed to CopyForm component as `sectionsToExpand` prop

**Precedence:** Immediate (synchronous during template load)

**Can User Override?** Yes, user can collapse/expand sections manually

**Cleanup:** Sections remain expanded until user collapses them or form is cleared

**Risks:**
- All populated sections expand at once - can be overwhelming for complex templates
- No "smart" expansion (e.g., expand only most important sections)

---

### Rule CM-AUTO-009: ApplyWizardDataToForm

**File:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` (lines 1657-1672)

**Trigger:** User clicks "Apply to Form" in QuickSetupWizard

**Condition:** Wizard provides `templateData` object

**Data Sources:**
- QuickSetupWizard collected inputs
- Wizard step data

**Outputs Applied:**
```typescript
setFormState(prevState => ({
  ...prevState,
  ...templateData,
  outputStructure: hasOutputStructure ? templateData.outputStructure : []
}));
```

**Precedence:** User-initiated (medium)

**Can User Override?** Yes, but existing form data is merged (wizard data takes precedence)

**Cleanup:** None

**Special Behavior:**
- Preserves `outputStructure` only if it has actual content (from URL extraction)
- Otherwise clears `outputStructure` to generate plain text markdown
- Does NOT clear form first - merges wizard data with existing state

**Risks:**
- Wizard data silently overwrites any conflicting form values
- No confirmation dialog
- User edits may be lost

---

### Rule CM-AUTO-010: TriggerGenerationAfterWizard

**File:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` (lines 1674-1698)

**Trigger:** User clicks "Generate Now" in QuickSetupWizard

**Condition:** Wizard provides `wizardData` object

**Data Sources:**
- QuickSetupWizard collected inputs
- Generation trigger flag

**Outputs Applied:**
```typescript
shouldGenerateAfterWizardRef.current = true;
setFormState(prevState => {
  const merged = {
    ...prevState,
    ...wizardData,
    outputStructure: hasOutputStructure ? wizardData.outputStructure : []
  };
  return merged;
});
```

**Precedence:** User-initiated (high - triggers generation)

**Can User Override?** No - triggers generation immediately

**Cleanup:** `shouldGenerateAfterWizardRef` is cleared after generation

**Special Behavior:**
- Sets flag to trigger generation in next render cycle
- Merges wizard data with form state (wizard takes precedence)
- Clears `outputStructure` unless it has content from URL extraction

**Risks:**
- Generation happens automatically - no chance to review merged data
- User can't preview final form state before generation

---

### Rule CM-AUTO-011: AutoCreateSessionOnFormComplete

**File:** `src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx` (lines 779-822)

**Trigger:** Form becomes "complete" and user is logged in

**Condition:**
```typescript
if (!currentUser || !isFormComplete() || formState.sessionId) {
  return; // Don't create if no user, form incomplete, or session exists
}

function isFormComplete(): boolean {
  return !!(
    formState.projectDescription?.trim() &&
    ((formState.productServiceName?.trim() && formState.businessDescription?.trim()) ||
     formState.originalCopy?.trim())
  );
}
```

**Data Sources:**
- Current form state
- SessionManager

**Outputs Applied:**
- Creates new session in database via `ensureActiveSession()`
- Sets `sessionId` in form state
- Sets session context via `setCurrentSession()`

**Precedence:** Low (happens in background)

**Can User Override?** N/A (automatic session creation for draft saving)

**Cleanup:** None

**Special Behavior:**
- Silent background operation
- Only creates session once (guards with `formState.sessionId`)
- Enables auto-save functionality

**Risks:**
- Creates sessions even if user doesn't want to save
- No opt-out mechanism

---

### Rule CM-AUTO-012: PersistModeToLocalStorage

**File:** `src/context/ModeContext.tsx` (lines 23-25)

**Trigger:** User switches mode (quick/standard/advanced)

**Condition:** Any mode change

**Data Sources:**
- ModeContext state

**Outputs Applied:**
- Writes to localStorage: `copyZap_formMode`

**Precedence:** N/A (persistence only)

**Can User Override?** Yes, by switching mode

**Cleanup:** Never cleared (persists across sessions)

**Special Behavior:**
- Mode is restored on next visit
- Default mode: 'standard'

**Risks:**
- Mode persists even after clearing form
- No way to reset to default without manually switching

---

## Precedence & Execution Order

### Mount-Time Execution (Approximate Order)

1. **ModeContext initialization** - Loads mode from localStorage (default: 'standard')
2. **SessionContext initialization** - Sets up session tracking
3. **UrlParamLoader mount** - Checks for `?sessionId`, `?templateId`, `?savedOutputId` (in that priority)
4. **PrefillEditMode mount** - Checks for `?prefillMode` and `?prefillId`
5. **IntentPolishPrefill effect** - Checks router state and sessionStorage (one-shot)
6. **StartHubConfig effect** - Checks router state for Start Hub handoff
7. **StartHub visibility effect** - Shows Start Hub if form empty and user preference enabled
8. **Auto-session creation effect** - Creates session when form becomes complete

### Timing Conflicts

- **Race condition:** If multiple URL params present (`?sessionId` + `?templateId`), only first one wins
- **Order-dependent:** useEffect execution order is not guaranteed in React 18+
- **StrictMode:** Effects run twice in development - one-shot guards prevent double-apply

### User Override Detection

**Current State:** No explicit override detection

**Recommendation:** Add user-edited fields tracking:
```typescript
const [userEditedFields, setUserEditedFields] = useState<Set<string>>(new Set());

function handleFieldChange(fieldName: string, value: any) {
  setUserEditedFields(prev => new Set(prev).add(fieldName));
  setFormState(prev => ({ ...prev, [fieldName]: value }));
}

function shouldApplyAutoValue(fieldName: string): boolean {
  return !userEditedFields.has(fieldName);
}
```

---

## Hidden Coupling & Risks

### 1. Multiple setFormState Calls in Same useEffect

**Location:** Multiple useEffect blocks that call `setFormState` with functional updates

**Risk:** If multiple effects trigger simultaneously, state updates may interleave unpredictably

**Example:**
```typescript
// Effect 1: Intent Polish
setFormState(prev => ({ ...prev, tab: 'improve', originalCopy: prefill.selected_output }));

// Effect 2: Auto-session
setFormState(prev => ({ ...prev, sessionId: newSessionId }));
```

**Mitigation:** React batches updates, but race conditions possible with async operations

---

### 2. Wizard Handoff Timing

**Location:** Wizard `onGenerate` callback

**Risk:** Generation trigger flag may fire before form state fully updates

**Current Guard:**
```typescript
shouldGenerateAfterWizardRef.current = true;
setFormState(prevState => ({ ...prevState, ...wizardData }));
// Next render cycle: useEffect checks shouldGenerateAfterWizardRef and calls handleGenerate()
```

**Mitigation:** Uses ref flag + useEffect, but still timing-sensitive

---

### 3. Template Mode Switch Always Advanced

**Location:** `useTemplates.ts` line 171

**Risk:** ALL template loads switch to Advanced mode, even simple templates

**Impact:** User loses preferred mode (Quick/Standard) every time

**Recommendation:** Make mode switch conditional on template complexity

---

### 4. No Confirmation on Data Loss

**Risk:** Multiple auto-apply rules clear form or overwrite values without user confirmation

**Affected Rules:**
- CM-AUTO-001 (Session load clears form)
- CM-AUTO-002 (Template load clears form)
- CM-AUTO-003 (Saved output load clears form)
- CM-AUTO-009 (Wizard merge overwrites values)

**Recommendation:** Add "discard changes?" confirmation if form has user input

---

## Debug Instrumentation Added

**File:** `src/utils/debugAutoApply.ts`

**Usage:**
```typescript
import { logAutoApply, isDebugAutoApplyEnabled } from '@/utils/debugAutoApply';

// In your auto-apply code:
if (isDebugAutoApplyEnabled()) {
  logAutoApply({
    ruleId: "CM-AUTO-001",
    target: "mode",
    before: "standard",
    after: "advanced",
    source: "template_load",
    context: { templateId: template.id, templateName: template.template_name }
  });
}
```

**Enable:** Add `?debugAutoApply=1` to URL

**View Logs:**
- Console: Look for `🔄 [AutoApply]` prefix
- Inspect: Run `window.__autoApplyEvents` in console
- Export: Run `exportAutoApplyEvents()` in console

---

## Next Steps

1. **Add logging to all 12 rules** - Insert `logAutoApply()` calls
2. **Test with debugAutoApply=1** - Validate all triggers fire correctly
3. **Add user override detection** - Track user-edited fields
4. **Add confirmation dialogs** - Warn before clearing/overwriting form data
5. **Make mode switch smarter** - Use `getRecommendedMode()` instead of always 'advanced'
6. **Document field mapping** - Show which template/prefill/session fields map to which form fields

---

## Glossary

- **Auto-apply:** Automatic setting of form values, mode, or UI state without explicit user action
- **One-shot guard:** Ref-based flag to prevent double-execution (e.g., in StrictMode)
- **Hydration:** Initial population of form state from data sources
- **Precedence:** Order of priority when multiple rules apply to same field
- **User override:** User manually editing a field after auto-apply

---

**End of Audit**
