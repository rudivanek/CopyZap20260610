/*
  # Add Templates Functionality
  
  1. New Tables
     - `pmc_templates` - Stores user templates for reuse
       - `id` (uuid, primary key): Unique identifier
       - `user_id` (uuid): Reference to pmc_users.id
       - `template_name` (text): Name of the template
       - `language` (text): Language setting
       - `tone` (text): Tone setting
       - `word_count` (text): Word count setting
       - `custom_word_count` (integer, optional): Custom word count value
       - `target_audience` (text): Target audience description
       - `key_message` (text): Key message content
       - `desired_emotion` (text): Desired emotions
       - `call_to_action` (text): Call to action text
       - `brand_values` (text): Brand values as comma-separated string
       - `keywords` (text): Keywords as comma-separated string
       - `context` (text): Context information
       - `brief_description` (text): Brief description of template
       - `page_type` (text, optional): Page type for 'create' templates
       - `business_description` (text, optional): Business description for 'create' templates
       - `original_copy` (text, optional): Original copy for 'improve' templates
       - `template_type` (text): Either 'create' or 'improve'
       - `created_at` (timestamptz): Creation timestamp
  
  2. Security
     - Enable RLS on the table
     - Add policies to ensure users can only access their own templates
*/

-- Create the pmc_templates table
CREATE TABLE IF NOT EXISTS public.pmc_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.pmc_users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  language text NOT NULL,
  tone text NOT NULL,
  word_count text NOT NULL,
  custom_word_count integer,
  target_audience text,
  key_message text,
  desired_emotion text,
  call_to_action text,
  brand_values text,
  keywords text,
  context text,
  brief_description text,
  page_type text,
  business_description text,
  original_copy text,
  template_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pmc_templates_user_id
ON public.pmc_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_pmc_templates_template_type
ON public.pmc_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_pmc_templates_created_at
ON public.pmc_templates(created_at);

-- Enable Row Level Security
ALTER TABLE public.pmc_templates ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read their own templates" 
ON public.pmc_templates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" 
ON public.pmc_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.pmc_templates
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.pmc_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Add a unique constraint on user_id and template_name
ALTER TABLE public.pmc_templates
ADD CONSTRAINT unique_user_template_name UNIQUE (user_id, template_name);