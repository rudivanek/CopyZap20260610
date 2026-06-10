import { Model } from '../../types';

export interface ModelValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AvailableModelsResult {
  availableModels: Array<{
    model: Model;
    label: string;
    isAvailable: boolean;
  }>;
  hasAnyAvailable: boolean;
}

const MODEL_LABELS: Record<Model, string> = {
  'claude-sonnet-4-5': 'Claude Sonnet 4.5',
  'claude-haiku-4-5': 'Claude Haiku 4.5',
  'claude-opus-4-5': 'Claude Opus 4.5',
  'gpt-4o': 'ChatGPT (GPT-4o)',
  'chatgpt-4o-latest': 'ChatGPT-4o Latest',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'deepseek-chat': 'DeepSeek V3',
  'grok-4-latest': 'Grok 4',
  'gemini-2.0-flash': 'Gemini 2.0 Flash'
};

export async function validateApiKey(model: Model): Promise<ModelValidationResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseEnabled = import.meta.env.VITE_SUPABASE_ENABLED;

  // If Supabase is enabled, all models are available through edge functions
  // API keys are stored server-side in Supabase Edge Functions secrets
  if (supabaseUrl && supabaseEnabled === 'true') {
    console.log(`✅ ${MODEL_LABELS[model]} - Available via Supabase Edge Functions`);
    return { isValid: true };
  }

  // Legacy validation for direct API calls (when Supabase is not enabled)
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  const grokKey = import.meta.env.VITE_GROK_API_KEY;
  const googleKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  let apiKey: string | undefined;
  let baseUrl: string;
  let testEndpoint: string;

  const modelLabel = MODEL_LABELS[model] || model;

  switch (model) {
    case 'claude-sonnet-4-5':
    case 'claude-haiku-4-5':
    case 'claude-opus-4-5':
      if (!anthropicKey) {
        return {
          isValid: false,
          error: `${modelLabel} requires an Anthropic API key.`
        };
      }
      console.log(`✅ ${modelLabel} - API key found`);
      return { isValid: true };
    case 'deepseek-chat':
      apiKey = deepseekKey;
      baseUrl = 'https://api.deepseek.com/v1';
      testEndpoint = '/models';
      break;
    case 'grok-4-latest':
      apiKey = grokKey;
      baseUrl = 'https://api.x.ai/v1';
      testEndpoint = '/models';
      break;
    case 'gemini-2.0-flash':
      if (!googleKey) {
        return {
          isValid: false,
          error: `${modelLabel} not available now.`
        };
      }
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${googleKey}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        if (response.ok) {
          return { isValid: true };
        }
        return {
          isValid: false,
          error: `${modelLabel} not available now.`
        };
      } catch (error: any) {
        return {
          isValid: false,
          error: `${modelLabel} not available now.`
        };
      }
    case 'gpt-4o':
    case 'chatgpt-4o-latest':
    case 'gpt-4-turbo':
    case 'gpt-3.5-turbo':
    default:
      apiKey = openaiKey;
      baseUrl = 'https://api.openai.com/v1';
      testEndpoint = '/models';
      break;
  }

  if (!apiKey) {
    return {
      isValid: false,
      error: `${modelLabel} not available now.`
    };
  }

  try {
    const response = await fetch(`${baseUrl}${testEndpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: `${modelLabel} not available now.`
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: `${modelLabel} not available now.`
    };
  }
}

export async function getAvailableModels(): Promise<AvailableModelsResult> {
  const models: Model[] = [
    'claude-sonnet-4-5',
    'claude-haiku-4-5',
    'claude-opus-4-5',
    'gpt-4o',
    'chatgpt-4o-latest',
    'deepseek-chat',
    'gemini-2.0-flash',
    'grok-4-latest',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ];

  const results = await Promise.all(
    models.map(async (model) => {
      const validation = await validateApiKey(model);
      return {
        model,
        label: MODEL_LABELS[model],
        isAvailable: validation.isValid
      };
    })
  );

  return {
    availableModels: results,
    hasAnyAvailable: results.some(r => r.isAvailable)
  };
}

export function getModelLabel(model: Model): string {
  return MODEL_LABELS[model] || model;
}
