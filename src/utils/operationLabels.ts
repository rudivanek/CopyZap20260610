/**
 * Operation Type Display Labels
 * Maps internal operation_type values to user-friendly display names
 */

export const OPERATION_LABELS: Record<string, string> = {
  // Copy Generation
  'generate_copy': 'Generate Copy',
  'generate_copy_enhanced': 'Generate Copy (Enhanced)',
  'generate_copy_basic': 'Generate Copy (Basic)',
  'generate_copy_variant': 'Generate Variant',
  'generate_copy_repair': 'Repair Copy Output',

  // URL Analysis
  'url_analysis': 'Website Analysis',
  'url_analysis_firecrawl': 'Website Analysis (Firecrawl)',
  'firecrawl-scrape': 'URL Crawl (Firecrawl)',
  'extract_brand_voice': 'Extract Brand Voice',

  // Voice & Style
  'apply_voice_style': 'Apply Voice Style',
  'analyze_brand_voice': 'Analyze Brand Voice',
  'blend_voice_styles': 'Blend Voice Styles',

  // Comparisons & Analysis
  'output_comparison': 'Compare Outputs',
  'grok_comparison': 'AI Comparison', // legacy label kept for historical records
  'score_comparison': 'Score Comparison',
  'content_scoring': 'Content Scoring',
  'geo_scoring': 'Geo SEO Scoring',

  // Scoring
  'generate_content_score': 'Score Content',
  'comprehensive_scoring': 'Comprehensive Scoring',
  'score-adjustment': 'Score Adjustment',
  'calculate_geo_score': 'Geo SEO Score',
  'deep_analysis': 'Deep Analysis',
  'overall_verdict': 'Overall Verdict',

  // Suggestions
  'field_suggestion': 'Field Suggestion',
  'template_suggestion': 'Template Suggestion',
  'modification_suggestion': 'Modification Suggestion',
  'special_instructions_suggestion': 'Special Instructions Suggestion',
  'content_modification_suggestion': 'Content Modification Suggestion',

  // Content Operations
  'content_refinement': 'Refine Content',
  'content_modification': 'Modify Content',
  'modify_content': 'Modify Content',
  'humanize_copy': 'Humanize Copy',
  'generate_humanized': 'Humanize Copy',
  'alternative_copy': 'Generate Alternatives',
  'generate_alternative': 'Generate Alternative',
  'blended_copy': 'Blend Outputs',
  'blend_outputs': 'Blend Outputs',
  'revise_content_wordcount': 'Revise Word Count',
  'revise_content_wordcount_second': 'Revise Word Count (2nd pass)',
  'revise_content_aggressive': 'Revise Word Count (Aggressive)',
  'performance_boost': 'Performance Boost',

  // SEO
  'seo_generation': 'SEO Generation',
  'seo_meta_tags': 'SEO Meta Tags',
  'seo_faq_schema': 'FAQ Schema',
  'generate_seo_metadata': 'Generate SEO Metadata',
  'generate_faq_schema': 'Generate FAQ Schema',

  // Evaluation
  'prompt_evaluation': 'Evaluate Prompt',
  'evaluate_prompt': 'Evaluate Prompt',
  'evaluate_content_quality': 'Evaluate Content Quality',
  'model_validation': 'Validate AI Model',

  // Workflow
  'workflow_execution': 'Workflow Execution',
  'workflow_step': 'Workflow Step',
};

/**
 * Get friendly display label for an operation type
 */
export function getOperationLabel(operationType: string): string {
  return OPERATION_LABELS[operationType] || operationType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get all operation types grouped by category (for admin/filtering)
 */
export function getOperationCategories() {
  return {
    'Content Generation': [
      'generate_copy',
      'generate_copy_enhanced',
      'generate_copy_basic',
      'generate_copy_variant',
      'generate_copy_repair',
      'alternative_copy',
      'generate_alternative',
      'blended_copy',
      'blend_outputs',
      'performance_boost',
    ],
    'Scoring': [
      'generate_content_score',
      'comprehensive_scoring',
      'score-adjustment',
      'calculate_geo_score',
      'deep_analysis',
      'overall_verdict',
      'content_scoring',
      'geo_scoring',
    ],
    'Analysis': [
      'url_analysis',
      'url_analysis_firecrawl',
      'firecrawl-scrape',
      'analyze_brand_voice',
      'extract_brand_voice',
    ],
    'Comparisons': [
      'output_comparison',
      'grok_comparison',
      'score_comparison',
    ],
    'Content Refinement': [
      'content_refinement',
      'content_modification',
      'modify_content',
      'humanize_copy',
      'generate_humanized',
      'revise_content_wordcount',
      'revise_content_wordcount_second',
      'revise_content_aggressive',
      'apply_voice_style',
      'blend_voice_styles',
    ],
    'SEO': [
      'seo_generation',
      'seo_meta_tags',
      'seo_faq_schema',
      'generate_seo_metadata',
      'generate_faq_schema',
    ],
    'Suggestions': [
      'field_suggestion',
      'template_suggestion',
      'modification_suggestion',
      'special_instructions_suggestion',
      'content_modification_suggestion',
    ],
    'Other': [
      'prompt_evaluation',
      'evaluate_prompt',
      'evaluate_content_quality',
      'model_validation',
      'workflow_execution',
      'workflow_step',
    ],
  };
}
