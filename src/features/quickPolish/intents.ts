export interface IntentPreset {
  id: string;
  label: string;
  description: string;
  fields: Array<'audience' | 'goal' | 'tone' | 'cta'>;
  outputShape: 'single';
  defaultTone: string;
}

export const INTENT_PRESETS: IntentPreset[] = [
  {
    id: 'hero_branding',
    label: 'Hero Headline + Subheadline',
    description: 'Polish hero section copy for branding/web pages',
    fields: ['audience', 'goal', 'tone'],
    outputShape: 'single',
    defaultTone: 'premium'
  },
  {
    id: 'cta',
    label: 'Call to Action',
    description: 'Rewrite CTA copy to be more compelling',
    fields: ['goal', 'tone', 'cta'],
    outputShape: 'single',
    defaultTone: 'bold'
  },
  {
    id: 'about',
    label: 'About Section',
    description: 'Polish about/bio section copy',
    fields: ['audience', 'tone'],
    outputShape: 'single',
    defaultTone: 'friendly'
  },
  {
    id: 'instagram_caption',
    label: 'Instagram Caption',
    description: 'Polish Instagram caption copy',
    fields: ['audience', 'goal', 'tone'],
    outputShape: 'single',
    defaultTone: 'friendly'
  },
  {
    id: 'ad_short',
    label: 'Short Ad Copy',
    description: 'Polish short form ad copy',
    fields: ['audience', 'goal', 'tone', 'cta'],
    outputShape: 'single',
    defaultTone: 'bold'
  },
  {
    id: 'email_intro',
    label: 'Email Opening',
    description: 'Polish email opening paragraph',
    fields: ['audience', 'goal', 'tone'],
    outputShape: 'single',
    defaultTone: 'friendly'
  },
  {
    id: 'value_prop',
    label: 'Value Proposition',
    description: 'Polish value proposition statement',
    fields: ['audience', 'tone'],
    outputShape: 'single',
    defaultTone: 'premium'
  },
  {
    id: 'seo_snippet',
    label: 'SEO Snippet',
    description: 'Polish short SEO-friendly snippet',
    fields: ['goal', 'tone'],
    outputShape: 'single',
    defaultTone: 'neutral'
  },
  {
    id: 'section_body',
    label: 'Section Body Copy (Web / Landing Page)',
    description: 'Polish paragraph-level website or landing-page body copy',
    fields: ['audience', 'goal', 'tone'],
    outputShape: 'single',
    defaultTone: 'neutral'
  },
  {
    id: 'product_desc_short',
    label: 'Product Description (Short)',
    description: 'Polish short product or service descriptions for conversion',
    fields: ['audience', 'goal', 'tone', 'cta'],
    outputShape: 'single',
    defaultTone: 'neutral'
  },
  {
    id: 'problem_pain',
    label: 'Problem / Pain Statement',
    description: 'Polish and clarify problem statements for landing pages, ads, and sales pitches',
    fields: ['audience', 'tone'],
    outputShape: 'single',
    defaultTone: 'neutral'
  }
];

export const TONE_OPTIONS = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'premium', label: 'Premium' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'bold', label: 'Bold' },
  { value: 'formal', label: 'Formal' }
];
