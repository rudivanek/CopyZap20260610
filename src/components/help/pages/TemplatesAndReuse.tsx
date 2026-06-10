import React from 'react';
import HelpLayout from '../HelpLayout';

const TemplatesAndReuse: React.FC = () => {
  return (
    <HelpLayout
      title="Templates & Reuse"
      breadcrumbs={[{ label: 'Templates & Reuse' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Save time by creating and reusing templates for your most common copywriting tasks.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Are Templates?</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Templates are saved configurations of form settings that can be quickly loaded and reused. They capture all your preferences including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Tone, language, and word count settings</li>
            <li>Selected optional features</li>
            <li>Brand voice and voice style preferences</li>
            <li>Output structure and format</li>
            <li>Special instructions and constraints</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Creating Templates</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 ml-4">
            <li>Configure Copy Maker with your desired settings</li>
            <li>Click the "Save Template" button</li>
            <li>Give your template a descriptive name</li>
            <li>Add a description to remember what it's for</li>
            <li>Optionally make it public to share with other users</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Loading Templates</h2>
          <p className="text-gray-700 dark:text-gray-300">
            To load a saved template:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Click "Load Template" in Copy Maker</li>
            <li>Browse your personal templates or public templates</li>
            <li>Select the template you want to use</li>
            <li>The form will populate with all saved settings</li>
            <li>Modify any fields as needed for your specific project</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Template Types</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Personal Templates</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Templates you create for your own use. Only visible to you.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Public Templates</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Templates shared by other users or provided by CopyZap. Great for discovering new approaches.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quick Start Templates</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Pre-configured templates for common use cases like blog posts, social media, emails, and ads.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Best Practices</h2>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <ul className="list-disc list-inside space-y-2 text-green-900 dark:text-green-100">
              <li>Use descriptive names that indicate the template's purpose</li>
              <li>Create separate templates for different content types</li>
              <li>Update templates when you find better configurations</li>
              <li>Share successful templates to help other users</li>
              <li>Organize templates by category or project type</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Managing Templates</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Access your template library from the Dashboard's Templates tab. From there you can:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>View all your saved templates</li>
            <li>Edit template names and descriptions</li>
            <li>Delete templates you no longer need</li>
            <li>Toggle templates between public and private</li>
            <li>See when templates were created and last used</li>
          </ul>
        </section>
      </div>
    </HelpLayout>
  );
};

export default TemplatesAndReuse;
