/*
  # Create pmc_saved_outputs table
  
  1. New Tables
     - `pmc_saved_outputs` - Stores complete output from copy generation
       - `id` (uuid, primary key): unique identifier
       - `user_id` (uuid, foreign key): references pmc_users.id
       - `customer_id` (uuid, foreign key, optional): references pmc_customers.id
       - `brief_description` (text): description of the output
       - `language` (text): language of the content
       - `tone` (text): tone of the content
       - `model` (text): AI model used to generate content
       - `selected_persona` (text, nullable): voice style that was applied, if any
       - `input_snapshot` (jsonb): snapshot of all input fields at time of saving
       - `output_content` (jsonb): complete copy result with all variations
       - `saved_at` (timestamptz): when the output was saved
  2. Security
     - Enable RLS on the table
     - Add policies to ensure users can only access their own saved outputs
*/

CREATE TABLE IF NOT EXISTS public.pmc_saved_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.pmc_users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.pmc_customers(id) ON DELETE SET NULL,
  brief_description text NOT NULL,
  language text NOT NULL,
  tone text NOT NULL,
  model text NOT NULL,
  selected_persona text,
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_content jsonb NOT NULL,
  saved_at timestamptz DEFAULT now()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pmc_saved_outputs_user_id 
ON public.pmc_saved_outputs(user_id);

CREATE INDEX IF NOT EXISTS idx_pmc_saved_outputs_customer_id 
ON public.pmc_saved_outputs(customer_id);

CREATE INDEX IF NOT EXISTS idx_pmc_saved_outputs_saved_at 
ON public.pmc_saved_outputs(saved_at);

-- Enable Row Level Security
ALTER TABLE public.pmc_saved_outputs ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies for pmc_saved_outputs
CREATE POLICY "Users can read their own saved outputs"
  ON public.pmc_saved_outputs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved outputs"
  ON public.pmc_saved_outputs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved outputs"
  ON public.pmc_saved_outputs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved outputs"
  ON public.pmc_saved_outputs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);