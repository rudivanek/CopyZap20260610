/*
  # Update Slogan / Tagline prefill

  1. Enhanced Prefill
    - Update existing "Slogan / Tagline" prefill with enhanced name and additional fields
    - Add Project Description, targeting fields, and context
    - Maintains ultra-short 8-word format with headline generation
    - Optimized for brand positioning and memorability

  2. Changes
    - Enhanced label: "Slogan / Tagline for [ENTER YOUR BRAND/PRODUCT]"
    - Added Project Description matching the prefill name
    - Added Industry/Niche, Product/Service Name, Target Audience
    - Added Preferred Writing Style, Context, Keywords
    - Maintains existing 8-word limit and headline generation settings
*/

UPDATE pmc_prefills 
SET 
  label = 'Slogan / Tagline for [ENTER YOUR BRAND/PRODUCT]',
  data = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  data,
                  '{projectDescription}', 
                  '"Slogan / Tagline for [ENTER YOUR BRAND/PRODUCT]"'
                ),
                '{industryNiche}', 
                '"Enter your industry"'
              ),
              '{productServiceName}', 
              '"Enter your brand/product name"'
            ),
            '{targetAudience}', 
            '"Your ideal customers and brand advocates"'
          ),
          '{preferredWritingStyle}', 
          '"Memorable"'
        ),
        '{context}', 
        '"Brand positioning and memorability - create a memorable phrase that captures your essence"'
      ),
      '{keywords}', 
      '"Enter your brand keywords"'
    ),
    '{briefDescription}', 
    '"Brand slogan/tagline creation"'
  )
WHERE label = 'Slogan / Tagline';