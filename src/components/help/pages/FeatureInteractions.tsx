import React from 'react';
import HelpLayout from '../HelpLayout';

const FeatureInteractions: React.FC = () => {
  return (
    <HelpLayout
      title="Feature Interactions"
      breadcrumbs={[{ label: 'Feature Interactions' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Understand how CopyZap's features work together to create powerful copywriting workflows.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Voice Systems Integration</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Brand Voice and Voice Styles work together to shape your content.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Templates + Brand Voice</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Templates can include brand voice associations for consistent content.
          </p>
        </section>
      </div>
    </HelpLayout>
  );
};

export default FeatureInteractions;
