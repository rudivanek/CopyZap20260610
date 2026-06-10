/*
  # Update Retargeting Ad Copy prefill with enhanced fields

  1. Updates
    - Enhanced label to "Retargeting Ad Copy for [ENTER YOUR PRODUCT/SERVICE]"
    - Added comprehensive form fields for better retargeting ad generation
    - Added project description matching the prefill name
    - Enhanced output structure for retargeting flow
    - Added industry/niche, brand values, and context fields
    - Maintains existing word count and targeting settings

  2. Enhanced Fields
    - Project Description: Matches prefill name for organization
    - Industry/Niche: Placeholder for user's industry
    - Product/Service Name: Placeholder for user's product
    - Preferred Writing Style: Set to "Persuasive" for retargeting
    - Reader's Funnel Stage: Set to "Decision" (warm audience)
    - Brand Values: Trust-focused for conversion
    - Keywords: Placeholder for retargeting keywords
    - Context: Specific to re-engagement scenarios
    - Output Structure: Optimized for retargeting ad flow
*/

UPDATE pmc_prefills 
SET 
  label = 'Retargeting Ad Copy for [ENTER YOUR PRODUCT/SERVICE]',
  data = jsonb_build_object(
    'pageType', 'Other',
    'projectDescription', 'Retargeting Ad Copy for [ENTER YOUR PRODUCT/SERVICE]',
    'industryNiche', 'Enter your industry',
    'productServiceName', 'Enter your product/service name',
    'keyMessage', 'Why should they come back and complete their action?',
    'callToAction', 'Complete your order',
    'desiredEmotion', 'Urgency',
    'tone', 'Persuasive',
    'wordCount', 'Custom',
    'customWordCount', 80,
    'prioritizeWordCount', true,
    'adhereToLittleWordCount', true,
    'targetAudience', 'Previous website visitors who didn''t convert',
    'targetAudiencePainPoints', 'Abandonment, hesitation, comparison shopping',
    'preferredWritingStyle', 'Persuasive',
    'readerFunnelStage', 'Decision',
    'brandValues', 'Trust, Value, Reliability',
    'keywords', 'Enter retargeting keywords',
    'context', 'Re-engaging users who showed interest but didn''t convert',
    'outputStructure', jsonb_build_array(
      jsonb_build_object('value', 'header1', 'label', 'Header 1', 'wordCount', null),
      jsonb_build_object('value', 'problem', 'label', 'Problem', 'wordCount', null),
      jsonb_build_object('value', 'solution', 'label', 'Solution', 'wordCount', null),
      jsonb_build_object('value', 'callToAction', 'label', 'Call to Action', 'wordCount', null)
    )
  )
WHERE label = 'Retargeting Ad Copy' AND category = 'Advertising & Paid Media';