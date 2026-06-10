/*
  # Add Advanced Style Controls to Brand Voices

  1. Changes
    - Add `advanced_style` column to `pmc_public_brand_voices` table
      - Type: jsonb (stores fine-grained voice control settings)
      - Default: null (optional - not all brand voices need advanced controls)

  2. Advanced Style Structure
    Contains optional fields for:
    - Sentence length preference (short, medium, long, varied)
    - Rhythm & cadence (staccato, smooth, energetic, calm)
    - Formality level (1-5 scale)
    - Emotional tone (array of tone descriptors)
    - Brand persona (mentor, friend, expert, etc.)
    - Point of view (first_person, second_person, third_person, brand_voice)
    - Figurative vs literal level
    - Detail depth (minimal, balanced, detailed, highly_explanatory)
    - Vocabulary complexity
    - Content structure rules (paragraphs, bullets, questions)
    - Allowed/forbidden elements

  3. Notes
    - All advanced style fields are optional
    - Existing brand voices will have null advanced_style by default
    - Advanced controls provide fine-grained control over AI generation style
*/

-- Add advanced_style column to pmc_public_brand_voices
ALTER TABLE public.pmc_public_brand_voices
ADD COLUMN IF NOT EXISTS advanced_style jsonb;
