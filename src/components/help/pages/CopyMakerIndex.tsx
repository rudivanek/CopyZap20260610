import React from 'react';
import HelpLayout from '../HelpLayout';
import { Link } from 'react-router-dom';

const CopyMakerIndex: React.FC = () => {
  return (
    <HelpLayout
      title="Copy Maker Overview"
      breadcrumbs={[{ label: 'Copy Maker Overview' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Copy Maker is CopyZap's powerful AI copywriting tool that helps you create, improve, and optimize marketing content.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Key Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Generate fresh marketing copy from scratch</li>
            <li>Improve and refine existing content</li>
            <li>Apply brand voices and voice styles</li>
            <li>Score content quality with AI-powered analysis</li>
            <li>Create multiple variations and alternatives</li>
            <li>Generate SEO metadata and optimized elements</li>
            <li>Save templates for reusable workflows</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Getting Started</h2>
          <p className="text-gray-700 dark:text-gray-300">
            To start using Copy Maker:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>Navigate to the Copy Maker tab from the main menu</li>
            <li>Fill in your project details and requirements</li>
            <li>Configure optional features as needed</li>
            <li>Click Generate to create your copy</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Learn More</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/help/getting-started" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Getting Started</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">First steps and quick setup wizard walkthrough</p>
            </Link>
            <Link to="/help/core-workflows" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Core Workflows</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create, improve, compare, and apply brand voice</p>
            </Link>
            <Link to="/help/optional-features" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Optional Features</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Explore advanced copywriting tools</p>
            </Link>
            <Link to="/help/setup-and-inputs" className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Setup & Inputs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Brand voice, templates, and project configuration</p>
            </Link>
          </div>
        </section>
      </div>
    </HelpLayout>
  );
};

export default CopyMakerIndex;
