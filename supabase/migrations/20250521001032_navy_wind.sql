/*
  # Fix users and sessions tables

  1. User Management
    - Creates handler function for new users
    - Ensures pmc_users table exists with proper structure
    - Sets up trigger for automatic user creation

  2. Security
    - Enables Row Level Security (RLS) on tables
    - Sets up proper access policies for user data
    - Ensures users can only access their own data

  3. Relationships
    - Fixes foreign key constraint between tables
    - Migrates existing users from auth.users to pmc_users
*/

-- Create function to sync auth users with pmc_users table
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pmc_users (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.pmc_users.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure pmc_users table exists with correct structure
CREATE TABLE IF NOT EXISTS public.pmc_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create or replace trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE public.pmc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmc_copy_sessions ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies for pmc_users
DO $$
BEGIN
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pmc_users' AND policyname = 'Users can read their own record'
  ) THEN
    CREATE POLICY "Users can read their own record"
      ON public.pmc_users FOR SELECT
      USING (auth.uid() = id);
  END IF;
  
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pmc_users' AND policyname = 'Users can update their own record'
  ) THEN
    CREATE POLICY "Users can update their own record"
      ON public.pmc_users FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Set up RLS policies for pmc_copy_sessions
DO $$
BEGIN
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pmc_copy_sessions' AND policyname = 'Users can read own copy sessions'
  ) THEN
    CREATE POLICY "Users can read own copy sessions"
      ON public.pmc_copy_sessions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pmc_copy_sessions' AND policyname = 'Users can insert own copy sessions'
  ) THEN
    CREATE POLICY "Users can insert own copy sessions"
      ON public.pmc_copy_sessions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pmc_copy_sessions' AND policyname = 'Users can delete own copy sessions'
  ) THEN
    CREATE POLICY "Users can delete own copy sessions"
      ON public.pmc_copy_sessions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Adjust foreign key on pmc_copy_sessions if needed
-- First check if the constraint exists, then recreate it properly
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pmc_copy_sessions_user_id_fkey'
    AND table_name = 'pmc_copy_sessions'
  ) THEN
    ALTER TABLE public.pmc_copy_sessions DROP CONSTRAINT pmc_copy_sessions_user_id_fkey;
  END IF;
  
  ALTER TABLE public.pmc_copy_sessions
  ADD CONSTRAINT pmc_copy_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.pmc_users(id) ON DELETE CASCADE;
END
$$;

-- Insert existing auth users into pmc_users if they don't exist
INSERT INTO public.pmc_users (id, email, name)
SELECT au.id, au.email, COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.pmc_users pu ON au.id = pu.id
WHERE pu.id IS NULL;