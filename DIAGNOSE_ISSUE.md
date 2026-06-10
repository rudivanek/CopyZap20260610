# Diagnose "Failed to analyze URL" Issue

## Step 1: Check if Edge Function is Deployed

The updated code is in the local files but **MUST BE DEPLOYED** to Supabase to work.

Run this command:
```bash
npx supabase functions deploy analyze-url
```

You should see output like:
```
Deploying Function analyze-url
...
Deployed Function analyze-url with version: XX
```

## Step 2: Verify Environment Variables

Go to Supabase Dashboard:
1. Navigate to: **Project Settings → Edge Functions → Secrets**
2. Check if these variables exist:
   - `OPENAI_API_KEY` (currently invalid, but that's ok)
   - `DEEPSEEK_API_KEY` ← **THIS IS CRITICAL**

If `DEEPSEEK_API_KEY` is missing:
1. Click "Add Secret"
2. Name: `DEEPSEEK_API_KEY`
3. Value: Your DeepSeek API key
4. Save

## Step 3: Check Function Logs After Deploying

After deploying, test the URL analyzer and then:

1. Go to: **Supabase Dashboard → Edge Functions → analyze-url → Logs**
2. Look for these messages:

**Expected logs when working:**
```
API Keys available: { openai: true, deepseek: true }
Attempting request with OpenAI...
OpenAI error details: { status: 401, code: 'invalid_api_key', ... }
Fallback decision: { shouldFallback: true, deepseekAvailable: true, errorStatus: 401, errorCode: 'invalid_api_key' }
Attempting fallback to DeepSeek...
DeepSeek request successful
```

**If you see this - DeepSeek key is MISSING:**
```
Fallback decision: { shouldFallback: true, deepseekAvailable: false }
```

## Step 4: Test Deployment Version

To verify the new code is deployed, check the logs for this new message that only exists in the updated version:
```
Fallback decision: { shouldFallback: ..., deepseekAvailable: ..., errorStatus: ..., errorCode: ... }
```

If you DON'T see this message format, the old version is still deployed.

## Common Issues

### Issue: "Still getting Failed to analyze URL"

**Cause 1: Function not deployed**
- Solution: Run `npx supabase functions deploy analyze-url`

**Cause 2: DEEPSEEK_API_KEY is not set**
- Solution: Add it in Supabase Dashboard → Edge Functions → Secrets

**Cause 3: Old version is cached**
- Solution: Wait 1-2 minutes after deployment, or restart the function

**Cause 4: DeepSeek API key is also invalid**
- Solution: Verify your DeepSeek key at https://platform.deepseek.com
- Test it with:
  ```bash
  curl https://api.deepseek.com/v1/models \
    -H "Authorization: Bearer YOUR_DEEPSEEK_KEY"
  ```

## Quick Test Commands

**Test if function has new code (look for detailed error logging):**
```bash
# Look at most recent function logs
# New version will show: "Fallback decision: { ... }"
# Old version will NOT have this message
```

**Verify API keys are set:**
```bash
# In Supabase dashboard, you should see both:
# - OPENAI_API_KEY (exists but invalid)
# - DEEPSEEK_API_KEY (must exist and be valid)
```

## Still Not Working?

Send me the logs from Supabase Dashboard → Edge Functions → analyze-url → Logs after:
1. Deploying the function
2. Attempting to analyze a URL

I need to see:
- "API Keys available: { ... }"
- "Fallback decision: { ... }"
- Any error messages
