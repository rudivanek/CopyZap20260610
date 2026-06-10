# Optimization Features Auto-Population Policy

**Version:** 2.0 (Strict Clarity-First Rule)
**Last Updated:** 2025-02-11

---

## Overview

The **"Optimization & Additional Features"** section contains toggles and settings that enhance copy generation. This document explains the strict, clarity-first policy governing when these fields can be auto-populated.

---

## STRICT CLARITY-FIRST RULE

### When Optimization Fields ARE Restored (ONLY 2 Cases)

Optimization fields are **RESTORED exactly as saved** ONLY when:

1. **Loading a Saved Session** (resume work)
   - User clicks "Resume" on a previous session in Dashboard
   - All optimization settings appear EXACTLY as they were when saved
   - Purpose: Continue work with the exact same configuration

2. **Opening a Saved Output** (view/edit existing saved output)
   - User opens a previously saved output from Dashboard
   - All optimization settings appear EXACTLY as they were when the output was created
   - Purpose: See/understand the exact settings used to create that output

### When Optimization Fields Are CLEARED (All Other Cases)

In **ALL other flows**, optimization fields start **EMPTY/OFF**:

- ❌ Quick Prompt Wizard (all paths: Make New Copy, Improve Existing, Quick Polish, Apply to Form, Generate Now)
- ❌ Wizard "Analyze URL"
- ❌ Purpose Rewrite → Continue in Copy Maker
- ❌ Load Template
- ❌ Load Prefill / Quick Start
- ❌ Any "Apply suggestions" or AI analysis step
- ❌ Any routing handoff into Copy Maker that is not a saved session or saved output

---

## Why This Policy?

### The Problems with "Smart Defaults"

The previous system attempted to be "intelligent" by:
- Having AI guess which optimization features you might want
- Auto-enabling features based on content type analysis
- Populating fields from wizard answers, URL analysis, templates, etc.

**This caused confusion:**
- Users didn't understand why certain toggles were already ON
- It was unclear whether settings came from AI inference or saved preferences
- Templates and prefills would silently change optimization settings
- Trust and reproducibility were compromised

### The Solution: Clarity First

The new policy prioritizes:

1. **Clarity** - It's immediately obvious where settings came from (only from saved data)
2. **Trust** - No hidden "smart" behavior that users didn't request
3. **Reproducibility** - Templates and workflows work consistently
4. **User Control** - All optimization features are opt-in, never assumed

---

## The Optimization Features Governed by This Policy

The following fields are **ONLY** auto-populated from saved sessions/outputs:

### Core Toggles
- Generate Scores
- Generate Geo Score
- Force Keyword Integration
- Force Elaborations & Examples
- Enhance for GEO
- Add TL;DR Summary
- Generate SEO Metadata

### Word Count Controls
- Prioritize Word Count
- Word Count Tolerance Percentage
- Adhere to Little Word Count
- Little Word Count Tolerance Percentage
- AI Decide Word Count

### SEO Metadata Variant Counts
- Number of URL Slugs
- Number of Meta Descriptions
- Number of H1 Variants
- Number of H2 Variants
- Number of H3 Variants
- Number of OG Titles
- Number of OG Descriptions

### Additional Settings
- GEO Regions
- FAQ Schema Enabled
- Section Breakdown

---

## Behavior in Each Flow

### ✅ Resume Saved Session
**Behavior:** All optimization fields RESTORED exactly as saved
**Example:** You had "Generate SEO Metadata" ON and "Number of H2 Variants: 5" → They appear ON/5 when you resume

### ✅ Open Saved Output
**Behavior:** All optimization fields RESTORED exactly as saved
**Example:** Output was created with "Enhance for GEO" ON → It appears ON when you open it

### ❌ Quick Prompt Wizard → Apply to Form
**Behavior:** All optimization fields EMPTY/OFF
**Example:** Even if wizard detected "blog post", optimization toggles remain OFF. User manually enables what they want.

### ❌ Quick Prompt Wizard → Generate Now
**Behavior:** All optimization fields EMPTY/OFF
**Example:** Direct generation from wizard starts with all optimization features disabled

### ❌ Wizard with "Analyze URL"
**Behavior:** All optimization fields EMPTY/OFF
**Example:** Even if URL analysis detects SEO focus, optimization toggles remain OFF

### ❌ Load Template
**Behavior:** All optimization fields EMPTY/OFF (even if template was saved with them ON)
**Example:** Old template had "Generate Scores: ON" → Loading it now shows "Generate Scores: OFF"

