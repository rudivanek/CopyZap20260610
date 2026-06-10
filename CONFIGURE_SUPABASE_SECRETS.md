# Configure Supabase API Keys (Secrets)

Your application is now configured to use Supabase Edge Functions for AI API calls. However, you need to configure the API keys as **secrets** in Supabase.

## Why You're Seeing "AI Model Unavailable"

The frontend validation passes (all models show as available), but when you click "Make Copy", the edge function returns a 401 error because the API keys aren't configured yet.

## How to Configure Secrets in Supabase

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Find your project ref in your Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`)

4. **Set the API key secrets**:
   ```bash
   # OpenAI (required for GPT models)
   supabase secrets set OPENAI_API_KEY=your_openai_api_key_here

   # Anthropic (required for Claude models)
   supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # DeepSeek (optional)
   supabase secrets set DEEPSEEK_API_KEY=your_deepseek_api_key_here

   # Grok/xAI (optional)
   supabase secrets set GROK_API_KEY=your_grok_api_key_here

   # Google (optional, for Gemini)
   supabase secrets set GOOGLE_API_KEY=your_google_api_key_here

   # Resend (required for welcome emails)
   supabase secrets set RESEND_API_KEY=your_resend_api_key_here
   ```

5. **Verify secrets are set**:
   ```bash
   supabase secrets list
   ```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Scroll to **Edge Function Secrets**
4. Add each secret:
   - Name: `OPENAI_API_KEY`, Value: `your_openai_api_key`
   - Name: `ANTHROPIC_API_KEY`, Value: `your_anthropic_api_key`
   - Name: `DEEPSEEK_API_KEY`, Value: `your_deepseek_api_key`
   - Name: `GROK_API_KEY`, Value: `your_grok_api_key`
   - Name: `GOOGLE_API_KEY`, Value: `your_google_api_key`
   - Name: `RESEND_API_KEY`, Value: `your_resend_api_key`

## Which API Keys Do You Need?

### AI Model Keys (Required for Content Generation)

You need **at least one** AI model API key configured. The application will use whichever models have keys configured:

- **OPENAI_API_KEY**: For GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **ANTHROPIC_API_KEY**: For Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.5
- **DEEPSEEK_API_KEY**: For DeepSeek V3 (also used as fallback if OpenAI fails)
- **GROK_API_KEY**: For Grok 4
- **GOOGLE_API_KEY**: For Gemini 2.0 Flash

### Email Service Key (Required for Welcome Emails)

- **RESEND_API_KEY**: For sending welcome emails to new users
  - Get your API key from [resend.com](https://resend.com)
  - You'll need to verify your domain or use their test domain
  - Without this key, signups will work but no welcome emails will be sent

## After Setting Secrets

1. The edge functions will automatically use the new secrets (no deployment needed)
2. Test by clicking "Make Copy" in the application
3. Check the edge function logs if there are still issues:
   ```bash
   supabase functions logs ai-completion
   ```

## Troubleshooting

### Check if secrets are loaded correctly

The edge function logs which API keys are available at startup. To see the logs:

```bash
supabase functions logs ai-completion --limit 50
```

Look for a log entry like:
```
API Keys available: { claude: true, openai: true, deepseek: false, grok: false, google: false }
```

### Common Issues

1. **"No API keys configured"**: You haven't set any secrets yet
2. **"Claude API key not configured"**: You selected Claude but haven't set `ANTHROPIC_API_KEY`
3. **"OpenAI API key not configured"**: You selected GPT but haven't set `OPENAI_API_KEY`

### Need to Remove Keys from .env?

Since the keys are now server-side, you can optionally remove them from `.env` (but keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`):

```env
# Keep these
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_ENABLED=true

# These can be removed (keys are now in Supabase secrets)
# VITE_OPENAI_API_KEY=...
# VITE_ANTHROPIC_API_KEY=...
# etc.
```

## Security Note

API keys stored as Supabase secrets are:
- ✅ Never exposed to the browser
- ✅ Never included in your frontend bundle
- ✅ Only accessible by your Edge Functions
- ✅ Not visible in your Git repository

This is much more secure than storing them in `.env` files!
