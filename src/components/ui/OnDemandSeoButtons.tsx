import React from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { SeoGenerationOptions } from '../SeoGenerationOptionsModal';
import { SeoMetadata } from '../../types';

interface OnDemandSeoButtonsProps {
  seoOptions?: SeoGenerationOptions;
  currentSeoMetadata?: SeoMetadata;
  onGenerateSeoElement: (elementType: SeoElementType, count: number) => Promise<void>;
  isGenerating?: boolean;
  generatingElementType?: SeoElementType;
}

export type SeoElementType =
  | 'urlSlugs'
  | 'metaDescriptions'
  | 'h1Variants'
  | 'h2Headings'
  | 'h3Headings'
  | 'ogTitles'
  | 'ogDescriptions';

const OnDemandSeoButtons: React.FC<OnDemandSeoButtonsProps> = ({
  seoOptions,
  currentSeoMetadata,
  onGenerateSeoElement,
  isGenerating = false,
  generatingElementType
}) => {
  if (!seoOptions) {
    return null;
  }

  const buttonConfig: Array<{
    type: SeoElementType;
    label: string;
    enabled: boolean;
    count: number;
    hasData: boolean;
  }> = [
    {
      type: 'urlSlugs',
      label: 'URL Slugs',
      enabled: seoOptions.urlSlugsEnabled,
      count: seoOptions.numUrlSlugs,
      hasData: !!(currentSeoMetadata?.urlSlugs && currentSeoMetadata.urlSlugs.length > 0)
    },
    {
      type: 'metaDescriptions',
      label: 'Meta Descriptions',
      enabled: seoOptions.metaDescriptionsEnabled,
      count: seoOptions.numMetaDescriptions,
      hasData: !!(currentSeoMetadata?.metaDescriptions && currentSeoMetadata.metaDescriptions.length > 0)
    },
    {
      type: 'h1Variants',
      label: 'H1 Variants',
      enabled: seoOptions.h1VariantsEnabled,
      count: seoOptions.numH1Variants,
      hasData: !!(currentSeoMetadata?.h1Variants && currentSeoMetadata.h1Variants.length > 0)
    },
    {
      type: 'h2Headings',
      label: 'H2 Headings',
      enabled: seoOptions.h2HeadingsEnabled,
      count: seoOptions.numH2Headings,
      hasData: !!(currentSeoMetadata?.h2Headings && currentSeoMetadata.h2Headings.length > 0)
    },
    {
      type: 'h3Headings',
      label: 'H3 Headings',
      enabled: seoOptions.h3HeadingsEnabled,
      count: seoOptions.numH3Headings,
      hasData: !!(currentSeoMetadata?.h3Headings && currentSeoMetadata.h3Headings.length > 0)
    },
    {
      type: 'ogTitles',
      label: 'OG Titles',
      enabled: seoOptions.ogTitlesEnabled,
      count: seoOptions.numOgTitles,
      hasData: !!(currentSeoMetadata?.ogTitles && currentSeoMetadata.ogTitles.length > 0)
    },
    {
      type: 'ogDescriptions',
      label: 'OG Descriptions',
      enabled: seoOptions.ogDescriptionsEnabled,
      count: seoOptions.numOgDescriptions,
      hasData: !!(currentSeoMetadata?.ogDescriptions && currentSeoMetadata.ogDescriptions.length > 0)
    }
  ];

  const buttonsToShow = buttonConfig.filter(btn => !btn.enabled && !btn.hasData);

  if (buttonsToShow.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {buttonsToShow.map((btn) => {
        const isGeneratingThis = isGenerating && generatingElementType === btn.type;

        return (
          <button
            key={btn.type}
            onClick={() => onGenerateSeoElement(btn.type, btn.count)}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={`Generate ${btn.count} ${btn.label}`}
          >
            {isGeneratingThis ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Globe size={12} />
                <span>Generate {btn.label}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default OnDemandSeoButtons;
