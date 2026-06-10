import React from 'react';
import HelpLayout from '../HelpLayout';

const RecommendedSettings: React.FC = () => {
  return (
    <HelpLayout
      title="Recommended Settings"
      breadcrumbs={[{ label: 'Recommended Settings' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Best practice settings for different types of content and use cases.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">General Recommendations</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Fill in the required fields plus target audience for most projects</li>
            <li>Use optional fields (Pain Points, Competitor URLs, etc.) when you need finer control</li>
            <li>Click Score on output cards to track quality improvements</li>
            <li>Save successful configurations as templates</li>
            <li>Use brand voices for consistent messaging</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Content Type Settings</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Blog Posts</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Word Count: 1500-2500 words</li>
                <li>Tone: Informative or Educational</li>
                <li>Enable SEO Metadata</li>
                <li>Generate Headlines (3-5 variations)</li>
                <li>Include section breakdown</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Social Media Posts</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Word Count: 50-150 words</li>
                <li>Tone: Casual or Engaging</li>
                <li>Generate multiple alternatives</li>
                <li>Apply voice styles for variety</li>
                <li>Focus on emotional connection</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Landing Pages</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Word Count: 300-800 words</li>
                <li>Tone: Persuasive</li>
                <li>Enable content scoring</li>
                <li>Generate headlines</li>
                <li>Include compelling CTA</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Email Marketing</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Word Count: 150-300 words</li>
                <li>Tone: Friendly or Professional</li>
                <li>Generate subject line variations</li>
                <li>Apply brand voice</li>
                <li>Clear call-to-action</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Remember</h3>
          <p className="text-blue-800 dark:text-blue-200">
            These are starting points. Adjust based on your specific audience, brand, and goals. Save your optimized configurations as templates for future use.
          </p>
        </div>
      </div>
    </HelpLayout>
  );
};

export default RecommendedSettings;
