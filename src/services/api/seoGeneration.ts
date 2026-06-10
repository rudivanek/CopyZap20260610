/**
 * SEO metadata generation functionality
 */
import { FormState, Model, SeoMetadata, User } from '../../types';
import { makeApiRequestWithFallback, storePrompts, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { SeoGenerationOptions } from '../../components/SeoGenerationOptionsModal';

/**
 * Generate SEO metadata and structural elements for content
 * @param content - The content to generate SEO metadata for
 * @param formState - The form state with generation settings
 * @param progressCallback - Optional callback for reporting progress
 * @param seoOptions - Optional SEO generation options to control which elements to generate
 * @returns A SeoMetadata object with all requested SEO elements
 */
export async function generateSeoMetadata(
  content: any,
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  sessionId?: string,
  seoOptions?: SeoGenerationOptions
): Promise<SeoMetadata> {
  // Extract actual content from nested objects (e.g., from Alternative Copy with SEO metadata)
  let actualContent = content;
  if (typeof content === 'object' && content.content) {
    actualContent = content.content;
  }

  // Extract text from structured content if needed
  const contentText = typeof actualContent === 'string'
    ? actualContent
    : actualContent.headline
      ? `${actualContent.headline}\n\n${actualContent.sections.map((s: any) =>
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(actualContent);

  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback('Generating SEO metadata and structural elements...');
  }
  
  // Build the system prompt
  const systemPrompt = `You are an expert SEO strategist with ABSOLUTE CHARACTER LIMIT ENFORCEMENT. 

CRITICAL NON-NEGOTIABLE REQUIREMENTS:
- NEVER EXCEED the specified character limits under ANY circumstances
- If your generated content approaches the limit, IMMEDIATELY shorten it
- Count characters meticulously for EVERY piece of content you generate
- CHARACTER LIMITS ARE ABSOLUTE - exceeding them by even 1 character is COMPLETE FAILURE
- If unsure about length, always err on the side of being shorter rather than longer

Respond only in JSON using the format and limits provided. Do not include any explanations, markdown, or extra output — only return the final JSON. If you cannot generate content for any reason, return an empty JSON object with all required fields as empty arrays: {"urlSlugs":[],"metaDescriptions":[],"h1Variants":[],"h2Headings":[],"h3Headings":[],"ogTitles":[],"ogDescriptions":[]}.`;
  
  // Build the user prompt as a structured JSON object
  const userPromptObject = {
    task: "Generate the following metadata and structural elements for the content below. Use the character limits EXACTLY as specified. If any field exceeds its limit, you MUST shorten it intelligently while preserving the meaning and keyword relevance.",
    content: contentText,
    context: {
      language: formState.language,
      tone: formState.tone,
      audience: formState.targetAudience || 'General audience',
      industry: formState.industryNiche ? [formState.industryNiche] : ['General'],
      keywords: formState.keywords ? formState.keywords.split(',').map(k => k.trim()).filter(Boolean) : []
    },
    characterLimits: {
      urlSlugs: 60,
      metaDescriptions: 160,
      h1Variants: 60,
      h2Headings: 70,
      h3Headings: 70,
      ogTitles: 60,
      ogDescriptions: 110
    },
    requiredCounts: {
      ...((!seoOptions || seoOptions.urlSlugsEnabled) && { urlSlugs: formState.numUrlSlugs || seoOptions?.numUrlSlugs || 1 }),
      ...((!seoOptions || seoOptions.metaDescriptionsEnabled) && { metaDescriptions: formState.numMetaDescriptions || seoOptions?.numMetaDescriptions || 1 }),
      ...((!seoOptions || seoOptions.h1VariantsEnabled) && { h1Variants: formState.numH1Variants || seoOptions?.numH1Variants || 1 }),
      ...((!seoOptions || seoOptions.h2HeadingsEnabled) && { h2Headings: formState.numH2Variants || seoOptions?.numH2Headings || 2 }),
      ...((!seoOptions || seoOptions.h3HeadingsEnabled) && { h3Headings: formState.numH3Variants || seoOptions?.numH3Headings || 2 }),
      ...((!seoOptions || seoOptions.ogTitlesEnabled) && { ogTitles: formState.numOgTitles || seoOptions?.numOgTitles || 1 }),
      ...((!seoOptions || seoOptions.ogDescriptionsEnabled) && { ogDescriptions: formState.numOgDescriptions || seoOptions?.numOgDescriptions || 1 })
    },
    exampleOutputFormat: {
      ...((!seoOptions || seoOptions.urlSlugsEnabled) && { urlSlugs: Array(formState.numUrlSlugs || seoOptions?.numUrlSlugs || 1).fill("example-slug") }),
      ...((!seoOptions || seoOptions.metaDescriptionsEnabled) && { metaDescriptions: Array(formState.numMetaDescriptions || seoOptions?.numMetaDescriptions || 1).fill("Example meta description") }),
      ...((!seoOptions || seoOptions.h1VariantsEnabled) && { h1Variants: Array(formState.numH1Variants || seoOptions?.numH1Variants || 1).fill("Example H1") }),
      ...((!seoOptions || seoOptions.h2HeadingsEnabled) && { h2Headings: Array(formState.numH2Variants || seoOptions?.numH2Headings || 2).fill("Example H2") }),
      ...((!seoOptions || seoOptions.h3HeadingsEnabled) && { h3Headings: Array(formState.numH3Variants || seoOptions?.numH3Headings || 2).fill("Example H3") }),
      ...((!seoOptions || seoOptions.ogTitlesEnabled) && { ogTitles: Array(formState.numOgTitles || seoOptions?.numOgTitles || 1).fill("Example OG Title") }),
      ...((!seoOptions || seoOptions.ogDescriptionsEnabled) && { ogDescriptions: Array(formState.numOgDescriptions || seoOptions?.numOgDescriptions || 1).fill("Example OG Description") })
    },
    instructions: [
      "Your entire response MUST be a single valid JSON object using the same keys as in exampleOutputFormat. DO NOT include any explanation, markdown, extra text, or comments — only pure JSON.",
      "CRITICAL: Generate EXACTLY the number of items specified in requiredCounts for each field. NO MORE, NO LESS. If requiredCounts.urlSlugs = 1, generate exactly 1 URL slug. If requiredCounts.h2Headings = 3, generate exactly 3 H2 headings.",
      "ABSOLUTE CHARACTER LIMIT ENFORCEMENT: Each value MUST NEVER exceed its character limit. Exceeding limits by even 1 character is COMPLETE FAILURE.",
      "COUNT CHARACTERS BEFORE SUBMITTING: For every string you generate, count the characters and ensure it stays within the specified maximum.",
      "IF APPROACHING LIMIT: Immediately shorten content by removing words, using abbreviations, or simplifying language.",
      "PRIORITY ORDER: 1) Generate exact count specified in requiredCounts, 2) Stay within character limits (non-negotiable), 3) Include keywords, 4) Make compelling.",
      "Each string must be compelling, keyword-rich, and benefit-focused WITHIN the character constraints.",
      `Use natural ${formState.language} phrasing appropriate for professional audiences.`,
      "No explanations, markdown, comments, or narrative. Just pure JSON.",
      "FINAL VERIFICATION: Before submitting your JSON response, verify that 1) Each array has EXACTLY the count specified in requiredCounts, and 2) EVERY string is within its character limit. NO EXCEPTIONS."
    ]
  };

  // Convert to string for the API call
  const userPrompt = JSON.stringify(userPromptObject, null, 2);

  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);

  try {
    // Make the API request using the edge function
    const data = await makeApiRequestWithFallback(
      formState.model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.7, // Balanced creativity and consistency
      4000, // SEO generation needs moderate tokens
      { type: "json_object" },
      currentUser?.email
    );

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;
    
    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        formState.model,
        'generate_seo_metadata',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }
    
    // Extract the content from the response
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent || responseContent.trim() === '') {
      console.warn('Empty response from AI, returning empty SEO metadata');
      return {
        urlSlugs: [],
        metaDescriptions: [],
        h1Variants: [],
        h2Headings: [],
        h3Headings: [],
        ogTitles: [],
        ogDescriptions: []
      };
    }
    
    // Parse the JSON content
    const cleanContent = cleanJsonResponse(responseContent);
    const parsedResponse = JSON.parse(cleanContent);
    
    // Validate and clean up the response
    const seoMetadata: SeoMetadata = {
      urlSlugs: Array.isArray(parsedResponse.urlSlugs) ? parsedResponse.urlSlugs : [],
      metaDescriptions: Array.isArray(parsedResponse.metaDescriptions) ? parsedResponse.metaDescriptions : [],
      h1Variants: Array.isArray(parsedResponse.h1Variants) ? parsedResponse.h1Variants : [],
      h2Headings: Array.isArray(parsedResponse.h2Headings) ? parsedResponse.h2Headings : [],
      h3Headings: Array.isArray(parsedResponse.h3Headings) ? parsedResponse.h3Headings : [],
      ogTitles: Array.isArray(parsedResponse.ogTitles) ? parsedResponse.ogTitles : [],
      ogDescriptions: Array.isArray(parsedResponse.ogDescriptions) ? parsedResponse.ogDescriptions : []
    };
    
    if (progressCallback) {
      const totalElements = Object.values(seoMetadata).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      progressCallback(`Generated ${totalElements} SEO metadata elements`);
    }
    
    return seoMetadata;
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    if (progressCallback) {
      progressCallback(`Error generating SEO metadata: ${error.message}`);
    }
    
    // Return empty structure in case of error
    return {
      urlSlugs: [],
      metaDescriptions: [],
      h1Variants: [],
      h2Headings: [],
      h3Headings: [],
      ogTitles: [],
      ogDescriptions: []
    };
  }
}

/**
 * Generate FAQ Schema from existing text content
 * @param textContent - The text content to extract FAQ from
 * @param formState - The form state with generation settings
 * @param currentUser - The current user (for token tracking)
 * @param progressCallback - Optional callback for reporting progress
 * @returns FAQ Schema as JSON-LD object
 */
export async function generateFaqSchemaFromText(
  textContent: string,
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<any> {
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback('Generating FAQ Schema from content...');
  }
  
  // Build the system prompt
  const systemPrompt = `You are an expert in structured data and FAQ Schema generation.

Your task is to analyze the provided text content and generate a valid FAQPage Schema (JSON-LD) object.

CRITICAL REQUIREMENTS:
- Extract or create relevant FAQ content from the provided text
- Format as valid JSON-LD FAQPage Schema
- Include 5-8 question-answer pairs
- Each answer must be comprehensive (minimum 50 words)
- Questions should cover different aspects: what, how, why, when, where, benefits, process, etc.

Respond only with the JSON-LD object. No additional text or explanations.`;
  
  // Build the user prompt
  const userPrompt = `Analyze this content and generate a FAQPage Schema (JSON-LD) object:

"""
${textContent}
"""

Generate a FAQPage Schema in this EXACT format:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [specific question about the topic]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Comprehensive answer explaining the topic with specific details and examples..."
      }
    },
    {
      "@type": "Question", 
      "name": "How does [specific question about implementation/usage]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Detailed answer with step-by-step explanations and practical information..."
      }
    }
  ]
}

