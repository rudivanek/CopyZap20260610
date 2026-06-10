import React from 'react';
import HelpLayout from '../HelpLayout';

const QuickPromptWizard: React.FC = () => {
  return (
    <HelpLayout
      title="Quick Prompt Wizard"
      breadcrumbs={[{ label: 'Quick Prompt Wizard' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          The Quick Prompt Wizard is a guided workflow that helps you generate high-quality copy quickly by answering simple questions.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How It Works</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 ml-4">
            <li>Click the "Quick Wizard" button in Copy Maker</li>
            <li>Answer guided questions about your project</li>
            <li>The wizard fills in form fields automatically</li>
            <li>Review and adjust the generated configuration</li>
            <li>Click Generate to create your copy</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">When to Use It</h2>
          <p className="text-gray-700 dark:text-gray-300">
            The Quick Prompt Wizard is ideal for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Starting a new project from scratch</li>
            <li>When you're not sure which fields to fill in</li>
            <li>Quickly generating copy without technical knowledge</li>
            <li>Exploring what CopyZap can do</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tips</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <ul className="list-disc list-inside space-y-2 text-blue-900 dark:text-blue-100">
              <li>Be specific in your answers for better results</li>
              <li>You can always modify the wizard's suggestions</li>
              <li>Save successful configurations as templates</li>
              <li>The wizard learns from your preferences over time</li>
            </ul>
          </div>
        </section>
      </div>
    </HelpLayout>
  );
};

export default QuickPromptWizard;
