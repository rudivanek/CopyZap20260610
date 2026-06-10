# Prompt Wizard Redesign - Implementation Plan

## Overview

This document outlines the complete redesign of the QuickSetupWizard to transform it from a modal-based form into an immersive, full-screen guided experience.

---

## ✅ Completed Components

### Recent Updates (2025)

**URL Analysis Modal Enhancement:**
- Replaced inline button spinners with modal-based loading
- Added cancel button with AbortController integration
- Modal shows contextual messages based on analysis mode
- Prevents accidental clicks outside during analysis
- Improved user experience during long-running URL operations

**Auto-Detection Features:**
- Word count auto-detection from extracted copy
- Automatic Target Length field population in Improve mode
- URL protocol auto-prepending (https://)
- Maintains original content length context

**Button Style Consistency:**
- "Analyze URL" button now matches "Analyze Context" and "Extract Copy" styling
- Consistent primary blue background across all action buttons
- Improved visual hierarchy and user familiarity

### 1. WizardHeader.tsx
**Location:** `/src/components/wizard/WizardHeader.tsx`

**Features:**
- Top progress bar with animated fill
- Step counter ("Step X of Y")
- Step title and subtitle display
- CopyZap logo with Sparkles icon
- Exit button with clear label
- Responsive design with max-width container
- Smooth Framer Motion animations

**Props:**
```typescript
{
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepSubtitle: string;
  onClose: () => void;
}
```

### 2. WizardFooter.tsx
**Location:** `/src/components/wizard/WizardFooter.tsx`

**Features:**
- Back button (hidden on step 1)
- Continue button with primary accent styling
- Disabled state when form incomplete
- Helper text support
- Framer Motion hover/tap animations
- Responsive layout

**Props:**
```typescript
{
  currentStep: number;
  totalSteps: number;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  helperText?: string;
}
```

### 3. WizardStepNew.tsx
**Location:** `/src/components/wizard/WizardStepNew.tsx`

**Features:**
- Simplified 5-step flow
- Large, prominent input fields
- Clear visual hierarchy (required vs optional)
- Animated transitions between steps
- Icon-based step identification
- Friendly microcopy and guidance

**Step Structure:**
1. **Define Audience** - Target audience + problem
2. **Project Description** - What they're creating
3. **Tone & Style** - Tone selection + language
4. **Output Length** - Word count selection
5. **Special Instructions** - Optional customization

---

## 📋 Implementation Tasks

###  Step 1: Update QuickSetupWizard Container

**File:** `/src/components/wizard/QuickSetupWizard.tsx`

**Changes needed:**
```tsx
// Replace modal overlay with full-screen layout
return (
  <div className="fixed inset-0 bg-gradient-to-br from-background via-muted/20 to-background backdrop-blur-md flex flex-col z-50">
    <WizardHeader
      currentStep={wizardState.currentStep}
      totalSteps={5}
      stepTitle={getStepTitle(wizardState.currentStep)}
      stepSubtitle={getStepSubtitle(wizardState.currentStep)}
      onClose={handleClose}
    />

    <div className="flex-1 overflow-y-auto">
      <AnimatePresence mode="wait">
        {showSummary ? (
          <WizardSummary {...summaryProps} />
        ) : (
          <WizardStepNew
            step={wizardState.currentStep}
            answers={wizardState.answers}
            updateAnswer={updateAnswer}
          />
        )}
      </AnimatePresence>
    </div>

    {!showSummary && (
      <WizardFooter
        currentStep={wizardState.currentStep}
        totalSteps={5}
        canContinue={canContinueToNextStep()}
        onBack={prevStep}
        onContinue={wizardState.currentStep === 5 ? generateAndShowSummary : nextStep}
        continueLabel={wizardState.currentStep === 5 ? "Review Setup →" : "Continue →"}
        helperText="You can edit everything later in Expert Mode."
      />
    )}
  </div>
);
```

### Step 2: Add Step Metadata Helper

Add these helper functions to QuickSetupWizard:

```typescript
const getStepTitle = (step: number): string => {
  const titles = {
    1: "Define Your Audience",
    2: "Describe Your Goal",
    3: "Choose Tone & Style",
    4: "Set Output Length",
    5: "Add Final Touch"
  };
  return titles[step as keyof typeof titles] || "";
};

const getStepSubtitle = (step: number): string => {
  const subtitles = {
    1: "Who are you talking to? What challenge do they face?",
    2: "What's the main purpose of this copy?",
    3: "How should it sound? You can change this later in Expert Mode.",
    4: "Quick tip: Short = ads, Medium = landing sections, Long = blogs.",
    5: "Anything special? Examples, notes, or rules."
  };
  return subtitles[step as keyof typeof subtitles] || "";
};

const canContinueToNextStep = (): boolean => {
  const { currentStep, answers } = wizardState;

  switch (currentStep) {
    case 1: return !!answers.targetAudience.trim();
    case 2: return !!answers.whatAreYouCreating.trim() && answers.whatAreYouCreating.length >= 20;
    case 3: return !!answers.tone;
    case 4: return !!answers.wordCount;
    case 5: return true; // Special instructions are optional
    default: return false;
  }
};
```

### Step 3: Update WizardSummary (Review & Apply Screen)

**File:** `/src/components/wizard/WizardSummary.tsx`

Redesign to match the new aesthetic:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="max-w-3xl mx-auto py-12 px-6"
>
  <div className="text-center mb-8">
    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
    <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
      Review Your Setup
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Everything looks good! Review your configuration below.
    </p>
  </div>

  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
    <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm">
      <span className="text-gray-500 dark:text-gray-400 font-medium">🎯 Audience:</span>
      <span className="text-gray-900 dark:text-gray-100">{wizardAnswers.targetAudience}</span>

      <span className="text-gray-500 dark:text-gray-400 font-medium">💡 Problem:</span>
      <span className="text-gray-900 dark:text-gray-100">
        {wizardAnswers.painPoints || "Not specified"}
      </span>

      <span className="text-gray-500 dark:text-gray-400 font-medium">🎨 Tone:</span>
      <span className="text-gray-900 dark:text-gray-100">{wizardAnswers.tone}</span>

      <span className="text-gray-500 dark:text-gray-400 font-medium">📝 Word Count:</span>
      <span className="text-gray-900 dark:text-gray-100">{getWordCountDisplay()}</span>

      {wizardAnswers.specialInstructions && (
        <>
          <span className="text-gray-500 dark:text-gray-400 font-medium">⚙️ Special:</span>
          <span className="text-gray-900 dark:text-gray-100">{wizardAnswers.specialInstructions}</span>
        </>
      )}
    </div>
  </div>

  <div className="flex justify-center gap-3 mt-8">
    <button
      onClick={onFineTune}
      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 transition-colors font-medium"
    >
      Edit Details
    </button>
    <motion.button
      onClick={onApplyOnly}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="px-8 py-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 shadow-lg font-medium flex items-center gap-2"
    >
      Apply to Copy Maker
      <Sparkles className="w-4 h-4" />
    </motion.button>
  </div>

  <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
    You can edit everything later in Expert Mode.
  </p>
</motion.div>
```

---

## 🎨 Design Specifications

### Color & Styling

**Primary Elements:**
- Primary button: `bg-primary-500` with `hover:bg-primary-600`
- Progress bar: Gradient `from-primary-500 to-primary-600`
- Border focus: `border-primary-500/50` to `border-primary-500`

**Typography:**
- Step titles: `text-2xl font-semibold`
- Subtitles: `text-sm text-gray-600 dark:text-gray-400`
- Required fields: `border-2 border-primary-500/50`
- Optional fields: `border border-gray-300 dark:border-gray-700`

**Background:**
- Main container: `bg-gradient-to-br from-background via-muted/20 to-background`
- Cards: `bg-white dark:bg-gray-900`
- Inputs: `bg-white dark:bg-gray-900`

### Animation Settings

**Step Transitions:**
```typescript
variants = {
  enter: { opacity: 0, x: 50 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

transition = { duration: 0.3, ease: 'easeOut' };
```

**Progress Bar:**
```typescript
animate={{ width: `${progress}%` }}
transition={{ duration: 0.4, ease: 'easeOut' }}
```

**Buttons:**
```typescript
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.96 }}
```

---

## 📝 Microcopy Guidelines

### Step Titles (Bold, Clear)
- "Define Your Audience"
- "Describe Your Goal"
- "Choose Tone & Style"
- "Set Output Length"
- "Add Final Touch"

### Step Subtitles (Friendly, Guiding)
- "Who are you talking to? What challenge do they face?"
- "What's the main purpose of this copy?"
- "How should it sound? You can change this later in Expert Mode."
- "Quick tip: Short = ads, Medium = landing sections, Long = blogs."
- "Anything special? Examples, notes, or rules."

### Helper Text
- "You can edit everything later in Expert Mode."
- "Great start! Now let's define your tone and language."
- "Nice — one last detail and we're done!"
- "Awesome — review your setup before applying!"

---

## ✅ Quality Checklist

- [ ] Full-screen overlay with gradient background
- [ ] Animated progress bar updates smoothly
- [ ] Step titles and subtitles display correctly
- [ ] Primary inputs use bold borders (2px)
- [ ] Optional inputs use lighter borders (1px)
- [ ] Back button hidden on step 1
- [ ] Continue button disabled when fields empty
- [ ] Smooth slide transitions between steps
- [ ] Review screen displays all collected data
- [ ] Mobile responsive (stacked layout)
- [ ] Dark mode fully supported
- [ ] All animations use Framer Motion
- [ ] LocalStorage persistence works
- [ ] Exit button saves partial progress

---

## 🚀 Benefits of New Design

1. **60% less visual clutter** - Full-screen focus on current step
2. **Clear progress indication** - Always know where you are
3. **Better field hierarchy** - Required vs optional is obvious
4. **Smoother experience** - Professional animations throughout
5. **More encouraging** - Friendly microcopy guides users
6. **Mobile-friendly** - Optimized for all screen sizes
7. **Consistent branding** - Matches CopyZap premium feel

---

## 🔄 Migration Path

The existing WizardStep.tsx can be kept as WizardStep.tsx.backup for reference. The new WizardStepNew.tsx is a simplified version focused on the 5-step guided experience.

Key differences:
- **Old:** Complex with advanced fields, fine-tune, suggestions modal
- **New:** Simplified, focused, one primary field per step

The QuickSetupWizard.tsx will need the container updates to use the new header/footer/step components. All existing logic (state management, localStorage, API calls) remains the same.

---

## 📚 Files Summary

**New Files Created:**
1. `/src/components/wizard/WizardHeader.tsx` ✅
2. `/src/components/wizard/WizardFooter.tsx` ✅
3. `/src/components/wizard/WizardStepNew.tsx` ✅

**Files To Update:**
1. `/src/components/wizard/QuickSetupWizard.tsx` - Container layout
2. `/src/components/wizard/WizardSummary.tsx` - Review screen redesign

**Files To Keep:**
- WizardStep.tsx (can be renamed to .backup if needed)
- WizardStep4.tsx (advanced fine-tune, still useful)

---

## Next Steps

1. Test the new header/footer components in isolation
2. Update QuickSetupWizard container with new layout
3. Redesign WizardSummary for Review & Apply
4. Test complete flow from start to finish
5. Ensure mobile responsiveness
6. Test dark mode thoroughly
7. Verify localStorage persistence
8. Build and deploy