MANDATORY REQUIREMENTS:
- Your response MUST be ONLY this JSON object - no additional text
- Each question must be specific and relevant to the content
- Each answer must be comprehensive and informative (minimum 50 words per answer)
- Generate 5-8 question-answer pairs total
- All text must be properly escaped for JSON format
- Language: ${formState.language}`;

  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);

  try {
    // Make the API request using the edge function
    const data = await makeApiRequestWithFallback(
      formState.model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.7,
      4000,
      { type: "json_object" },
      currentUser?.email
    );

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;
    
    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        formState.model,
        'generate_faq_schema',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }
    
    // Extract the content from the response
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent || responseContent.trim() === '') {
      console.warn('Empty response from AI, returning empty FAQ schema');
      return {};
    }
    
    // Parse the JSON content
    const cleanFaqContent = cleanJsonResponse(responseContent);
    const faqSchema = JSON.parse(cleanFaqContent);
    
    if (progressCallback) {
      const questionCount = faqSchema.mainEntity?.length || 0;
      progressCallback(`Generated FAQ Schema with ${questionCount} question-answer pairs`);
    }
    
    return faqSchema;
  } catch (error) {
    console.error('Error generating FAQ schema from text:', error);
    if (progressCallback) {
      progressCallback(`Error generating FAQ schema: ${error.message}`);
    }
    
    // Return empty object in case of error
    return {};
  }
}

/**
 * Generate a single type of SEO element on-demand
 * @param content - The content to generate SEO metadata for
 * @param elementType - The type of SEO element to generate
 * @param count - How many variations to generate
 * @param formState - The form state with generation settings
 * @param currentUser - The current user (for token tracking)
 * @param progressCallback - Optional callback for reporting progress
 * @param sessionId - Session ID for token tracking
 * @returns Partial SeoMetadata object with only the requested element
 */
export async function generateSeoElement(
  content: any,
  elementType: 'urlSlugs' | 'metaDescriptions' | 'h1Variants' | 'h2Headings' | 'h3Headings' | 'ogTitles' | 'ogDescriptions',
  count: number,
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<Partial<SeoMetadata>> {
  // Extract actual content from nested objects
  let actualContent = content;
  if (typeof content === 'object' && content.content) {
    actualContent = content.content;
  }

  // Extract text from structured content if needed
  const contentText = typeof actualContent === 'string'
    ? actualContent
    : actualContent.headline
      ? `${actualContent.headline}\n\n${actualContent.sections.map((s: any) =>
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(actualContent);

  // Map element types to their labels and character limits
  const elementConfig = {
    urlSlugs: { label: 'URL Slugs', charLimit: 60 },
    metaDescriptions: { label: 'Meta Descriptions', charLimit: 160 },
    h1Variants: { label: 'H1 Variants', charLimit: 60 },
    h2Headings: { label: 'H2 Headings', charLimit: 70 },
    h3Headings: { label: 'H3 Headings', charLimit: 70 },
    ogTitles: { label: 'Open Graph Titles', charLimit: 60 },
    ogDescriptions: { label: 'Open Graph Descriptions', charLimit: 110 }
  };

  const config = elementConfig[elementType];

  if (progressCallback) {
    progressCallback(`Generating ${config.label}...`);
  }

  const systemPrompt = `You are an expert SEO strategist with ABSOLUTE CHARACTER LIMIT ENFORCEMENT.

CRITICAL NON-NEGOTIABLE REQUIREMENTS:
- NEVER EXCEED the specified character limit under ANY circumstances
- If your generated content approaches the limit, IMMEDIATELY shorten it
- Count characters meticulously for EVERY piece of content you generate
- CHARACTER LIMITS ARE ABSOLUTE - exceeding them by even 1 character is COMPLETE FAILURE
- If unsure about length, always err on the side of being shorter rather than longer

Respond only in JSON format. Do not include any explanations, markdown, or extra output — only return the final JSON.`;

  const userPromptObject = {
    task: `Generate EXACTLY ${count} variations of ${config.label} for the content below.`,
    content: contentText,
    context: {
      language: formState.language,
      tone: formState.tone,
      audience: formState.targetAudience || 'General audience',
      industry: formState.industryNiche ? [formState.industryNiche] : ['General'],
      keywords: formState.keywords ? formState.keywords.split(',').map(k => k.trim()).filter(Boolean) : []
    },
    characterLimit: config.charLimit,
    requiredCount: count,
    exampleOutputFormat: {
      [elementType]: Array(count).fill(`Example ${config.label.slice(0, -1)}`)
    },
    instructions: [
      `Generate EXACTLY ${count} variations. NO MORE, NO LESS.`,
      `Each variation MUST be ${config.charLimit} characters or less. This is ABSOLUTE and NON-NEGOTIABLE.`,
      `Your entire response MUST be a single valid JSON object with one key: "${elementType}" containing an array of ${count} strings.`,
      'Each string must be compelling, keyword-rich, and benefit-focused WITHIN the character constraints.',
      `Use natural ${formState.language} phrasing appropriate for professional audiences.`,
      'VERIFY BEFORE SUBMITTING: Count characters for each string and ensure none exceed the limit.'
    ]
  };

  const userPrompt = JSON.stringify(userPromptObject, null, 2);

  storePrompts(systemPrompt, userPrompt);

  try {
    const data = await makeApiRequestWithFallback(
      formState.model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.7,
      2000,
      { type: "json_object" },
      currentUser?.email
    );

    const tokenUsage = data.usage?.total_tokens || 0;

    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        formState.model,
        `generate_seo_${elementType}`,
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }

    const responseContent = data.choices[0]?.message?.content;

    if (!responseContent || responseContent.trim() === '') {
      console.warn(`Empty response from AI for ${elementType}`);
      return { [elementType]: [] };
    }

    const cleanContent = cleanJsonResponse(responseContent);
    const parsedResponse = JSON.parse(cleanContent);

    const result: Partial<SeoMetadata> = {
      [elementType]: Array.isArray(parsedResponse[elementType]) ? parsedResponse[elementType] : []
    };

    if (progressCallback) {
      const generatedCount = (result[elementType] as string[]).length;
      progressCallback(`Generated ${generatedCount} ${config.label}`);
    }

    return result;
  } catch (error) {
    console.error(`Error generating ${elementType}:`, error);
    if (progressCallback) {
      progressCallback(`Error generating ${config.label}: ${error.message}`);
    }

    return { [elementType]: [] };
  }
}