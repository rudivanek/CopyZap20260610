/*
  # Add Original Copy Guidance to All Prefills

  1. Purpose
     - Add specific instructions for the "Original Copy or Describe what you want to achieve *" field to all prefills
     - Provide context-specific guidance for users in the unified Copy Maker interface
     - Enhance user experience with precise instructions for each prefill type

  2. Changes
     - Update all 33 prefill records in the database
     - Add originalCopyGuidance field to the data JSONB column
     - Each guidance is tailored to the specific purpose and context of the prefill

  3. Implementation
     - Use jsonb_set() to add the new field to existing data
     - Preserve all existing prefill configuration
     - Apply unified guidance approach for both existing content and new creation goals
*/

-- Update prefills with originalCopyGuidance field

-- Advertising & Paid Media Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing awareness ad copy you want to optimize, OR describe your product/service, target audience pain points, and the specific awareness goal you want to achieve with your advertising."')
WHERE label = 'Create awareness ad copy about [ENTER YOUR PRODUCT/SERVICE]';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing Google Ads copy (headlines, descriptions, extensions) you want to improve, OR describe your product/service, main selling points, target keywords, and the specific action you want searchers to take."')
WHERE label = 'Google Ads Copy';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing retargeting ad copy you want to enhance, OR describe the product/offer, reasons customers abandoned their action, urgency factors, and specific incentives to bring them back."')
WHERE label = 'Retargeting Ad Copy';

-- Brand & Messaging Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing About Us content you want to enhance, OR describe your company story, founding mission, core values, team background, and what makes your brand unique in your industry."')
WHERE label = 'About Us Section';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current homepage content you want to improve, OR describe your business, main services/products, target audience, unique value proposition, and primary goals for visitors to your homepage."')
WHERE label = 'Homepage Copy';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing service page content you want to optimize, OR describe the specific service, target customer problems it solves, key benefits, process/methodology, results achieved, and differentiators from competitors."')
WHERE label = 'Service Page';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current slogan/tagline you want to refine, OR describe your product/brand, core essence, target audience, key benefit, emotional response you want to evoke, and memorable qualities you want communicated."')
WHERE label = 'Slogan / Tagline';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing unique selling proposition you want to strengthen, OR describe your product/service, main competitors, specific advantages you offer, target customer needs, and what makes you the best choice."')
WHERE label = 'Unique Selling Proposition (USP)';

-- Content Marketing Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing blog post draft you want to improve, OR describe the blog topic, main points to cover, target audience, key takeaways, SEO keywords, and specific value you want to provide readers."')
WHERE label = 'Blog Post';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing case study content you want to enhance, OR describe the client situation, initial problem/challenge, solution implemented, specific results achieved, methodology used, and lessons learned for prospects."')
WHERE label = 'Case Study Outline';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current newsletter content you want to optimize, OR describe the newsletter topic, key updates to share, value for subscribers, main call-to-action, and engagement goals for this edition."')
WHERE label = 'Newsletter Content';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing press release you want to improve, OR describe the newsworthy announcement, key details, company background, significance to industry, quotes from leadership, and media angle you want to emphasize."')
WHERE label = 'Press Release';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current video script you want to enhance, OR describe the video topic, main message, target audience, key points to cover, desired viewer action, and emotional tone you want to achieve."')
WHERE label = 'Video Script Outline';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing webinar promotion copy you want to optimize, OR describe the webinar topic, key learning outcomes, expert presenter details, target audience benefits, urgency factors, and registration incentives."')
WHERE label = 'Webinar Promotion';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current white paper abstract you want to improve, OR describe the research topic, key findings, methodology, target professional audience, industry implications, and download value proposition."')
WHERE label = 'White Paper Abstract';

-- Copywriting Frameworks Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste existing copy you want to restructure using the AIDA framework, OR describe the product/service, target audience attention-grabbers, interest factors, desire elements, and specific action you want readers to take."')
WHERE label = 'AIDA Framework (Attention, Interest, Desire, Action)';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current hero section content you want to optimize, OR describe your product/service, primary benefit, target audience, competitive advantages, and immediate value proposition that should grab visitor attention."')
WHERE label = 'High-Converting Hero Section';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste existing copy you want to restructure using PAS framework, OR describe the specific problem your audience faces, how to intensify their awareness of this problem, and your solution that provides relief."')
WHERE label = 'PAS Framework (Problem, Agitate, Solution)';

