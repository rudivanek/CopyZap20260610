# Phase 2A Credits Balance - Verification Guide

## Overview
Phase 2A adds a parallel "Credits Balance" system that displays monthly credits allowance WITHOUT affecting token-based access enforcement.

## Database Verification

### 1. Verify credits_* columns exist in pmc_users

```sql
-- Check that all credits columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pmc_users'
  AND column_name IN ('credits_allowed', 'credits_period_start_day', 'credits_rollover_enabled', 'credits_note')
ORDER BY column_name;
```

**Expected Output:**
```
column_name                | data_type | column_default | is_nullable
---------------------------|-----------|----------------|-------------
credits_allowed            | integer   | 0              | NO
credits_note               | text      | NULL           | YES
credits_period_start_day   | integer   | 1              | NO
credits_rollover_enabled   | boolean   | false          | NO
```

### 2. Verify rfv@datago.net has 20,000 credits assigned

```sql
-- Check credits plan for test user
SELECT
  email,
  credits_allowed,
  credits_period_start_day,
  credits_rollover_enabled,
  credits_note
FROM public.pmc_users
WHERE email = 'rfv@datago.net';
```

**Expected Output:**
```
email            | credits_allowed | credits_period_start_day | credits_rollover_enabled | credits_note
-----------------|-----------------|--------------------------|--------------------------|---------------------------
rfv@datago.net   | 20000           | 1                        | false                    | Phase 2A test account...
```

### 3. Verify period calculation correctness

For testing period calculation, use this SQL to see current period for rfv user:

```sql
-- This simulates the period calculation logic
-- Adjust for today's date
WITH user_settings AS (
  SELECT
    id,
    email,
    credits_period_start_day,
    credits_allowed
  FROM public.pmc_users
  WHERE email = 'rfv@datago.net'
),
period_calc AS (
  SELECT
    u.*,
    CASE
      WHEN EXTRACT(DAY FROM CURRENT_DATE) >= u.credits_period_start_day THEN
        DATE_TRUNC('month', CURRENT_DATE) + (u.credits_period_start_day - 1 || ' days')::INTERVAL
      ELSE
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + (u.credits_period_start_day - 1 || ' days')::INTERVAL
    END AS period_start,
    CASE
      WHEN EXTRACT(DAY FROM CURRENT_DATE) >= u.credits_period_start_day THEN
        DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + (u.credits_period_start_day - 1 || ' days')::INTERVAL - INTERVAL '1 second'
      ELSE
        DATE_TRUNC('month', CURRENT_DATE) + (u.credits_period_start_day - 1 || ' days')::INTERVAL - INTERVAL '1 second'
    END AS period_end
  FROM user_settings u
)
SELECT
  email,
  credits_allowed,
  credits_period_start_day,
  period_start,
  period_end,
  EXTRACT(DAY FROM (period_end - period_start)) + 1 AS days_in_period
FROM period_calc;
```

**Expected Output (example for January 16, 2026):**
```
email          | credits_allowed | credits_period_start_day | period_start        | period_end          | days_in_period
---------------|-----------------|--------------------------|---------------------|---------------------|----------------
rfv@datago.net | 20000           | 1                        | 2026-01-01 00:00:00 | 2026-01-31 23:59:59 | 31
```

### 4. Verify credits_used_in_period matches SUM(billable_units)

```sql
-- Get credits used in current period for rfv user
WITH user_settings AS (
  SELECT
    id,
    email,
    credits_period_start_day
  FROM public.pmc_users
  WHERE email = 'rfv@datago.net'
),
period_calc AS (
  SELECT
    u.*,
    CASE
      WHEN EXTRACT(DAY FROM CURRENT_DATE) >= u.credits_period_start_day THEN
        DATE_TRUNC('month', CURRENT_DATE) + (u.credits_period_start_day - 1 || ' days')::INTERVAL
      ELSE
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + (u.credits_period_start_day - 1 || ' days')::INTERVAL
    END AS period_start,
    CASE
      WHEN EXTRACT(DAY FROM CURRENT_DATE) >= u.credits_period_start_day THEN
        DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + (u.credits_period_start_day - 1 || ' days')::INTERVAL - INTERVAL '1 second'
      ELSE
        DATE_TRUNC('month', CURRENT_DATE) + (u.credits_period_start_day - 1 || ' days')::INTERVAL - INTERVAL '1 second'
    END AS period_end
  FROM user_settings u
)
SELECT
  p.email,
  p.period_start,
  p.period_end,
  COUNT(t.id) AS num_operations,
  COALESCE(SUM(t.billable_units), 0) AS credits_used_in_period,
  COALESCE(SUM(t.tokens_used), 0) AS tokens_used_in_period,
  COALESCE(SUM(t.cost_usd), 0) AS cost_in_period
FROM period_calc p
LEFT JOIN public.pmc_user_tokens_used t ON t.user_id = p.id
  AND t.created_at >= p.period_start
  AND t.created_at <= p.period_end
GROUP BY p.email, p.period_start, p.period_end;
```

