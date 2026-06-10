/*
# Fix Project Description for all prefills

1. Updates
   - Fix Project Description field within JSONB data for all prefills
   - Handle both updated and original label formats
   - Add missing prefills that weren't in previous batch

2. Method
   - Use single JSONB update per statement to avoid multiple column assignment error
   - Match by existing labels (both old and new formats)
   - Only update where Project Description is missing or empty

3. Verification
   - Query at bottom to check final status of all prefills
*/

-- Update prefills with enhanced labels (from previous migration)
UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"About Us Section for [ENTER YOUR BRAND/COMPANY]"')
WHERE label = 'About Us Section for [ENTER YOUR BRAND/COMPANY]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Homepage Copy for [ENTER YOUR WEBSITE/BRAND]"')
WHERE label = 'Homepage Copy for [ENTER YOUR WEBSITE/BRAND]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Service Page for [ENTER YOUR SERVICE NAME]"')
WHERE label = 'Service Page for [ENTER YOUR SERVICE NAME]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Unique Selling Proposition (USP) for [ENTER YOUR BRAND/PRODUCT]"')
WHERE label = 'Unique Selling Proposition (USP) for [ENTER YOUR BRAND/PRODUCT]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Blog Post: [ENTER YOUR TOPIC]"')
WHERE label = 'Blog Post: [ENTER YOUR TOPIC]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Case Study: [ENTER CLIENT/PROJECT NAME]"')
WHERE label = 'Case Study: [ENTER CLIENT/PROJECT NAME]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Newsletter Content: [ENTER TOPIC/UPDATE]"')
WHERE label = 'Newsletter Content: [ENTER TOPIC/UPDATE]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Press Release: [ENTER ANNOUNCEMENT]"')
WHERE label = 'Press Release: [ENTER ANNOUNCEMENT]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Video Script Outline: [ENTER VIDEO TOPIC]"')
WHERE label = 'Video Script Outline: [ENTER VIDEO TOPIC]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Webinar Promotion: [ENTER WEBINAR TOPIC]"')
WHERE label = 'Webinar Promotion: [ENTER WEBINAR TOPIC]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"White Paper Abstract: [ENTER WHITE PAPER TOPIC]"')
WHERE label = 'White Paper Abstract: [ENTER WHITE PAPER TOPIC]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"AIDA Framework for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'AIDA Framework for [ENTER YOUR PRODUCT/SERVICE]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"High-Converting Hero Section for [ENTER YOUR WEBSITE/PRODUCT]"')
WHERE label = 'High-Converting Hero Section for [ENTER YOUR WEBSITE/PRODUCT]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"PAS Framework for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'PAS Framework for [ENTER YOUR PRODUCT/SERVICE]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Feature Announcement for [ENTER NEW FEATURE NAME]"')
WHERE label = 'Feature Announcement for [ENTER NEW FEATURE NAME]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Pricing Page Copy for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'Pricing Page Copy for [ENTER YOUR PRODUCT/SERVICE]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Product Comparison Page for [ENTER YOUR PRODUCT NAME]"')
WHERE label = 'Product Comparison Page for [ENTER YOUR PRODUCT NAME]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Product Description (E-commerce) for [ENTER PRODUCT NAME]"')
WHERE label = 'Product Description (E-commerce) for [ENTER PRODUCT NAME]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Product Launch Announcement for [ENTER PRODUCT NAME]"')
WHERE label = 'Product Launch Announcement for [ENTER PRODUCT NAME]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Cold Email Outreach for [ENTER YOUR OFFER]"')
WHERE label = 'Cold Email Outreach for [ENTER YOUR OFFER]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Email Content: [ENTER EMAIL TOPIC]"')
WHERE label = 'Email Content: [ENTER EMAIL TOPIC]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Lead Nurturing Email: [ENTER TOPIC/STAGE]"')
WHERE label = 'Lead Nurturing Email: [ENTER TOPIC/STAGE]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"SaaS Onboarding Email Series: [ENTER PRODUCT NAME]"')
WHERE label = 'SaaS Onboarding Email Series: [ENTER PRODUCT NAME]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Testimonial Request Email for [ENTER CLIENT NAME]"')
WHERE label = 'Testimonial Request Email for [ENTER CLIENT NAME]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Call to Action (CTA) for [ENTER YOUR OFFER]"')
WHERE label = 'Call to Action (CTA) for [ENTER YOUR OFFER]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"FAQ Section (Conversion-focused) for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'FAQ Section (Conversion-focused) for [ENTER YOUR PRODUCT/SERVICE]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Landing Page (Lead Gen) for [ENTER YOUR OFFER]"')
WHERE label = 'Landing Page (Lead Gen) for [ENTER YOUR OFFER]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Sales Page (Long-Form) for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'Sales Page (Long-Form) for [ENTER YOUR PRODUCT/SERVICE]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Thank You Page for [ENTER YOUR ACTION]"')
WHERE label = 'Thank You Page for [ENTER YOUR ACTION]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"SEO Content Brief: [ENTER YOUR TOPIC]"')
WHERE label = 'SEO Content Brief: [ENTER YOUR TOPIC]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"LinkedIn Post (Thought Leadership) for [ENTER YOUR TOPIC]"')
WHERE label = 'LinkedIn Post (Thought Leadership) for [ENTER YOUR TOPIC]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Social Media Post (Instagram/Facebook) for [ENTER YOUR TOPIC]"')
WHERE label = 'Social Media Post (Instagram/Facebook) for [ENTER YOUR TOPIC]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Software Tutorial/Help Content for [ENTER SOFTWARE/FEATURE NAME]"')
WHERE label = 'Software Tutorial/Help Content for [ENTER SOFTWARE/FEATURE NAME]' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

