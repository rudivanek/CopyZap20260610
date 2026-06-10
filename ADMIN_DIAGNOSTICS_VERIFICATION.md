# Admin Diagnostics & Verification System

**Created:** February 10, 2026
**Purpose:** Verify that the app_admins allowlist system is working correctly and prevent regression to hardcoded emails

---

## What Was Added

This implementation adds read-only diagnostic tools to verify admin authentication is working correctly. **No permissions, RLS policies, or admin logic were modified.**

### 1. Edge Function: `admin-ping`

**Location:** `supabase/functions/admin-ping/index.ts`

**Purpose:** Diagnostic endpoint that returns detailed information about admin status

**Behavior:**
- Requires authentication (JWT required)
- Uses existing `requireAdmin()` helper from `_shared/admin.ts`
- Returns comprehensive diagnostic information:
  - Whether user is admin (true/false)
  - Method used (allowlist, fallback, or none)
  - Details about allowlist record (if exists)
  - Fallback configuration status
  - Timestamps and error information

**Response Format:**
```json
{
  "ok": true,
  "isAdmin": true,
  "email": "user@example.com",
  "method": "allowlist",
  "timestamp": "2026-02-10T18:30:00.000Z",
  "details": {
    "allowlistRecord": {
      "email": "user@example.com",
      "isActive": true,
      "addedAt": "2026-02-10T12:00:00.000Z",
      "lastUpdated": "2026-02-10T12:00:00.000Z"
    },
    "fallbackConfigured": true,
    "note": "Admin access granted via app_admins allowlist"
  }
}
```

**Deployment Status:** ✅ Deployed and active

### 2. Admin Diagnostics Page

**Location:** `src/components/AdminDiagnostics.tsx`
**Route:** `/admin/diagnostics`

**Purpose:** Read-only dashboard showing admin authentication system status

**Features:**
- Shows current user email
- Displays frontend `isAdmin` status (from `useIsAdmin` hook)
- Calls and displays results from `admin-ping` edge function
- Calls and displays results from `is_app_admin()` RPC function
- Shows environment configuration (fallback present: yes/no)
- Refresh button to re-run all diagnostics

**Access:** Admin-only (uses `AuthenticatedRoute` wrapper)

**UI Sections:**
1. **Frontend Admin Check** - useIsAdmin hook result
2. **Edge Function Check** - admin-ping response with full details
3. **Database RPC Check** - is_app_admin() result
4. **Environment Configuration** - Fallback detection (boolean only, no secrets shown)

### 3. Regression Guard Script

**Location:** `check-hardcoded-admins.cjs`
**Command:** `npm run check:hardcoded-admins`

**Purpose:** Prevent accidental re-introduction of hardcoded admin emails

**Behavior:**
- Searches entire codebase for known admin email addresses
- Allows emails in specific locations:
  - `supabase/migrations/*.sql` (seeding app_admins)
  - `*.md` files (documentation)
  - The guard script itself
- Fails build if emails found in disallowed locations
- Provides clear error messages and remediation guidance

**Exit Codes:**
- `0` - No violations found (safe)
- `1` - Hardcoded emails found in disallowed locations (fail)

**Example Output:**
```
✅ Check passed: No hardcoded admin emails in disallowed locations.

✅ Found in allowed locations:
  Migration files seeding app_admins table:
    - supabase/migrations/20260210164209_update_rls_policies_use_app_admins.sql:15

  Documentation files:
    - ADMIN_SYSTEM_MIGRATION.md:42
```

---

## Environment Variables

The admin system supports optional emergency fallback environment variables. These are **ONLY** used when the database is unreachable or the allowlist query fails. During normal operation, the `app_admins` allowlist table is always the source of truth.

### Edge Functions Environment Variable

**Variable:** `ADMIN_EMAIL_FALLBACK`
**Example:** `rfv@datago.net`
**Purpose:** Emergency fallback for admin access when database is unreachable
**Behavior:**
- Used ONLY if the `app_admins` table query fails or times out
- Does NOT override the allowlist during normal operation
- Method will show "fallback" instead of "allowlist" if this is used
- Should be set to a trusted admin email address

**How to set:**
Configure in your Supabase Edge Functions environment (automatically done by Supabase).

### Frontend Environment Variable

