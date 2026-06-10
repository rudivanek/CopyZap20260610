/*
  # Update Ad Copy Awareness Prefill

  1. Updates
     - Updates the "Ad Copy (Awareness)" prefill label to include descriptive placeholder
     - Enhances the prefill data with comprehensive form fields for awareness-stage advertising
     - Adds targeting, messaging, and word count controls for better ad copy generation

  2. Changes Made
     - Label: "Ad Copy (Awareness)" → "Create awareness ad copy about [ENTER YOUR PRODUCT/SERVICE]"
     - Enhanced data JSONB with target audience, key message, industry guidance
     - Added output structure for organized ad copy
     - Enabled word count controls for precise ad length (80 words)
     - Added persuasive writing style and keyword integration
*/

-- Update the Ad Copy (Awareness) prefill with enhanced label and comprehensive data
UPDATE pmc_prefills 
SET 
  label = 'Create awareness ad copy about [ENTER YOUR PRODUCT/SERVICE]',
  data = jsonb_build_object(
    'pageType', 'Other',
    'targetAudience', 'People who haven''t heard of your solution yet and are experiencing the problem',
    'keyMessage', 'Introduce your unique value proposition and grab attention',
    'industryNiche', 'Enter your industry',
    'preferredWritingStyle', 'Persuasive',
    'keywords', 'Enter keywords for your product/service',
    'outputStructure', jsonb_build_array(
      jsonb_build_object('value', 'header1', 'label', 'Header 1', 'wordCount', null),
      jsonb_build_object('value', 'problem', 'label', 'Problem', 'wordCount', null),
      jsonb_build_object('value', 'solution', 'label', 'Solution', 'wordCount', null),
      jsonb_build_object('value', 'callToAction', 'label', 'Call to Action', 'wordCount', null)
    ),
    'targetAudiencePainPoints', 'Describe the problem your audience faces that they might not know can be solved',
    'productServiceName', 'Enter your product or service name',
    'readerFunnelStage', 'Awareness',
    'desiredEmotion', 'Curiosity',
    'callToAction', 'Learn more',
    'tone', 'Bold',
    'wordCount', 'Custom',
    'customWordCount', 80,
    'prioritizeWordCount', true,
    'adhereToLittleWordCount', true
  ),
  updated_at = now()
WHERE label = 'Ad Copy (Awareness)'
  AND category = 'Advertising & Paid Media';