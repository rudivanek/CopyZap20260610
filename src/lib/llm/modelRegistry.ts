/**
 * Canonical LLM Model Registry for CopyZap
 *
 * SECURITY NOTE: Provider API keys live ONLY in the Supabase `ai-completion`
 * edge function (server-side). They are NEVER read or referenced in the browser.
 * Do not reintroduce any import.meta.env.VITE_*_API_KEY references here.
 *
 * DeepSeek is an internal fallback only - never shown in UI.
 */

export type Provider = 'anthropic' | 'openai' | 'deepseek';

export type AiEngine = 'claude' | 'openai';

export interface ModelConfig {
  provider: Provider;
  modelId: string;
  label: string;
  description: string;
  temperature: number;
  top_p?: number;
  maxTokens: number;
}

export interface EngineDefinition {
  engine: AiEngine;
  label: string;
  description: string;
  helperText: string;
  primary: ModelConfig;
  fallbackChain: ModelConfig[];
}

/**
 * Model configurations by provider
 */
const MODELS: Record<string, ModelConfig> = {
  // Claude - Pinned to 4.6 for stability
  'claude-sonnet-4-6': {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    label: 'Claude Sonnet 4.6',
    description: 'Best for persuasive, long-form, and premium copy',
    temperature: 0.3,
    top_p: 1.0,
    maxTokens: 64000,
  },

  // OpenAI - Stable GPT-4o
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
    label: 'GPT-4o',
    description: 'Best for structured and precise output',
    temperature: 0.45,
    top_p: 0.9,
    maxTokens: 16000,
  },

  // DeepSeek - Internal fallback only
  'deepseek-chat': {
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    label: 'DeepSeek V3',
    description: 'Internal fallback model',
    temperature: 0.65,
    top_p: 0.9,
    maxTokens: 8192,
  },
};

/**
 * Engine definitions exposed to UI
 */
export const ENGINES: Record<AiEngine, EngineDefinition> = {
  claude: {
    engine: 'claude',
    label: 'Claude',
    description: 'Anthropic Claude Sonnet 4.6',
    helperText: 'Best for persuasive, long-form, and premium copy.',
    primary: MODELS['claude-sonnet-4-6'],
    fallbackChain: [
      MODELS['claude-sonnet-4-6'],
      MODELS['gpt-4o'],
      MODELS['deepseek-chat'],
    ],
  },

  openai: {
    engine: 'openai',
    label: 'OpenAI',
    description: 'OpenAI GPT-4o',
    helperText: 'Best for structured and precise output.',
    primary: MODELS['gpt-4o'],
    fallbackChain: [
      MODELS['gpt-4o'],
      MODELS['claude-sonnet-4-6'],
      MODELS['deepseek-chat'],
    ],
  },
};

/**
 * Default engine for all new sessions
 */
export const DEFAULT_ENGINE: AiEngine = 'claude';

/**
 * Get engine configuration
 */
export function getEngineConfig(engine: AiEngine): EngineDefinition {
  return ENGINES[engine];
}

/**
 * Get model configuration by internal key
 */
export function getModelConfig(key: string): ModelConfig | undefined {
  return MODELS[key];
}

/**
 * Get primary model config for an engine
 */
export function getPrimaryModel(engine: AiEngine): ModelConfig {
  return ENGINES[engine].primary;
}

/**
 * Get fallback chain for an engine
 */
export function getFallbackChain(engine: AiEngine): ModelConfig[] {
  return ENGINES[engine].fallbackChain;
}

/**
 * Get all engines available in UI
 */
export function getAvailableEngines(): EngineDefinition[] {
  return Object.values(ENGINES);
}

/**
 * Map legacy model strings to new engine selection
 * Used for migration of persisted user settings
 */
export function migrateModelToEngine(legacyModel: string): AiEngine {
  const modelLower = legacyModel.toLowerCase();

  // Claude variants
  if (modelLower.includes('claude') || modelLower.includes('anthropic')) {
    return 'claude';
  }

  // OpenAI variants (including deprecated ones)
  if (
    modelLower.includes('gpt') ||
    modelLower.includes('openai') ||
    modelLower.includes('chatgpt')
  ) {
    return 'openai';
  }

  // DeepSeek or unknown -> default to Claude
  return DEFAULT_ENGINE;
}

/**
 * Provider availability.
 *
 * Keys live server-side in the edge function, so the browser cannot (and must
 * not) check for them. We assume providers are available; if a provider is
 * actually misconfigured server-side, the edge function returns a clear error.
 */
export function isProviderAvailable(_provider: Provider): boolean {
  return true;
}

/**
 * Check if an engine is available
 */
export function isEngineAvailable(engine: AiEngine): boolean {
  const config = getEngineConfig(engine);
  return isProviderAvailable(config.primary.provider);
}

/**
 * Deprecated: direct client-side API config.
 *
 * Kept only so any leftover importers don't break at build time. It no longer
 * references any API keys and will throw if called, because all LLM calls must
 * go through the Supabase `ai-completion` edge function.
 */
export function getProviderApiConfig(_provider: Provider): {
  apiKey: string;
  baseUrl: string;
  headers: HeadersInit;
} {
  throw new Error(
    'Direct client-side LLM calls are disabled. All requests must go through the Supabase ai-completion edge function.'
  );
}

/**
 * Error codes that should trigger fallback
 */
export const RETRIABLE_ERROR_CODES = [
  401, // Unauthorized
  403, // Forbidden
  429, // Rate limit
  503, // Service unavailable
  529, // Overload
];

/**
 * Check if an error should trigger fallback
 */
export function isRetriableError(error: any): boolean {
  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return true;
  }

  // HTTP status codes
  if (error.status && RETRIABLE_ERROR_CODES.includes(error.status)) {
    return true;
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return true;
  }

  return false;
}