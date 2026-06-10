/**
 * Best Elements Analysis Service
 *
 * Identifies the strongest section per dimension across all versions,
 * then compiles them via CODE-LEVEL TEXT EXTRACTION (not AI rewriting).
 *
 * Compile approach:
 *   1. Convert all version content to plain markdown text
 *   2. Split into sections by heading or double newline
 *   3. Find the section matching each element's excerpt by word overlap
 *   4. Concatenate matched sections verbatim
 *   5. One tiny AI call to write transitions only (max 15 words each)
 */

import { GeneratedContentItem } from '../../types';
import { makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { SCORING_MODEL } from '../../constants';
import { ComparisonResult } from './comprehensiveScoring';

export interface BestElement {
  dimension: string;
  versionName: string;
  versionId: string;
  excerpt: string;
  reason: string;
}

export interface BestElementsResult {
  elements: BestElement[];
  assemblyNote: string;
  generatedAt: string;
}

// ── Content normalisation ────────────────────────────────────────────────────

/**
 * Convert any version content (string, structured JSON, or object) to
 * plain markdown text with H2 headings preserved.
 */
function contentToMarkdown(content: any): string {
  if (!content) return '';

  // Already a plain string
  if (typeof content === 'string') {
    // If it looks like JSON, try to parse it
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return contentToMarkdown(parsed);
      } catch {
        return content; // Return as-is
      }
    }
    return content;
  }

  // Structured content with headline + sections (CopyZap format)
  if (typeof content === 'object' && content !== null) {
    if (content.headline && Array.isArray(content.sections)) {
      let result = `# ${content.headline}\n\n`;
      content.sections.forEach((section: any) => {
        if (!section) return;
        if (section.title) result += `## ${section.title}\n\n`;
        if (section.content) result += `${section.content}\n\n`;
        if (section.listItems && Array.isArray(section.listItems)) {
          section.listItems.forEach((item: string) => {
            result += `- ${item}\n`;
          });
          result += '\n';
        }
      });
      return result.trim();
    }

    // Generic object — try common text fields
    if (content.text) return String(content.text);
    if (content.output) return String(content.output);
    if (content.message) return String(content.message);
    if (content.content) return contentToMarkdown(content.content);

    // Last resort: stringify
    return JSON.stringify(content, null, 2);
  }

  return String(content);
}

// ── Section splitting ────────────────────────────────────────────────────────

/**
 * Split a markdown string into sections. Each section starts at a heading
 * (# ## ###) or at a double-newline paragraph boundary.
 * Returns an array of text blocks, each non-empty.
 */
function splitIntoSections(markdown: string): string[] {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const isHeading = /^#{1,3}\s/.test(line.trim());
    if (isHeading && current.length > 0) {
      const block = current.join('\n').trim();
      if (block.length > 10) sections.push(block);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    const block = current.join('\n').trim();
    if (block.length > 10) sections.push(block);
  }

  // No headings found — split by double newline
  if (sections.length <= 1) {
    return markdown
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(s => s.length > 20);
  }

  return sections;
}

// ── Section matching ─────────────────────────────────────────────────────────

/**
 * Find the section in a markdown string that best matches an excerpt.
 * Uses word-overlap scoring. Returns the full section text.
 */