-- Handle any prefills that might still have original labels (fallback updates)
UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Google Ads Copy for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'Google Ads Copy' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Retargeting Ad Copy for [ENTER YOUR OFFER]"')
WHERE label = 'Retargeting Ad Copy' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Slogan / Tagline for [ENTER YOUR BRAND]"')
WHERE label = 'Slogan / Tagline' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"About Us Section for [ENTER YOUR BRAND/COMPANY]"')
WHERE label = 'About Us Section' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Homepage Copy for [ENTER YOUR WEBSITE/BRAND]"')
WHERE label = 'Homepage Copy' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Service Page for [ENTER YOUR SERVICE NAME]"')
WHERE label = 'Service Page' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Unique Selling Proposition (USP) for [ENTER YOUR BRAND/PRODUCT]"')
WHERE label = 'Unique Selling Proposition (USP)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Blog Post: [ENTER YOUR TOPIC]"')
WHERE label = 'Blog Post' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Case Study: [ENTER CLIENT/PROJECT NAME]"')
WHERE label = 'Case Study Outline' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Newsletter Content: [ENTER TOPIC/UPDATE]"')
WHERE label = 'Newsletter Content' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Press Release: [ENTER ANNOUNCEMENT]"')
WHERE label = 'Press Release' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Video Script Outline: [ENTER VIDEO TOPIC]"')
WHERE label = 'Video Script Outline' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Webinar Promotion: [ENTER WEBINAR TOPIC]"')
WHERE label = 'Webinar Promotion' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"White Paper Abstract: [ENTER WHITE PAPER TOPIC]"')
WHERE label = 'White Paper Abstract' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"AIDA Framework for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'AIDA Framework (Attention, Interest, Desire, Action)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"High-Converting Hero Section for [ENTER YOUR WEBSITE/PRODUCT]"')
WHERE label = 'High-Converting Hero Section' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"PAS Framework for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'PAS Framework (Problem, Agitate, Solution)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Feature Announcement for [ENTER NEW FEATURE NAME]"')
WHERE label = 'Feature Announcement' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Pricing Page Copy for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'Pricing Page Copy' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Product Comparison Page for [ENTER YOUR PRODUCT NAME]"')
WHERE label = 'Product Comparison Page' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Product Description (E-commerce) for [ENTER PRODUCT NAME]"')
WHERE label = 'Product Description (E-commerce)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Product Launch Announcement for [ENTER PRODUCT NAME]"')
WHERE label = 'Product Launch Announcement' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Cold Email Outreach for [ENTER YOUR OFFER]"')
WHERE label = 'Cold Email Outreach' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Email Content: [ENTER EMAIL TOPIC]"')
WHERE label = 'Email Content' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Lead Nurturing Email: [ENTER TOPIC/STAGE]"')
WHERE label = 'Lead Nurturing Email' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"SaaS Onboarding Email Series: [ENTER PRODUCT NAME]"')
WHERE label = 'SaaS Onboarding Email Series' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Testimonial Request Email for [ENTER CLIENT NAME]"')
WHERE label = 'Testimonial Request Email' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Call to Action (CTA) for [ENTER YOUR OFFER]"')
WHERE label = 'Call to Action (CTA)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"FAQ Section (Conversion-focused) for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'FAQ Section (Conversion-focused)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Landing Page (Lead Gen) for [ENTER YOUR OFFER]"')
WHERE label = 'Landing Page (Lead Gen)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Sales Page (Long-Form) for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'Sales Page (Long-Form)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Thank You Page for [ENTER YOUR ACTION]"')
WHERE label = 'Thank You Page' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"SEO Content Brief: [ENTER YOUR TOPIC]"')
WHERE label = 'SEO Content Brief' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"LinkedIn Post (Thought Leadership) for [ENTER YOUR TOPIC]"')
WHERE label = 'LinkedIn Post (Thought Leadership)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Social Media Post (Instagram/Facebook) for [ENTER YOUR TOPIC]"')
WHERE label = 'Social Media Post (Instagram/Facebook)' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

UPDATE public.pmc_prefills
SET data = jsonb_set(data, '{projectDescription}', '"Software Tutorial/Help Content for [ENTER SOFTWARE/FEATURE NAME]"')
WHERE label = 'Software Tutorial/Help Content' 
  AND (data->>'projectDescription' IS NULL OR data->>'projectDescription' = '');

-- Verification query (uncomment to check results)
-- SELECT 
--   id, 
--   label, 
--   (data->>'projectDescription') as project_description,
--   CASE 
--     WHEN (data->>'projectDescription') IS NULL OR (data->>'projectDescription') = '' THEN 'MISSING' 
--     ELSE 'SET' 
--   END as status
-- FROM public.pmc_prefills 
-- ORDER BY label;