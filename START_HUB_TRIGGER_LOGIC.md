# Start Hub Trigger Logic Implementation

**Last Updated:** 2026-01-06

## Overview

Start Hub modal now appears at strategic "fresh start" moments when the user preference `show_start_hub` is `true` (default for new users).

## Trigger Points

### 1. **On Initial App Load**
- **When:** User opens the app and Copy Maker tab loads for the first time
- **Condition:** Form must be empty (no work in progress)
- **Location:** `CopyMakerTab.tsx` lines 410-436
- **Logic:**
  ```typescript
  // Only show on mount if form is empty
  if (!hasAnyPopulatedFields(formState)) {
    const prefs = await getUserPreferences(currentUser.id);
    if (!prefs || prefs.show_start_hub === true) {
      setShowStartHub(true);
    }
  }
  ```

### 2. **After Clearing All Fields**
- **When:** User clicks "Clear All" button
- **Condition:** Always (since fields are now empty)
- **Location:** `CopyMakerTab.tsx` lines 549-574
- **Logic:**
  ```typescript
  // Show Start Hub after clearing all fields
  const prefs = await getUserPreferences(currentUser.id);
  if (!prefs || prefs.show_start_hub === true) {
    setShowStartHub(true);
  }
  ```

### 3. **After Saving a Template**
- **When:** User successfully saves a template
- **Condition:** Always (they just finished organizing their work)
- **Location:** `App.tsx` lines 797-800
- **Logic:**
  ```typescript
  onSaveSuccess={() => {
    // Trigger Start Hub after saving template
    handleOpenStartHub();
  }}
  ```

### 4. **When Navigating to Copy Maker Tab**
- **When:** User navigates TO `/copy-maker` from another route
- **Condition:** Form must be empty (no work in progress)
- **Location:** `CopyMakerTab.tsx` lines 508-541
- **Logic:**
  ```typescript
  if (
    currentPath === '/copy-maker' &&
    previousPath &&
    previousPath !== '/copy-maker' &&
    currentUser?.id &&
    !hasAnyPopulatedFields(formState)
  ) {
    const prefs = await getUserPreferences(currentUser.id);
    if (!prefs || prefs.show_start_hub === true) {
      setShowStartHub(true);
    }
  }
  ```

### 5. **After Logging In**
- **When:** User successfully logs in
- **Condition:** Always (first action in a new session)
- **Location:** `App.tsx` lines 586-588
- **Logic:**
  ```typescript
  <Login onLogin={handleLogin} onLoginSuccess={() => {
    // Trigger Start Hub after successful login with a delay
    setTimeout(() => handleOpenStartHub(), 500);
  }} />
  ```

## When Start Hub Does NOT Appear

Start Hub is suppressed in these situations:
1. User has work in progress (form has populated fields)
2. User just loaded a template (already made a choice)
3. User just loaded a prefill (already made a choice)
4. User is viewing results
5. User has permanently disabled Start Hub via preferences (`show_start_hub = false`)

## User Preferences

### Database Schema
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  show_start_hub BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Migration Applied
The table was migrated from old `dismissed_start_hub` column to new `show_start_hub` column:
- Migration file: `migrate_user_preferences_show_start_hub.sql`
- Existing users who dismissed Start Hub: `show_start_hub = false`
- New users: `show_start_hub = true` (default)
- Applied: 2026-01-06

### Preference Check Logic
```typescript
const prefs = await getUserPreferences(currentUser.id);
// Show if preference is true OR if user has no preferences yet (new users)
if (!prefs || prefs.show_start_hub === true) {
  setShowStartHub(true);
}
```

### Disabling Start Hub Permanently
When user clicks "Don't show this again" in Start Hub modal:
```typescript
export const dismissStartHub = async (userId: string): Promise<boolean> => {
  return await updateUserPreferences(userId, {
    show_start_hub: false
  });
};
```

## Files Modified

1. **CopyMakerTab.tsx**
   - Updated mount effect to check if form is empty
   - Updated navigation effect to check if form is empty
   - Updated clear all effect
   - Changed all preference checks from `dismissed_start_hub !== true` to `show_start_hub === true`

2. **supabaseClient.ts**
   - Updated `UserPreferences` interface to use `show_start_hub: boolean`
   - Updated `dismissStartHub` function to set `show_start_hub: false`

3. **App.tsx**
   - Login trigger already existed (no changes needed)
   - Template save success trigger already existed (no changes needed)

## Design Principles

1. **Empty Slate Moments**: Show Start Hub when users are at a blank slate and need to decide "what should I work on next?"

2. **Respect User Intent**: Don't show Start Hub if user already made a choice (loaded template/prefill) or has work in progress

3. **Default Enabled**: New users see Start Hub by default to help with onboarding

4. **Permanent Opt-Out**: Users can permanently disable it if they don't find it helpful

5. **Preference-Based**: All triggers respect the user's `show_start_hub` preference
