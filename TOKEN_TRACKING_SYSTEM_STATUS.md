# Token Tracking System - Status & Monitoring Guide

**Last Updated:** February 10, 2026
**Status:** ✅ **HEALTHY & OPERATIONAL**

---

## Current System Status

### ✅ Token Tracking is Working Correctly

**Evidence:**
- Latest successful tracking: February 10, 2026 at 18:21:57 UTC
- Record properly linked to session (no orphaned records)
- Billable units correctly calculated (11 units)
- Cost tracking working ($0.01 USD)
- Edge function deployed and active
- RLS policies correct (SELECT-only for users, INSERT via service role)

### Historical Data Loss (Resolved)

**What Happened:**
- On December 23, 2025, 904 token tracking records were deleted
- This was related to a cleanup migration that ran multiple times or had cascading effects
- All historical data before February 10, 2026 is lost
- **Current system is protected against this happening again**

**Root Cause:**
- Session cleanup migration deleted empty sessions
- Some records may have been manually cleaned up
- Foreign key relationships triggered cascading deletes

**Resolution:**
- Foreign key constraints now use `SET NULL` instead of `CASCADE` for session_id
- Token records persist even if sessions are deleted
- Cleanup migrations are one-time only
- System now has proper safeguards

---

## System Architecture

### Data Flow

```
Frontend → Edge Function (track-tokens) → Database (pmc_user_tokens_used)
   ↓              ↓ (service role key)              ↓
  User       Bypasses RLS                    Persistent record
```

### Key Components

1. **Frontend Service** (`tokenTracking.ts`)
   - Calls edge function with anon key
   - Includes session_id validation
   - Retries on failure (3 attempts)
   - Tracks failed attempts in queue

2. **Edge Function** (`track-tokens`)
   - Uses service role key (bypasses RLS)
   - Calculates billable units from cost
   - Auto-creates session if missing
   - Records token breakdown (input/output/reasoning)

3. **Database Table** (`pmc_user_tokens_used`)
   - RLS enabled with SELECT-only policies
   - INSERT restricted to service role (edge functions)
   - Foreign keys: user_id (CASCADE), session_id (SET NULL)
   - Tracks cost, billable units, token breakdown

### Security Model

**RLS Policies:**
- ✅ Users can SELECT their own records
- ✅ Admins can SELECT all records
- ❌ No INSERT policy (service role only)
- ❌ No UPDATE policy (immutable records)
- ❌ No DELETE policy (preserve history)

**Why This Works:**
- Edge functions use service role key
- Service role bypasses RLS completely
- Frontend cannot insert directly
- All tracking goes through edge function

---

## Monitoring & Health Checks

### Daily Health Check Query

Run this query to verify the system is working:

```sql
SELECT
  COUNT(*) as total_records_24h,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as records_last_hour,
  COUNT(CASE WHEN session_id IS NULL THEN 1 END) as orphaned_records,
  COUNT(CASE WHEN session_id IS NOT NULL THEN 1 END) as linked_records,
  SUM(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN cost_usd ELSE 0 END) as cost_last_hour,
  SUM(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN billable_units ELSE 0 END) as units_last_hour,
  MAX(created_at) as latest_tracking_timestamp
FROM pmc_user_tokens_used
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Expected Results

**Healthy System:**
- `records_last_hour` > 0 (if users are active)
- `orphaned_records` = 0 (all linked to sessions)
- `latest_tracking_timestamp` recent (within last hour during active use)

**Warning Signs:**
- No records in last hour (if users are active)
- High number of orphaned records (session linkage broken)
- No records in last 24 hours (tracking completely stopped)

### Edge Function Status

Check if the edge function is deployed:

```bash
# Via Supabase Dashboard
https://supabase.com/dashboard/project/gsismfzlmmtxmuzommya/functions

# Expected: track-tokens should be ACTIVE
```

---

## Troubleshooting Guide

### Issue: No Token Records Being Created

**Diagnosis:**
```sql
-- Check if edge function is being called (check logs in Supabase Dashboard)
-- Check if sessions are being created
SELECT COUNT(*) FROM pmc_copy_sessions WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Possible Causes:**
1. Edge function not deployed → Deploy track-tokens function
2. Frontend not calling edge function → Check network tab
3. Service role key missing → Check Supabase environment variables
4. RLS blocking inserts → Should NOT happen (service role bypasses RLS)

