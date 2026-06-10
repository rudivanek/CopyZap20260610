/*
# Update Project Description for all prefills

1. Updates
   - Updates the `projectDescription` field within the JSONB `data` column for all prefills
   - Matches prefills by their current `label` since `id` is UUID in database
   - Sets Project Description to match the enhanced prefill labels

2. Changes
   - Uses `label` field to identify records instead of string IDs
   - Updates both `label` and `projectDescription` to new enhanced versions
   - Preserves all existing prefill data while adding missing project descriptions

3. Security
   - No RLS changes needed - uses existing table structure
*/

-- 1. Update 'About Us Section'
UPDATE public.pmc_prefills
SET
  label = 'About Us Section for [ENTER YOUR BRAND/COMPANY]',
  data = jsonb_set(data, '{projectDescription}', '"About Us Section for [ENTER YOUR BRAND/COMPANY]"')
WHERE label = 'About Us Section';

-- 2. Update 'Homepage Copy'
UPDATE public.pmc_prefills
SET
  label = 'Homepage Copy for [ENTER YOUR WEBSITE/BRAND]',
  data = jsonb_set(data, '{projectDescription}', '"Homepage Copy for [ENTER YOUR WEBSITE/BRAND]"')
WHERE label = 'Homepage Copy';

-- 3. Update 'Service Page'
UPDATE public.pmc_prefills
SET
  label = 'Service Page for [ENTER YOUR SERVICE NAME]',
  data = jsonb_set(data, '{projectDescription}', '"Service Page for [ENTER YOUR SERVICE NAME]"')
WHERE label = 'Service Page';

-- 4. Update 'Slogan / Tagline'
UPDATE public.pmc_prefills
SET
  label = 'Slogan / Tagline for [ENTER YOUR BRAND/PRODUCT]',
  data = jsonb_set(data, '{projectDescription}', '"Slogan / Tagline for [ENTER YOUR BRAND/PRODUCT]"')
WHERE label = 'Slogan / Tagline';

-- 5. Update 'Unique Selling Proposition (USP)'
UPDATE public.pmc_prefills
SET
  label = 'Unique Selling Proposition (USP) for [ENTER YOUR BRAND/PRODUCT]',
  data = jsonb_set(data, '{projectDescription}', '"Unique Selling Proposition (USP) for [ENTER YOUR BRAND/PRODUCT]"')
WHERE label = 'Unique Selling Proposition (USP)';

-- 6. Update 'Blog Post'
UPDATE public.pmc_prefills
SET
  label = 'Blog Post: [ENTER YOUR TOPIC]',
  data = jsonb_set(data, '{projectDescription}', '"Blog Post: [ENTER YOUR TOPIC]"')
WHERE label = 'Blog Post';

-- 7. Update 'Case Study Outline'
UPDATE public.pmc_prefills
SET
  label = 'Case Study: [ENTER CLIENT/PROJECT NAME]',
  data = jsonb_set(data, '{projectDescription}', '"Case Study: [ENTER CLIENT/PROJECT NAME]"')
WHERE label = 'Case Study Outline';

-- 8. Update 'Newsletter Content'
UPDATE public.pmc_prefills
SET
  label = 'Newsletter Content: [ENTER TOPIC/UPDATE]',
  data = jsonb_set(data, '{projectDescription}', '"Newsletter Content: [ENTER TOPIC/UPDATE]"')
WHERE label = 'Newsletter Content';

-- 9. Update 'Press Release'
UPDATE public.pmc_prefills
SET
  label = 'Press Release: [ENTER ANNOUNCEMENT]',
  data = jsonb_set(data, '{projectDescription}', '"Press Release: [ENTER ANNOUNCEMENT]"')
WHERE label = 'Press Release';

-- 10. Update 'Video Script Outline'
UPDATE public.pmc_prefills
SET
  label = 'Video Script Outline: [ENTER VIDEO TOPIC]',
  data = jsonb_set(data, '{projectDescription}', '"Video Script Outline: [ENTER VIDEO TOPIC]"')
WHERE label = 'Video Script Outline';

-- 11. Update 'Webinar Promotion'
UPDATE public.pmc_prefills
SET
  label = 'Webinar Promotion: [ENTER WEBINAR TOPIC]',
  data = jsonb_set(data, '{projectDescription}', '"Webinar Promotion: [ENTER WEBINAR TOPIC]"')
