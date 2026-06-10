/*
  # Migrate token tracking to pmc_users and drop user_access tables

  1. Drop Foreign Key Constraints
    - Remove all foreign key constraints that reference user_access tables
  2. Drop Tables
    - Drop user_access and all related duplicate tables
  3. Create New Foreign Keys
    - Add foreign key constraints that reference pmc_users(email)
  4. Add Indexes
    - Create indexes for performance on the new foreign key relationships
*/

-- Step 1: Drop all foreign key constraints that reference user_access tables
DO $$
BEGIN
  -- Drop foreign key constraint from pmc_user_tokens_usage that references user_access
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_tokens_usage_user_email_fkey' 
    AND table_name = 'pmc_user_tokens_usage'
  ) THEN
    ALTER TABLE pmc_user_tokens_usage DROP CONSTRAINT user_tokens_usage_user_email_fkey;
  END IF;

  -- Drop foreign key constraint from user_tokens_usage that references user_access
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_tokens_usage_user_email_fkey' 
    AND table_name = 'user_tokens_usage'
  ) THEN
    ALTER TABLE user_tokens_usage DROP CONSTRAINT user_tokens_usage_user_email_fkey;
  END IF;
END $$;

-- Step 2: Drop user_access tables (now that constraints are removed)
DO $$
BEGIN
  -- Drop main user_access table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_access') THEN
    DROP TABLE user_access;
  END IF;

  -- Drop duplicate user_access tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_access_bup2') THEN
    DROP TABLE user_access_bup2;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_access_copy') THEN
    DROP TABLE user_access_copy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_access_duplicate') THEN
    DROP TABLE user_access_duplicate;
  END IF;
END $$;

-- Step 3: Create new foreign key constraints that reference pmc_users
DO $$
BEGIN
  -- Add foreign key constraint from pmc_user_tokens_usage to pmc_users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pmc_user_tokens_usage_user_email_fkey' 
    AND table_name = 'pmc_user_tokens_usage'
  ) THEN
    ALTER TABLE pmc_user_tokens_usage 
    ADD CONSTRAINT pmc_user_tokens_usage_user_email_fkey 
    FOREIGN KEY (user_email) REFERENCES pmc_users(email);
  END IF;

  -- Add foreign key constraint from user_tokens_usage to pmc_users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_tokens_usage_user_email_fkey' 
    AND table_name = 'user_tokens_usage'
  ) THEN
    ALTER TABLE user_tokens_usage 
    ADD CONSTRAINT user_tokens_usage_user_email_fkey 
    FOREIGN KEY (user_email) REFERENCES pmc_users(email);
  END IF;
END $$;

-- Step 4: Add indexes for performance on the new foreign key relationships
DO $$
BEGIN
  -- Index on pmc_user_tokens_usage.user_email (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'pmc_user_tokens_usage' 
    AND indexname = 'idx_pmc_user_tokens_usage_user_email'
  ) THEN
    CREATE INDEX idx_pmc_user_tokens_usage_user_email ON pmc_user_tokens_usage(user_email);
  END IF;

  -- Index on user_tokens_usage.user_email (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_tokens_usage' 
    AND indexname = 'idx_user_tokens_usage_user_email_new'
  ) THEN
    CREATE INDEX idx_user_tokens_usage_user_email_new ON user_tokens_usage(user_email);
  END IF;
END $$;