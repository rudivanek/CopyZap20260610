/**
 * Suggestions functionality for form fields
 */
import { Model, User } from '../../types';
import { makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';

/**
 * Get AI-generated suggestions for a specific field
 * @param text - The context text (business description or original copy)
 * @param fieldType - The type of field to generate suggestions for
 * @param model - The AI model to use
 * @param language - The language to generate suggestions in
 * @param currentUser - The current user (for token tracking)
 * @param progressCallback - Optional callback for reporting progress
 * @returns An array of suggestions
 */
export async function getSuggestions(
  text: string,
  fieldType: string,
  model: Model,
  language: string = 'English',
  currentUser?: User,
  progressCallback?: (message: string) => void,
  sessionId?: string,
  projectDescription?: string
): Promise<string[]> {
  if (!text || !fieldType) {
    throw new Error('Text and field type are required');
  }
  
  // Will use maxTokens from model config in makeApiRequestWithFallback
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Generating suggestions for ${fieldType}...`);
  }
  
  // Define field-specific instructions
  let fieldInstructions = '';
  
  switch (fieldType) {
    case 'keyMessage':
      fieldInstructions = `key messages that summarize the main point or value proposition`;
      break;
    case 'targetAudience':
      fieldInstructions = `target audience descriptions focusing on demographics, interests, and needs`;
      break;
    case 'callToAction':
      fieldInstructions = `effective calls to action that would motivate the user's target audience to take the next step`;
      break;
    case 'desiredEmotion':
      fieldInstructions = `emotional responses that the content should evoke in the audience`;
      break;
    case 'brandValues':
      fieldInstructions = `brand values that would align with this business`;
      break;
    case 'keywords':
      fieldInstructions = `SEO keywords and key phrases that would be relevant`;
      break;
    case 'context':
      fieldInstructions = `contextual information that would help create more effective copy`;
      break;
    case 'industryNiche':
      fieldInstructions = `specific industry niches that best match this business`;
      break;
    case 'readerFunnelStage':
      fieldInstructions = `appropriate marketing funnel stages for this content (awareness, consideration, decision, etc.)`;
      break;
    case 'preferredWritingStyle':
      fieldInstructions = `writing styles that would be most effective for this content`;
      break;
    case 'targetAudiencePainPoints':
      fieldInstructions = `specific pain points or challenges that the target audience likely faces`;
      break;
    case 'competitorCopyText':
      fieldInstructions = `suggestions for competitor copy examples that would be relevant to analyze`;
      break;
    default:
      fieldInstructions = `suggestions for the ${fieldType} field`;
  }
  
  // Build the system prompt
  const systemPrompt = `You are an expert marketing advisor helping to generate suggestions for a marketing copy project. 
  Provide practical, high-quality suggestions based on the context provided.`;
  
  // Build the user prompt
  let userPrompt = '';
  
  if (model === 'grok-4-latest') {
    // Simplified prompt for GROK without JSON formatting requirements
    userPrompt = `Based on this information, suggest 6-8 relevant ${fieldInstructions} in ${language} language:

Context:
"""
${text}
"""

Please provide your suggestions as a simple numbered list:
1. First suggestion
2. Second suggestion
3. Third suggestion
(etc.)

Keep suggestions concise and practical.`;
  } else {
    userPrompt = `Based on the following information, suggest 6-8 relevant ${fieldInstructions}. 
  The suggestions should be in ${language} language.
  
  Context:
  """
  ${text}
  """
  
  Format your response as a JSON array of strings like this:
  [
    "Suggestion 1",
    "Suggestion 2",
    "Suggestion 3"
  ]
  
  Keep each suggestion concise and focused. No need for explanations or additional commentary.`;
  }
  
  try {
    // Make the API request with fallback
    const data = await makeApiRequestWithFallback(
      model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.8,
      2000,
      model !== 'grok-4-latest' ? { type: "json_object" } : undefined,
      currentUser?.email
    );

    // Debug: Log the actual response structure for GROK API
    if (model === 'grok-4-latest' || data.model_used === 'grok-4-latest') {
      console.log('GROK API Response structure:', JSON.stringify(data, null, 2));
      console.log('GROK choices array:', data.choices);
      if (data.choices && data.choices[0]) {
        console.log('GROK first choice:', data.choices[0]);
        console.log('GROK message object:', data.choices[0].message);
        console.log('GROK content:', data.choices[0].message?.content);
      }
    }

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;
    
    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        data.model_used,
        'field_suggestion',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }

    // Extract the content from the response
    let content = data.choices[0]?.message?.content;

    // Handle different possible response structures for GROK
    if (!content && (model === 'grok-4-latest' || data.model_used === 'grok-4-latest')) {
      console.log('GROK: No content in standard location, checking alternative structures...');
      
      // Check if GROK has a different response structure
      if (data.choices && data.choices[0]) {
        const choice = data.choices[0];
        
        // Try different possible content locations
        content = choice.message?.content || 
                 choice.text || 
                 choice.content || 
                 (choice.message as any)?.text ||
                 (choice as any)?.delta?.content;
        
        console.log('GROK: Found content in alternative location:', !!content);
      }
      
      // If still no content, check if the entire response is the content
      if (!content && typeof data === 'string') {
        content = data;
        console.log('GROK: Using entire response as content');
      }
    }
    
    if (!content) {
      // Check if this was a token limit issue (finish_reason: "length")
      const finishReason = data.choices?.[0]?.finish_reason;
      if (finishReason === 'length') {
        console.warn(`${model} hit token limit during suggestions generation`);
        if (progressCallback) {
          progressCallback(`${model} hit token limit - try a simpler context or different model`);
        }
        throw new Error(`${model} hit token limit during generation. Try using a simpler context or switch to a different model.`);
      }
      
      console.error(`No content in ${model} AI response for suggestions`);
      console.error('Full response data:', JSON.stringify(data, null, 2));
      if (progressCallback) {
        progressCallback(`No suggestions received from ${model} AI`);
      }
      throw new Error(`No content received from ${model} AI for suggestions`);
    }
    
    // Check if content is empty string or only whitespace
    if (typeof content === 'string' && content.trim().length === 0) {
      // For GROK, empty content is a valid response indicating no suggestions
      if (model !== 'grok-4-latest') {
        console.error(`Empty content in ${model} AI response for suggestions`);
        console.error('Full response data:', JSON.stringify(data, null, 2));
      }
      if (progressCallback) {
        progressCallback(model === 'grok-4-latest' ? 'No suggestions available' : `Empty response received from ${model} AI`);
      }
      return [];
    }
    
    // Parse the content based on model type
    let suggestions: string[];

    if (model === 'grok-4-latest') {
      // Parse numbered list format for GROK
      const lines = content.split('\n').filter(line => line.trim());
      suggestions = lines
        .filter(line => /^\d+\./.test(line.trim())) // Only lines that start with number and dot
        .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove number and dot
        .filter(suggestion => suggestion.length > 0); // Remove empty suggestions
    } else {
      // Parse JSON format for other models
      // Clean any markdown code fences that might wrap the JSON
      const cleanContent = cleanJsonResponse(content);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('JSON Parse Error in suggestions:', parseError);
        console.error('Raw response:', content);
        console.error('Cleaned content:', cleanContent);

        // Try to fix common JSON issues like unescaped newlines
        let fixedContent = cleanContent.replace(/([^\\])\n/g, '$1\\n');

        try {
          parsedResponse = JSON.parse(fixedContent);
          console.log('Successfully parsed suggestions after fixing newlines');
        } catch (secondError) {
          console.error('Still failed after fixing newlines:', secondError);
          throw new Error(`Failed to parse AI suggestions: ${parseError.message}`);
        }
      }
    
      if (Array.isArray(parsedResponse)) {
        // Direct array format
        suggestions = parsedResponse;
      } else if (parsedResponse && typeof parsedResponse === 'object') {
        // Object format - check for various response keys
        if (Array.isArray(parsedResponse.suggestions)) {
          suggestions = parsedResponse.suggestions;
        } else if (fieldType === 'readerFunnelStage' && Array.isArray(parsedResponse.marketing_funnel_stages)) {
          // Handle specific response format for reader funnel stage
          suggestions = parsedResponse.marketing_funnel_stages;
        } else {
          // Try to find any array in the response object
          const arrayValues = Object.values(parsedResponse).filter(value => Array.isArray(value));
          if (arrayValues.length > 0) {
            suggestions = arrayValues[0] as string[];
          } else {
            console.error('Unexpected response format:', content);
            return [];
          }
        }
      } else {
        console.error('Unexpected response format:', content);
        return [];
      }
    }
    
    // Ensure all items are strings
    const validSuggestions = suggestions.filter(item => typeof item === 'string' && item.trim().length > 0);
    
    if (progressCallback) {
      progressCallback(`Generated ${validSuggestions.length} suggestions for ${fieldType}`);
    }
    
    return validSuggestions;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    if (progressCallback) {
      progressCallback(`Error generating suggestions: ${error.message}`);
    }
    throw error;
  }
}