**Variable:** `VITE_ADMIN_EMAIL_FALLBACK`
**Example:** `rfv@datago.net`
**Purpose:** Frontend consistency check during database outages
**Behavior:**
- Used ONLY if the `is_app_admin()` RPC call fails
- Does NOT change UI behavior during normal operation
- Should match the Edge Functions fallback email
- Admin diagnostics page will show "Emergency Fallback Configured: Yes" if set

**How to set:**
Add to your `.env` file:
```
VITE_ADMIN_EMAIL_FALLBACK=rfv@datago.net
```

### Important Notes

1. **Fallback is EMERGENCY ONLY:** The allowlist remains the primary admin source during normal operation
2. **No security reduction:** Fallback only activates when database is unreachable
3. **Diagnostics verification:** Admin diagnostics will show method = "allowlist" under normal conditions
4. **Not logged:** Fallback email is never logged or exposed in responses
5. **Optional but recommended:** System works without fallback, but it prevents lockouts during outages

---

## How to Use

### Accessing Admin Diagnostics

1. Login as an admin user
2. Navigate to: `/admin/diagnostics`
3. Page will automatically run all diagnostic checks
4. Click "Refresh Diagnostics" to re-run checks

### Running Regression Guard

**Manually:**
```bash
npm run check:hardcoded-admins
```

**In CI/CD:**
Add to your CI pipeline:
```yaml
- name: Check for hardcoded admin emails
  run: npm run check:hardcoded-admins
```

**Pre-commit Hook (optional):**
```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
npm run check:hardcoded-admins
```

---

## Verification Checklist

Use this checklist to verify the admin system is working correctly:

### ✅ 1. Admin User Testing

**Login as admin user and verify:**

- [ ] Navigate to `/admin/diagnostics`
- [ ] Page loads without errors
- [ ] "Frontend Admin Check" shows: **Admin** (green checkmark)
- [ ] "Edge Function Check" shows:
  - Status: **Admin** (green checkmark)
  - Method: **allowlist** (or **fallback** if using emergency fallback)
  - Details section shows allowlist record with `isActive: true`
- [ ] "Database RPC Check" shows:
  - Status: **Admin** (green checkmark)
  - RPC Success: **Yes**
- [ ] "Environment Configuration" shows fallback status (yes/no)

### ✅ 2. Non-Admin User Testing

**Login as non-admin user and verify:**

- [ ] Attempt to navigate to `/admin/diagnostics`
- [ ] Should be redirected or blocked (admin-only route)
- [ ] If somehow accessible, all checks should show: **Not Admin** (red X)

### ✅ 3. Admin Features Still Working

**Verify admin-only features remain functional:**

- [ ] Can access `/admin/users` (Manage Users)
- [ ] Can access `/admin/workflows` (Manage Workflows)
- [ ] Can toggle `is_public` on templates
- [ ] Can access pricing/billing admin features
- [ ] Can modify app_admins table entries

### ✅ 4. Edge Function Testing

**Test the admin-ping endpoint directly:**

```bash
# Get your access token from browser DevTools > Application > Local Storage
ACCESS_TOKEN="your_access_token_here"

curl -X POST \
  https://your-project.supabase.co/functions/v1/admin-ping \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected response (admin user):**
- Status: `200 OK`
- `isAdmin: true`
- `method: "allowlist"` or `"fallback"`

**Expected response (non-admin user):**
- Status: `403 Forbidden`
- `isAdmin: false`
- `method: "none"`

### ✅ 5. Regression Guard Testing

**Verify the regression guard works:**

```bash
# Should pass (no violations)
npm run check:hardcoded-admins
```

**Test it catches violations (optional):**

1. Add a test file with hardcoded email:
   ```bash
   echo "const admin = 'info@sharpen.studio';" > test-violation.js
   ```

2. Run check (should fail):
   ```bash
   npm run check:hardcoded-admins
   ```

3. Clean up:
   ```bash
   rm test-violation.js
   ```

### ✅ 6. Database Verification

**Check app_admins table:**

```sql
-- Should show active admin users
SELECT email, is_active, created_at, updated_at
FROM app_admins
WHERE is_active = true;
```

**Check is_app_admin() RPC function:**

```sql
-- Run as admin user (should return true)
SELECT is_app_admin();

