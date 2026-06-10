import { FormState, StructuredOutputElement } from '../types';
import { OUTPUT_STRUCTURE_OPTIONS } from './index';

export interface Prefill {
  id: string;
  label: string;
  data: Partial<FormState>;
}

export interface PrefillGroup {
  category: string;
  options: Prefill[];
}

// Helper function to convert string array to StructuredOutputElement array
export function createOutputStructure(structureStrings: string[]): StructuredOutputElement[] {
  return structureStrings
    .filter(str => typeof str === 'string' && str.trim()) // Filter out non-strings and empty strings
    .map(str => {
      // Ensure str is a string
      const strValue = String(str);

      // Try to find matching option in OUTPUT_STRUCTURE_OPTIONS
      const option = OUTPUT_STRUCTURE_OPTIONS.find(opt =>
        opt.label.toLowerCase() === strValue.toLowerCase() ||
        opt.value.toLowerCase() === strValue.toLowerCase()
      );

      if (option) {
        return {
          id: `prefill-${option.value}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          value: option.value,
          label: option.label,
          wordCount: null
        };
      }

      // If not found, create custom structure element
      return {
        id: `custom-${strValue.toLowerCase().replace(/\s+/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        value: strValue.toLowerCase().replace(/\s+/g, ''),
        label: strValue,
        wordCount: null
      };
    });
}

export const GROUPED_PREFILLS: PrefillGroup[] = [
  {
    category: 'Advertising & Paid Media',
    options: [
      {
        id: 'google-search-ad',
        label: 'Google Search Ad',
        data: {
          projectDescription: 'Google Search Ad campaign for [your product/service]',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Header 2', 'Header 3', 'Call to Action']),
          keyMessage: 'What is your key value proposition?',
          callToAction: 'Shop now',
          desiredEmotion: 'Urgency',
          tone: 'Bold',
          wordCount: 'Custom',
          customWordCount: 90,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          keywords: 'Enter target keywords',
          targetAudience: 'Search users with high purchase intent',
          generateHeadlines: true,
          numberOfHeadlines: 5
        }
      },
      {
        id: 'ad-copy-awareness',
        label: 'Create awareness ad copy about [ENTER YOUR PRODUCT/SERVICE]',
        data: {
          projectDescription: 'Create awareness ad copy about [ENTER YOUR PRODUCT/SERVICE] project',
          pageType: 'Other',
          targetAudience: 'People who haven\'t heard of your solution yet and are experiencing the problem',
          keyMessage: 'Introduce your unique value proposition and grab attention',
          industryNiche: 'Enter your industry',
          preferredWritingStyle: 'Persuasive',
          keywords: 'Enter keywords for your product/service',
          outputStructure: createOutputStructure(['Header 1', 'Problem', 'Solution', 'Call to Action']),
          targetAudiencePainPoints: 'Describe the problem your audience faces that they might not know can be solved',
          productServiceName: 'Enter your product or service name',
          readerFunnelStage: 'Awareness',
          desiredEmotion: 'Curiosity',
          callToAction: 'Learn more',
          tone: 'Bold',
          wordCount: 'Custom',
          customWordCount: 80,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true
        }
      },
      {
        id: 'google-ads-copy',
        label: 'Google Ads Copy',
        data: {
          projectDescription: 'Google Ads Copy project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Header 2', 'Call to Action']),
          keyMessage: 'What\'s your strongest selling point for ad searchers?',
          callToAction: 'Click to learn more',
          desiredEmotion: 'Urgency',
          tone: 'Bold',
          wordCount: 'Custom',
          customWordCount: 45,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          keywords: 'Enter your target ad keywords',
          targetAudience: 'People actively searching for your solution'
        }
      },
      {
        id: 'retargeting-ad-copy',
        label: 'Retargeting Ad Copy',
        data: {
          projectDescription: 'Retargeting Ad Copy project',
          pageType: 'Other',
          keyMessage: 'Why should they come back and complete their action?',
          callToAction: 'Complete your order',
          desiredEmotion: 'Urgency',
          tone: 'Persuasive',
          wordCount: 'Custom',
          customWordCount: 80,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          targetAudience: 'Previous website visitors who didn\'t convert',
          targetAudiencePainPoints: 'Abandonment, hesitation, comparison shopping'
        }
      }
    ]
  },
  {
    category: 'Brand & Messaging',
    options: [
      {
        id: 'about-us',
        label: 'About Us Section',
        data: {
          projectDescription: 'About Us Section project',
          pageType: 'About',
          businessDescription: 'Tell the story of your brand',
          brandValues: 'Integrity, Creativity, Customer-first',
          keyMessage: 'Summarize your mission and what makes you unique',
          preferredWritingStyle: 'Storytelling',
          outputStructure: createOutputStructure(['Mission', 'Story', 'Values', 'Summary']),
          tone: 'Friendly',
          wordCount: 'Custom',
          customWordCount: 450
        }
      },
      {
        id: 'homepage-copy',
        label: 'Homepage Copy',
        data: {
          projectDescription: 'Homepage Copy project',
          pageType: 'Homepage',
          outputStructure: createOutputStructure(['Hero', 'About', 'Benefits', 'Testimonial', 'Call to Action']),
          keyMessage: 'Summarize what your company does best',
          callToAction: 'See what we offer',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 600,
          targetAudience: 'Define your primary website visitors'
        }
      },
      {
        id: 'homepage-hero-sections',
        label: 'Homepage Hero + Value Props',
        data: {
          projectDescription: 'Create a homepage for [enter your business or brand]. The site must clearly communicate the main value proposition in the hero section.',
          pageType: 'Homepage',
          keyMessage: 'We help [enter target audience] achieve [main benefit] through [your solution].',
          targetAudience: '[enter your target audience]',
          tone: 'Professional, Clear',
          preferredWritingStyle: 'High-conversion, short sentences, modern tech style',
          wordCount: 'Custom',
          customWordCount: 85,
          outputStructure: [
            {
              id: `hero-headline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              value: 'heroheadline',
              label: 'Hero Headline',
              wordCount: 10,
              description: 'Main brand promise in 6–10 words related to [enter your offering]'
            },
            {
              id: `subheadline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              value: 'subheadline',
              label: 'Subheadline',
              wordCount: 30,
              description: 'Explain what you do, for whom, and why it matters. Include reference to [main benefit].'
            },
            {
              id: `valueprop1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              value: 'valueprop1',
              label: 'Value Proposition 1',
              wordCount: 15,
              description: 'Key advantage #1 for [your target audience]'
            },
            {
              id: `valueprop2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              value: 'valueprop2',
              label: 'Value Proposition 2',
              wordCount: 15,
              description: 'Key advantage #2 showing credibility or differentiation'
            },
            {
              id: `valueprop3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              value: 'valueprop3',
              label: 'Value Proposition 3',
              wordCount: 15,
              description: 'Key advantage #3 focusing on measurable results or user benefits'
            }
          ]
        }
      },
      {
        id: 'service-page',
        label: 'Service Page',
        data: {
          projectDescription: 'Service Page project',
          pageType: 'Services',
          productServiceName: 'Name of your service',
          keyMessage: 'Main service benefit',
          targetAudiencePainPoints: 'What problems does it solve?',
          outputStructure: createOutputStructure(['Overview', 'Features', 'Benefits', 'Call to Action']),
          forceElaborationsExamples: true,
          wordCount: 'Custom',
          customWordCount: 500
        }
      },
      {
        id: 'slogan-tagline',
        label: 'Slogan / Tagline',
        data: {
          projectDescription: 'Slogan / Tagline project',
          pageType: 'Other',
          keyMessage: 'What should people remember about you?',
          brandValues: 'Trust, Innovation, Simplicity',
          desiredEmotion: 'Inspiration',
          wordCount: 'Custom',
          customWordCount: 8,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          generateHeadlines: true,
          numberOfHeadlines: 5
        }
      },
      {
        id: 'usp',
        label: 'Unique Selling Proposition (USP)',
        data: {
          projectDescription: 'Unique Selling Proposition (USP) project',
          pageType: 'About',
          businessDescription: 'Describe what makes your product or service unique',
          keyMessage: 'What is your strongest value proposition?',
          targetAudience: 'Who is this for?',
          wordCount: 'Custom',
          customWordCount: 25,
          prioritizeWordCount: true
        }
      }
    ]
  },
  {
    category: 'Content Marketing',
    options: [
      {
        id: 'blog-post',
        label: 'Blog Post',
        data: {
          projectDescription: 'Blog Post project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Problem', 'Solution', 'Benefits', 'Q&A', 'Conclusion']),
          keywords: 'Enter your focus keywords',
          forceKeywordIntegration: true,
          forceElaborationsExamples: true,
          preferredWritingStyle: 'Informative',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 1200,
          prioritizeWordCount: true
        }
      },
      {
        id: 'case-study',
        label: 'Case Study Outline',
        data: {
          projectDescription: 'Case Study Outline project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Problem', 'Solution', 'Benefits', 'Summary']),
          keyMessage: 'What specific results did you achieve for this client?',
          callToAction: 'Get similar results',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 800,
          forceElaborationsExamples: true,
          preferredWritingStyle: 'Informative',
          targetAudience: 'Prospects facing similar challenges'
        }
      },
      {
        id: 'newsletter-content',
        label: 'Newsletter Content',
        data: {
          projectDescription: 'Newsletter Content project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Introduction', 'Features', 'Call to Action']),
          keyMessage: 'What valuable updates are you sharing with subscribers?',
          callToAction: 'Read the full article',
          desiredEmotion: 'Interest',
          tone: 'Friendly',
          wordCount: 'Custom',
          customWordCount: 350,
          preferredWritingStyle: 'Conversational',
          targetAudience: 'Email subscribers and loyal customers'
        }
      },
      {
        id: 'press-release-announcement',
        label: 'Press Release',
        data: {
          projectDescription: 'Press Release project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Introduction', 'Quote', 'Features', 'Summary', 'Call to Action']),
          keyMessage: 'What is your newsworthy announcement?',
          callToAction: 'For more information, contact us',
          desiredEmotion: 'Authority',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 500,
          preferredWritingStyle: 'Informative',
          targetAudience: 'Journalists, media outlets, industry stakeholders',
          forceElaborationsExamples: true,
          businessDescription: 'Company name and background'
        }
      },
      {
        id: 'video-script',
        label: 'Video Script',
        data: {
          projectDescription: 'Video Script project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Hook', 'Problem', 'Solution', 'Benefits', 'Call to Action']),
          keyMessage: 'What story are you telling in this video?',
          callToAction: 'Like, subscribe, and share',
          desiredEmotion: 'Engagement',
          tone: 'Conversational',
          wordCount: 'Custom',
          customWordCount: 500,
          preferredWritingStyle: 'Storytelling',
          targetAudience: 'YouTube/video viewers',
          forceElaborationsExamples: true
        }
      },
      {
        id: 'video-script-outline',
        label: 'Video Script Outline',
        data: {
          projectDescription: 'Video Script Outline project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Problem', 'Solution', 'Benefits', 'Call to Action']),
          keyMessage: 'What\'s the main message of your video?',
          callToAction: 'Subscribe and follow for more',
          desiredEmotion: 'Engagement',
          tone: 'Conversational',
          wordCount: 'Custom',
          customWordCount: 400,
          preferredWritingStyle: 'Storytelling',
          targetAudience: 'Video viewers interested in your topic'
        }
      },
      {
        id: 'webinar-promotion',
        label: 'Webinar Promotion',
        data: {
          projectDescription: 'Webinar Promotion project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Benefits', 'Features', 'Call to Action']),
          keyMessage: 'What valuable knowledge will attendees gain?',
          callToAction: 'Reserve your spot now',
          desiredEmotion: 'Curiosity',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 250,
          targetAudience: 'Professionals interested in learning about your topic',
          readerFunnelStage: 'Awareness'
        }
      },
      {
        id: 'white-paper-abstract',
        label: 'White Paper Abstract',
        data: {
          projectDescription: 'White Paper Abstract project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Problem', 'Solution', 'Summary', 'Call to Action']),
          keyMessage: 'What key findings or insights does your research provide?',
          callToAction: 'Download the full white paper',
          desiredEmotion: 'Authority',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 200,
          preferredWritingStyle: 'Informative',
          targetAudience: 'Industry professionals and decision-makers',
          forceElaborationsExamples: true
        }
      }
    ]
  },
  {
    category: 'Copywriting Frameworks',
    options: [
      {
        id: 'aida-framework',
        label: 'AIDA Framework (Attention, Interest, Desire, Action)',
        data: {
          projectDescription: 'AIDA Framework (Attention, Interest, Desire, Action) project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Problem', 'Solution', 'Benefits', 'Call to Action']),
          keyMessage: 'What core benefit grabs attention and creates desire?',
          callToAction: 'Take action now',
          desiredEmotion: 'Urgency',
          tone: 'Persuasive',
          wordCount: 'Custom',
          customWordCount: 400,
          forceElaborationsExamples: true,
          targetAudience: 'Define who needs this solution most urgently'
        }
      },
      {
        id: 'hero-section',
        label: 'High-Converting Hero Section',
        data: {
          projectDescription: 'High-Converting Hero Section project',
          pageType: 'Homepage',
          outputStructure: createOutputStructure(['Header 1', 'Header 2', 'Call to Action']),
          keyMessage: 'Highlight your product\'s core benefit',
          callToAction: 'Get started now',
          tone: 'Persuasive',
          wordCount: 'Custom',
          customWordCount: 200,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true
        }
      },
      {
        id: 'pas-framework',
        label: 'PAS Framework (Problem, Agitate, Solution)',
        data: {
          projectDescription: 'PAS Framework (Problem, Agitate, Solution) project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Problem', 'Solution', 'Benefits', 'Call to Action']),
          keyMessage: 'What painful problem does your solution solve?',
          callToAction: 'Solve this problem today',
          desiredEmotion: 'Relief',
          tone: 'Bold',
          wordCount: 'Custom',
          customWordCount: 350,
          targetAudiencePainPoints: 'Describe the specific pain points this addresses',
          forceElaborationsExamples: true
        }
      }
    ]
  },
  {
    category: 'E-commerce & Product',
    options: [
      {
        id: 'product-description',
        label: 'Product Description',
        data: {
          projectDescription: 'Product Description project',
          pageType: 'Other',
          productServiceName: 'Enter your product name',
          outputStructure: createOutputStructure(['Header 1', 'Features', 'Benefits', 'Call to Action']),
          keyMessage: 'What makes this product valuable to customers?',
          callToAction: 'Buy now',
          desiredEmotion: 'Desire',
          tone: 'Persuasive',
          wordCount: 'Custom',
          customWordCount: 250,
          forceElaborationsExamples: true,
          targetAudience: 'Potential customers looking for this product',
          keywords: 'Enter relevant product keywords'
        }
      },
      {
        id: 'feature-benefit-section',
        label: 'Feature/Benefit Section',
        data: {
          projectDescription: 'Feature/Benefit Section project',
          pageType: 'Services',
          outputStructure: createOutputStructure(['Features', 'Benefits', 'Summary']),
          keyMessage: 'What features provide the most value?',
          desiredEmotion: 'Confidence',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 400,
          forceElaborationsExamples: true,
          targetAudience: 'Prospects evaluating your solution',
          targetAudiencePainPoints: 'Uncertainty about value, feature confusion, ROI concerns'
        }
      },
      {
        id: 'feature-announcement',
        label: 'Feature Announcement',
        data: {
          projectDescription: 'Feature Announcement project',
          pageType: 'Other',
          productServiceName: 'New feature name',
          outputStructure: createOutputStructure(['Header 1', 'Features', 'Benefits', 'Call to Action']),
          keyMessage: 'What new capability are you introducing?',
          callToAction: 'Try the new feature',
          desiredEmotion: 'Excitement',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 300,
          targetAudience: 'Existing customers and active users',
          forceElaborationsExamples: true
        }
      },
      {
        id: 'pricing-page-copy',
        label: 'Pricing Page Copy',
        data: {
          projectDescription: 'Pricing Page Copy project',
          pageType: 'Services',
          outputStructure: createOutputStructure(['Header 1', 'Benefits', 'Comparison', 'Testimonial', 'Call to Action']),
          keyMessage: 'Why is your pricing justified by the value provided?',
          callToAction: 'Choose your plan',
          desiredEmotion: 'Confidence',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 400,
          targetAudiencePainPoints: 'Price sensitivity, value uncertainty, feature comparison needs',
          forceElaborationsExamples: true
        }
      },
      {
        id: 'product-comparison-page',
        label: 'Product Comparison Page',
        data: {
          projectDescription: 'Product Comparison Page project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Comparison', 'Benefits', 'Summary', 'Call to Action']),
          keyMessage: 'How does your solution compare to alternatives?',
          callToAction: 'See why we\'re the best choice',
          desiredEmotion: 'Confidence',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 600,
          competitorUrls: ['', '', ''],
          targetAudience: 'Prospects actively comparing solutions',
          forceElaborationsExamples: true
        }
      },
      {
        id: 'product-description-ecommerce',
        label: 'Product Description (E-commerce)',
        data: {
          projectDescription: 'Product Description (E-commerce) project',
          pageType: 'Other',
          productServiceName: 'Enter your product name',
          outputStructure: createOutputStructure(['Header 1', 'Features', 'Benefits', 'Comparison', 'Call to Action']),
          keyMessage: 'What makes this product special and worth buying?',
          callToAction: 'Add to cart',
          desiredEmotion: 'Desire',
          tone: 'Persuasive',
          wordCount: 'Custom',
          customWordCount: 300,
          forceElaborationsExamples: true,
          targetAudience: 'Online shoppers comparing similar products',
          keywords: 'Enter product-related keywords for SEO'
        }
      },
      {
        id: 'product-launch-announcement',
        label: 'Product Launch Announcement',
        data: {
          projectDescription: 'Product Launch Announcement project',
          pageType: 'Other',
          productServiceName: 'Your new product/feature name',
          outputStructure: createOutputStructure(['Header 1', 'Features', 'Benefits', 'Call to Action']),
          keyMessage: 'What exciting new capability are you launching?',
          callToAction: 'Be among the first to try it',
          desiredEmotion: 'Excitement',
          tone: 'Bold',
          wordCount: 'Custom',
          customWordCount: 250,
          targetAudience: 'Existing customers and prospects interested in innovation',
          forceElaborationsExamples: true
        }
      }
    ]
  },
  {
    category: 'Email Marketing',
    options: [
      {
        id: 'email-campaign',
        label: 'Email Campaign',
        data: {
          projectDescription: 'Email Campaign project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Introduction', 'Offer', 'Benefits', 'Call to Action']),
          keyMessage: 'What is the main goal of this email campaign?',
          callToAction: 'Take action now',
          desiredEmotion: 'Interest',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 300,
          preferredWritingStyle: 'Persuasive',
          targetAudience: 'Email subscribers and leads',
          readerFunnelStage: 'Consideration',
          generateHeadlines: true,
          numberOfHeadlines: 3
        }
      },
      {
        id: 'cold-email-outreach',
        label: 'Cold Email Outreach',
        data: {
          projectDescription: 'Cold Email Outreach project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Offer', 'Call to Action']),
          keyMessage: 'What value can you provide to this cold prospect?',
          callToAction: 'Worth a quick chat?',
          desiredEmotion: 'Curiosity',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 120,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          preferredWritingStyle: 'Conversational',
          targetAudience: 'Cold prospects who don\'t know you yet',
          targetAudiencePainPoints: 'Busy schedule, skeptical of sales outreach, need clear value'
        }
      },
      {
        id: 'email-content',
        label: 'Email Content',
        data: {
          projectDescription: 'Email Content project',
          pageType: 'Other',
          readerFunnelStage: 'Consideration',
          keyMessage: 'What\'s the purpose of this email?',
          callToAction: 'Claim your offer',
          desiredEmotion: 'Trust',
          outputStructure: createOutputStructure(['Introduction', 'Offer', 'Call to Action']),
          wordCount: 'Medium: 100-200'
        }
      },
      {
        id: 'lead-nurturing-email',
        label: 'Lead Nurturing Email',
        data: {
          projectDescription: 'Lead Nurturing Email project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Introduction', 'Offer', 'Benefits', 'Call to Action']),
          keyMessage: 'What value are you providing in this touchpoint?',
          callToAction: 'Continue the conversation',
          desiredEmotion: 'Trust',
          tone: 'Friendly',
          wordCount: 'Custom',
          customWordCount: 250,
          preferredWritingStyle: 'Conversational',
          readerFunnelStage: 'Consideration',
          targetAudience: 'Warm leads who opted in but haven\'t purchased yet'
        }
      },
      {
        id: 'saas-onboarding-email',
        label: 'SaaS Onboarding Email Series',
        data: {
          projectDescription: 'SaaS Onboarding Email Series project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Introduction', 'Features', 'Call to Action']),
          keyMessage: 'How do you help new users get value quickly?',
          callToAction: 'Complete your setup',
          desiredEmotion: 'Confidence',
          tone: 'Friendly',
          wordCount: 'Custom',
          customWordCount: 200,
          preferredWritingStyle: 'Educational',
          targetAudience: 'New SaaS customers who just signed up',
          readerFunnelStage: 'Decision'
        }
      },
      {
        id: 'testimonial-request-email',
        label: 'Testimonial Request Email',
        data: {
          projectDescription: 'Testimonial Request Email project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Benefits', 'Call to Action']),
          keyMessage: 'How has your service positively impacted this customer?',
          callToAction: 'Share your experience',
          desiredEmotion: 'Gratitude',
          tone: 'Friendly',
          wordCount: 'Custom',
          customWordCount: 180,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          preferredWritingStyle: 'Conversational',
          targetAudience: 'Satisfied customers who achieved good results'
        }
      }
    ]
  },
  {
    category: 'Sales & Conversion',
    options: [
      {
        id: 'landing-page-hero',
        label: 'Landing Page Hero',
        data: {
          projectDescription: 'Landing Page Hero project',
          pageType: 'Homepage',
          outputStructure: createOutputStructure(['Header 1', 'Header 2', 'Benefits', 'Call to Action']),
          keyMessage: 'What is your most compelling value proposition?',
          callToAction: 'Get started free',
          desiredEmotion: 'Interest',
          tone: 'Persuasive',
          wordCount: 'Custom',
          customWordCount: 250,
          prioritizeWordCount: true,
          targetAudience: 'First-time visitors to your landing page',
          readerFunnelStage: 'Awareness'
        }
      },
      {
        id: 'cta-button',
        label: 'Call-to-Action (CTA)',
        data: {
          projectDescription: 'Call-to-Action (CTA) project',
          pageType: 'Other',
          callToAction: 'Download now',
          keyMessage: 'What action should users take?',
          desiredEmotion: 'Urgency',
          tone: 'Bold',
          wordCount: 'Custom',
          customWordCount: 10,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          generateHeadlines: true,
          numberOfHeadlines: 5
        }
      },
      {
        id: 'cta',
        label: 'Call to Action (CTA)',
        data: {
          projectDescription: 'Call to Action (CTA) project',
          pageType: 'Other',
          callToAction: 'Download now',
          desiredEmotion: 'Urgency',
          tone: 'Bold',
          wordCount: 'Custom',
          customWordCount: 15,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true
        }
      },
      {
        id: 'faq-conversion',
        label: 'FAQ Section (Conversion-focused)',
        data: {
          projectDescription: 'FAQ Section (Conversion-focused) project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Q&A', 'Benefits', 'Call to Action']),
          keyMessage: 'Address objections while reinforcing value',
          callToAction: 'Ready to get started?',
          desiredEmotion: 'Confidence',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 600,
          forceElaborationsExamples: true,
          targetAudience: 'Prospects with specific questions or concerns',
          faqSchemaEnabled: true
        }
      },
      {
        id: 'landing-page-lead-gen',
        label: 'Landing Page (Lead Gen)',
        data: {
          projectDescription: 'Landing Page (Lead Gen) project',
          pageType: 'Homepage',
          outputStructure: createOutputStructure(['Header 1', 'Problem', 'Solution', 'Benefits', 'Call to Action']),
          keyMessage: 'What free value are you offering in exchange for contact info?',
          callToAction: 'Get your free guide',
          desiredEmotion: 'Trust',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 400,
          targetAudience: 'Prospects researching solutions to their problems',
          readerFunnelStage: 'Awareness',
          forceElaborationsExamples: true
        }
      },
      {
        id: 'sales-page-longform',
        label: 'Sales Page (Long-Form)',
        data: {
          projectDescription: 'Sales Page (Long-Form) project',
          pageType: 'Services',
          outputStructure: createOutputStructure(['Header 1', 'Problem', 'Solution', 'Features', 'Benefits', 'Testimonial', 'Call to Action']),
          keyMessage: 'What transformation do you provide?',
          callToAction: 'Buy now - Limited time',
          desiredEmotion: 'Urgency',
          tone: 'Persuasive',
          wordCount: 'Custom',
          customWordCount: 1500,
          forceElaborationsExamples: true,
          preferredWritingStyle: 'Persuasive',
          targetAudience: 'Ready-to-buy prospects seeking this solution'
        }
      },
      {
        id: 'thank-you-page',
        label: 'Thank You Page',
        data: {
          projectDescription: 'Thank You Page project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Header 1', 'Summary', 'Call to Action']),
          keyMessage: 'What should the customer do next after converting?',
          callToAction: 'Share with friends',
          desiredEmotion: 'Satisfaction',
          tone: 'Friendly',
          wordCount: 'Custom',
          customWordCount: 150,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          targetAudience: 'Recent customers who just completed an action'
        }
      }
    ]
  },
  {
    category: 'SEO & Optimization',
    options: [
      {
        id: 'seo-content-brief',
        label: 'SEO Content Brief',
        data: {
          projectDescription: 'SEO Content Brief project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Problem', 'Solution', 'Features', 'Benefits', 'Conclusion']),
          keyMessage: 'What search intent does this content address?',
          callToAction: 'Learn more about our solution',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 1200,
          forceKeywordIntegration: true,
          forceElaborationsExamples: true,
          generateSeoMetadata: true,
          enhanceForGEO: true,
          addTldrSummary: true,
          preferredWritingStyle: 'Informative',
          keywords: 'Enter your target keywords',
          targetAudience: 'Users searching for solutions to this problem'
        }
      }
    ]
  },
  {
    category: 'Social Media',
    options: [
      {
        id: 'social-media-post-general',
        label: 'Social Media Post',
        data: {
          projectDescription: 'Social Media Post project',
          pageType: 'Other',
          keyMessage: 'What message do you want to share?',
          callToAction: 'Learn more',
          desiredEmotion: 'Engagement',
          tone: 'Friendly',
          wordCount: 'Custom',
          customWordCount: 100,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          preferredWritingStyle: 'Conversational',
          targetAudience: 'Social media audience',
          generateHeadlines: true,
          numberOfHeadlines: 3
        }
      },
      {
        id: 'linkedin-thought-leadership',
        label: 'LinkedIn Post (Thought Leadership)',
        data: {
          projectDescription: 'LinkedIn Post (Thought Leadership) project',
          pageType: 'Other',
          keyMessage: 'What insight or perspective do you want to share?',
          callToAction: 'Share your thoughts',
          desiredEmotion: 'Inspiration',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 150,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          preferredWritingStyle: 'Conversational',
          targetAudience: 'LinkedIn professionals in your industry'
        }
      },
      {
        id: 'social-media-post',
        label: 'Social Media Post (Instagram/Facebook)',
        data: {
          projectDescription: 'Social Media Post (Instagram/Facebook) project',
          pageType: 'Other',
          keyMessage: 'What\'s your main social media message?',
          callToAction: 'Link in bio',
          desiredEmotion: 'Engagement',
          tone: 'Friendly',
          wordCount: 'Custom',
          customWordCount: 60,
          prioritizeWordCount: true,
          adhereToLittleWordCount: true,
          preferredWritingStyle: 'Conversational',
          targetAudience: 'Social media followers and potential customers'
        }
      }
    ]
  },
  {
    category: 'Tech & SaaS',
    options: [
      {
        id: 'software-tutorial-help',
        label: 'Software Tutorial/Help Content',
        data: {
          projectDescription: 'Software Tutorial/Help Content project',
          pageType: 'Other',
          outputStructure: createOutputStructure(['Introduction', 'Numbered list', 'Benefits', 'Summary']),
          keyMessage: 'What specific task are you helping users accomplish?',
          callToAction: 'Need more help? Contact support',
          desiredEmotion: 'Confidence',
          tone: 'Professional',
          wordCount: 'Custom',
          customWordCount: 500,
          preferredWritingStyle: 'Educational',
          forceElaborationsExamples: true,
          targetAudience: 'Users seeking help with specific software features'
        }
      }
    ]
  }
];
// Keep the original flat array for backwards compatibility if needed
export const PREFILLS: Prefill[] = GROUPED_PREFILLS.flatMap(group => group.options);