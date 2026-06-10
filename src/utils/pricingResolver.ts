/**
 * Phase 3: DB-Driven Pricing Resolver
 *
 * This module provides utilities to fetch and cache model pricing from the
 * llm_model_pricing table. It serves as the source of truth for cost calculations.
 *
 * CRITICAL: All pricing lookups must gracefully handle failures and provide
 * fallback to legacy pricing. NEVER block user actions due to pricing lookup failures.
 */

import { supabase } from '../services/supabaseClient';

// Pricing record structure from llm_model_pricing table
export interface ModelPricing {
  id: string;
  model_key: string;
  provider: string;
  pricing_tier: string;
  // RPC returns aliased names: input_usd_per_1k, output_usd_per_1k, reasoning_usd_per_1k
  input_usd_per_1k: number;
  output_usd_per_1k: number;
  reasoning_usd_per_1k: number | null;
  is_active: boolean;
  effective_from: string;
  notes: string | null;
}

// In-memory cache for pricing data (5 minute TTL)
interface PricingCacheEntry {
  pricing: ModelPricing;
  cached_at: number;
}

const pricingCache = new Map<string, PricingCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key for pricing lookup
 */
function getCacheKey(modelKey: string, pricingTier: string = 'standard'): string {
  return `${modelKey}:${pricingTier}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: PricingCacheEntry): boolean {
  return (Date.now() - entry.cached_at) < CACHE_TTL_MS;
}

/**
 * Fetch active model pricing from database
 *
 * Uses the get_active_model_pricing database function to fetch the most
 * recent active pricing for the specified model and tier.
 *
 * @param modelKey - The model identifier (e.g., 'gpt-4o', 'claude-3-5-sonnet-20241022')
 * @param pricingTier - The pricing tier (default: 'standard')
 * @returns ModelPricing object or null if not found
 */
export async function getActiveModelPricing(
  modelKey: string,
  pricingTier: string = 'standard'
): Promise<ModelPricing | null> {
  // Check cache first
  const cacheKey = getCacheKey(modelKey, pricingTier);
  const cachedEntry = pricingCache.get(cacheKey);

  if (cachedEntry && isCacheValid(cachedEntry)) {
    console.log(`[PricingResolver] Cache hit for ${cacheKey}`);
    return cachedEntry.pricing;
  }

  try {
    // Call database function to get active pricing
    const { data, error } = await supabase.rpc('get_active_model_pricing', {
      p_model_key: modelKey,
      p_pricing_tier: pricingTier
    });

    if (error) {
      console.warn(`[PricingResolver] Error fetching pricing for ${modelKey}:`, error.message);
      return null;
    }

    // The RPC returns an array, we want the first (and only) result
    if (!data || data.length === 0) {
      console.warn(`[PricingResolver] No pricing found for ${modelKey} (tier: ${pricingTier})`);
      return null;
    }

    const pricing = data[0] as ModelPricing;

    // Cache the result
    pricingCache.set(cacheKey, {
      pricing,
      cached_at: Date.now()
    });

    console.log(`[PricingResolver] Fetched pricing for ${modelKey}:`, {
      input: pricing.input_usd_per_1k,
      output: pricing.output_usd_per_1k,
      reasoning: pricing.reasoning_usd_per_1k
    });

    return pricing;
  } catch (err) {
    console.error(`[PricingResolver] Exception fetching pricing for ${modelKey}:`, err);
    return null;
  }
}

/**
 * Calculate cost using DB pricing (Phase 3 preferred method)
 *
 * @param modelKey - Model identifier
 * @param inputTokens - Number of input/prompt tokens
 * @param outputTokens - Number of output/completion tokens
 * @param reasoningTokens - Number of reasoning tokens (optional, for o1 models)
 * @param pricingTier - Pricing tier (default: 'standard')
 * @returns Cost calculation result with cost, source, and pricing_row_id
 */
export async function calculateCostFromDbPricing(
  modelKey: string,
  inputTokens: number,
  outputTokens: number,
  reasoningTokens: number = 0,
  pricingTier: string = 'standard'
): Promise<{
  cost_usd: number;
  cost_source: 'db_pricing' | 'db_pricing_avg' | null;
  pricing_row_id: string | null;
}> {
  const pricing = await getActiveModelPricing(modelKey, pricingTier);

  if (!pricing) {
    // No pricing found - caller should fall back to legacy pricing
    return {
      cost_usd: 0,
      cost_source: null,
      pricing_row_id: null
    };
  }

  // Calculate cost with token breakdown
  const inputCost = (inputTokens / 1000) * Number(pricing.input_usd_per_1k || 0);
  const outputCost = (outputTokens / 1000) * Number(pricing.output_usd_per_1k || 0);

  let reasoningCost = 0;
  if (reasoningTokens > 0 && pricing.reasoning_usd_per_1k !== null) {
    reasoningCost = (reasoningTokens / 1000) * Number(pricing.reasoning_usd_per_1k);
  }

  const totalCost = inputCost + outputCost + reasoningCost;

  // STABILIZATION: Guard against NaN
  if (!Number.isFinite(totalCost) || totalCost < 0) {
    console.error(`[PricingResolver] Invalid cost calculated: ${totalCost}, returning 0`);
    return {
      cost_usd: 0,
      cost_source: null,
      pricing_row_id: null
    };
  }

  return {
    cost_usd: totalCost,
    cost_source: 'db_pricing',
    pricing_row_id: pricing.id
  };
}

/**
 * Calculate cost using average pricing when token breakdown is not available
 *
 * @param modelKey - Model identifier
 * @param totalTokens - Total tokens (input + output combined)
 * @param pricingTier - Pricing tier (default: 'standard')
 * @returns Cost calculation result with averaged pricing
 */
export async function calculateCostFromDbPricingAverage(
  modelKey: string,
  totalTokens: number,
  pricingTier: string = 'standard'
): Promise<{
  cost_usd: number;
  cost_source: 'db_pricing_avg' | null;
  pricing_row_id: string | null;
}> {
  const pricing = await getActiveModelPricing(modelKey, pricingTier);

  if (!pricing) {
    return {
      cost_usd: 0,
      cost_source: null,
      pricing_row_id: null
    };
  }

  // Average input and output pricing
  const avgPer1k = (Number(pricing.input_usd_per_1k || 0) + Number(pricing.output_usd_per_1k || 0)) / 2;
  const totalCost = (totalTokens / 1000) * avgPer1k;

  // STABILIZATION: Guard against NaN
  if (!Number.isFinite(totalCost) || totalCost < 0) {
    console.error(`[PricingResolver] Invalid average cost calculated: ${totalCost}, returning 0`);
    return {
      cost_usd: 0,
      cost_source: null,
      pricing_row_id: null
    };
  }

  return {
    cost_usd: totalCost,
    cost_source: 'db_pricing_avg',
    pricing_row_id: pricing.id
  };
}

/**
 * Clear the pricing cache (useful for testing or manual refresh)
 */
export function clearPricingCache(): void {
  pricingCache.clear();
  console.log('[PricingResolver] Pricing cache cleared');
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getPricingCacheStats(): {
  size: number;
  entries: Array<{ key: string; age_ms: number }>;
} {
  const now = Date.now();
  const entries = Array.from(pricingCache.entries()).map(([key, entry]) => ({
    key,
    age_ms: now - entry.cached_at
  }));

  return {
    size: pricingCache.size,
    entries
  };
}
