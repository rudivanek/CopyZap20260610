import React from 'react';
import HelpLayout from '../HelpLayout';

const CompareBlend: React.FC = () => {
  return (
    <HelpLayout
      title="Evaluation Tools"
      breadcrumbs={[{ label: 'Evaluation Tools' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Compare different copy versions and blend the best elements into one optimized result.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Compare Feature</h2>
          <p className="text-gray-700 dark:text-gray-300">
            The Compare feature lets you view multiple copy versions side-by-side to identify the strongest elements.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">How to Use Compare</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Generate multiple copy versions (main + alternatives)</li>
              <li>Click the "Compare" button in the output section</li>
              <li>Select which versions to compare</li>
              <li>View them side-by-side with synchronized scrolling</li>
              <li>Identify differences and strengths</li>
            </ol>
          </div>

          <p className="text-gray-700 dark:text-gray-300">
            <strong>What to Look For:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Which version has the strongest opening?</li>
            <li>Which call-to-action is most compelling?</li>
            <li>Which version better addresses pain points?</li>
            <li>Which has better flow and readability?</li>
            <li>Which version aligns best with your brand voice?</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Blend Feature</h2>
          <p className="text-gray-700 dark:text-gray-300">
            The Blend feature combines the best elements from multiple copy versions into one optimized result.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">How Blending Works</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Select 2-3 copy versions to blend</li>
              <li>The AI analyzes strengths of each version</li>
              <li>Elements are intelligently combined</li>
              <li>A new blended version is generated</li>
              <li>The blend maintains coherent flow and voice</li>
            </ol>
          </div>

          <p className="text-gray-700 dark:text-gray-300">
            <strong>Blending Strategy:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Combines the strongest opening from one version</li>
            <li>Integrates the clearest value propositions</li>
            <li>Selects the most compelling call-to-action</li>
            <li>Maintains consistent tone throughout</li>
            <li>Ensures logical flow and transitions</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Content Scoring</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Get AI-powered quality scores for your content:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Clarity Score</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">How easy your content is to understand</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Persuasiveness</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">How effectively it motivates action</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Engagement</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">How well it captures and maintains attention</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Overall Quality</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive evaluation of all factors</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Comparison Persistence</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">How Comparison Updates Work</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <strong>Important:</strong> Comparison results are static snapshots that persist exactly as generated.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Once created, a comparison card remains unchanged even if you add new output cards</li>
              <li>Adding alternatives, applying voice styles, or creating new variations does NOT automatically update existing comparisons</li>
              <li>To include new outputs in a comparison, you must manually click "Compare All Outputs" again</li>
              <li>This creates a new comparison card while preserving the original comparison for reference</li>
            </ul>
            <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded border border-blue-300 dark:border-blue-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Example Workflow:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                <li>Generate 3 alternatives → Click "Compare All Outputs" → Get Comparison Card A (analyzes 3 outputs)</li>
                <li>Apply voice style to best alternative → Comparison Card A remains unchanged</li>
                <li>Create another alternative → Comparison Card A still shows original 3 outputs</li>
                <li>Click "Compare All Outputs" again → Get Comparison Card B (analyzes all 5 current outputs)</li>
                <li>Now you have both comparisons saved for reference</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Best Practices</h2>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <ul className="list-disc list-inside space-y-2 text-green-900 dark:text-green-100">
              <li>Generate at least 2-3 versions before comparing</li>
              <li>Use different voice styles for more variety</li>
              <li>Compare scores as well as content</li>
              <li>Blend versions with complementary strengths</li>
              <li>Always review blended content for coherence</li>
              <li>Test different blends if the first isn't perfect</li>
              <li>Click "Compare All Outputs" again after creating new variations to include them in analysis</li>
              <li>Keep multiple comparison cards to track different analysis perspectives</li>
            </ul>
          </div>
        </section>
      </div>
    </HelpLayout>
  );
};

export default CompareBlend;
