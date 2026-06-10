/*
  # Update All Angles Blog Template to Public

  1. Changes
    - Update the "12.) Blog Post – All Angles (5 Strategies)" template to be public
    - Set is_public = true
    - Add public_name and public_description for the template library
    
  2. Purpose
    - Make the All Angles Blog template visible to all users in the template dropdown
    - Provide clear public-facing name and description
*/

UPDATE pmc_templates
SET 
  is_public = true,
  public_name = 'Blog Post – All Angles (5 Strategies)',
  public_description = 'Generate 1-5 complete blog posts from a single topic using different strategic angles. Select which approaches to use: How-To Guide, Framework/Listicle, Comparison, Thought Leadership, or Case Study.'
WHERE 
  template_name = '12.) Blog Post – All Angles (5 Strategies)'
  AND user_id = '2ac648bd-fa9e-4323-92a5-2e02799dc514';