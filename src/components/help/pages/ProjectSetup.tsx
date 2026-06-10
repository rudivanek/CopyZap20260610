import React from 'react';
import HelpLayout from '../HelpLayout';

const ProjectSetup: React.FC = () => {
  return (
    <HelpLayout
      title="Project Setup Guide"
      breadcrumbs={[{ label: 'Project Setup' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Learn how to set up your copywriting projects effectively for the best results.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Essential Information</h2>
          <p className="text-gray-700 dark:text-gray-300">
            For best results, provide the following information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li><strong>Project Description:</strong> A brief overview of what you're creating</li>
            <li><strong>Product/Service Name:</strong> The name of what you're promoting</li>
            <li><strong>Target Audience:</strong> Who you're writing for</li>
            <li><strong>Key Message:</strong> The main point you want to communicate</li>
            <li><strong>Call to Action:</strong> What you want readers to do</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Choosing Your Settings</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tone</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Select the tone that matches your brand and audience (e.g., Professional, Casual, Persuasive).
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Word Count</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Choose an appropriate length for your content type. Use "AI Decide" for automatic optimization.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Language</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Select the language for your output. CopyZap supports multiple languages.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Best Practices</h2>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <ul className="list-disc list-inside space-y-2 text-green-900 dark:text-green-100">
              <li>Start with the Quick Prompt Wizard if you're unsure</li>
              <li>Use clear, specific descriptions</li>
              <li>Provide context about your business and industry</li>
              <li>Include competitor information when relevant</li>
              <li>Save successful configurations as templates</li>
            </ul>
          </div>
        </section>
      </div>
    </HelpLayout>
  );
};

export default ProjectSetup;
