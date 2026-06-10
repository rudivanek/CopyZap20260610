-- SQL Migration: Add enable_analyze_compare to workflows table
-- Run this SQL in your Supabase SQL Editor

-- Add enable_analyze_compare column to workflows table
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS enable_analyze_compare boolean DEFAULT false;

-- This field enables automatic "Analyze – Compare & Score Copy" at workflow completion
-- When enabled, workflows will automatically trigger AI comparison and scoring of all generated outputs