### ❌ Load Prefill / Quick Start
**Behavior:** All optimization fields EMPTY/OFF
**Example:** Prefill example may populate inputs, but optimization section always starts empty

### ❌ Quick Polish → Continue in Copy Maker
**Behavior:** All optimization fields EMPTY/OFF
**Example:** Even if Quick Polish was SEO-focused, optimization toggles start OFF in Copy Maker

---

## User Experience

### What Users See

When users open the "Optimization & Optional Features" section, they see:

> **Note:** These options are restored only from saved sessions or saved outputs. Otherwise, all fields start empty. You can set them manually as needed.

### What Users Can Do

1. **Manually Enable Features** - Click any toggle or fill any field at any time
2. **Settings Persist During Session** - Your manual changes stay until you clear/reload
3. **Save as Template** - Your chosen settings can be saved for reuse
4. **Save as Session** - When you save work, optimization settings are included
5. **Create Saved Output** - When saving output, optimization settings are preserved

---

## Implementation Details

### Central Policy Function

All form state loading goes through a central policy enforcement function:

```typescript
applyOptimizationRestorePolicy(
  source: 'saved_session' | 'saved_output' | 'wizard' | 'template' | 'prefill' | ...,
  incomingState: Partial<FormState>
): Partial<FormState>
```

**Logic:**
- If `source === 'saved_session' || source === 'saved_output'`: RESTORE optimization fields
- Else: OVERWRITE optimization fields with empty/off defaults

### Files Modified

1. **`src/utils/optimizationRestorePolicy.ts`** - Central policy function
2. **`src/hooks/useFormState.ts`** - All load functions use policy
3. **`src/components/wizard/QuickSetupWizard.tsx`** - Wizard applies policy
4. **`src/components/FeatureToggles.tsx`** - UI helper text added

---

## Testing Scenarios

To verify the policy is working:

### ✅ Test: Resume Session
1. Set some optimization toggles ON
2. Save session
3. Resume session
4. **Expected:** Toggles appear ON exactly as saved

### ✅ Test: Open Saved Output
1. Generate copy with optimization toggles ON
2. Save output
3. Open saved output
4. **Expected:** Toggles appear ON exactly as saved

### ❌ Test: Load Template
1. Create template with optimization toggles ON
2. Save template
3. Load template
4. **Expected:** Toggles appear OFF (cleared by policy)

### ❌ Test: Load Prefill
1. Use Quick Start prefill
2. **Expected:** All optimization toggles OFF

### ❌ Test: Wizard Apply to Form
1. Complete wizard (any path)
2. Click "Apply to Form"
3. **Expected:** All optimization toggles OFF

### ❌ Test: Wizard Generate Now
1. Complete wizard
2. Click "Generate Now"
3. **Expected:** All optimization toggles OFF during generation

---

## Migration from Previous Behavior

### What Changed

**Before:** Templates, prefills, wizard, and URL analysis could all auto-enable optimization features based on AI analysis or saved data.

**After:** Only saved sessions and saved outputs restore optimization features. Everything else starts empty.

### For Existing Templates

Templates created before this policy change may have optimization settings stored in the database. When you load these templates now:
- Content fields (business description, keywords, etc.) are still restored
- Optimization fields are now cleared (not restored)
- You must manually re-enable desired optimization features each time

**Recommendation:** If you have common optimization patterns, save them as new templates after manually configuring the optimization section the way you want.

### For Existing Workflows

Workflows that relied on templates to pre-configure optimization features will need adjustment:
- Update workflow templates to focus on content fields only
- Use workflow steps to document which optimization features should be manually enabled
- Or create a prefill that includes instructions for which features to enable

---

## FAQ

### Q: Why can't templates restore optimization settings?
**A:** Clarity and consistency. We want users to consciously choose optimization features for each new task, not inherit them implicitly from templates. Templates focus on content setup, not execution options.

### Q: Can I save my preferred optimization settings?
**A:** Yes! You can:
1. Create a session with your preferred settings, save it, and resume it later
2. Create a saved output with your settings, and reference it as a starting point
3. Document your preferences and manually set them each time

### Q: Will this policy change again?
**A:** This is the final policy. It's strict, clear, and designed for long-term stability. No more "smart" auto-population.

### Q: What if I want the old "smart defaults" behavior?
**A:** The old behavior was confusing and unpredictable. The new policy is better for trust and control. If you frequently use the same optimization settings, save a session as your starting point.

---

## Summary

**Simple Rule:** Optimization features are auto-populated **ONLY** from saved sessions or saved outputs. Everything else starts empty. Users enable what they need, manually.

This ensures clarity, trust, and reproducibility in every generation task.
