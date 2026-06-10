/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_ENABLED: string;
  // API keys are server-side only (stored in Supabase Edge Functions secrets)
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_GROK_API_KEY?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Google Analytics gtag types
interface Window {
  dataLayer: any[];
  gtag: (
    command: 'consent' | 'config' | 'event' | 'js',
    targetOrAction: string | Date,
    params?: Record<string, any>
  ) => void;
}