-- E-commerce & Product Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing feature announcement content you want to enhance, OR describe the new feature, benefits for users, technical capabilities, use cases, competitive advantages, and adoption incentives you want to communicate."')
WHERE label = 'Feature Announcement';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current pricing page content you want to optimize, OR describe your pricing structure, value justification, plan differences, target customer segments, objection handling, and conversion strategies."')
WHERE label = 'Pricing Page Copy';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing product comparison content you want to improve, OR describe the products being compared, key differentiators, competitive advantages, feature matrices, and decision-making criteria for prospects."')
WHERE label = 'Product Comparison Page';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current product description you want to enhance, OR describe the product features, benefits, target customer needs, use cases, specifications, and purchase motivators for e-commerce optimization."')
WHERE label = 'Product Description (E-commerce)';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing product launch content you want to optimize, OR describe the new product, innovation highlights, target market, launch benefits, early adopter incentives, and excitement factors you want to generate."')
WHERE label = 'Product Launch Announcement';

-- Email Marketing Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing cold email you want to improve, OR describe your product/service, target prospect profile, specific value proposition, pain points you solve, and desired response/next step for cold outreach."')
WHERE label = 'Cold Email Outreach';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current email content you want to enhance, OR describe the email purpose, target audience, main message, desired action, value offered, and engagement goals for this email campaign."')
WHERE label = 'Email Content';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing lead nurturing email you want to optimize, OR describe the lead stage, relationship context, value to provide, trust-building elements, next steps in journey, and conversion objectives."')
WHERE label = 'Lead Nurturing Email';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current SaaS onboarding email you want to improve, OR describe your software, new user challenges, setup steps, value realization goals, feature highlights, and success metrics for user activation."')
WHERE label = 'SaaS Onboarding Email Series';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing testimonial request email you want to enhance, OR describe the customer relationship, positive results achieved, specific outcomes to highlight, request timing, and incentives for customer participation."')
WHERE label = 'Testimonial Request Email';

-- Sales & Conversion Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current call-to-action copy you want to strengthen, OR describe the specific action you want users to take, urgency factors, value proposition, risk reduction, and motivational elements for conversion."')
WHERE label = 'Call to Action (CTA)';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing FAQ content you want to optimize for conversion, OR describe common customer objections, concerns to address, trust-building information, value reinforcement, and conversion opportunities within FAQ responses."')
WHERE label = 'FAQ Section (Conversion-focused)';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current lead generation landing page content you want to improve, OR describe the lead magnet offered, target audience problems, value proposition, trust signals, form optimization, and conversion incentives."')
WHERE label = 'Landing Page (Lead Gen)';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing sales page content you want to enhance, OR describe the transformation offered, target customer profile, problem depth, solution benefits, proof elements, pricing strategy, and urgency factors for long-form sales."')
WHERE label = 'Sales Page (Long-Form)';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current thank you page content you want to optimize, OR describe the completed action, next steps for customers, additional offers, social sharing opportunities, and relationship continuation strategies."')
WHERE label = 'Thank You Page';

-- SEO & Optimization Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing SEO content you want to improve, OR describe the target keywords, search intent, competitor landscape, content depth required, user value, and ranking objectives for search optimization."')
WHERE label = 'SEO Content Brief';

-- Social Media Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing LinkedIn post you want to enhance, OR describe the professional insight, thought leadership angle, industry perspective, audience value, engagement goals, and discussion topics for LinkedIn professionals."')
WHERE label = 'LinkedIn Post (Thought Leadership)';

UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your current social media post you want to optimize, OR describe the social content goal, target audience, key message, visual elements, engagement strategy, and desired social action (likes, shares, comments)."')
WHERE label = 'Social Media Post (Instagram/Facebook)';

-- Tech & SaaS Category
UPDATE pmc_prefills 
SET data = jsonb_set(data, '{originalCopyGuidance}', '"Paste your existing tutorial/help content you want to improve, OR describe the software feature, user task to accomplish, step-by-step process, common difficulties, success criteria, and support objectives for user guidance."')
WHERE label = 'Software Tutorial/Help Content';

-- Verify all updates were applied successfully
-- SELECT label, data->>'originalCopyGuidance' as guidance 
-- FROM pmc_prefills 
-- WHERE data->>'originalCopyGuidance' IS NOT NULL 
-- ORDER BY label;