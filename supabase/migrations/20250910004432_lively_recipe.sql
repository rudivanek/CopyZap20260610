/*
  # Add originalCopyGuidance to all prefills

  1. New Field
    - `originalCopyGuidance` (string)
      - Specific instructions for the "Original Copy or Describe what you want to achieve *" field
      - Tailored to each prefill's context and purpose
      - Guides users on what to paste (existing copy) or describe (creation goals)

  2. Updates
    - Updates all 33 prefills with context-specific guidance
    - Uses jsonb_set() to add the new field to the data JSONB column
    - Preserves all existing prefill configuration
*/

-- Advertising & Paid Media Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current awareness ad copy that you want to improve, OR describe the product/service you want to create awareness ads for. Include details about your unique value proposition and what makes your solution different from competitors."'
) 
WHERE label = 'Create awareness ad copy about [ENTER YOUR PRODUCT/SERVICE]';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing Google Ads copy (headlines, descriptions, extensions) that needs improvement, OR describe your product/service and what action you want searchers to take. Include your strongest selling points and target keywords."'
) 
WHERE label = 'Google Ads Copy';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current retargeting ad copy that needs optimization, OR describe why previous visitors should return to complete their purchase. Include details about what they viewed, abandoned, or hesitated on."'
) 
WHERE label = 'Retargeting Ad Copy';

-- Brand & Messaging Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current About Us page content that needs improvement, OR describe your brand story, mission, founding story, values, and what makes your company unique. Include key milestones, achievements, and your team''s background."'
) 
WHERE label = 'About Us Section';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current homepage copy that needs improvement, OR describe your business, main services/products, target customers, and primary value proposition. Include what makes you different and what visitors should do next."'
) 
WHERE label = 'Homepage Copy';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current service page content that needs enhancement, OR describe the specific service you offer, who it''s for, what problems it solves, key features/benefits, process overview, and pricing approach."'
) 
WHERE label = 'Service Page';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste existing slogans/taglines you want to improve, OR describe your brand essence, core benefit, target emotion, and what you want people to remember about your brand. Include your brand personality and key differentiators."'
) 
WHERE label = 'Slogan / Tagline';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current USP statement that needs refinement, OR describe what makes your product/service uniquely valuable, how it''s different from competitors, and the specific benefit only you can provide."'
) 
WHERE label = 'Unique Selling Proposition (USP)';

-- Content Marketing Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing blog post draft that needs improvement, OR describe the blog topic, key points to cover, target audience, main takeaways, and SEO keywords you want to target."'
) 
WHERE label = 'Blog Post';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current case study content that needs enhancement, OR describe the client project, initial problem/challenge, solution implemented, specific results achieved, and metrics that demonstrate success."'
) 
WHERE label = 'Case Study Outline';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing newsletter content that needs improvement, OR describe the key updates, valuable insights, industry news, or educational content you want to share with subscribers this edition."'
) 
WHERE label = 'Newsletter Content';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current press release draft that needs refinement, OR describe the newsworthy announcement, key stakeholders, impact on industry/customers, supporting quotes, and media contact information."'
) 
WHERE label = 'Press Release';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing video script that needs improvement, OR describe the video topic, target audience, key messages, desired viewer actions, tone/style, and approximate video length."'
) 
WHERE label = 'Video Script Outline';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current webinar promotional copy that needs enhancement, OR describe the webinar topic, key learning outcomes, target audience, speaker credentials, and what attendees will gain."'
) 
WHERE label = 'Webinar Promotion';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing white paper abstract that needs improvement, OR describe the research topic, key findings, methodology, target audience, and main conclusions that would interest industry professionals."'
) 
WHERE label = 'White Paper Abstract';

-- Copywriting Frameworks Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste existing copy that needs AIDA framework enhancement, OR describe the product/service, target customer, main problem solved, desired action, and urgency factors that would grab attention and create desire."'
) 
WHERE label = 'AIDA Framework (Attention, Interest, Desire, Action)';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current hero section copy that needs optimization, OR describe your core product benefit, target audience, main value proposition, and the primary action you want visitors to take immediately."'
) 
WHERE label = 'High-Converting Hero Section';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste existing copy that needs PAS framework enhancement, OR describe the painful problem your audience faces, how that problem affects them daily, and your solution that provides relief."'
) 
WHERE label = 'PAS Framework (Problem, Agitate, Solution)';

