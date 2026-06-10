import React from 'react';
import HelpLayout from '../HelpLayout';
import { Link } from 'react-router-dom';

const Workflows: React.FC = () => {
  return (
    <HelpLayout
      title="Workflows & Examples"
      breadcrumbs={[{ label: 'Workflows & Examples' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Learn proven workflows for different content types and copywriting scenarios.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Quick Start Workflows</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">New Project from Scratch</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Click "Quick Wizard" for guided setup</li>
                <li>Answer questions about your project</li>
                <li>Review and adjust filled fields</li>
                <li>Generate initial copy</li>
                <li>Refine based on results</li>
                <li>Save as template for similar projects</li>
              </ol>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Improving Existing Copy</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Paste existing copy into Original Copy field</li>
                <li>Select "Improve Existing" mode</li>
                <li>Specify what to improve (clarity, engagement, etc.)</li>
                <li>Generate improved version</li>
                <li>Compare original vs improved side-by-side</li>
                <li>Use blend feature to combine best of both</li>
              </ol>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">A/B Testing Content</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Generate main copy with base settings</li>
                <li>Generate 2-3 alternatives with different approaches</li>
                <li>Apply different voice styles to each</li>
                <li>Score all versions</li>
                <li>Select top 2 for A/B testing</li>
                <li>Export both versions</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Industry-Specific Workflows</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/help/best-practices" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">E-commerce</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Product descriptions, category pages, promotional emails</p>
            </Link>

            <Link to="/help/best-practices" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">SaaS</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Landing pages, feature descriptions, onboarding emails</p>
            </Link>

            <Link to="/help/best-practices" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Content Marketing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Blog posts, whitepapers, social media content</p>
            </Link>

            <Link to="/help/best-practices" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Agency</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Multi-client management, brand voice templates</p>
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Learn More</h2>
          <p className="text-gray-700 dark:text-gray-300">
            For detailed step-by-step tutorials and real-world examples, check out:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li><Link to="/help/tutorials" className="text-primary-600 dark:text-primary-400 hover:underline">Quick Tutorials</Link></li>
            <li><Link to="/help/best-practices" className="text-primary-600 dark:text-primary-400 hover:underline">Best Practices</Link></li>
            <li><Link to="/help/core-workflows" className="text-primary-600 dark:text-primary-400 hover:underline">Core Workflows</Link></li>
          </ul>
        </section>
      </div>
    </HelpLayout>
  );
};

export default Workflows;