**Solution:**
1. Verify edge function is deployed and active
2. Check frontend console for errors
3. Verify service role key is set in edge function environment

### Issue: Orphaned Records (session_id = NULL)

**Diagnosis:**
```sql
SELECT COUNT(*)
FROM pmc_user_tokens_used
WHERE session_id IS NULL
  AND created_at > NOW() - INTERVAL '24 hours';
```

**Possible Causes:**
1. Sessions being deleted after token tracking
2. Frontend not passing session_id
3. Auto-create session logic failing

**Solution:**
1. Check foreign key constraint is SET NULL (not CASCADE)
2. Verify frontend always passes session_id
3. Check edge function auto-create logic

### Issue: Tracking Failures

**Diagnosis:**
```typescript
// In browser console
import { getTrackingQueueStatus } from './services/api/tokenTracking';
console.log(getTrackingQueueStatus());
```

**Possible Causes:**
1. Network issues
2. Edge function errors
3. Database constraints violated

**Solution:**
1. Check edge function logs in Supabase Dashboard
2. Verify database constraints are satisfied
3. Check network connectivity

---

## Database Schema Reference

### Table: pmc_user_tokens_used

```sql
CREATE TABLE pmc_user_tokens_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pmc_users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES pmc_copy_sessions(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL,
  model TEXT NOT NULL,
  cost_usd NUMERIC(10, 8) NOT NULL,
  billable_units INTEGER NOT NULL DEFAULT 0,
  billing_rule_name TEXT NOT NULL DEFAULT 'default',
  pricing_tier TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Token breakdown (optional)
  input_tokens_used INTEGER,
  output_tokens_used INTEGER,
  reasoning_tokens_used INTEGER,

  -- Pricing metadata
  cost_source TEXT,
  pricing_row_id UUID REFERENCES llm_model_pricing(id) ON DELETE NO ACTION
);
```

### Foreign Key Behavior

| Column | References | On Delete | Purpose |
|--------|-----------|-----------|---------|
| user_id | pmc_users.id | CASCADE | Remove all user data when user deleted |
| session_id | pmc_copy_sessions.id | SET NULL | Keep token records even if session deleted |
| pricing_row_id | llm_model_pricing.id | NO ACTION | Preserve pricing reference |

---

## Maintenance Tasks

### Weekly
- [ ] Run health check query
- [ ] Verify recent tracking records exist
- [ ] Check for orphaned records

### Monthly
- [ ] Review token tracking statistics
- [ ] Check edge function logs for errors
- [ ] Verify billing unit calculations are accurate

### Quarterly
- [ ] Audit RLS policies
- [ ] Review foreign key constraints
- [ ] Check for database performance issues

---

## Future Improvements

### Recommended Enhancements

1. **Automated Monitoring**
   - Set up alerts for no tracking in 1 hour
   - Alert on high orphan record count
   - Monitor edge function error rate

2. **Better Logging**
   - Add structured logging to edge function
   - Log all tracking attempts (success + failure)
   - Create audit trail for debugging

3. **Performance Optimization**
   - Add index on (user_id, created_at)
   - Consider partitioning by month
   - Archive old records (> 1 year)

4. **Redundancy**
   - Add backup tracking mechanism
   - Store failed tracking attempts in database
   - Implement automatic retry from database queue

---

## Contact & Support

**For Issues:**
1. Check this documentation first
2. Run health check queries
3. Review edge function logs
4. Contact system administrator

**System Administrator:**
- Email: info@sharpen.studio
- Dashboard: https://supabase.com/dashboard/project/gsismfzlmmtxmuzommya

---

## Change Log

### February 10, 2026
- ✅ System verified as healthy and operational
- ✅ Latest tracking record confirmed (18:21:57 UTC)
- ✅ All foreign key constraints verified
- ✅ RLS policies confirmed correct
- ✅ Edge function deployment verified
- ℹ️ Historical data loss documented (904 records lost from before Feb 10)
- ℹ️ System safeguards in place to prevent future data loss
