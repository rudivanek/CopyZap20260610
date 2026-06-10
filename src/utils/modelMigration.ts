/**
 * Model selection migration utilities
 *
 * Handles backward compatibility when migrating from old
 * multi-model selection to simplified 2-engine selection
 */

import { AiEngine, FormState } from '../types';
import { migrateModelToEngine } from '../lib/llm/modelRegistry';

/**
 * Migrate FormState to ensure aiEngine is set
 * If aiEngine is missing, derive it from the legacy model field
 */
export function migrateFormStateEngine(state: FormState): FormState {
  if (!state.aiEngine && state.model) {
    return {
      ...state,
      aiEngine: migrateModelToEngine(state.model),
    };
  }
  return state;
}

/**
 * Migrate persisted sessions/templates from DB
 * Ensures all loaded data has aiEngine field populated
 */
export function migratePersistedData(data: any): any {
  if (!data) return data;

  // If it's an array, migrate each item
  if (Array.isArray(data)) {
    return data.map((item) => migratePersistedData(item));
  }

  // If it has input_data (sessions/templates), migrate it
  if (data.input_data && typeof data.input_data === 'object') {
    return {
      ...data,
      input_data: {
        ...data.input_data,
        aiEngine:
          data.input_data.aiEngine || migrateModelToEngine(data.input_data.model || 'claude-sonnet-4-5'),
      },
    };
  }

  // If it's a direct FormState-like object
  if (data.model && !data.aiEngine) {
    return {
      ...data,
      aiEngine: migrateModelToEngine(data.model),
    };
  }

  return data;
}

/**
 * Get effective AI engine from FormState
 * Falls back to migration if needed, then default
 */
export function getEffectiveEngine(state: FormState): AiEngine {
  if (state.aiEngine) {
    return state.aiEngine;
  }

  if (state.model) {
    return migrateModelToEngine(state.model);
  }

  return 'claude'; // Default
}
