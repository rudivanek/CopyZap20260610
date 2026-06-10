/*
  # Update Google Ads Copy prefill

  1. Updates
    - Updates the existing "Google Ads Copy" prefill label to include placeholder guidance
    - Enhances the data field with additional targeting and messaging fields
    - Adds industry/niche, preferred writing style, reader funnel stage fields
    - Includes brand values, context, and pain points for better ad targeting
    - Maintains existing word count controls and settings for Google Ads format
  
  2. Enhanced Fields
    - Target audience guidance for search intent users
    - Industry/niche field for better targeting
    - Brand values and context for consistent messaging
    - Pain points specific to search users
    - Product/service name field for personalization
*/

-- Update the Google Ads Copy prefill with enhanced label and comprehensive data
UPDATE pmc_prefills 
SET 
  label = 'Google Ads Copy for [ENTER YOUR PRODUCT/SERVICE]',
  data = jsonb_build_object(
    'pageType', 'Other',
    'outputStructure', jsonb_build_array(
      jsonb_build_object('value', 'header1', 'label', 'Header 1', 'wordCount', null),
      jsonb_build_object('value', 'header2', 'label', 'Header 2', 'wordCount', null),
      jsonb_build_object('value', 'callToAction', 'label', 'Call to Action', 'wordCount', null)
    ),
    'keyMessage', 'What''s your strongest selling point for ad searchers?',
    'callToAction', 'Click to learn more',
    'desiredEmotion', 'Urgency',
    'tone', 'Bold',
    'wordCount', 'Custom',
    'customWordCount', 45,
    'prioritizeWordCount', true,
    'adhereToLittleWordCount', true,
    'keywords', 'Enter your target ad keywords',
    'targetAudience', 'People actively searching for your solution',
    'industryNiche', 'Enter your industry',
    'preferredWritingStyle', 'Persuasive',
    'readerFunnelStage', 'Decision',
    'targetAudiencePainPoints', 'Active search intent, comparing options, need quick decision',
    'productServiceName', 'Enter your product/service name',
    'brandValues', 'Trust, Results, Quality',
    'context', 'Paid search environment where users are actively looking for solutions'
  )
WHERE label = 'Google Ads Copy' AND category = 'Advertising & Paid Media';