WHERE label = 'Webinar Promotion';

-- 12. Update 'White Paper Abstract'
UPDATE public.pmc_prefills
SET
  label = 'White Paper Abstract: [ENTER WHITE PAPER TOPIC]',
  data = jsonb_set(data, '{projectDescription}', '"White Paper Abstract: [ENTER WHITE PAPER TOPIC]"')
WHERE label = 'White Paper Abstract';

-- 13. Update 'AIDA Framework (Attention, Interest, Desire, Action)'
UPDATE public.pmc_prefills
SET
  label = 'AIDA Framework for [ENTER YOUR PRODUCT/SERVICE]',
  data = jsonb_set(data, '{projectDescription}', '"AIDA Framework for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'AIDA Framework (Attention, Interest, Desire, Action)';

-- 14. Update 'High-Converting Hero Section'
UPDATE public.pmc_prefills
SET
  label = 'High-Converting Hero Section for [ENTER YOUR WEBSITE/PRODUCT]',
  data = jsonb_set(data, '{projectDescription}', '"High-Converting Hero Section for [ENTER YOUR WEBSITE/PRODUCT]"')
WHERE label = 'High-Converting Hero Section';

-- 15. Update 'PAS Framework (Problem, Agitate, Solution)'
UPDATE public.pmc_prefills
SET
  label = 'PAS Framework for [ENTER YOUR PRODUCT/SERVICE]',
  data = jsonb_set(data, '{projectDescription}', '"PAS Framework for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'PAS Framework (Problem, Agitate, Solution)';

-- 16. Update 'Feature Announcement'
UPDATE public.pmc_prefills
SET
  label = 'Feature Announcement for [ENTER NEW FEATURE NAME]',
  data = jsonb_set(data, '{projectDescription}', '"Feature Announcement for [ENTER NEW FEATURE NAME]"')
WHERE label = 'Feature Announcement';

-- 17. Update 'Pricing Page Copy'
UPDATE public.pmc_prefills
SET
  label = 'Pricing Page Copy for [ENTER YOUR PRODUCT/SERVICE]',
  data = jsonb_set(data, '{projectDescription}', '"Pricing Page Copy for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'Pricing Page Copy';

-- 18. Update 'Product Comparison Page'
UPDATE public.pmc_prefills
SET
  label = 'Product Comparison Page for [ENTER YOUR PRODUCT NAME]',
  data = jsonb_set(data, '{projectDescription}', '"Product Comparison Page for [ENTER YOUR PRODUCT NAME]"')
WHERE label = 'Product Comparison Page';

-- 19. Update 'Product Description (E-commerce)'
UPDATE public.pmc_prefills
SET
  label = 'Product Description (E-commerce) for [ENTER PRODUCT NAME]',
  data = jsonb_set(data, '{projectDescription}', '"Product Description (E-commerce) for [ENTER PRODUCT NAME]"')
WHERE label = 'Product Description (E-commerce)';

-- 20. Update 'Product Launch Announcement'
UPDATE public.pmc_prefills
SET
  label = 'Product Launch Announcement for [ENTER PRODUCT NAME]',
  data = jsonb_set(data, '{projectDescription}', '"Product Launch Announcement for [ENTER PRODUCT NAME]"')
WHERE label = 'Product Launch Announcement';

-- 21. Update 'Cold Email Outreach'
UPDATE public.pmc_prefills
SET
  label = 'Cold Email Outreach for [ENTER YOUR OFFER]',
  data = jsonb_set(data, '{projectDescription}', '"Cold Email Outreach for [ENTER YOUR OFFER]"')
WHERE label = 'Cold Email Outreach';

-- 22. Update 'Email Content'
UPDATE public.pmc_prefills
SET
  label = 'Email Content: [ENTER EMAIL TOPIC]',
  data = jsonb_set(data, '{projectDescription}', '"Email Content: [ENTER EMAIL TOPIC]"')
WHERE label = 'Email Content';

-- 23. Update 'Lead Nurturing Email'
UPDATE public.pmc_prefills
SET
  label = 'Lead Nurturing Email: [ENTER TOPIC/STAGE]',
  data = jsonb_set(data, '{projectDescription}', '"Lead Nurturing Email: [ENTER TOPIC/STAGE]"')
WHERE label = 'Lead Nurturing Email';

-- 24. Update 'SaaS Onboarding Email Series'
UPDATE public.pmc_prefills
SET
  label = 'SaaS Onboarding Email Series: [ENTER PRODUCT NAME]',
  data = jsonb_set(data, '{projectDescription}', '"SaaS Onboarding Email Series: [ENTER PRODUCT NAME]"')
WHERE label = 'SaaS Onboarding Email Series';

-- 25. Update 'Testimonial Request Email'
UPDATE public.pmc_prefills
SET
  label = 'Testimonial Request Email for [ENTER CLIENT NAME]',
  data = jsonb_set(data, '{projectDescription}', '"Testimonial Request Email for [ENTER CLIENT NAME]"')
WHERE label = 'Testimonial Request Email';

-- 26. Update 'Call to Action (CTA)'
UPDATE public.pmc_prefills
SET
  label = 'Call to Action (CTA) for [ENTER YOUR OFFER]',
  data = jsonb_set(data, '{projectDescription}', '"Call to Action (CTA) for [ENTER YOUR OFFER]"')
WHERE label = 'Call to Action (CTA)';

-- 27. Update 'FAQ Section (Conversion-focused)'
UPDATE public.pmc_prefills
SET
  label = 'FAQ Section (Conversion-focused) for [ENTER YOUR PRODUCT/SERVICE]',
  data = jsonb_set(data, '{projectDescription}', '"FAQ Section (Conversion-focused) for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'FAQ Section (Conversion-focused)';

-- 28. Update 'Landing Page (Lead Gen)'
UPDATE public.pmc_prefills
SET
  label = 'Landing Page (Lead Gen) for [ENTER YOUR OFFER]',
  data = jsonb_set(data, '{projectDescription}', '"Landing Page (Lead Gen) for [ENTER YOUR OFFER]"')
WHERE label = 'Landing Page (Lead Gen)';

-- 29. Update 'Sales Page (Long-Form)'
UPDATE public.pmc_prefills
SET
  label = 'Sales Page (Long-Form) for [ENTER YOUR PRODUCT/SERVICE]',
  data = jsonb_set(data, '{projectDescription}', '"Sales Page (Long-Form) for [ENTER YOUR PRODUCT/SERVICE]"')
WHERE label = 'Sales Page (Long-Form)';

-- 30. Update 'Thank You Page'
UPDATE public.pmc_prefills
SET
  label = 'Thank You Page for [ENTER YOUR ACTION]',
  data = jsonb_set(data, '{projectDescription}', '"Thank You Page for [ENTER YOUR ACTION]"')
WHERE label = 'Thank You Page';

-- 31. Update 'SEO Content Brief'
UPDATE public.pmc_prefills
SET
  label = 'SEO Content Brief: [ENTER YOUR TOPIC]',
  data = jsonb_set(data, '{projectDescription}', '"SEO Content Brief: [ENTER YOUR TOPIC]"')
WHERE label = 'SEO Content Brief';

-- 32. Update 'LinkedIn Post (Thought Leadership)'
UPDATE public.pmc_prefills
SET
  label = 'LinkedIn Post (Thought Leadership) for [ENTER YOUR TOPIC]',
  data = jsonb_set(data, '{projectDescription}', '"LinkedIn Post (Thought Leadership) for [ENTER YOUR TOPIC]"')
WHERE label = 'LinkedIn Post (Thought Leadership)';

-- 33. Update 'Social Media Post (Instagram/Facebook)'
UPDATE public.pmc_prefills
SET
  label = 'Social Media Post (Instagram/Facebook) for [ENTER YOUR TOPIC]',
  data = jsonb_set(data, '{projectDescription}', '"Social Media Post (Instagram/Facebook) for [ENTER YOUR TOPIC]"')
WHERE label = 'Social Media Post (Instagram/Facebook)';

-- 34. Update 'Software Tutorial/Help Content'
UPDATE public.pmc_prefills
SET
  label = 'Software Tutorial/Help Content for [ENTER SOFTWARE/FEATURE NAME]',
  data = jsonb_set(data, '{projectDescription}', '"Software Tutorial/Help Content for [ENTER SOFTWARE/FEATURE NAME]"')
WHERE label = 'Software Tutorial/Help Content';