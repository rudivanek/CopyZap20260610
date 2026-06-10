/**
 * Multi-Model Temperature Settings for CopyZap+ Mode
 * Optimized settings for different AI providers
 */

export interface EnhancedModelSettings {
  temperature: number;
  top_p?: number;
}

/**
 * Get enhanced model settings based on the selected model
 */
export function getEnhancedModelSettings(model: string): EnhancedModelSettings {
  const modelLower = model.toLowerCase();

  // OpenAI models
  if (modelLower.includes('gpt') || modelLower.includes('openai')) {
    return {
      temperature: 0.45,
      top_p: 0.9
    };
  }

  // Claude models
  if (modelLower.includes('claude') || modelLower.includes('anthropic')) {
    return {
      temperature: 0.3,
      top_p: 1.0
    };
  }

  // Gemini models
  if (modelLower.includes('gemini') || modelLower.includes('google')) {
    return {
      temperature: 0.5
    };
  }

  // DeepSeek models
  if (modelLower.includes('deepseek')) {
    return {
      temperature: 0.65
    };
  }

  // Default fallback
  return {
    temperature: 0.5,
    top_p: 0.9
  };
}