-- E-commerce & Product Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current feature announcement copy that needs improvement, OR describe the new feature, who it benefits, problems it solves, how it works, and why existing customers should be excited."'
) 
WHERE label = 'Feature Announcement';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing pricing page copy that needs optimization, OR describe your pricing tiers, value justification, target customer for each plan, and how to overcome price objections."'
) 
WHERE label = 'Pricing Page Copy';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current product comparison content that needs enhancement, OR describe your product vs. competitors, key differentiators, feature advantages, and why prospects should choose you."'
) 
WHERE label = 'Product Comparison Page';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing product description that needs improvement, OR describe the product features, target customer, problems solved, usage scenarios, and benefits that justify the purchase."'
) 
WHERE label = 'Product Description (E-commerce)';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current product launch copy that needs refinement, OR describe the new product, target market, launch strategy, key benefits, early bird offers, and excitement factors."'
) 
WHERE label = 'Product Launch Announcement';

-- Email Marketing Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing cold email template that needs improvement, OR describe your target prospect, the value you provide, why they should care, and what specific next step you want them to take."'
) 
WHERE label = 'Cold Email Outreach';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current email content that needs enhancement, OR describe the email purpose, target subscriber segment, key message, offer/value provided, and desired reader action."'
) 
WHERE label = 'Email Content';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing lead nurturing email that needs improvement, OR describe the prospect''s current stage, pain points, value you''re providing, trust-building elements, and next conversion step."'
) 
WHERE label = 'Lead Nurturing Email';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current SaaS onboarding email that needs optimization, OR describe the user''s journey stage, key features to highlight, success metrics, common obstacles, and actions for quick value."'
) 
WHERE label = 'SaaS Onboarding Email Series';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing testimonial request email that needs improvement, OR describe the successful customer outcome, specific results achieved, relationship history, and how you want them to share their experience."'
) 
WHERE label = 'Testimonial Request Email';

-- Sales & Conversion Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current call-to-action text that needs optimization, OR describe the specific action you want users to take, urgency factors, value proposition, and barrier removal strategies."'
) 
WHERE label = 'Call to Action (CTA)';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing FAQ content that needs conversion optimization, OR describe common customer objections, concerns, hesitations, and how your answers should guide prospects toward purchase decisions."'
) 
WHERE label = 'FAQ Section (Conversion-focused)';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current landing page copy that needs improvement, OR describe the lead magnet offer, target audience pain points, value provided, trust elements, and conversion goal."'
) 
WHERE label = 'Landing Page (Lead Gen)';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing sales page content that needs enhancement, OR describe the transformation promised, target customer, problem depth, solution benefits, social proof, pricing strategy, and urgency factors."'
) 
WHERE label = 'Sales Page (Long-Form)';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current thank you page content that needs improvement, OR describe what the customer just completed, next steps, additional offers, social sharing opportunities, and relationship building goals."'
) 
WHERE label = 'Thank You Page';

-- SEO & Optimization Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste existing SEO content that needs optimization, OR describe the target search intent, primary keywords, competitive landscape, target audience queries, and content goals for search visibility."'
) 
WHERE label = 'SEO Content Brief';

-- Social Media Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing LinkedIn post that needs improvement, OR describe the professional insight, industry perspective, personal experience, or thought leadership topic you want to share with your network."'
) 
WHERE label = 'LinkedIn Post (Thought Leadership)';

UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your current social media post that needs enhancement, OR describe the content idea, visual concept, target audience, brand message, engagement goals, and desired social action."'
) 
WHERE label = 'Social Media Post (Instagram/Facebook)';

-- Tech & SaaS Category
UPDATE public.pmc_prefills 
SET data = jsonb_set(
  data, 
  '{originalCopyGuidance}', 
  '"Paste your existing tutorial/help content that needs improvement, OR describe the software task, user skill level, step-by-step process, common challenges, and learning objectives for users."'
) 
WHERE label = 'Software Tutorial/Help Content';

-- Verification query to check all updates (commented out)
/*
SELECT 
  id,
  label,
  category,
  (data->>'originalCopyGuidance') as original_copy_guidance,
  CASE 
    WHEN (data->>'originalCopyGuidance') IS NULL OR (data->>'originalCopyGuidance') = '' THEN 'MISSING' 
    ELSE 'SET' 
  END as guidance_status
FROM public.pmc_prefills 
ORDER BY category, label;
*/