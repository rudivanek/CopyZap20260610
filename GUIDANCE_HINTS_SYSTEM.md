# Guidance Hints System - Developer Guide

A lightweight, config-driven transient hint system for contextual user guidance toasts.

## Architecture Overview

The system is built with three layers:

1. **Config Layer** (`src/config/guidanceHints.ts`) - Define hints
2. **Service Layer** (`src/utils/guidanceHintService.ts`) - Trigger and manage hints
3. **UI Layer** - Components for rendering and context

## Files

- `src/config/guidanceHints.ts` - Hint configuration and definitions
- `src/utils/guidanceHintService.ts` - Service for triggering/managing hints
- `src/context/GuidanceHintContext.tsx` - React context provider
- `src/components/shared/GuidanceToast.tsx` - Toast UI component
- `src/components/shared/GuidanceHintHost.tsx` - Toast host/renderer
- `src/main.tsx` - Provider integration
- `src/App.tsx` - Host component integration

## How to Use

### 1. Add or Edit Hint Text

Edit `src/config/guidanceHints.ts`:

```typescript
export const GUIDANCE_HINTS: Record<string, GuidanceHint> = {
  // Add your hint here
  my_hint_id: {
    id: 'my_hint_id',
    text: 'This is the text users will see', // <-- EDIT HERE
    durationMs: 6000,
    once: true,
    enabled: false, // <-- Set to true to enable
  },
};
```

**Key fields:**
- `text`: The message shown to users
- `durationMs`: Duration before auto-dismiss (6000 = 6 seconds)
- `once`: If true, hint shows only once per browser (stored in localStorage)
- `enabled`: Must be `true` to trigger (allows easy disable without code changes)

### 2. Enable a Hint

Set `enabled: true` in the hint config:

```typescript
after_generate: {
  id: 'after_generate',
  text: 'Click "Score" to evaluate quality...',
  durationMs: 6000,
  once: true,
  enabled: true, // <-- Enable here
},
```

### 3. Disable a Hint

Set `enabled: false` (no code removal needed):

```typescript
after_generate: {
  enabled: false, // <-- Disabled, won't trigger
},
```

### 4. Add a New Hint

1. Add to config in `src/config/guidanceHints.ts`
2. Set `enabled: false` initially
3. Later, integrate into product code (see Step 5)

### 5. Trigger a Hint in Product Code

Once hints are configured, integrate them into your product flows:

```typescript
import { triggerGuidanceHint } from '../utils/guidanceHintService';

// Trigger after user generates copy
const handleGenerate = async () => {
  // ... generation logic ...
  triggerGuidanceHint('after_generate'); // <-- Trigger hint
};

// Trigger after user scores output
const handleScore = () => {
  // ... scoring logic ...
  triggerGuidanceHint('after_score'); // <-- Trigger hint
};
```

**IMPORTANT:** No triggers are currently integrated into product code. This is done intentionally to keep the foundation clean and reversible.

## Features

### Auto-Dismiss
Hints automatically dismiss after `durationMs`. Users can also manually dismiss by clicking the X button.

### Show Once
If `once: true`, the hint shows only once per browser using localStorage. The key is `guidance_hints_shown`.

### Disable All Shown Hints (Dev)
In browser console:
```javascript
localStorage.removeItem('guidance_hints_shown');
```

Or programmatically:
```typescript
import { resetShownHints } from '../utils/guidanceHintService';
resetShownHints();
```

### Reset a Specific Hint
```typescript
import { resetSpecificHint } from '../utils/guidanceHintService';
resetSpecificHint('after_generate');
```

## Current Status

✓ Foundation complete
✓ Config layer ready
✓ Service layer ready
✓ UI components ready
✓ Provider integrated
✗ No triggers integrated yet (intentional)

Example hints in config:
- `after_generate` - Suggest clicking "Score" after generation
- `after_score` - Suggest comparing versions

Both are `enabled: false` by default.

## Testing the Foundation

1. In `src/config/guidanceHints.ts`, set a hint to `enabled: true`
2. Manually trigger in console:
   ```javascript
   const { triggerGuidanceHint } = await import('./utils/guidanceHintService');
   triggerGuidanceHint('after_generate');
   ```
3. Toast should appear at bottom-left with fade in/out animation
4. Can dismiss manually or wait for auto-dismiss

## Styling Toast Later

Edit `src/components/shared/GuidanceToast.tsx` for styling changes:
- Colors: Modify Tailwind classes in the component
- Position: Change in `GuidanceHintHost.tsx` if needed
- Animation: Adjust `motion.div` in GuidanceToast

## Reversibility

To remove the system entirely:
1. Delete `src/config/guidanceHints.ts`
2. Delete `src/utils/guidanceHintService.ts`
3. Delete `src/context/GuidanceHintContext.tsx`
4. Delete `src/components/shared/GuidanceToast.tsx`
5. Delete `src/components/shared/GuidanceHintHost.tsx`
6. Remove import/provider from `src/main.tsx`
7. Remove import/component from `src/App.tsx`
8. Remove any `triggerGuidanceHint()` calls from product code

Total removed: ~300 lines, all isolated.
