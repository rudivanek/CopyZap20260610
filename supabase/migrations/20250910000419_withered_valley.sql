/*
  # Update Google Ads Copy prefill with enhanced fields

  1. Updates
    - Enhanced prefill label to include placeholder for customization
    - Added comprehensive form fields for Google Ads copy generation
    - Added project description matching prefill name
    - Enhanced targeting and messaging fields
    - Maintained optimal settings for Google Ads format (45 words, strict adherence)

  2. Changes Made
    - Updated label to "Google Ads Copy for [ENTER YOUR PRODUCT/SERVICE]"
    - Added project description field
    - Enhanced target audience description
    - Added industry/niche, reader funnel stage, brand values
    - Added context specific to paid search environment
    - Added target audience pain points for search users
*/

UPDATE pmc_prefills 
SET 
  label = 'Google Ads Copy for [ENTER YOUR PRODUCT/SERVICE]',
  data = jsonb_build_object(
    'pageType', 'Other',
    'projectDescription', 'Google Ads Copy for [ENTER YOUR PRODUCT/SERVICE]',
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