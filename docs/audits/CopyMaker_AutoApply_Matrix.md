# Copy Maker Auto-Apply Decision Matrix

**Version:** 1.0
**Created:** 2026-02-10
**Purpose:** Single-table reference for all auto-apply conditions and their outcomes

---

## How to Use This Matrix

1. Find your scenario in the **Trigger** column
2. Check the **Condition** to see if it applies
3. See which **Targets** are affected
4. Check **Precedence** to understand conflict resolution
5. Review **Notes** for edge cases and risks

---

## Master Decision Matrix

| Rule ID | Trigger | Condition | Target | Before | After | Data Source | Precedence | Can Override? | Notes |
|---------|---------|-----------|--------|--------|-------|-------------|------------|---------------|-------|
| **CM-AUTO-001** | URL has `?sessionId=UUID` | Valid UUID format + session exists in DB | **All form fields** | Any | Session `input_data` | `copy_maker_sessions` table | **HIGH** (mount) | Yes | Clears form first. Sets intent context. No confirmation. |
| **CM-AUTO-002** | URL has `?templateId=UUID` | Valid UUID format + template exists in DB | **All form fields** | Any | Template data (40+ fields) | `pmc_saved_templates` table | **HIGH** (mount) | Yes | Clears form first. Triggers CM-AUTO-007 (mode switch). Triggers CM-AUTO-008 (accordion expand). |
| **CM-AUTO-002** | (same as above) | (same) | **Mode** | Any | `'advanced'` | Template load | **HIGH** | Yes | ALWAYS switches to Advanced mode regardless of template complexity. |
| **CM-AUTO-002** | (same as above) | (same) | **Accordion sections** | Any | Array of section IDs | Template data analysis | **HIGH** | Yes | See CM-AUTO-008 for expansion logic. |
| **CM-AUTO-003** | URL has `?savedOutputId=UUID` | Valid UUID + saved output exists + NOT CopySnap output | **All form fields** | Any | Saved `input_data` | `pmc_saved_outputs` table | **HIGH** (mount) | Yes | Clears form first. Remaps versionId. Sets tab based on operation. |
| **CM-AUTO-003** | (same as above) | Valid UUID + saved output exists + IS CopySnap output | **Page redirect** | Copy Maker | `/app/copy-snap` | Saved output metadata | **CRITICAL** | No | Prevents CopySnap outputs from loading into Copy Maker. Redirects immediately. |
| **CM-AUTO-004** | URL has `?prefillMode=edit&prefillId=UUID` | Valid UUID + prefill exists in DB | **Form fields** (merge) | Any | Prefill data | `pmc_copy_prefills` table | **MEDIUM** (mount) | Yes | Does NOT clear form - merges with existing data. No confirmation. |
| **CM-AUTO-004** | URL has `?prefillMode=clone&prefillId=UUID` | (same) | **Form fields** (merge) | Any | Prefill data (copy) | (same) | **MEDIUM** | Yes | Same as edit but doesn't link to original prefill. |
| **CM-AUTO-004** | URL has `?prefillMode=add` | No prefillId needed | **Edit mode** | N/A | Prefill add mode | URL param only | **MEDIUM** | Yes | Sets UI to prefill creation mode. No form changes. |
| **CM-AUTO-005** | Router state or sessionStorage has Intent Polish prefill | `prefill.source === 'intent_polish'` + valid data + one-shot guard | **Field: tab** | Any | `'improve'` | Intent Polish feature | **HIGH** (mount) | No (one-shot) | One-shot apply only. Clears storage immediately. |
| **CM-AUTO-005** | (same) | (same) | **Field: originalCopy** | Any | `prefill.selected_output` | (same) | **HIGH** | No | Polished output becomes "original copy" to improve. |
| **CM-AUTO-005** | (same) | (same) | **Field: specialInstructions** | Any | `prefill.special_instructions` or keep existing | (same) | **HIGH** | No | Only sets if provided. |
| **CM-AUTO-005** | (same) | (same) | **Field: section** | Any | `prefill.intent.label` or keep existing | (same) | **HIGH** | No | Maps intent label to section field. |
| **CM-AUTO-005** | (same) | (same) | **Field: targetAudience** | Any | `prefill.intent.audience` or keep existing | (same) | **HIGH** | No | Maps intent audience to form field. |
| **CM-AUTO-005** | (same) | (same) | **Field: tone** | Any | `prefill.intent.tone` or keep existing | (same) | **HIGH** | No | Maps intent tone to form field. |
| **CM-AUTO-005** | (same) | (same) | **Field: callToAction** | Any | `prefill.intent.cta` or keep existing | (same) | **HIGH** | No | Maps intent CTA to form field. |
| **CM-AUTO-005** | (same) | (same) | **Field: language** | Any | Converted from language code or keep existing | (same) | **HIGH** | No | Converts 'es' → 'Spanish', etc. |
| **CM-AUTO-005** | (same) | (same) | **UI: Banner** | Hidden | Shown for 2 seconds | (same) | **HIGH** | N/A | Shows "Content loaded from Purpose Rewrite" banner. |
| **CM-AUTO-005** | (same) | (same) | **UI: Focus** | None | Project Description field | (same) | **HIGH** | N/A | Auto-focuses and scrolls to field after 100ms. |
| **CM-AUTO-006** | Start Hub selection: Wizard | `config.openFeature === 'copy_wizard'` | **Field: tab** | Any | Based on `wizardMode` ('create'/'improve') | Start Hub user choice | **MEDIUM** | Yes | User-initiated action. |
| **CM-AUTO-006** | (same) | (same) | **Modal: Wizard** | Closed | Open with initial config | (same) | **MEDIUM** | Yes | Opens QuickSetupWizard with pre-set mode and step. |
| **CM-AUTO-006** | Start Hub selection: Form | `config.openFeature === 'copy_form'` | **Mode** | Any | `config.uiLevel` (quick/standard/advanced) | Start Hub user choice | **MEDIUM** | Yes | Direct mode switch without confirmation. |
| **CM-AUTO-006** | (same) | (same) | **UI: Focus** | None | `config.focusField` after 300ms | (same) | **MEDIUM** | Yes | Focuses specified field if provided. |
| **CM-AUTO-007** | Template selected from dropdown | Always (when `currentMode !== 'advanced'`) | **Mode** | quick/standard | `'advanced'` | Template selection | **IMMEDIATE** | Yes | ALWAYS switches to Advanced mode. No template complexity check. |
| **CM-AUTO-008** | Template loaded into form | Any field in section group is populated | **Accordion: what-youre-creating** | Any | Expanded if fields populated | Template data | **IMMEDIATE** | Yes | Expands if: projectDescription, productServiceName, businessDescription, originalCopy, section, or excludedTerms populated. |
| **CM-AUTO-008** | (same) | (same) | **Accordion: audience-targeting** | Any | Expanded if fields populated | (same) | **IMMEDIATE** | Yes | Expands if: industryNiche, targetAudience, readerFunnelStage, competitorUrls, targetAudiencePainPoints, or competitorCopyText populated. |
| **CM-AUTO-008** | (same) | (same) | **Accordion: tone-style** | Any | Expanded if fields populated | (same) | **IMMEDIATE** | Yes | Expands if: language, tone, wordCount, customWordCount, toneLevel, preferredWritingStyle, languageStyleConstraints, outputStructure, or includeSectionTitles populated. |
| **CM-AUTO-008** | (same) | (same) | **Accordion: strategic-messaging** | Any | Expanded if fields populated | (same) | **IMMEDIATE** | Yes | Expands if: keyMessage, desiredEmotion, callToAction, brandValues, keywords, context, or specialInstructions populated. |
| **CM-AUTO-008** | (same) | (same) | **Accordion: optimization-optional** | Any | Expanded if fields populated | (same) | **IMMEDIATE** | Yes | Expands if: generateSeoMetadata, generateScores, generateGeoScore, prioritizeWordCount, forceKeywordIntegration, forceElaborationsExamples, enhanceForGEO, addTldrSummary, or geoRegions populated. |
| **CM-AUTO-009** | User clicks "Apply to Form" in Wizard | Wizard provides `templateData` | **Form fields** (merge) | Any | Wizard data | QuickSetupWizard | **USER-INITIATED** | Yes | Merges with existing form state - wizard data takes precedence. No clear. No confirmation. |
| **CM-AUTO-009** | (same) | (same) | **Field: outputStructure** | Any | Kept if has content, else cleared | (same) | **USER-INITIATED** | Yes | Special logic for URL extraction outputs. |
| **CM-AUTO-010** | User clicks "Generate Now" in Wizard | Wizard provides `wizardData` | **Form fields** (merge) | Any | Wizard data | QuickSetupWizard | **USER-INITIATED (HIGH)** | No | Merges data and triggers generation immediately. |
| **CM-AUTO-010** | (same) | (same) | **Generation trigger** | Not generating | Triggers generation | (same) | **USER-INITIATED** | No | Sets `shouldGenerateAfterWizardRef` flag for next render cycle. |
| **CM-AUTO-011** | Form becomes complete + user logged in + no session exists | `isFormComplete() === true` | **Field: sessionId** | null | New session UUID | SessionManager | **LOW (background)** | N/A | Silent auto-session creation for draft saving. |
| **CM-AUTO-011** | (same) | (same) | **Session context** | None | Active session | (same) | **LOW** | N/A | Enables auto-save and session tracking. |
| **CM-AUTO-012** | User switches mode | Any mode change | **localStorage** | Old mode | New mode | ModeContext | **N/A (persistence)** | Yes | Persists user preference across sessions. |