-- Run as non-admin user (should return false)
SELECT is_app_admin();
```

---

## Troubleshooting

### Diagnostics Page Shows "Not Admin" for Admin User

**Possible causes:**

1. **User not in app_admins table**
   - Check: `SELECT * FROM app_admins WHERE email = 'user@example.com';`
   - Fix: Add user with `INSERT INTO app_admins (email, is_active) VALUES ('user@example.com', true);`

2. **User marked as inactive**
   - Check: `SELECT is_active FROM app_admins WHERE email = 'user@example.com';`
   - Fix: Update with `UPDATE app_admins SET is_active = true WHERE email = 'user@example.com';`

3. **Email case mismatch**
   - Admin check uses lowercase comparison
   - Ensure email in app_admins matches auth.users email (case-insensitive)

4. **RPC function not found**
   - Check: `SELECT * FROM pg_proc WHERE proname = 'is_app_admin';`
   - Fix: Re-run migration `20260210163509_add_app_admins_allowlist.sql`

### Edge Function Returns 403 for Admin User

**Possible causes:**

1. **Edge function not using latest code**
   - Redeploy: Run deployment script or use Supabase dashboard

2. **Service role key missing**
   - Check: Edge function environment has `SUPABASE_SERVICE_ROLE_KEY`
   - Fix: Supabase automatically configures this (should never be missing)

3. **Database connection issue**
   - Check edge function logs in Supabase dashboard
   - Look for connection errors or timeouts

### Regression Guard False Positives

**If script reports violations in legitimate files:**

1. Edit `check-hardcoded-admins.cjs`
2. Add file pattern to `ALLOWED_FILES` array:
   ```javascript
   {
     pattern: /path\/to\/file\.js$/,
     reason: 'Explanation why this file needs hardcoded email'
   }
   ```

### Frontend Hook Returns Wrong Status

**If `useIsAdmin()` doesn't match database:**

1. Clear browser cache and local storage
2. Re-login to refresh auth token
3. Check browser console for errors
4. Verify `is_app_admin()` RPC function exists and is callable

---

## Architecture Notes

### Admin Check Flow

```
User Login
    ↓
Frontend: useIsAdmin() hook
    ↓
Database: is_app_admin() RPC
    ↓
Query: app_admins table
    ↓
Fallback: ADMIN_EMAIL_FALLBACK env var (emergency only)
    ↓
Result: true/false
```

### Edge Function Admin Check

```
Client Request
    ↓
Edge Function: admin-ping
    ↓
Shared Helper: admin.ts / isAdminUser()
    ↓
Service Role Client: Query app_admins directly
    ↓
Fallback: ADMIN_EMAIL_FALLBACK env var (emergency only)
    ↓
Response: { isAdmin, method, details }
```

### Security Model

- **Primary:** app_admins table (allowlist with is_active flag)
- **Fallback:** Environment variable (database unreachable only)
- **RLS:** All policies use `is_app_admin()` RPC function
- **Edge Functions:** Use service-role client with shared `admin.ts` helper
- **Frontend:** Uses `useIsAdmin()` hook (calls `is_app_admin()` RPC)

---

## Files Changed

### New Files
- `supabase/functions/admin-ping/index.ts` - Diagnostic edge function
- `src/components/AdminDiagnostics.tsx` - Diagnostics page component
- `check-hardcoded-admins.cjs` - Regression guard script
- `ADMIN_DIAGNOSTICS_VERIFICATION.md` - This documentation

### Modified Files
- `src/App.tsx` - Added `/admin/diagnostics` route and lazy-loaded component
- `package.json` - Added `check:hardcoded-admins` script

### No Changes To
- RLS policies (unchanged)
- Admin permission logic (unchanged)
- Existing admin routes (unchanged)
- Database schema (unchanged)

---

## CI/CD Integration

### Recommended Pipeline Steps

1. **Before Deployment:**
   ```bash
   npm run check:hardcoded-admins
   ```
   Fails if hardcoded emails detected

2. **After Deployment:**
   - Navigate to `/admin/diagnostics`
   - Verify all checks pass
   - Save screenshot for deployment log

3. **Regular Monitoring:**
   - Schedule weekly check: Admin logs into diagnostics page
   - Verify all systems show green checkmarks
   - Report any anomalies

---

## Summary

This implementation provides:

✅ **Comprehensive diagnostics** for admin authentication system
✅ **Read-only verification** (no permission changes)
✅ **Regression prevention** (automated guard script)
✅ **Clear documentation** (verification checklist)
✅ **Production-ready** (deployed and tested)

The admin system now has robust verification tools while maintaining its secure, allowlist-based architecture.