function extractMatchingSection(markdown: string, excerpt: string): string {
  if (!markdown || !excerpt) return excerpt || '';

  const sections = splitIntoSections(markdown);
  if (sections.length === 0) return markdown;

  // Normalise for comparison
  const normalize = (s: string) =>
    s.toLowerCase()
     .replace(/[""«»"']/g, '"')
     .replace(/[^\w\s]/g, ' ')
     .trim();

  const excerptWords = normalize(excerpt)
    .split(/\s+/)
    .filter(w => w.length > 3); // meaningful words only

  if (excerptWords.length === 0) return sections[0];

  // Score each section by how many excerpt words it contains
  let bestSection = sections[0];
  let bestScore = -1;

  for (const section of sections) {
    const normalizedSection = normalize(section);
    const matchCount = excerptWords.filter(w => normalizedSection.includes(w)).length;
    const score = matchCount / excerptWords.length;
    if (score > bestScore) {
      bestScore = score;
      bestSection = section;
    }
  }

  return bestSection;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function generateBestElements(
  versions: GeneratedContentItem[],
  comparisonResult: ComparisonResult,
  currentUser: any,
  sessionId?: string
): Promise<BestElementsResult> {
  if (versions.length < 2) {
    throw new Error('Need at least 2 versions to identify best elements.');
  }

  // Build summaries — convert to markdown first so the AI sees clean text
  const versionSummaries = versions.map(v => {
    const row = comparisonResult.rows.find((r: any) => r.versionId === v.id);
    const score = row?.finalScore ?? row?.score ?? '—';
    const name = v.sourceDisplayName || v.type || 'Version';
    const markdown = contentToMarkdown(v.content);
    const preview = markdown.length > 1000 ? markdown.slice(0, 1000) + '…' : markdown;
    return `--- VERSION: "${name}" (Score: ${score}/100) id:${v.id} ---\n${preview}`;
  }).join('\n\n');

  const systemPrompt = `You are a senior copywriter and content strategist. You analyze multiple versions of marketing copy and identify the single strongest element in each key dimension.

Return ONLY valid JSON — no markdown fences, no text outside the JSON.`;

  const userPrompt = `Analyze these ${versions.length} versions and identify the best element across 6 dimensions.

${versionSummaries}

For each dimension, identify which version has the strongest execution. Extract a short verbatim excerpt (max 30 words, exact text from that version). Include the exact versionId from the "id:" tag.

Dimensions:
1. Headline / Opening Hook
2. Problem Statement
3. Treatment Explanation
4. Social Proof / Testimonials
5. Call to Action
6. Credibility / Authority

Return this JSON:
{
  "elements": [
    {
      "dimension": "Headline / Opening Hook",
      "versionName": "exact name",
      "versionId": "exact id from id: tag",
      "excerpt": "verbatim text from that version (max 30 words)",
      "reason": "one sentence why it wins"
    }
  ],
  "assemblyNote": "2-3 sentence practical note on how to combine these elements"
}

Return ONLY JSON.`;

  const data = await makeApiRequestWithFallback(
    SCORING_MODEL,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    0.3,
    1500
  );

  const raw = data.choices?.[0]?.message?.content || '';
  const cleaned = cleanJsonResponse(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse best elements response from AI.');
  }

  const elements: BestElement[] = (parsed.elements || []).map((el: any) => {
    let matched = versions.find(v => v.id === el.versionId);
    if (!matched) {
      matched = versions.find(v =>
        (v.sourceDisplayName || v.type || '').toLowerCase().includes(
          (el.versionName || '').toLowerCase().slice(0, 20)
        )
      );
    }
    return {
      dimension: el.dimension || '—',
      versionName: el.versionName || '—',
      versionId: el.versionId || matched?.id || '',
      excerpt: el.excerpt || '',
      reason: el.reason || '',
    };
  });

  return {
    elements,
    assemblyNote: parsed.assemblyNote || '',
    generatedAt: new Date().toISOString(),
  };
}

// ── Similarity scoring ───────────────────────────────────────────────────────

/**
 * Compute word-overlap similarity between two text blocks.
 * Returns 0 (completely different) to 1 (identical).
 * Uses meaningful words only (length > 3).
 */
function textSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase()
     .replace(/[^\w\s]/g, ' ')
     .split(/\s+/)
     .filter(w => w.length > 3);

  const wordsA = new Set(normalize(a));
  const wordsB = new Set(normalize(b));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }

  // Jaccard similarity
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? overlap / union : 0;
}

const SIMILARITY_THRESHOLD = 0.55; // sections above this are considered duplicates

// ── Compile ──────────────────────────────────────────────────────────────────

export async function compileBestElements(
  elements: BestElement[],
  versions: GeneratedContentItem[],
  formState: any,
  currentUser: any,
  sessionId?: string
): Promise<string> {
  const language = formState?.language || 'English';
  const tone = formState?.tone || 'Professional';

  // ── STEP 1: Convert all versions to clean markdown ──────────────────────
  const versionMarkdowns: Map<string, string> = new Map();
  for (const v of versions) {
    versionMarkdowns.set(v.id, contentToMarkdown(v.content));
  }

  // ── STEP 2: Extract the best matching section for each element ──────────
  interface ExtractedBlock {
    dimension: string;
    block: string;
    versionName: string;
    versionId: string;
  }

  const candidateBlocks: ExtractedBlock[] = [];

  for (const el of elements) {
    const markdown = versionMarkdowns.get(el.versionId);
    if (!markdown) continue;

    const section = extractMatchingSection(markdown, el.excerpt);
    candidateBlocks.push({
      dimension: el.dimension,
      block: section,
      versionName: el.versionName,
      versionId: el.versionId,
    });
  }

  if (candidateBlocks.length === 0) {
    throw new Error('Could not extract any sections from source versions.');
  }

  // ── STEP 3: Deduplicate — remove sections too similar to earlier ones ───
  // Keep the first occurrence of each unique section.
  // For duplicates, try to find a different section from the same version,
  // or skip entirely if nothing unique exists.
  const uniqueBlocks: ExtractedBlock[] = [];

  for (const candidate of candidateBlocks) {
    // Check if this block is too similar to any already-accepted block
    const isDuplicate = uniqueBlocks.some(accepted => {
      const similarity = textSimilarity(candidate.block, accepted.block);
      return similarity >= SIMILARITY_THRESHOLD;
    });

    if (!isDuplicate) {
      uniqueBlocks.push(candidate);
      continue;
    }

    // It's a duplicate — try to find a different section from the same source version
    const markdown = versionMarkdowns.get(candidate.versionId);
    if (!markdown) continue;

    const allSections = splitIntoSections(markdown);

    // Find a section from this version that isn't similar to any accepted block
    const alternativeSection = allSections.find(section => {
      // Must not be similar to the matched section (already used)
      if (textSimilarity(section, candidate.block) >= SIMILARITY_THRESHOLD) return false;
      // Must not be similar to any already-accepted block
      return !uniqueBlocks.some(accepted =>
        textSimilarity(section, accepted.block) >= SIMILARITY_THRESHOLD
      );
    });

    if (alternativeSection && alternativeSection.trim().length > 50) {
      uniqueBlocks.push({
        ...candidate,
        block: alternativeSection,
      });
    }
    // If no alternative found, skip this element entirely (better than repetition)
  }

  if (uniqueBlocks.length === 0) {
    throw new Error('All sections were duplicates — versions are too similar to compile meaningfully.');
  }

  // ── STEP 4: Generate short transitions between unique blocks ────────────
  let transitions: string[] = new Array(uniqueBlocks.length).fill('');

  try {
    const systemPrompt = `You write SHORT transition sentences between marketing copy sections. Max 15 words each, in ${language}. Return ONLY valid JSON.`;

    const userPrompt = `Write a brief transition sentence (max 15 words, ${language}, ${tone} tone) between each consecutive pair of sections. Return "" if sections flow naturally without a transition.

Sections:
${uniqueBlocks.map((b, i) => `[${i}] ${b.dimension}: "${b.block.slice(0, 120).replace(/\n/g, ' ')}…"`).join('\n')}

Return JSON: { "transitions": ["after 0", "after 1", "after 2", "after 3", "after 4"] }
Return ONLY JSON.`;

    const data = await makeApiRequestWithFallback(
      SCORING_MODEL,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.3,
      400
    );

    const raw = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(cleanJsonResponse(raw));
    if (Array.isArray(parsed.transitions)) {
      transitions = parsed.transitions;
    }
  } catch {
    // Non-critical — proceed without transitions
  }

  // ── STEP 5: Assemble final text ─────────────────────────────────────────
  const parts: string[] = [];
  for (let i = 0; i < uniqueBlocks.length; i++) {
    parts.push(uniqueBlocks[i].block);
    const transition = transitions[i]?.trim();
    if (transition && i < uniqueBlocks.length - 1) {
      parts.push(transition);
    }
  }

  return parts.join('\n\n');
}