---

## Field-Level Impact Matrix

### Mode (quick / standard / advanced)

| Source | Condition | Resulting Mode | Precedence | Overridable? |
|--------|-----------|----------------|------------|--------------|
| localStorage | First mount, no other triggers | Saved mode (default: 'standard') | Lowest | Yes |
| Start Hub selection | User selects form with UI level | `config.uiLevel` | Medium | Yes |
| Template load | Always (except if already advanced) | `'advanced'` | High | Yes (user can switch back) |

**Conflict Resolution:** Template load ALWAYS wins during that action, but user can manually switch afterwards.

---

### Tab (create / improve)

| Source | Condition | Resulting Tab | Precedence | Overridable? |
|--------|-----------|---------------|------------|--------------|
| Intent Polish prefill | Has Intent Polish data | `'improve'` | High | No (one-shot) |
| Start Hub wizard selection | User picks wizard mode | Based on `wizardMode` | Medium | Yes |
| Saved output load | `operation === 'create'` | `'create'` | High | Yes |
| Saved output load | `operation === 'improve'` | `'improve'` | High | Yes |

**Conflict Resolution:** Last action wins (mount-time triggers have precedence).

---

### Accordion Sections (expanded / collapsed)

| Source | Condition | Expanded Sections | Precedence | Overridable? |
|--------|-----------|-------------------|------------|--------------|
| Template load | Any field in section populated | See CM-AUTO-008 logic | Immediate | Yes (user can collapse) |

