import React, { useState } from 'react';
import { X, Globe } from 'lucide-react';
import { Button } from './ui/button';

interface SeoGenerationOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: SeoGenerationOptions) => void;
  defaultValues?: Partial<SeoGenerationOptions>;
}

export interface SeoGenerationOptions {
  urlSlugsEnabled: boolean;
  numUrlSlugs: number;
  metaDescriptionsEnabled: boolean;
  numMetaDescriptions: number;
  h1VariantsEnabled: boolean;
  numH1Variants: number;
  h2HeadingsEnabled: boolean;
  numH2Headings: number;
  h3HeadingsEnabled: boolean;
  numH3Headings: number;
  ogTitlesEnabled: boolean;
  numOgTitles: number;
  ogDescriptionsEnabled: boolean;
  numOgDescriptions: number;
}

const SeoGenerationOptionsModal: React.FC<SeoGenerationOptionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultValues = {}
}) => {
  const [options, setOptions] = useState<SeoGenerationOptions>({
    urlSlugsEnabled: defaultValues.urlSlugsEnabled ?? true,
    numUrlSlugs: defaultValues.numUrlSlugs || 3,
    metaDescriptionsEnabled: defaultValues.metaDescriptionsEnabled ?? true,
    numMetaDescriptions: defaultValues.numMetaDescriptions || 3,
    h1VariantsEnabled: defaultValues.h1VariantsEnabled ?? true,
    numH1Variants: defaultValues.numH1Variants || 3,
    h2HeadingsEnabled: defaultValues.h2HeadingsEnabled ?? true,
    numH2Headings: defaultValues.numH2Headings || 3,
    h3HeadingsEnabled: defaultValues.h3HeadingsEnabled ?? true,
    numH3Headings: defaultValues.numH3Headings || 3,
    ogTitlesEnabled: defaultValues.ogTitlesEnabled ?? true,
    numOgTitles: defaultValues.numOgTitles || 3,
    ogDescriptionsEnabled: defaultValues.ogDescriptionsEnabled ?? true,
    numOgDescriptions: defaultValues.numOgDescriptions || 3,
  });

  if (!isOpen) return null;

  const handleChange = (field: keyof SeoGenerationOptions, value: number | boolean) => {
    if (typeof value === 'boolean') {
      setOptions(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setOptions(prev => ({
        ...prev,
        [field]: Math.max(1, Math.min(10, value))
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(options);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-lg w-full max-h-[85vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Globe size={24} className="text-primary-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              SEO Metadata Options
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Select which SEO elements to generate and how many variations of each:
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.urlSlugsEnabled}
                  onChange={(e) => handleChange('urlSlugsEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL Slugs
                </label>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={options.numUrlSlugs}
                onChange={(e) => handleChange('numUrlSlugs', parseInt(e.target.value) || 1)}
                disabled={!options.urlSlugsEnabled}
                className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.metaDescriptionsEnabled}
                  onChange={(e) => handleChange('metaDescriptionsEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta Descriptions
                </label>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={options.numMetaDescriptions}
                onChange={(e) => handleChange('numMetaDescriptions', parseInt(e.target.value) || 1)}
                disabled={!options.metaDescriptionsEnabled}
                className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.h1VariantsEnabled}
                  onChange={(e) => handleChange('h1VariantsEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  H1 Variants
                </label>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={options.numH1Variants}
                onChange={(e) => handleChange('numH1Variants', parseInt(e.target.value) || 1)}
                disabled={!options.h1VariantsEnabled}
                className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.h2HeadingsEnabled}
                  onChange={(e) => handleChange('h2HeadingsEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  H2 Headings
                </label>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={options.numH2Headings}
                onChange={(e) => handleChange('numH2Headings', parseInt(e.target.value) || 1)}
                disabled={!options.h2HeadingsEnabled}
                className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.h3HeadingsEnabled}
                  onChange={(e) => handleChange('h3HeadingsEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  H3 Headings
                </label>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={options.numH3Headings}
                onChange={(e) => handleChange('numH3Headings', parseInt(e.target.value) || 1)}
                disabled={!options.h3HeadingsEnabled}
                className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.ogTitlesEnabled}
                  onChange={(e) => handleChange('ogTitlesEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Open Graph Titles
                </label>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={options.numOgTitles}
                onChange={(e) => handleChange('numOgTitles', parseInt(e.target.value) || 1)}
                disabled={!options.ogTitlesEnabled}
                className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.ogDescriptionsEnabled}
                  onChange={(e) => handleChange('ogDescriptionsEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Open Graph Descriptions
                </label>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={options.numOgDescriptions}
                onChange={(e) => handleChange('numOgDescriptions', parseInt(e.target.value) || 1)}
                disabled={!options.ogDescriptionsEnabled}
                className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Globe size={16} className="mr-2" />
              Generate SEO Metadata
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeoGenerationOptionsModal;
