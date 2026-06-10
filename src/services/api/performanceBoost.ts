import { FormState, User } from '../../types';
import { makeApiRequestWithFallback, storePrompts, calculateTargetWordCount, extractWordCount } from './utils';
import { contentToText, stripToMarkdown } from './contentText';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import type { VersionScoreResult } from './comprehensiveScoring';

const DIMENSION_LABELS: Record<string, string> = {
  audienceToneAlignment: 'audience-tone alignment and cultural appropriateness',
  clarity: 'clarity, structure, and readability',
  persuasion: 'persuasion structure and compelling framing',
  seo: 'SEO keyword integration and relevance',
  emotion: 'emotional resonance and authentic engagement',
  differentiation: 'differentiation and unique angle',
  trust: 'trust, credibility, and substantiated claims',
  cta: 'call-to-action strength and conversion focus',
};

function buildBoostFocus(scoreResult: VersionScoreResult | null): string {
  if (!scoreResult) {
    return `Focus on improving clarity, specificity, and CTA strength while preserving the existing voice and credibility.`;
  }

  const { subscores, weakestDimension, weakestReason } = scoreResult;

  const sorted = Object.entries(subscores)
    .filter(([, v]) => typeof v === 'number')
    .sort((a, b) => (a[1] as number) - (b[1] as number));

  const weakest = sorted.slice(0, 2).map(([dim]) => dim);
  const primaryLabel = DIMENSION_LABELS[weakestDimension] || weakestDimension;
  const secondaryLabels = weakest
    .filter(d => d !== weakestDimension)
    .map(d => DIMENSION_LABELS[d] || d)
    .join(' and ');

  let focus = `Primary weakness identified: ${primaryLabel}.\nReason: ${weakestReason}\n`;
  if (secondaryLabels) {
    focus += `Secondary area to improve: ${secondaryLabels}.\n`;
  }

  focus += `\nDimension scores (out of 10):\n`;
  for (const [dim, val] of sorted) {
    focus += `  - ${DIMENSION_LABELS[dim] || dim}: ${typeof val === 'number' ? val.toFixed(1) : val}\n`;
  }

  return focus;
}

function detectZoneLabels(text: string): string[] {
  const lines = text.split('\n');
  const zoneLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^zona\s+\d+\s*[—\-–]/i.test(trimmed) || /^\[zona\s+\d+/i.test(trimmed)) {
      zoneLines.push(trimmed);
    }
  }
  return zoneLines;
}

export async function performBoost(
  content: any,
  scoreResult: VersionScoreResult | null,
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<string> {
  const textContent = contentToText(content);
  const boostFocus = buildBoostFocus(scoreResult);
  const targetWordCountInfo = calculateTargetWordCount(formState);
  const targetWordCount = targetWordCountInfo.target;

  const zoneLabelsFromContent = detectZoneLabels(textContent);
  const zoneLabelsFromInstructions = detectZoneLabels(formState.specialInstructions || '');
  const zoneLabels = zoneLabelsFromContent.length > 0 ? zoneLabelsFromContent : zoneLabelsFromInstructions;
  const hasZoneStructure = zoneLabels.length > 0;

  let systemPrompt = `You are a precision copy optimizer. Your task is to boost the performance of an existing piece of marketing copy by improving its weakest dimensions — NOT by rewriting its strategy, repositioning the offer, or inventing new claims.

STRICT RULES:
1. Preserve the audience, offer, and positioning EXACTLY.
2. Maintain the existing tone, style, and voice constraints.
3. Do NOT add guarantees, invented statistics, or fabricated testimonials.
4. Do NOT use fake urgency ("limited time only!" etc.) unless it was already in the original.
5. Do NOT exaggerate existing claims.
6. Improve only what the scoring analysis indicates is weak.
7. Keep the output approximately the same word count (±15%) as the original unless clarity requires structural changes.
8. Return clean, readable text with markdown formatting. Do NOT return JSON.
${formState.includeSectionTitles !== false ? `9. Preserve markdown heading structure (# and ## syntax).` : ''}${hasZoneStructure ? `
10. CRITICAL — ZONE STRUCTURE PRESERVATION: This copy uses a named zone layout. You MUST output every zone label EXACTLY as it appears in the original (e.g., "${zoneLabels[0]}"). Do NOT rename, merge, reorder, drop, or rephrase any zone label. Improve only the copy content within each zone.` : ''}

Language: ${formState.language}
Tone: ${formState.tone}${targetWordCount ? `\nTarget word count: ~${targetWordCount} words` : ''}${hasZoneStructure ? `\n\nZone labels that MUST appear in the output, unchanged:\n${zoneLabels.map(z => `  - ${z}`).join('\n')}` : ''}`;

  if (formState.specialInstructions && formState.specialInstructions.trim()) {
    systemPrompt += `\n\nADDITIONAL SPECIAL INSTRUCTIONS:\n${formState.specialInstructions.trim()}\n\nThese special instructions must be respected while applying the performance improvements.`;
  }

  const userPrompt = `BOOST FOCUS — address these specific weaknesses:
${boostFocus}

ORIGINAL COPY TO BOOST:
"""
${textContent}
"""

${formState.targetAudience ? `Target audience: ${formState.targetAudience}` : ''}
${formState.keyMessage ? `Key message to preserve: ${formState.keyMessage}` : ''}
${formState.callToAction ? `Call to action to strengthen: ${formState.callToAction}` : ''}

Deliver the boosted version now. Return ONLY the improved copy — no preamble, no explanation, no metadata.`;

  storePrompts(systemPrompt, userPrompt);

  const data = await makeApiRequestWithFallback(
    formState.model,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    0.55,
    4000,
    undefined,
    currentUser?.email
  );

  const tokenUsage = data.usage?.total_tokens || 0;
  if (currentUser && tokenUsage > 0) {
    await trackTokenUsage(
      currentUser,
      tokenUsage,
      data.model_used,
      'performance_boost',
      sessionId,
      0,
      undefined,
      extractTokenBreakdown(data.usage)
    );
  }

  let boostedContent: string = data.choices[0]?.message?.content;
  if (!boostedContent) throw new Error('No content returned from boost API');

  boostedContent = stripToMarkdown(boostedContent);

  if (progressCallback) {
    progressCallback(`✓ Performance Boost complete (${extractWordCount(boostedContent)} words)`);
  }

  return boostedContent;
}
