import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';

const VoiceStylesAndBlending: React.FC = () => {
  return (
    <HelpLayout
      title="Voice Styles & Blending"
      breadcrumbs={[{ label: 'Voice Styles & Blending' }]}
    >
      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Overview</p>
        <p className="text-gray-700 dark:text-gray-300">Voice styles transform an existing output into a specific writing style — from legendary copywriters like David Ogilvy and Gary Halbert to modern voices like Alex Hormozi, or practical transformations like Humanize. You apply them after generation, directly on any output card.</p>
      </div>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-700 dark:text-green-400 mb-2">Use this when:</p>
          <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Your copy is correct but feels flat or generic</li>
            <li>You want a distinctive, recognizable voice</li>
            <li>You need copy to sound more human and natural</li>
          </ul>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-400 mb-2">What you'll get:</p>
          <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>A new version of your copy in the chosen style</li>
            <li>The original stays untouched for comparison</li>
            <li>Multiple styled versions you can score against each other</li>
          </ul>
        </div>
      </div>

      <h2>How to Apply a Voice Style</h2>
      <ol>
        <li>Generate your copy in Copy Maker</li>
        <li>On the output card, open the <strong>Change Voice</strong> action</li>
        <li>Select a voice style from the list</li>
        <li>A new output card appears with the transformed copy — your original is preserved</li>
      </ol>

      <h2>Available Style Categories</h2>

      <div className="not-prose space-y-4 mb-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Humanization</h3>
          <p className="text-gray-700 dark:text-gray-300">Humanize and Humanize (No AI Detection) rewrite content into warm, natural, human-sounding text — ideal when copy feels robotic or overly polished.</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Iconic Voices</h3>
          <p className="text-gray-700 dark:text-gray-300">Styles modeled after well-known communicators and copywriters: Alex Hormozi, David Ogilvy, Gary Halbert, Seth Godin, Steve Jobs, Simon Sinek, Donald Miller, Don Draper, Tony Robbins, Marie Forleo, Brené Brown, Richard Branson, Elon Musk, Maider Tomasena, and more.</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Generic Tones</h3>
          <p className="text-gray-700 dark:text-gray-300">Practical style presets like Luxury Brand, Tech Startup, Professional Formal, Friendly Conversational, Bold Direct, Minimalist, Storytelling, Educational, and Playful.</p>
        </div>
      </div>

      <h2>Voice Styles vs. Brand Voice</h2>
      <p>These are two different systems that work together:</p>
      <ul>
        <li><strong>Brand Voice</strong> is <em>your</em> voice — created from your content or written manually, applied during generation as the baseline style</li>
        <li><strong>Voice Styles</strong> are pre-defined transformations applied <em>after</em> generation to an existing output</li>
      </ul>
      <p>A common workflow: generate with your Brand Voice, then apply a voice style like Humanize to the winner for a final polish.</p>

      <h2>Blending with Special Instructions</h2>
      <p>When blending multiple versions, you can add optional special instructions (e.g., "Make it shorter and punchier", "Focus on benefits for enterprise customers", "Add humor") to steer how the blend combines the source versions.</p>

      <div className="not-prose bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">Pro Tips</p>
        <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300 space-y-1">
          <li>Apply one style at a time and compare against the original using scoring</li>
          <li>Strong personas (Hormozi, Halbert) transform copy aggressively — best for ads and sales pages, not corporate pages</li>
          <li>Humanize is the safest all-purpose finishing step</li>
          <li>Each style application consumes credits — apply styles to your best version, not every version</li>
        </ul>
      </div>

      <h2>Related Topics</h2>
      <ul>
        <li><Link to="/help/optional-features" className="text-blue-600 dark:text-blue-400 hover:underline">Optional Features</Link></li>
        <li><Link to="/help/how-scoring-works" className="text-blue-600 dark:text-blue-400 hover:underline">Output, Scoring &amp; Comparison</Link></li>
        <li><Link to="/help/setup-and-inputs" className="text-blue-600 dark:text-blue-400 hover:underline">Setup &amp; Inputs (Brand Voice)</Link></li>
      </ul>

      <hr className="my-8" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2026-07-11</p>
    </HelpLayout>
  );
};

export default VoiceStylesAndBlending;
