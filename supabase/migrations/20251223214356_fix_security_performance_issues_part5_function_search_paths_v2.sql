/*
  # Security and Performance Fixes - Part 5: Fix Function Search Paths
  
  ## Overview
  Sets explicit search_path on all functions to prevent potential security vulnerabilities
  from search_path manipulation attacks.
  
  ## Changes
  Sets search_path to 'public, pg_catalog' for all affected functions.
  This ensures functions can only access objects in public schema and PostgreSQL catalog.
  
  ## Affected Functions (21)
  All functions that previously had role-mutable search_path.
  
  ## Security Notes
  - Prevents search_path manipulation attacks
  - No functional changes to the functions
  - All functions remain fully operational
*/

-- Functions without parameters
ALTER FUNCTION public.handle_new_user() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_special_instructions_suggestions_updated_at() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_pmc_extrasuggestions_updated_at() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_modify_content_suggestions_updated_at() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_blog_posts_updated_at() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_saved_output_timestamp() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_saved_outputs_updated_at() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_timestamp() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_updated_at_column() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.cleanup_old_copy_sessions() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.cleanup_excess_user_sessions() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.cleanup_copy_sessions() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.generate_task_id() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.refresh_translations_view() 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.process_task_dependencies() 
SET search_path = public, pg_catalog;

-- Functions with parameters (need full signature)
ALTER FUNCTION public.get_token_usage_summary(user_email_param text) 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_user_session_count(user_uuid uuid) 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_user_saved_count(user_uuid uuid) 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.generate_session_name(p_output_type text, p_brief_description text, p_created_at timestamp with time zone) 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_translated_value(value_column text, fallback_column text) 
SET search_path = public, pg_catalog;

ALTER FUNCTION public.process_all_project_dependencies(project_id_param uuid) 
SET search_path = public, pg_catalog;