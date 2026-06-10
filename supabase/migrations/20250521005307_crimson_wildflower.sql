/*
  # Add customer functionality

  1. New Tables
     - `pmc_customers` - Stores customer information for the dropdown
       - `id` (uuid, primary key) - Unique customer identifier
       - `name` (text, not null) - Customer name to display
       - `description` (text) - Optional customer description
       - `user_id` (uuid) - Reference to the user who created the customer
       - `created_at` (timestamptz) - Creation timestamp

  2. Table Modifications
     - Add `customer_id` column to `pmc_copy_sessions` table
       - UUID foreign key to the pmc_customers table
       - Can be null (for backward compatibility)

  3. Security
     - Enable RLS on the new table
     - Add policies for customers table:
       - Users can insert their own customers
       - Users can select all customers
       - Users can update/delete their own customers
*/

-- Create the pmc_customers table
CREATE TABLE IF NOT EXISTS public.pmc_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES public.pmc_users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Add index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_pmc_customers_name
ON public.pmc_customers(name);

-- Add index on user_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_pmc_customers_user_id
ON public.pmc_customers(user_id);

-- Enable row level security
ALTER TABLE public.pmc_customers ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies for pmc_customers
CREATE POLICY "Users can insert their own customers"
  ON public.pmc_customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select all customers"
  ON public.pmc_customers FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own customers"
  ON public.pmc_customers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
  ON public.pmc_customers FOR DELETE
  USING (auth.uid() = user_id);

-- Add customer_id column to pmc_copy_sessions table
ALTER TABLE public.pmc_copy_sessions 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.pmc_customers(id) ON DELETE SET NULL;

-- Add index on customer_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_pmc_copy_sessions_customer_id
ON public.pmc_copy_sessions(customer_id);

-- Insert some default customers for all users to use
INSERT INTO public.pmc_customers (id, name, description, user_id)
VALUES 
  (gen_random_uuid(), 'General', 'Default customer for general content', NULL),
  (gen_random_uuid(), 'Small Business', 'Small to medium-sized businesses', NULL),
  (gen_random_uuid(), 'Enterprise', 'Large enterprise clients', NULL),
  (gen_random_uuid(), 'E-commerce', 'Online retail businesses', NULL),
  (gen_random_uuid(), 'Education', 'Educational institutions and services', NULL),
  (gen_random_uuid(), 'Healthcare', 'Medical and healthcare services', NULL),
  (gen_random_uuid(), 'Technology', 'Tech companies and startups', NULL),
  (gen_random_uuid(), 'Non-profit', 'Non-profit organizations', NULL)
ON CONFLICT (id) DO NOTHING;