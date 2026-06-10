import React from 'react';
import HelpLayout from '../HelpLayout';

const OptionalFeatures: React.FC = () => {
  return (
    <HelpLayout
      title="Optional Features"
      breadcrumbs={[{ label: 'Optional Features' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Enhance your copy generation with these powerful optional features.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Content Enhancement</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Content Scoring</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Get AI-powered quality scores with detailed feedback on your generated copy. Scores evaluate clarity, persuasiveness, and engagement.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Headline Generation</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Automatically generate multiple headline variations to find the most compelling option. Specify how many headlines you need.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Alternative Copy</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Generate multiple versions of your copy with different approaches. Compare and choose the best one or blend elements from multiple versions.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">SEO Features</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">SEO Metadata</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Generate optimized meta titles, descriptions, and other SEO elements. Includes URL slugs and heading variations.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">GEO Scoring</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Evaluate content for Generative Engine Optimization (GEO) - how well it performs with AI search engines and LLMs.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Customization Options</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Brand Voice</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Apply custom brand voices to ensure consistency across all your content. Extract voices from existing content or create them manually.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Voice Styles</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Apply pre-defined communication styles modeled after well-known personalities or writing approaches.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Output Structure</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Control how your content is formatted - paragraphs, bullet points, sections, or custom structures.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-3">Tip</h3>
          <p className="text-yellow-800 dark:text-yellow-200">
            Start with a few optional features and gradually add more as you become familiar with them. Not every feature is needed for every project.
          </p>
        </div>
      </div>
    </HelpLayout>
  );
};

export default OptionalFeatures;