**Conflict Resolution:** Only template load triggers auto-expansion. User actions always respected.

---

### Optimization & Optional Features Fields

| Field | Auto-Applied By | Condition | Source |
|-------|-----------------|-----------|--------|
| `generateSeoMetadata` | Template load, Prefill load, Session restore | Field populated in source | Template/Prefill/Session data |
| `generateScores` | (same) | (same) | (same) |
| `generateGeoScore` | (same) | (same) | (same) |
| `geoRegions` | (same) | (same) | (same) |
| `prioritizeWordCount` | (same) | (same) | (same) |
| `forceKeywordIntegration` | (same) | (same) | (same) |
| `forceElaborationsExamples` | (same) | (same) | (same) |
| `enhanceForGEO` | (same) | (same) | (same) |
| `addTldrSummary` | (same) | (same) | (same) |

**Note:** These fields are NEVER auto-applied in isolation - they only come from loading saved data (templates, prefills, sessions, saved outputs).

---

## Precedence Ladder (Highest to Lowest)

1. **URL Parameters** (`?sessionId`, `?templateId`, `?savedOutputId`) - Highest, runs on mount
2. **Intent Polish Prefill** (router state or sessionStorage) - High, one-shot
3. **Template Load** (user action) - Immediate, triggers mode switch + accordion expansion
4. **Wizard "Generate Now"** (user action) - User-initiated, triggers generation
5. **Start Hub Selection** (user action) - Medium, user choice
6. **Wizard "Apply to Form"** (user action) - Medium, user choice
7. **Prefill Load** (URL param or user selection) - Medium, merges data
8. **Auto-Session Creation** (background) - Low, silent
9. **localStorage Mode Restore** (mount) - Lowest, default fallback

