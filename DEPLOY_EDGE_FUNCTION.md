# Deploy Updated Edge Function - URGENT FIX

The `analyze-url` edge function has been updated to fix the **401 Invalid API Key** error.

## Problem Found

Your OpenAI API key is **INVALID** (error code: `invalid_api_key`, status: 401).

The error shows:
```
Error: 401 Incorrect API key provided: sk-proj-...nC8A
```

## What Changed

The edge function now:
- **Detects invalid OpenAI API keys** (401 errors with code `invalid_api_key`)
- **Automatically falls back to DeepSeek** when OpenAI key is invalid or missing
- Falls back on rate limits, quota issues, and server errors
- Uses DeepSeek as primary if no OpenAI key is configured
- Logs detailed error information including status codes and error types
- Alerts user `rfv@datago.net` when fallback is used

## Quick Fix Options

### Option 1: Deploy and Use DeepSeek (Recommended - Immediate Fix)

1. **Ensure DeepSeek API key is set** in Supabase Dashboard:
   - Go to: Project Settings → Edge Functions → Secrets
   - Add/verify: `DEEPSEEK_API_KEY`

2. **Deploy the updated function:**
   ```bash
   npx supabase functions deploy analyze-url
   ```

3. **The function will now automatically use DeepSeek** instead of the invalid OpenAI key

### Option 2: Fix OpenAI Key (Alternative)

1. **Get a new valid OpenAI API key** from https://platform.openai.com/api-keys
2. **Update in Supabase Dashboard**: Project Settings → Edge Functions → Secrets
3. **Update `OPENAI_API_KEY`** with the new key
4. Deploy the function (step 2 above)

3. **Verify Deployment**

   Check the Supabase dashboard → Edge Functions → analyze-url → Logs

   You should see logs like:
   - "API Keys available: { openai: true, deepseek: true }"
   - Either "Attempting request with OpenAI..." or "Using DeepSeek as primary API..."

## Testing

1. Use the wizard's "Analyze URL" feature with a valid URL
2. Check the browser console and Supabase function logs
3. For user `rfv@datago.net`, if fallback occurs:
   - Server logs will show: "🔄 FALLBACK ALERT: Using DeepSeek API for user rfv@datago.net"
   - Browser will show a blue toast notification

## Troubleshooting

If you still get "Failed to analyze URL":

1. **Check API Keys**
   - Verify keys are set in Supabase Dashboard
   - Test keys manually with curl:
     ```bash
     # Test OpenAI
     curl https://api.openai.com/v1/models \
       -H "Authorization: Bearer YOUR_OPENAI_KEY"

     # Test DeepSeek
     curl https://api.deepseek.com/v1/models \
       -H "Authorization: Bearer YOUR_DEEPSEEK_KEY"
     ```

2. **Check Function Logs**
   - Go to Supabase Dashboard → Edge Functions → analyze-url → Logs
   - Look for detailed error messages
   - Check which keys are detected: "API Keys available: { openai: ..., deepseek: ... }"

3. **Verify Deployment**
   - Ensure the function was deployed after the changes
   - Check the deployment timestamp in Supabase dashboard

## Key Environment Variables

These are automatically available in Supabase Edge Functions:
- `SUPABASE_URL` - Auto-populated
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-populated
- `OPENAI_API_KEY` - **You must set this** (or use DeepSeek only)
- `DEEPSEEK_API_KEY` - **You must set this**

## Notes

- The function will work with ONLY DeepSeek if OpenAI key is not set
- DeepSeek has a max_tokens limit of 8000 (OpenAI's gpt-4o-mini is 16000)
- Token costs are tracked per model used
- User alert only shows for fallback scenarios (not when DeepSeek is primary)
