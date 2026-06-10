import { v4 as uuidv4 } from 'uuid';
import {
  FormState,
  GeneratedContentItem,
  GeneratedContentItemType,
  GeoGenerateElement,
  User,
} from '../../types';
import { makeApiRequestWithFallback, storePrompts } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { SCORING_MODEL } from '../../constants';

interface GenerateGeoContentParams {
  sourceCard: GeneratedContentItem;
  selectedElements: GeoGenerateElement[];
  targetRegions?: string;
  formState: FormState;
  currentUser?: User;
  sessionId?: string;
}

function extractText(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content.content) return extractText(content.content);
  if (Array.isArray(content)) return content.join('\n');
  if (typeof content === 'object' && content.headline) {
    const sections = (content.sections || [])
      .map((s: any) => `${s.title || ''}\n${s.content || (s.listItems || []).join('\n')}`)
      .join('\n\n');
    return `${content.headline}\n\n${sections}`;
  }
  return JSON.stringify(content);
}

const LANGUAGE_RULE = `CRITICAL: Detect the language of the source copy and generate your output in that exact same language. Do not translate or switch languages under any circumstances.`;

const ELEMENT_CONFIG: Record<
  GeoGenerateElement,
  { type: GeneratedContentItemType; label: string; prompt: string }
> = {
  tldr: {
    type: GeneratedContentItemType.GeoTldr,
    label: 'TL;DR',
    prompt: `Write a TL;DR / Answer Box for the content below. It should be 2–4 sentences, start with a direct answer to the implied question, and be optimised for AI assistants to surface as a featured snippet. Plain text only — no markdown.\n\n${LANGUAGE_RULE}`,
  },
  faq: {
    type: GeneratedContentItemType.GeoFaqBlock,
    label: 'FAQ Block',
    prompt: `Generate a FAQ block for the content below. Produce 4–6 question-and-answer pairs. Each question should reflect a real user search query. Each answer should be 1–3 sentences, direct, and easy for AI assistants to quote. Format: Q: ...\nA: ...\n\n${LANGUAGE_RULE}`,
  },
  questionHeadings: {
    type: GeneratedContentItemType.GeoQuestionHeadings,
    label: 'Question Headings',
    prompt: `Rewrite the key section headings from the content below as natural-language questions that users would type into a search engine or ask an AI assistant. Provide 4–7 question-based headings. Return them as a numbered list only.\n\n${LANGUAGE_RULE}`,
  },
  bulletSummary: {
    type: GeneratedContentItemType.GeoBulletSummary,
    label: 'Bullet Summary',
    prompt: `Create a bullet-point summary of the content below. Produce 5–8 concise bullets that capture the key points. Each bullet should be a single sentence and self-contained so an AI assistant can quote it directly.\n\n${LANGUAGE_RULE}`,
  },
  authoritySnippets: {
    type: GeneratedContentItemType.GeoAuthoritySnippets,
    label: 'Authority Snippets',
    prompt: `Extract or generate 3–5 authority snippets from the content below — short, fact-dense sentences that include specific numbers, results, credentials, or proof points. These should be suitable for AI assistants to cite as evidence. Return them as a numbered list.\n\n${LANGUAGE_RULE}`,
  },
  quoteReady: {
    type: GeneratedContentItemType.GeoQuoteReady,
    label: 'Quote-Ready',
    prompt: `Extract the most citable concepts and ideas from the content below and rewrite them as punchy, standalone, quotable sentences. Do not reproduce the original wording — each sentence must be a fresh rewrite that preserves the core idea but feels distinct from the source. Generate 3–5 quote-ready sentences. Each must be complete and self-contained so it makes sense without surrounding context. Return them as a numbered list.\n\n${LANGUAGE_RULE}`,
  },
  localVariations: {
    type: GeneratedContentItemType.GeoLocalVariations,
    label: 'Local Variations',
    prompt: `Rewrite key passages from the content below to include local geographical signals — specific cities, regions, or country names where relevant. The goal is to improve local GEO discoverability.\n\nRules:\n- Generate exactly 2 location variations (no more).\n- Each variation must be no longer than 80 words.\n- Keep the same tone and style as the source copy.\n\n${LANGUAGE_RULE}`,
  },
};

export async function generateGeoContent(
  params: GenerateGeoContentParams,
): Promise<GeneratedContentItem[]> {
  const { sourceCard, selectedElements, targetRegions, formState, currentUser, sessionId } = params;
  const sourceText = extractText(sourceCard.content);
  const sourceName = sourceCard.sourceDisplayName || sourceCard.type;
  const regionContext = targetRegions
    ? `\n\nTarget regions for localisation: ${targetRegions}`
    : '';

  const sections: string[] = [];

  for (const element of selectedElements) {
    const cfg = ELEMENT_CONFIG[element];
    if (!cfg) continue;

    const systemPrompt = `You are a GEO (Generative Engine Optimization) specialist. Your task is to create content optimised for AI assistant discoverability.${regionContext}`;
    const userPrompt = `${cfg.prompt}${regionContext}\n\nSOURCE CONTENT:\n"""\n${sourceText}\n"""`;

    storePrompts(systemPrompt, userPrompt);

    const data = await makeApiRequestWithFallback(
      SCORING_MODEL,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      0.7,
      1500,
      undefined,
      currentUser?.email,
    );

    const tokenUsage = data.usage?.total_tokens || 0;
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        SCORING_MODEL,
        `geo_generate_${element}`,
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage),
      );
    }

    const responseText = data.choices[0]?.message?.content || '';
    sections.push(`## ${cfg.label}\n\n${responseText}`);
  }

  const combinedContent = sections.join('\n\n---\n\n');

  return [
    {
      id: uuidv4(),
      type: GeneratedContentItemType.GeoOptimized,
      content: combinedContent,
      sourceDisplayName: `GEO Package — ${sourceName}`,
      sourceId: sourceCard.id,
      sourceType: sourceCard.type,
      generatedAt: new Date().toISOString(),
    } as GeneratedContentItem,
  ];
}
