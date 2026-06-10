# Email Verification Setup Instructions

## Problem
Previously, users could sign up with ANY email address (even fake ones) without verification. This has been fixed in the code, but you need to enable email confirmation in Supabase.

## Solution Implemented
✅ Updated `CreateAccount.tsx` to handle email confirmation flow
✅ Updated `Login.tsx` to block unverified emails from signing in
✅ Users now see a message to check their email after signup

## Required: Enable Email Confirmation in Supabase Dashboard

### Steps:

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard

2. **Select your project**

3. **Go to Authentication Settings**
   - In the left sidebar, click **Authentication**
   - Click **Settings** (should be under the Authentication section)
   - Or directly navigate to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/settings`

4. **Enable Email Confirmation**
   - Scroll down to the **"Email Auth"** section
   - Find the setting: **"Confirm email"**
   - **Enable/Toggle it ON**
   - Click **Save** if there's a save button

5. **Verify Email Templates (Optional but Recommended)**
   - Go to **Authentication** > **Email Templates**
   - Check the **"Confirm signup"** template
   - Customize if needed (company name, branding, etc.)

### What This Does:

- **Before**: Anyone could sign up with `billgates@microsoft.com` and get instant access
- **After**: Users must click a confirmation link sent to their email before they can sign in

### How It Works Now:

1. User signs up with email/password
2. They see: "✅ Account created! Please check your email and click the confirmation link..."
3. Supabase sends a confirmation email
4. User clicks the link in their email
5. Email is verified and they're redirected to `/login`
6. User can now sign in normally

### Testing:

After enabling email confirmation:

1. Try creating a new account with a **real email you own**
2. You should receive a confirmation email
3. Click the link in the email
4. You should be redirected to the login page
5. Sign in with your credentials
6. You should be able to access the app

### Important Notes:

- **Google OAuth is NOT affected** - Google already verifies emails, so those users can sign in immediately
- **Existing users** who signed up before this change will still work (they're grandfathered in)
- **New signups** from now on MUST verify their email

## Troubleshooting

### If confirmation emails aren't being sent:

1. Check **Authentication** > **Settings** > **SMTP Settings**
2. Make sure your email provider is configured
3. Check spam/junk folders
4. For development, you can check the Supabase logs: **Authentication** > **Users** > click on a user to see their confirmation status

### If you want to manually verify a user (for testing):

1. Go to **Authentication** > **Users**
2. Click on the user
3. Find "Email Confirmed" and manually toggle it to confirmed
4. Or delete the test user and try again

---

**Status**: ✅ Code changes complete - Just need to enable the setting in Supabase Dashboard