**Expected Output (example):**
```
email          | period_start        | period_end          | num_operations | credits_used_in_period | tokens_used_in_period | cost_in_period
---------------|---------------------|---------------------|----------------|------------------------|----------------------|----------------
rfv@datago.net | 2026-01-01 00:00:00 | 2026-01-31 23:59:59 | 15             | 2500                   | 125000               | 0.50
```

## Manual Test Steps

### Test 1: Verify Dashboard Displays Credits Balance

1. Log in as rfv@datago.net
2. Navigate to Dashboard
3. **Verify**: You should see a new "Monthly Credits Balance" card with:
   - Credits Allowed: 20,000
   - Credits Used: (current usage)
   - Credits Remaining: (20,000 - current usage)
   - Period dates displayed
   - Note: "Phase 2A test account..."

### Test 2: Generate Copy and Verify Credits Update

1. Log in as rfv@datago.net
2. Navigate to Copy Maker
3. Generate 2-3 pieces of copy (different operations)
4. Return to Dashboard
5. **Verify**: Credits Used should increase by the billable_units consumed
6. **Verify**: Credits Remaining should decrease accordingly
7. **Verify**: The display updates automatically without refresh

### Test 3: Verify NO Enforcement When Credits Hit Zero

This is the CRITICAL test to ensure Phase 2A doesn't break token enforcement.

1. (Admin) Manually set credits_allowed to a very small number (e.g., 10) for test user:
   ```sql
   UPDATE public.pmc_users
   SET credits_allowed = 10
   WHERE email = 'rfv@datago.net';
   ```

2. Log in as rfv@datago.net
3. Generate copy until Credits Remaining shows 0 (or negative)
4. **VERIFY**: User can STILL generate copy (not blocked)
5. **VERIFY**: Credits Remaining shows 0 or negative value
6. **VERIFY**: Token enforcement still works (if tokens_remaining = 0, user IS blocked)

7. (Admin) Reset credits_allowed back to 20000:
   ```sql
   UPDATE public.pmc_users
   SET credits_allowed = 20000
   WHERE email = 'rfv@datago.net';
   ```

### Test 4: Verify User with No Credits Plan (credits_allowed = 0)

1. Create a new test user or use existing user with credits_allowed = 0
2. Log in as that user
3. Navigate to Dashboard
4. **Verify**: "Monthly Credits Balance" card displays:
   - "No credit plan assigned yet"
   - Shows credits_used_in_period (even though no plan assigned)
5. Generate some copy
6. **Verify**: Credits used increases, but no enforcement

### Test 5: Verify Period Calculation Accuracy

1. (Admin) Set credits_period_start_day to different values (1, 15, 28):
   ```sql
   UPDATE public.pmc_users
   SET credits_period_start_day = 15
   WHERE email = 'rfv@datago.net';
   ```

2. Log in as rfv@datago.net
3. Navigate to Dashboard
4. **Verify**: Period dates shown match the expected period based on start_day
5. **Verify**: Credits Used only counts billable_units from current period

### Test 6: Token Enforcement Still Works

1. (Admin) Set tokens_remaining to 0 for test user:
   ```sql
   UPDATE public.pmc_users
   SET tokens_remaining = 0
   WHERE email = 'rfv@datago.net';
   ```

2. Try to generate copy as rfv@datago.net
3. **VERIFY**: User IS blocked (token enforcement still active)
4. **VERIFY**: Credits balance still displays correctly

5. (Admin) Reset tokens_remaining:
   ```sql
   UPDATE public.pmc_users
   SET tokens_remaining = 1000000
   WHERE email = 'rfv@datago.net';
   ```

## Files Changed

### Database
- `supabase/migrations/[timestamp]_add_credits_balance_tracking.sql`

### Backend
- `src/services/supabaseClient.ts`
  - Added `CreditsBalance` interface
  - Added `computeCreditsPeriod()` function
  - Added `getCreditsBalance()` function

### Frontend
- `src/components/Dashboard.tsx`
  - Imported `getCreditsBalance` and `CreditsBalance`
  - Added `creditsBalance` state
  - Load credits balance on mount
  - Display "Monthly Credits Balance" card in UI

## Success Criteria

✅ All database columns exist with correct types and defaults
✅ rfv@datago.net has 20,000 credits assigned
✅ Period calculation correctly determines current billing cycle
✅ Credits used accurately sums billable_units from current period
✅ Dashboard displays credits balance with correct values
✅ Credits balance updates after generating copy
✅ User NOT blocked when credits_remaining = 0 (tokens still enforce)
✅ Users with credits_allowed = 0 see appropriate message
✅ Token enforcement completely unaffected by credits system
✅ Application builds without errors

## Phase 2A Completion Checklist

- [x] Database migration applied
- [x] Backend logic implemented
- [x] Frontend UI updated
- [ ] Manual tests passed
- [ ] Build verification passed
- [ ] Documentation updated

## Notes

- This is Phase 2A - **DISPLAY ONLY**
- NO enforcement based on credits_remaining
- tokens_remaining is still the ONLY access gate
- Phase 3 will add enforcement (separate migration plan required)
