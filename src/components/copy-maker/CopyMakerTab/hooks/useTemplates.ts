import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getUserTemplates } from '../../../../services/supabaseClient';
import { Template, User, FormState } from '../../../../types';
import { countPopulatedFields, getSectionsToExpand } from '../../../../utils/templateLoader';
import { getFieldsWithPlaceholders } from '../../../../utils/placeholderDetection';
import { logAutoApply } from '../../../../utils/debugAutoApply';

interface UseTemplatesReturn {
  fetchedTemplates: Template[];
  isLoadingTemplates: boolean;
  templateLoadError: string | null;
  templateSearchQuery: string;
  setTemplateSearchQuery: (query: string) => void;
  filteredAndGroupedTemplates: Array<{ category: string; templates: Template[] }>;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  handleTemplateSelection: (templateId: string) => void;
}

export function useTemplates(
  currentUser?: User,
  loadFormStateFromTemplate?: (template: Template) => void,
  setLoadedTemplateId?: (id: string | null) => void,
  setLoadedTemplateName?: (name: string) => void,
  setLoadedTemplateCategory?: (category: string) => void,
  onClearAll?: () => void,
  currentMode?: 'quick' | 'standard' | 'advanced',
  setMode?: (mode: 'quick' | 'standard' | 'advanced') => void,
  forceAdvanced?: (reason: string, details?: string) => void,
  formState?: FormState,
  onExpandSections?: (sectionKeys: string[]) => void
): UseTemplatesReturn {
  const [fetchedTemplates, setFetchedTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);

  // Fetch templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!currentUser?.id) {
        setFetchedTemplates([]);
        return;
      }

      setIsLoadingTemplates(true);
      setTemplateLoadError(null);

      try {
        const { data, error } = await getUserTemplates(currentUser.id);
        if (error) {
          throw error;
        }
        setFetchedTemplates(data || []);
      } catch (error: any) {
        console.error('Error fetching templates:', error);
        setTemplateLoadError(`Failed to load templates: ${error.message}`);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [currentUser?.id]);

  // Filter and group templates for the dropdown
  const filteredAndGroupedTemplates = useMemo(() => {
    const query = templateSearchQuery.toLowerCase();
    const filtered = fetchedTemplates.filter(template =>
      (typeof template.template_name === 'string' && template.template_name.toLowerCase().includes(query)) ||
      (typeof template.category === 'string' && template.category.toLowerCase().includes(query)) ||
      (typeof template.description === 'string' && template.description.toLowerCase().includes(query))
    );

    const grouped: { [key: string]: Template[] } = {};
    filtered.forEach(template => {
      const category = (typeof template.category === 'string' && template.category) ? template.category : 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(template);
    });

    // Sort categories: "Uncategorized" first, then alphabetically
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === 'Uncategorized') return -1;
      if (b === 'Uncategorized') return 1;
      return a.localeCompare(b);
    });

    return sortedCategories.map(category => ({
      category,
      templates: grouped[category].sort((a, b) => {
        const nameA = (typeof a.template_name === 'string' && a.template_name) ? a.template_name : '';
        const nameB = (typeof b.template_name === 'string' && b.template_name) ? b.template_name : '';
        return nameA.localeCompare(nameB);
      })
    }));
  }, [fetchedTemplates, templateSearchQuery]);

  // Handle template selection from dropdown
  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = fetchedTemplates.find(t => t.id === templateId);

      if (template && loadFormStateFromTemplate) {
        // Clear all inputs first
        if (onClearAll) onClearAll();

        loadFormStateFromTemplate(template);
        if (setLoadedTemplateId) setLoadedTemplateId(template.id || null);
        if (setLoadedTemplateName) setLoadedTemplateName(template.template_name || '');
        if (setLoadedTemplateCategory) setLoadedTemplateCategory(template.category || '');

        // Convert template to FormState format for analysis
        const templateData: Partial<FormState> = {
          businessDescription: template.business_description,
          originalCopy: template.original_copy,
          targetAudience: template.target_audience,
          keyMessage: template.key_message,
          callToAction: template.call_to_action,
          desiredEmotion: template.desired_emotion,
          brandValues: template.brand_values,
          keywords: template.keywords,
          context: template.context,
          specialInstructions: template.special_instructions,
          briefDescription: template.brief_description,
          productServiceName: template.product_service_name,
          industryNiche: template.industry_niche,
          readerFunnelStage: template.reader_funnel_stage,
          targetAudiencePainPoints: template.target_audience_pain_points,
          competitorCopyText: template.competitor_copy_text,
          preferredWritingStyle: template.preferred_writing_style,
          languageStyleConstraints: template.language_style_constraints,
          excludedTerms: template.excluded_terms,
          geoRegions: template.geoRegions || template.geo_regions,
          generateSeoMetadata: template.generateSeoMetadata || template.generate_seo_metadata,
          generateScores: template.generateScores || template.generate_scores,
          generateGeoScore: template.generateGeoScore || template.generate_geo_score,
          prioritizeWordCount: template.prioritizeWordCount,
          forceElaborationsExamples: template.forceElaborationsExamples || template.force_elaborations_examples,
          enhanceForGEO: template.enhanceForGEO || template.enhance_for_geo,
          addTldrSummary: template.addTldrSummary || template.add_tldr_summary,
          numUrlSlugs: template.numUrlSlugs || template.num_url_slugs,
          numMetaDescriptions: template.numMetaDescriptions || template.num_meta_descriptions,
          numH1Variants: template.numH1Variants || template.num_h1_variants,
          numH2Variants: template.numH2Variants || template.num_h2_variants,
          numH3Variants: template.numH3Variants || template.num_h3_variants,
          numOgTitles: template.numOgTitles || template.num_og_titles,
          numOgDescriptions: template.numOgDescriptions || template.num_og_descriptions,
          wordCountTolerancePercentage: template.wordCountTolerancePercentage || template.word_count_tolerance_percentage,
          competitorUrls: template.competitor_urls,
          outputStructure: template.output_structure,
          language: template.language,
          tone: template.tone,
          wordCount: template.word_count,
          customWordCount: template.custom_word_count,
          toneLevel: template.tone_level,
          section: template.section,
          createVariants: template.createVariants || template.create_variants,
          numberOfVariants: template.numberOfVariants || template.number_of_variants
        };

        // Count populated fields
        const populatedCount = countPopulatedFields(templateData);

        // Always switch to Advanced mode when loading a template
        if (forceAdvanced && currentMode !== 'advanced') {
          logAutoApply({
            ruleId: 'CM-AUTO-007',
            target: 'mode',
            before: currentMode,
            after: 'advanced',
            source: 'template_load',
            context: { templateId: template.id, templateName: template.template_name, populatedFieldCount: populatedCount }
          });
          forceAdvanced('template_load', template.template_name);
          toast.success(`Template loaded: ${populatedCount} field${populatedCount !== 1 ? 's' : ''}.`);
        } else {
          toast.success(`Template loaded: ${populatedCount} field${populatedCount !== 1 ? 's' : ''}.`);
        }

        // Determine which sections should be expanded and notify parent
        const sectionsToExpandList = getSectionsToExpand(templateData);
        logAutoApply({
          ruleId: 'CM-AUTO-008',
          target: 'accordion',
          before: [],
          after: sectionsToExpandList,
          source: 'template_load',
          context: { templateId: template.id, templateName: template.template_name, sections: sectionsToExpandList }
        });
        if (onExpandSections) onExpandSections(sectionsToExpandList);

        // Check if template has placeholders using the template data directly
        const placeholders = getFieldsWithPlaceholders(templateData);
        if (placeholders.length > 0) {
          setTimeout(() => {
            toast('⚠️ This template contains placeholder fields highlighted in orange. Replace them with your content before generating.', {
              duration: 6000,
              icon: '📝'
            });
          }, 500);
        }
      }
    } else {
      // If "Select a template" is chosen, clear the form
      if (onClearAll) onClearAll();
    }
  };

  return {
    fetchedTemplates,
    isLoadingTemplates,
    templateLoadError,
    templateSearchQuery,
    setTemplateSearchQuery,
    filteredAndGroupedTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    handleTemplateSelection
  };
}