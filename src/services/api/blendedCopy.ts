import { GeneratedContentItem, User } from '../../types';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { makeApiRequestWithFallback } from './utils';
import { getPrimaryModel, DEFAULT_ENGINE } from '../../lib/llm/modelRegistry';
import { contentToText } from './contentText';

export interface BlendedCopyResult {
  content: string;
  sourceVersions: string[];
  blendStrategy: string;
}

interface NormalizedDetail {
  versionId?: string;
  versionTitle: string;
  score: number;
  pros: string[];
  cons: string[];
  bestUsedFor?: string;
  metrics?: {
    tone: string;
    readability: string;
    persuasion: string;
    emotionalAppeal: string;
    differentiation: string;
    conversionPotential: string;
  };
}

function normalizeComparisonDetails(comparisonResult: any, versions: GeneratedContentItem[]): NormalizedDetail[] {
  if (Array.isArray(comparisonResult.comparisonDetails) && comparisonResult.comparisonDetails.length > 0) {
    return comparisonResult.comparisonDetails;
  }
  if (Array.isArray(comparisonResult.rows) && comparisonResult.rows.length > 0) {
    return comparisonResult.rows.map((row: any) => {
      const version = versions.find(v => v.id === row.versionId);
      return {
        versionId: row.versionId,
        versionTitle: version?.sourceDisplayName || row.optionLabel || row.versionId,
        score: row.finalScore ?? 70,
        pros: row.bestUseCase ? [row.bestUseCase] : ['Strong overall score'],
        cons: [],
        bestUsedFor: row.bestUseCase || undefined,
      };
    });
  }
  return [];
}

export async function generateBlendedCopy(
  versions: GeneratedContentItem[],
  comparisonResult: any,
  userId?: string,
  formState?: any,
  specialInstructions?: string,
  userEmail?: string,
  sessionId?: string,
  selectedModel?: string
): Promise<BlendedCopyResult> {
  const normalizedDetails = normalizeComparisonDetails(comparisonResult, versions);

  const topVersions = [...normalizedDetails]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(detail => {
      const version = (detail.versionId ? versions.find(v => v.id === detail.versionId) : undefined)
        || versions.find(v => {
          const label = v.sourceDisplayName || `Version ${versions.indexOf(v) + 1}`;
          return label === detail.versionTitle;
        });
      return { detail, version };
    })
    .filter(item => item.version);

  const finalTopVersions = topVersions.length > 0
    ? topVersions
    : versions.slice(0, 3).map((version, idx) => ({
        detail: {
          versionTitle: version.sourceDisplayName || `Version ${idx + 1}`,
          score: 70,
          pros: ['Selected for blending'],
          cons: [],
        } as NormalizedDetail,
        version,
      }));

  if (finalTopVersions.length === 0) {
    throw new Error('No versions available to blend');
  }

  const versionsText = finalTopVersions.map(({ detail, version }) => {
    const versionContentString = contentToText(version!.content);

    return `
**${detail.versionTitle}** (Score: ${detail.score}/100)

Content:
${versionContentString}

Strengths:
${detail.pros.map(p => `- ${p}`).join('\n')}

Best Used For: ${detail.bestUsedFor || 'General purpose'}

${detail.metrics ? `Metrics:
- Tone: ${detail.metrics.tone}
- Readability: ${detail.metrics.readability}
- Persuasion: ${detail.metrics.persuasion}
- Emotional Appeal: ${detail.metrics.emotionalAppeal}
- Conversion Potential: ${detail.metrics.conversionPotential}` : ''}
---`;
  }).join('\n\n');

  const sourceVersionNames = finalTopVersions.map(({ detail }) => detail.versionTitle);

  const firstVersionContent = finalTopVersions[0].version!.content;
  const contentAsString = contentToText(firstVersionContent);

  // Language source of truth is formState.language (same as every other service);
  // character detection is only a fallback when it is missing.
  const detectedLanguageFallback = /[áéíóúñ¿¡]/i.test(contentAsString) ? 'Spanish' : 'English';
  const language = (formState?.language && String(formState.language).trim()) || detectedLanguageFallback;
  const referenceWordCount = contentAsString.trim().split(/\s+/).length;
  const targetWordCount = formState?.customWordCount || referenceWordCount;

  const prompt = `You are an expert copywriter. I have multiple versions of copy with detailed analysis. Create an OPTIMIZED BLEND that synthesizes the best elements.

${versionsText}

**Strategic Recommendation:**
${comparisonResult.strategicRecommendation || 'Combine the strongest elements from each version to create the ultimate blend.'}

**Overall Analysis:**
- Best performing version: ${comparisonResult.bestForMarketing || comparisonResult.bestVersionTitle || finalTopVersions[0]?.detail.versionTitle || 'Top scoring version'}
- Focus on: clarity, persuasion, and conversion potential

${specialInstructions ? `**🎯 SPECIAL INSTRUCTIONS (HIGHEST PRIORITY):**
${specialInstructions}

FOLLOW THESE INSTRUCTIONS ABOVE ALL ELSE.

` : ''}**Your Task:**
Create a blended version that takes the best from each:
- Most persuasive elements from the highest-scoring version
- Clarity and structure from the version rated best for clarity
- Readability from the simplest version
- Maximum marketing effectiveness and conversion potential

**Requirements:**
- Write in ${language} (unless the special instructions above explicitly specify a different language)
- Stay on the same topic and maintain the same brand voice
- Create a TRUE synthesis, not just picking one version
- Target word count: ~${targetWordCount} words (range: ${Math.round(targetWordCount * 0.85)}-${Math.round(targetWordCount * 1.15)})${specialInstructions && /\d+\s*words?/.test(specialInstructions.toLowerCase()) ? ' (special instructions may override)' : ''}
${formState?.includeSectionTitles !== false ? '- Use markdown headings (# for main title, ## for sections)\n- Section titles must be compelling and 3-8 words\n' : '- Plain text only, no markdown formatting\n'}
Respond ONLY with the blended copy. No explanations.`;

  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert copywriter who creates optimized blends from multiple content versions.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const engineModel = formState?.aiEngine
      ? getPrimaryModel(formState.aiEngine).modelId
      : undefined;
    const modelToUse = selectedModel || formState?.model || engineModel || getPrimaryModel(DEFAULT_ENGINE).modelId;

    const completion = await makeApiRequestWithFallback(
      modelToUse,
      messages,
      0.7,
      8000,
      undefined,
      userEmail
    );

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('No response from AI model');
    }

    if (userId && completion.usage) {
      try {
        const totalTokens = completion.usage.total_tokens || 0;
        await trackTokenUsage(
          { id: userId } as User,
          totalTokens,
          completion.model_used,
          'blend_outputs',
          sessionId,
          0,
          undefined,
          extractTokenBreakdown(completion.usage)
        );
      } catch (trackError) {
        console.warn('Failed to track token usage:', trackError);
      }
    }

    return {
      content,
      sourceVersions: sourceVersionNames,
      blendStrategy: comparisonResult.strategicRecommendation || comparisonResult.reasoning || `AI-powered blend of top-scoring versions using ${modelToUse}`
    };
  } catch (error: any) {
    console.error('Error generating blended copy:', error);
    throw new Error(error.message || 'Failed to generate blended copy. Please try again.');
  }
}