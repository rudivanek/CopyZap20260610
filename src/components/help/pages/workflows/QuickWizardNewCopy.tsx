import React from 'react';
import HelpLayout from '../../HelpLayout';
import HelpPageTemplate from '../../HelpPageTemplate';

const QuickWizardNewCopy: React.FC = () => {
  return (
    <HelpLayout
      title="Quick Wizard: Create New Copy"
      breadcrumbs={[
        { label: 'Real-Case Workflows', path: '/help/real-case-workflows' },
        { label: 'Quick Wizard: Create New Copy' }
      ]}
    >
      <HelpPageTemplate
        tldr="Use the Quick Wizard to generate professional marketing copy in under 60 seconds with just 4-5 simple questions."
        whenToUse="Perfect for quick content needs, when starting fresh projects, or when you want guided assistance without manually filling every field."
        steps={[
          {
            title: 'Open Copy Maker and Start Wizard',
            content: (
              <p>
                Navigate to the Copy Maker page and click the "Quick Setup Wizard" button at the top.
                The wizard opens in a modal with step indicators.
              </p>
            )
          },
          {
            title: 'Step 1: Business & Audience',
            content: (
              <div>
                <p className="mb-2">Answer questions about:</p>
                <ul className="list-disc ml-6">
                  <li>What your business does</li>
                  <li>Who your target audience is</li>
                  <li>What problem you're solving</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Example: "Eco-friendly water bottles for health-conscious millennials who want to reduce plastic waste"
                </p>
              </div>
            )
          },
          {
            title: 'Step 2: Tone & Style',
            content: (
              <p>
                Select your desired tone (Professional, Casual, Enthusiastic, etc.) and writing style.
                You can choose multiple tones if needed.
              </p>
            )
          },
          {
            title: 'Step 3: Content Goals',
            content: (
              <p>
                Specify what you want to achieve: Educate, Persuade, Inform, or Entertain.
                Set your target word count (recommended: 150-300 for quick copy).
              </p>
            )
          },
          {
            title: 'Step 4: Optional Enhancements',
            content: (
              <p>
                Choose quick-add features like "Generate Headlines" or "Add Content Scoring".
                These are optional but recommended for better results.
              </p>
            )
          },
          {
            title: 'Review and Generate',
            content: (
              <p>
                The wizard populates your Copy Maker fields. Review the auto-filled content,
                make any quick adjustments, then click Generate.
              </p>
            )
          },
          {
            title: 'Review Output',
            content: (
              <p>
                Your copy appears as expandable cards. Review the main copy, headlines (if enabled),
                and scores. Copy to clipboard or download in your preferred format.
              </p>
            )
          }
        ]}
        example={
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-3">Complete Example: Product Launch Email</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Wizard Inputs:</p>
                  <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300">
                    <li>Business: SaaS project management tool for remote teams</li>
                    <li>Audience: Team leaders at companies with 10-50 employees</li>
                    <li>Tone: Professional yet friendly</li>
                    <li>Goal: Announce new features and drive trial signups</li>
                    <li>Word Count: 200 words</li>
                    <li>Features: Headlines + Scoring enabled</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Time to complete: 45 seconds</p>
                  <p className="text-gray-600 dark:text-gray-400">Result: Professional email copy with 5 headline variations and quality score of 87/100</p>
                </div>
              </div>
            </div>
          </div>
        }
        commonMistakes={[
          'Rushing through wizard steps without reading the questions carefully',
          'Providing vague audience descriptions like "everyone" instead of specific demographics',
          'Skipping the optional enhancements which significantly improve output quality',
          'Not reviewing the populated fields before generating - the wizard is a starting point'
        ]}
        proTips={[
          'Use the wizard 2-3 times to learn which fields matter most for your content type',
          'After wizard completion, you can still edit any field before generating',
          'Save the wizard result as a template if you will create similar content regularly',
          'Enable "Generate Headlines" in the wizard - it is a huge time saver',
          'The wizard learns from your answers - more specific input = better output'
        ]}
        relatedLinks={[
          { title: 'Getting Started', path: '/help/getting-started' },
          { title: 'Copy Maker Overview', path: '/help/copy-maker' },
          { title: 'Workflow: Wizard Improve Existing', path: '/help/real-case-workflows/wizard-improve-existing' }
        ]}
      />
    </HelpLayout>
  );
};

export default QuickWizardNewCopy;
