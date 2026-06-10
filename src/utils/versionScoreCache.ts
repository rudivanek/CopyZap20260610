/**
 * Version Score Cache with Context-Aware Invalidation
 *
 * Caches scoring results per version with strict invalidation rules:
 * - Content changes (detected via hash)
 * - Context changes (model, scoringVersion, persona/voice style)
 */

import { GeneratedContentItem, Model } from '../types';
import { VersionScoreResult } from '../services/api/comprehensiveScoring';
import { debugCompare } from './debugLogger';

/**
 * Context signature for cache invalidation
 * Changes to any of these factors should trigger re-scoring
 */
export interface ScoreContextKey {
  scoringVersion: string;
  model: Model;
  persona?: string; // Voice style/persona if used in scoring prompt
  keywordsSignature?: string; // 'none' or sorted/joined keywords — prevents SEO-on/off contamination
}

/**
 * Extended VersionScoreResult with cache metadata
 */
export interface CachedVersionScore extends VersionScoreResult {
  contentHash: string; // Hash of version content
  contextKey: string; // Serialized context for cache validation
}

/**
 * Generate a stable hash from version content
 * Used to detect content changes
 */
export function generateVersionHash(version: GeneratedContentItem): string {
  let contentStr = '';

  if (typeof version.content === 'string') {
    contentStr = version.content;
  } else if (Array.isArray(version.content)) {
    contentStr = version.content.join('|');
  } else if (typeof version.content === 'object' && version.content !== null) {
    contentStr = JSON.stringify(version.content);
  }

  // Simple hash (not cryptographic, just for change detection)
  let hash = 0;
  for (let i = 0; i < contentStr.length; i++) {
    const char = contentStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `v${Math.abs(hash).toString(36)}`;
}

/**
 * Build context key string from scoring parameters
 * Used to detect when scoring context has changed
 */
export function buildContextKey(context: ScoreContextKey): string {
  const parts = [
    `sv:${context.scoringVersion}`,
    `m:${context.model}`,
  ];

  if (context.persona) {
    parts.push(`p:${context.persona}`);
  }

  parts.push(`kw:${context.keywordsSignature ?? 'none'}`);

  return parts.join('|');
}

/**
 * Check if a version needs re-scoring
 * Returns true if content or context has changed
 */
export function needsRescoring(
  version: GeneratedContentItem,
  cachedScore: CachedVersionScore | undefined,
  currentContext: ScoreContextKey
): boolean {
  if (!cachedScore) {
    debugCompare.log(`🔄 No cached score for version ${version.id} - needs scoring`);
    return true;
  }

  // Check content hash
  const currentHash = generateVersionHash(version);
  if (currentHash !== cachedScore.contentHash) {
    debugCompare.log(`🔄 Content changed for version ${version.id} (${cachedScore.contentHash} → ${currentHash}) - needs scoring`);
    return true;
  }

  // Check context key
  const currentKey = buildContextKey(currentContext);
  if (currentKey !== cachedScore.contextKey) {
    debugCompare.log(`🔄 Context changed for version ${version.id} (${cachedScore.contextKey} → ${currentKey}) - needs scoring`);
    return true;
  }

  debugCompare.log(`✅ Using cached score for version ${version.id}: ${cachedScore.finalScore}`);
  return false;
}

/**
 * Update the score cache with new scores
 * Preserves existing cache entries and adds new ones
 */
export function updateScoreCache(
  existingCache: Record<string, CachedVersionScore>,
  newScores: VersionScoreResult[],
  versions: GeneratedContentItem[],
  context: ScoreContextKey
): Record<string, CachedVersionScore> {
  const updatedCache = { ...existingCache };

  newScores.forEach((score) => {
    const version = versions.find(v => v.id === score.versionId);
    if (version) {
      const contentHash = generateVersionHash(version);
      const contextKey = buildContextKey(context);

      updatedCache[score.versionId] = {
        ...score,
        contentHash,
        contextKey
      };
    }
  });

  return updatedCache;
}

/**
 * Clean cache entries for deleted versions
 */
export function cleanScoreCache(
  cache: Record<string, CachedVersionScore>,
  validVersionIds: string[]
): Record<string, CachedVersionScore> {
  const validIdSet = new Set(validVersionIds);
  const cleanedCache: Record<string, CachedVersionScore> = {};

  Object.entries(cache).forEach(([versionId, score]) => {
    if (validIdSet.has(versionId)) {
      cleanedCache[versionId] = score;
    } else {
      debugCompare.log(`🧹 Removing cached score for deleted version: ${versionId}`);
    }
  });

  return cleanedCache;
}

/**
 * Invalidate cache for a specific version
 * Used when user edits a version
 */
export function invalidateVersionCache(
  cache: Record<string, CachedVersionScore>,
  versionId: string
): Record<string, CachedVersionScore> {
  const updatedCache = { ...cache };

  if (updatedCache[versionId]) {
    debugCompare.log(`❌ Invalidating cache for version: ${versionId}`);
    delete updatedCache[versionId];
  }

  return updatedCache;
}
