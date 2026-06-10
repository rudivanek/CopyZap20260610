/**
 * Template JSON suggestions functionality
 */
import { FormState, User, Model } from '../../types';
import { storePrompts, makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';

/**
 * Generate a detailed template JSON suggestion based on user instruction
 * @param instruction - Natural language instruction for the template
 * @param currentUser - The current user (for token tracking)
 * @returns A detailed FormState object as JSON
 */
export async function generateTemplateJsonSuggestion(
  instruction: string,
  currentUser: User,
  model: Model = 'gpt-4o',
  sessionId?: string
): Promise<Partial<FormState>> {

  // Build comprehensive system prompt for template generation
  const systemPrompt = `You are an expert template generator for CopyZap. Your task is to analyze user instructions and generate a detailed, comprehensive JSON template for the FormState object.

CRITICAL: You must respond with a valid JSON object only. No explanations, no markdown, no additional text.

The JSON should represent a FormState object with the following structure and guidelines:

REQUIRED FIELDS:
- originalCopy: string (UNIVERSAL primary content field - ALWAYS use this for the main content description regardless of whether creating new copy or improving existing copy)
- projectDescription: string (internal organization field)
- language: one of ["English", "Spanish", "French", "German", "Italian", "Portuguese"]
- tone: one of ["Professional", "Friendly", "Bold", "Minimalist", "Creative", "Persuasive"]
- wordCount: one of ["Short: 50-100", "Medium: 100-200", "Long: 200-400", "Custom"]
- customWordCount: number (if wordCount is "Custom")
- model: "deepseek-chat" (default model)

OPTIONAL FIELDS TO POPULATE WHEN RELEVANT:
- pageType: one of ["Homepage", "About", "Services", "Contact", "Other"]
- section: string (e.g., "Hero Section", "Benefits", "Features", "FAQ", "Full Copy")
- productServiceName: string
- briefDescription: string
- targetAudience: string (detailed audience description)
- keyMessage: string
- callToAction: string
- desiredEmotion: string
- brandValues: string
- keywords: string
- context: string
- industryNiche: string
- toneLevel: number (0-100, 50 is default)
- readerFunnelStage: string
- targetAudiencePainPoints: string
- preferredWritingStyle: string
- languageStyleConstraints: string[]
- competitorUrls: string[] (max 3 URLs)
- competitorCopyText: string
- excludedTerms: string

CRITICAL FIELD USAGE RULES:
- ALWAYS populate originalCopy field with the main content description from the user's instruction
- NEVER populate businessDescription field (it is deprecated and not used anymore)
- originalCopy is used for both creating new copy and improving existing copy
- The content in originalCopy should describe what the user wants to achieve or the copy they want to improve

STRUCTURE AND FEATURES:
- outputStructure: array of objects with {value: string, label: string, wordCount: number}
- generateSeoMetadata: boolean
- generateScores: boolean
- generateGeoScore: boolean
- prioritizeWordCount: boolean
- forceElaborationsExamples: boolean
- enhanceForGEO: boolean
- addTldrSummary: boolean
- geoRegions: string

SEO METADATA COUNTS (when generateSeoMetadata is true):
- numUrlSlugs: number (1-5)
- numMetaDescriptions: number (1-5) 
- numH1Variants: number (1-5)
- numH2Variants: number (1-10)
- numH3Variants: number (1-10)
- numOgTitles: number (1-5)
- numOgDescriptions: number (1-5)

WORD COUNT FEATURES:
- adhereToLittleWordCount: boolean (for content under 100 words)
- littleWordCountTolerancePercentage: number (default 20)
- wordCountTolerancePercentage: number (default 2)

OUTPUT STRUCTURE OPTIONS:
Available values: "header1", "header2", "structured", "paragraphs", "problem", "solution", "benefits", "features", "bullets", "numbered", "qaFormat", "faqJson", "callToAction", "testimonial", "comparison", "statistics", "casestudy", "quote", "summary", "introduction", "conclusion"

INSTRUCTIONS:
1. Analyze the user's instruction carefully
2. Extract content type, word count, target audience, features needed
3. Set appropriate values for all relevant fields
4. Be comprehensive - fill in logical defaults and suggestions
5. Make the template immediately usable for content generation
6. Include relevant SEO and optimization features when appropriate
7. Set realistic word count allocations for output structure elements
8. Consider the content type when setting tone, style, and features
9. ALWAYS use originalCopy field for primary content, NEVER businessDescription
10. NEVER include selectedPersona field - voice styles should be applied manually after generation`;

  // Build user prompt with examples
  const userPrompt = `Generate a comprehensive FormState JSON template based on this instruction:

"${instruction}"

ANALYSIS REQUIREMENTS:
1. Determine the content type and set appropriate pageType/section
2. Extract word count requirements and set wordCount/customWordCount
3. Infer target audience and industry from context
4. Set appropriate tone and writing style
5. Include relevant output structure with word count allocations
6. Enable appropriate features (SEO, scoring, etc.)
7. Fill in logical defaults for key messaging elements

EXAMPLE TEMPLATE STRUCTURE:
{
  "originalCopy": "Detailed description of what to achieve based on the instruction",
  "projectDescription": "Brief project identifier",
  "language": "English",
  "tone": "Professional",
  "wordCount": "Custom",
  "customWordCount": 400,
  "model": "deepseek-chat",
  "pageType": "Other",
  "section": "Blog Post",
  "productServiceName": "Twitter Marketing Services",
  "briefDescription": "Blog post template for Twitter marketing",
  "targetAudience": "Social media managers and digital marketers looking to improve their Twitter strategy",
  "keyMessage": "Effective Twitter marketing drives engagement and conversions",
  "callToAction": "Start implementing these strategies",
  "keywords": "twitter marketing, social media strategy, engagement",
  "industryNiche": "marketing-advertising",
  "preferredWritingStyle": "Informative",
  "outputStructure": [
    {"value": "introduction", "label": "Introduction", "wordCount": 50},
    {"value": "problem", "label": "Problem", "wordCount": 100},
    {"value": "solution", "label": "Solution", "wordCount": 150},
    {"value": "benefits", "label": "Benefits", "wordCount": 75},
    {"value": "callToAction", "label": "Call to Action", "wordCount": 25}
  ],
  "generateSeoMetadata": true,
  "generateScores": true,
  "forceElaborationsExamples": true,
  "prioritizeWordCount": true,
  "wordCountTolerancePercentage": 20,
  "numH2Variants": 3,
  "numH3Variants": 5
}

Generate a similar comprehensive template based on the user's instruction. Include all relevant fields and make logical inferences about what would make this template most effective.

CRITICAL REMINDERS:
- ALWAYS populate originalCopy with the main content description
- NEVER populate businessDescription (deprecated field)
- NEVER include selectedPersona field (voice styles are applied manually after generation)
- The originalCopy field should contain a detailed description of what the user wants to achieve or the copy they want to create/improve`;

  // Store the prompts for display
  storePrompts(systemPrompt, userPrompt);

  // Prepare the messages
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    // Use makeApiRequestWithFallback which handles OpenAI -> DeepSeek fallback
    const completion = await makeApiRequestWithFallback(
      model,
      messages,
      0.7,
      4000,
      { type: "json_object" },
      currentUser.email
    );

    // Extract token usage
    const tokenUsage = completion.usage?.total_tokens || 0;

    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        completion.model_used,
        'template_suggestion',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(completion.usage)
      );
    }

    // Extract the content from the response
    let responseContent = completion.choices[0]?.message?.content;

    if (!responseContent || responseContent.trim() === '') {
      throw new Error('AI returned empty response');
    }

    // Clean markdown code blocks if present
    // Some models wrap JSON in ```json...``` blocks despite being told not to
    const cleanContent = cleanJsonResponse(responseContent);

    // Parse the JSON content with error handling
    let templateJson;
    try {
      templateJson = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON Parse Error in template suggestions:', parseError);
      console.error('Raw response:', responseContent);
      console.error('Cleaned content:', cleanContent);

      // Try to fix common JSON issues like unescaped newlines
      let fixedContent = cleanContent.replace(/([^\\])\n/g, '$1\\n');

      try {
        templateJson = JSON.parse(fixedContent);
        console.log('Successfully parsed template suggestions after fixing newlines');
      } catch (secondError) {
        console.error('Still failed after fixing newlines:', secondError);
        throw new Error(`Failed to parse template suggestions: ${parseError.message}`);
      }
    }

    return templateJson;
  } catch (error) {
    console.error('Error generating template JSON suggestion:', error);
    throw error;
  }
}