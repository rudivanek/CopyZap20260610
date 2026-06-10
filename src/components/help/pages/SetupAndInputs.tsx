import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';
import { Users, Mic, Database, Wand2, Globe, FileCode, FileText, Settings } from 'lucide-react';

const SetupAndInputs: React.FC = () => {
  return (
    <HelpLayout
      title="Setup & Inputs"
      breadcrumbs={[{ label: 'Setup & Inputs' }]}
    >
      {/* ─── SECTION: Project Setup ────────────────────────────────────── */}
      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">What's on This Page</p>
        <p className="text-gray-700 dark:text-gray-300">This page covers the three main setup areas: Project Setup (configuring your inputs), Brand Voice System (defining and applying brand identity), and Templates (saving and reusing configurations).</p>
      </div>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">Use this when:</p>
          <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Setting up your first project or customer</li>
            <li>Defining brand voice for consistency</li>
            <li>Saving configurations as reusable templates</li>
          </ul>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-400 mb-2">What you'll get:</p>
          <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Optimized input configurations for your projects</li>
            <li>Consistent brand voice system for your team</li>
            <li>Reusable templates to save setup time</li>
          </ul>
        </div>
      </div>

      <h2>Project Setup</h2>
      <p>Learn how to set up your copywriting projects effectively for the best results.</p>

      <h3>Essential Information</h3>
      <p>For best results, provide the following information:</p>
      <ul>
        <li><strong>Project Description:</strong> A brief overview of what you're creating</li>
        <li><strong>Product/Service Name:</strong> The name of what you're promoting</li>
        <li><strong>Target Audience:</strong> Who you're writing for</li>
        <li><strong>Key Message:</strong> The main point you want to communicate</li>
        <li><strong>Call to Action:</strong> What you want readers to do</li>
      </ul>

      <h3>Choosing Your Settings</h3>

      <div className="not-prose space-y-4 mb-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tone</h4>
          <p className="text-gray-700 dark:text-gray-300">Select the tone that matches your brand and audience (e.g., Professional, Casual, Persuasive).</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Word Count</h4>
          <p className="text-gray-700 dark:text-gray-300">Choose an appropriate length for your content type. Use "AI Decide" for automatic optimization.</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Language</h4>
          <p className="text-gray-700 dark:text-gray-300">Select the language for your output. CopyZap supports multiple languages.</p>
        </div>
      </div>

      <div className="not-prose bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800 mb-8">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">Best Practices</p>
        <ul className="list-disc ml-6 text-green-900 dark:text-green-100 space-y-1">
          <li>Start with the Quick Prompt Wizard if you're unsure</li>
          <li>Use clear, specific descriptions</li>
          <li>Provide context about your business and industry</li>
          <li>Include competitor information when relevant</li>
          <li>Save successful configurations as templates</li>
        </ul>
      </div>

      {/* ─── SECTION: Brand Voice System ───────────────────────────────── */}
      <hr className="my-8" />
      <h2>Brand Voice System</h2>

      <div className="not-prose bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-6 mb-6">
        <p className="text-gray-900 dark:text-white font-semibold mb-2">What is the Brand Voice System?</p>
        <p className="text-gray-700 dark:text-gray-300">
          The Brand Voice System allows you to <strong>define, store, and automatically apply a brand's unique writing style</strong> across all AI-generated content. It ensures consistency in tone, personality, vocabulary, sentence structure, punctuation rules, and call-to-action styles.
        </p>
      </div>

      <div className="not-prose space-y-4 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Why Use Brand Voices?</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            <strong>Problem</strong>: Maintaining consistent brand voice manually is time-consuming and error-prone. Different team members might interpret brand guidelines differently.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Solution</strong>: The Brand Voice System acts as a centralized, AI-enforceable brand style guide that automatically injects brand rules into every AI generation request.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Key Capabilities</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Manual entry of brand parameters</li>
              <li>AI generation from description</li>
              <li>AI analysis from pasted copy</li>
              <li>URL scanning to extract brand voice</li>
              <li>Pre-configured presets</li>
            </ul>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Granular Control</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Personality traits & tone style</li>
              <li>Preferred vocabulary & forbidden terms</li>
              <li>CTA style preferences</li>
              <li>Punctuation rules (Oxford comma, contractions)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="not-prose mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-blue-600 dark:text-blue-400" size={24} />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Step 1: Customer Management (Foundation)</h3>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4 mb-4">
          <p className="text-gray-900 dark:text-white font-semibold mb-1">Important</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Before creating brand voices, you must first create a <strong>Customer</strong>. Each brand voice is tied to a specific customer/client.
          </p>
        </div>

        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Creating a Customer</h4>
        <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
          <li>Navigate to <strong>Dashboard → Customers</strong></li>
          <li>Click <strong>"Add New Customer"</strong></li>
          <li>Enter customer name (required) and optional description</li>
          <li>Click <strong>"Save"</strong></li>
        </ol>
      </div>

      <div className="not-prose mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Mic className="text-blue-600 dark:text-blue-400" size={24} />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Step 2: Creating Brand Voices</h3>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Method 1: Manual Entry</h4>
            <ol className="list-decimal ml-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li>Go to <strong>Manage Customers → Select Customer → View Details</strong></li>
              <li>Click <strong>"Add Brand Voice"</strong> and switch to <strong>"Manual"</strong> tab</li>
              <li>Fill in personality traits, tone style, vocabulary preferences, forbidden terms, CTA style, and punctuation rules</li>
              <li>Click <strong>"Save Brand Voice"</strong></li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Wand2 size={18} /> Method 2: AI Generation from Description
            </h4>
            <ol className="list-decimal ml-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li>Click <strong>"Add Brand Voice"</strong>, stay on <strong>"AI Generate"</strong> tab</li>
              <li>Enter a Brand Voice Name and Brand Description (1-2 sentences)</li>
              <li>Click <strong>"Generate Brand Voice"</strong> — all fields populate automatically</li>
              <li>Review, edit if needed, then save</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText size={18} /> Method 3: Paste Copy (AI Analysis from Text)
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Paste any existing copy (website paragraphs, emails, social posts) and AI extracts tone, vocabulary, sentence rhythm, and CTA style automatically. Minimum 100 characters required.</p>
            <ol className="list-decimal ml-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li>Click <strong>"Add Brand Voice"</strong> → scroll to <strong>"Option 2: Paste Any Copy"</strong></li>
              <li>Paste your text and click <strong>"Analyze & Generate Brand Voice"</strong></li>
              <li>Review auto-populated fields and save</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Globe size={18} /> Method 4: URL Scanning (Website Analysis)
            </h4>
            <ol className="list-decimal ml-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li>Click <strong>"Add Brand Voice"</strong> → scroll to <strong>"Option 3: Scan Website"</strong></li>
              <li>Enter a website URL and click <strong>"Scan & Generate Brand Voice"</strong></li>
              <li>AI fetches and analyzes the homepage/about page content, then populates all fields</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Method 5: Using Presets</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Switch to the <strong>"Use Preset"</strong> tab and select from 6 pre-configured styles: Professional & Authoritative, Friendly & Conversational, Bold & Energetic, Minimalist & Clear, Creative & Playful, Persuasive & Urgent.</p>
          </div>
        </div>
      </div>

      <div className="not-prose mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-blue-600 dark:text-blue-400" size={24} />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Save Output as Brand Voice</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-3">After generating copy you love, click <strong>"Save as Brand Voice"</strong> in the output toolbar. The generated text is automatically analyzed by AI to extract tone, style, vocabulary, and personality traits — which are saved as a new brand voice linked to a customer.</p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Turns great generated copy into a persistent brand identity</li>
            <li>Saves time — no need to manually paste anything</li>
            <li>Customer selection is required before saving</li>
          </ul>
        </div>
      </div>

      <div className="not-prose mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="text-blue-600 dark:text-blue-400" size={24} />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Brand Voice Style Controls</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Optional but powerful settings that give you fine-grained control over sentence structure, formality, emotional tone, vocabulary complexity, and more.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Sentence & Structure</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li><strong>Sentence Length</strong>: short, medium, long, varied</li>
              <li><strong>Rhythm</strong>: staccato, smooth, energetic, calm</li>
              <li><strong>Content Structure</strong>: short paragraphs, bullets, questions</li>
            </ul>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Tone & Voice</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li><strong>Formality</strong>: 1-5 scale (casual to ultra formal)</li>
              <li><strong>Emotional Tone</strong>: warm, friendly, serious, etc.</li>
              <li><strong>Persona</strong>: mentor, friend, expert, storyteller, etc.</li>
            </ul>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Language & Style</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li><strong>Point of View</strong>: first, second, third person</li>
              <li><strong>Figurative Level</strong>: literal, balanced, metaphorical</li>
              <li><strong>Vocabulary</strong>: simple to highly intellectual</li>
            </ul>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Detail & Elements</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li><strong>Detail Depth</strong>: minimal, balanced, detailed</li>
              <li><strong>Allowed Elements</strong>: questions, bullets, analogies</li>
              <li><strong>Forbidden Elements</strong>: emojis, slang, ALL CAPS</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="not-prose mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileCode className="text-blue-600 dark:text-blue-400" size={24} />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Using Brand Voices in Copy Generation</h3>
        </div>
        <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Navigate to <strong>Copy Maker</strong></li>
          <li>Select a <strong>Customer</strong> from dropdown</li>
          <li>Brand Voice dropdown appears automatically — select your saved brand voice</li>
          <li>Fill in other fields and click <strong>Generate</strong></li>
        </ol>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Without Brand Voice</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">"Get Fresh Organic Food Delivered Fast. Tired of grocery shopping? We bring farm-fresh organic produce straight to your door! Order today and get 20% off!"</p>
              <p className="text-xs text-gray-500 mt-1">Generic, promotional, discount-focused</p>
            </div>
            <div className="border border-green-200 dark:border-green-700 rounded p-3 bg-green-50/50 dark:bg-green-900/10">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">With Brand Voice (Eco-Friendly)</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">"Nourish your family with the season's freshest organic harvest, delivered right to your doorstep. We partner with local farms to bring you sustainably grown fruits and vegetables."</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">Warm, sustainable, community-focused</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION: Templates & Reuse ───────────────────────────────── */}
      <hr className="my-8" />
      <h2>Templates &amp; Reuse</h2>
      <p>Save time by creating and reusing templates for your most common copywriting tasks.</p>

      <h3>What Are Templates?</h3>
      <p>Templates are saved configurations of form settings that can be quickly loaded and reused. They capture all your preferences including:</p>
      <ul>
        <li>Tone, language, and word count settings</li>
        <li>Selected optional features</li>
        <li>Brand voice and voice style preferences</li>
        <li>Output structure and format</li>
        <li>Special instructions and constraints</li>
      </ul>

      <h3>Creating Templates</h3>
      <ol>
        <li>Configure Copy Maker with your desired settings</li>
        <li>Click the <strong>"Save Template"</strong> button</li>
        <li>Give your template a descriptive name</li>
        <li>Add a description to remember what it's for</li>
        <li>Optionally make it public to share with other users</li>
      </ol>

      <h3>Loading Templates</h3>
      <ol>
        <li>Click <strong>"Load Template"</strong> in Copy Maker</li>
        <li>Browse your personal templates or public templates</li>
        <li>Select the template you want to use</li>
        <li>The form will populate with all saved settings</li>
        <li>Modify any fields as needed for your specific project</li>
      </ol>

      <h3>Template Types</h3>

      <div className="not-prose space-y-4 mb-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Personal Templates</h4>
          <p className="text-gray-700 dark:text-gray-300">Templates you create for your own use. Only visible to you.</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Public Templates</h4>
          <p className="text-gray-700 dark:text-gray-300">Templates shared by other users or provided by CopyZap. Great for discovering new approaches.</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quick Start Templates</h4>
          <p className="text-gray-700 dark:text-gray-300">Pre-configured templates for common use cases like blog posts, social media, emails, and ads.</p>
        </div>
      </div>

      <h3>Managing Templates</h3>
      <p>Access your template library from the Dashboard's Templates tab. From there you can:</p>
      <ul>
        <li>View all your saved templates</li>
        <li>Edit template names and descriptions</li>
        <li>Delete templates you no longer need</li>
        <li>Toggle templates between public and private</li>
        <li>See when templates were created and last used</li>
      </ul>

      <div className="not-prose bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800 mb-8">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">Best Practices</p>
        <ul className="list-disc ml-6 text-green-900 dark:text-green-100 space-y-1">
          <li>Use descriptive names that indicate the template's purpose</li>
          <li>Create separate templates for different content types</li>
          <li>Update templates when you find better configurations</li>
          <li>Share successful templates to help other users</li>
          <li>Save customer + brand voice combinations as templates for fast client work</li>
        </ul>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link to="/help/core-workflows" className="text-blue-600 dark:text-blue-400 hover:underline">Core Workflows</Link> — see how these inputs combine in real generation workflows</li>
        <li><Link to="/help/how-scoring-works" className="text-blue-600 dark:text-blue-400 hover:underline">Output, Scoring &amp; Comparison</Link> — understand what happens after you generate</li>
        <li><Link to="/help/voice-styles-and-blending" className="text-blue-600 dark:text-blue-400 hover:underline">Voice Styles &amp; Blending</Link> — apply persona-based transformations to output</li>
        <li><Link to="/help/workflow-builder" className="text-blue-600 dark:text-blue-400 hover:underline">Workflow Builder</Link> — automate multi-step processes</li>
      </ul>

      <hr className="my-8" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2026-04-17</p>
    </HelpLayout>
  );
};

export default SetupAndInputs;
