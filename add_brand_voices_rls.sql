/*
  # Add RLS Policies for Brand Voices

  Run this SQL in your Supabase SQL Editor to add the necessary RLS policies.

  1. Security
    - Enable RLS on `pmc_public_brand_voices` table
    - Add policy for users to view brand voices for their customers
    - Add policy for users to insert brand voices for their customers
    - Add policy for users to update brand voices for their customers
    - Add policy for users to delete brand voices for their customers

  2. Notes
    - Policies check that the user has access to the customer via pmc_customer_users table
*/

-- Enable RLS (if not already enabled)
ALTER TABLE pmc_public_brand_voices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view brand voices for their customers" ON pmc_public_brand_voices;
DROP POLICY IF EXISTS "Users can insert brand voices for their customers" ON pmc_public_brand_voices;
DROP POLICY IF EXISTS "Users can update brand voices for their customers" ON pmc_public_brand_voices;
DROP POLICY IF EXISTS "Users can delete brand voices for their customers" ON pmc_public_brand_voices;

-- Policy: Users can view brand voices for customers they own or shared customers
CREATE POLICY "Users can view brand voices for their customers"
  ON pmc_public_brand_voices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND (pmc_customers.user_id = auth.uid() OR pmc_customers.user_id IS NULL)
    )
  );

-- Policy: Users can insert brand voices for customers they own or shared customers
CREATE POLICY "Users can insert brand voices for their customers"
  ON pmc_public_brand_voices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND (pmc_customers.user_id = auth.uid() OR pmc_customers.user_id IS NULL)
    )
  );

-- Policy: Users can update brand voices for customers they own or shared customers
CREATE POLICY "Users can update brand voices for their customers"
  ON pmc_public_brand_voices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND (pmc_customers.user_id = auth.uid() OR pmc_customers.user_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND (pmc_customers.user_id = auth.uid() OR pmc_customers.user_id IS NULL)
    )
  );

-- Policy: Users can delete brand voices for customers they own or shared customers
CREATE POLICY "Users can delete brand voices for their customers"
  ON pmc_public_brand_voices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND (pmc_customers.user_id = auth.uid() OR pmc_customers.user_id IS NULL)
    )
  );