---

## Conflict Scenarios

### Scenario A: Multiple URL Params Present

**Example:** `?sessionId=abc&templateId=xyz`

**What Happens:**
1. UrlParamLoader processes params in order
2. `sessionId` loads first → clears form → loads session data
3. `templateId` check happens but UrlParamLoader removes params after first load
4. **Result:** Only session loads, template ignored

**Recommendation:** Never use multiple load params simultaneously.

---

### Scenario B: Intent Polish Prefill + Form Already Has Data

**Example:** User has partially filled form, navigates to Intent Polish, returns with prefill

**What Happens:**
1. Intent Polish prefill applies (CM-AUTO-005)
2. Overwrites conflicting fields without confirmation
3. Non-conflicting fields preserved
4. **Result:** User edits in non-overlapping fields are kept, but conflicting fields overwritten

**Recommendation:** Show confirmation dialog before applying prefill if form has data.

---

### Scenario C: User in Quick Mode, Loads Template

**Example:** User prefers Quick mode, loads complex template

**What Happens:**
1. Template loads (CM-AUTO-002)
2. Mode auto-switches to Advanced (CM-AUTO-007)
3. All sections with data expand (CM-AUTO-008)
4. **Result:** User loses preferred mode, must manually switch back

**Recommendation:** Check template complexity and only switch mode if necessary.

---

### Scenario D: Wizard Data Conflicts with Form Edits

**Example:** User fills form, opens wizard, wizard overwrites some fields

**What Happens:**
1. Wizard applies data (CM-AUTO-009 or CM-AUTO-010)
2. Uses spread operator: `{ ...prevState, ...wizardData }`
3. Wizard data overwrites conflicting fields
4. **Result:** User edits silently overwritten

**Recommendation:** Detect user-edited fields and warn before overwrite.

---

## Testing Checklist

Use `?debugAutoApply=1` in URL and verify each rule fires:

- [ ] CM-AUTO-001: Load session from URL
- [ ] CM-AUTO-002: Load template from URL
- [ ] CM-AUTO-003: Load saved output from URL (non-CopySnap)
- [ ] CM-AUTO-003: Redirect on CopySnap saved output
- [ ] CM-AUTO-004: Edit prefill from URL
- [ ] CM-AUTO-004: Clone prefill from URL
- [ ] CM-AUTO-004: Add new prefill from URL
- [ ] CM-AUTO-005: Intent Polish prefill from router state
- [ ] CM-AUTO-005: Intent Polish prefill from sessionStorage
- [ ] CM-AUTO-006: Start Hub → Wizard selection
- [ ] CM-AUTO-006: Start Hub → Form selection with mode
- [ ] CM-AUTO-007: Template load → mode switch to Advanced
- [ ] CM-AUTO-008: Template load → accordion sections expand
- [ ] CM-AUTO-009: Wizard "Apply to Form"
- [ ] CM-AUTO-010: Wizard "Generate Now"
- [ ] CM-AUTO-011: Auto-create session when form complete
- [ ] CM-AUTO-012: Mode persist to localStorage

---

## Recommendations Summary

1. **Add User Override Tracking** - Track which fields user manually edited
2. **Add Confirmation Dialogs** - Warn before clearing/overwriting form with user data
3. **Make Mode Switch Conditional** - Use `getRecommendedMode()` instead of always 'advanced'
4. **Add Conflict Resolution UI** - Show merge preview when multiple sources compete
5. **Document Field Mappings** - Create field-by-field mapping doc for all sources
6. **Add "Restore" Feature** - Allow user to undo auto-applies (undo stack)
7. **Add Loading States** - Show what's being auto-applied during hydration
8. **Add Debug Panel** - Built-in UI panel for viewing auto-apply history

---

**End of Matrix**
