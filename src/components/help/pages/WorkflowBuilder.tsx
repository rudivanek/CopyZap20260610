import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';

const WorkflowBuilder: React.FC = () => {
  return (
    <HelpLayout
      title="Workflow Builder"
      breadcrumbs={[{ label: 'Workflow Builder' }]}
    >
      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Overview</p>
        <p className="text-gray-700 dark:text-gray-300">The Workflow Builder lets you automate multi-step copy generation processes. Define a sequence of actions (like generate → apply voice → create alternative) and execute them with a single click.</p>
      </div>

      <h2>What Is a Workflow?</h2>
      <p>A workflow is an automated sequence of copy transformation steps that execute automatically after your primary generation completes.</p>

      <p><strong>Example workflow:</strong></p>
      <ol>
        <li>Generate primary copy</li>
        <li>Create an alternative version (different angle)</li>
        <li>Apply brand voice to the original</li>
        <li>Apply "Humanize" voice style to the alternative</li>
        <li>Result: 4 outputs from 1 "Generate" click</li>
      </ol>

      <div className="not-prose bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 my-6">
        <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">Why Use Workflows?</p>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li><strong>Save time:</strong> Automate repetitive multi-step processes</li>
          <li><strong>Consistency:</strong> Ensure same steps execute every time</li>
          <li><strong>Client deliverables:</strong> Generate complete packages (original + alternatives + voice styles) in one click</li>
          <li><strong>Reusability:</strong> Create once, use on every project</li>
        </ul>
      </div>

      <h2>Where to Access the Workflow Builder</h2>
      <p>Navigate to the Workflow Builder:</p>
      <ol>
        <li>Click <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">Dashboard</Link> in the bottom navigation bar</li>
        <li>Switch to the <strong>Manage Workflows</strong> tab</li>
        <li>Click <strong>Create Workflow</strong> to open the Workflow Builder</li>
      </ol>

      <p>Alternative direct access:</p>
      <ul>
        <li>Navigate to <code>/manage-workflows</code> in your browser</li>
      </ul>

      <h2>Workflow Builder Interface</h2>

      <h3>Two-Panel Layout</h3>
      <p>The Workflow Builder has two main areas:</p>

      <div className="not-prose space-y-4 mb-6">
        <div className="border-l-4 border-blue-600 pl-4">
          <h4 className="text-lg font-bold mb-2">Left Panel: Action Library</h4>
          <p className="text-gray-700 dark:text-gray-300">Available action types you can add to your workflow:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 mt-2">
            <li><strong>Create Alternative Copy:</strong> Generate a new version with different angle</li>
            <li><strong>Apply Voice Style:</strong> Transform copy to match a specific voice (brand voice or persona)</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <h4 className="text-lg font-bold mb-2">Right Panel: Workflow Canvas</h4>
          <p className="text-gray-700 dark:text-gray-300">Your workflow steps in execution order. Drag actions from the library, reorder steps, and configure each action.</p>
        </div>
      </div>

      <h3>Workflow Metadata</h3>
      <p>At the top of the builder, configure:</p>
      <ul>
        <li><strong>Workflow Name:</strong> Descriptive name (e.g., "Standard Client Deliverable")</li>
        <li><strong>Description:</strong> Optional notes about purpose or use case</li>
        <li><strong>Customer:</strong> Associate with specific client (optional, for agency workflows)</li>
        <li><strong>Public:</strong> Make visible to other users (your choice—does not share edit access)</li>
      </ul>

      <h2>Available Workflow Actions</h2>

      <div className="not-prose space-y-6 mb-8">
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-5">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">1. Create Alternative Copy</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-3"><strong>Purpose:</strong> Generate a new version with different angle, phrasing, or approach.</p>

          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Configuration:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li><strong>Target:</strong> Which content to transform (Original, Alternative 1, Alternative 2, etc.)</li>
          </ul>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3"><strong>Use Case:</strong> Generate multiple versions for A/B testing or client selection.</p>
        </div>

        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-5">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">2. Apply Voice Style</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-3"><strong>Purpose:</strong> Transform copy to match a specific brand voice or famous persona.</p>

          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Configuration:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li><strong>Target:</strong> Which content to transform</li>
            <li><strong>Voice Style:</strong> Choose from:
              <ul className="list-circle ml-6 mt-1">
                <li>Humanize (make less AI-like)</li>
                <li>Brand voices you've created</li>
                <li>Famous personas: Alex Hormozi, Steve Jobs, Seth Godin, Gary Vaynerchuk, Donald Miller, Eugene Schwartz</li>
              </ul>
            </li>
          </ul>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3"><strong>Use Case:</strong> Generate copy in multiple brand voices or test different personas for audience fit.</p>
        </div>

      </div>

      <h2>How to Create a Workflow</h2>

      <div className="not-prose space-y-6 mb-8">
        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 1: Open Workflow Builder</h3>
          <p className="text-gray-700 dark:text-gray-300">Navigate to Dashboard → Manage Workflows → Create Workflow</p>
        </div>

        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 2: Name Your Workflow</h3>
          <p className="text-gray-700 dark:text-gray-300">Give it a descriptive name like "Blog Post Package" or "Client Launch Workflow"</p>
        </div>

        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 3: Add Actions from Library</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2">Drag actions from the left panel to the canvas, or click "Add" buttons:</p>
          <ol className="list-decimal ml-6 text-gray-700 dark:text-gray-300">
            <li>Click <strong>Create Alternative Copy</strong> → Added as Step 1</li>
            <li>Click <strong>Apply Voice Style</strong> → Added as Step 2</li>
            <li>Click <strong>Apply Voice Style</strong> again → Added as Step 3</li>
          </ol>
        </div>

        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 4: Configure Each Step</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2">Click each step to configure:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
            <li><strong>Step 1 (Alternative):</strong> Set Target = "Original"</li>
            <li><strong>Step 2 (Voice Style):</strong> Set Target = "Original", Voice = "Your Brand Voice"</li>
            <li><strong>Step 3 (Voice Style):</strong> Set Target = "Alternative 1", Voice = "Humanize"</li>
          </ul>
        </div>

        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 5: Reorder If Needed</h3>
          <p className="text-gray-700 dark:text-gray-300">Drag steps up or down to change execution order. Steps execute sequentially from top to bottom.</p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Step 6: Save Workflow</h3>
          <p className="text-gray-700 dark:text-gray-300">Click <strong>Save</strong>. Your workflow is now available in Copy Maker.</p>
        </div>
      </div>

      <h2>Using a Workflow in Copy Maker</h2>
      <ol>
        <li>Fill out Copy Maker form as usual</li>
        <li>Enable the <strong>"Use Workflow"</strong> toggle (in the Special Features or Optional Features section)</li>
        <li>Select your workflow from the dropdown</li>
        <li>Click <strong>Generate</strong></li>
        <li>Wait for primary generation + workflow steps to complete (30-60 seconds for 3-5 steps)</li>
        <li>All outputs appear in separate cards (Original + workflow-generated outputs)</li>
      </ol>

      <div className="not-prose bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-6">
        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Sequential Execution</p>
        <p className="text-gray-700 dark:text-gray-300">Workflow steps execute one at a time (not in parallel). A 5-step workflow may take 30-60 seconds total. Plan accordingly for time-sensitive projects.</p>
      </div>

      <h2>Editing and Managing Workflows</h2>

      <h3>Edit Existing Workflow</h3>
      <ol>
        <li>Navigate to Dashboard → Manage Workflows</li>
        <li>Find the workflow you want to edit</li>
        <li>Click <strong>Edit</strong></li>
        <li>Workflow Builder opens with existing configuration</li>
        <li>Make changes (add/remove/reorder steps)</li>
        <li>Click <strong>Save</strong></li>
      </ol>

      <h3>Duplicate Workflow</h3>
      <ol>
        <li>Find the workflow in Manage Workflows</li>
        <li>Click <strong>Duplicate</strong></li>
        <li>A copy is created with " (Copy)" suffix</li>
        <li>Edit the duplicate as needed</li>
      </ol>

      <p className="text-sm text-gray-600 dark:text-gray-400 my-4"><strong>Use Case:</strong> Create variations of workflows without modifying the original (e.g., "Client Deliverable - Standard" and "Client Deliverable - Premium").</p>

      <h3>Delete Workflow</h3>
      <ol>
        <li>Find the workflow in Manage Workflows</li>
        <li>Click <strong>Delete</strong></li>
        <li>Confirm deletion</li>
        <li>Workflow is permanently removed</li>
      </ol>

      <p className="text-sm text-gray-600 dark:text-gray-400 my-4"><strong>Warning:</strong> Deleted workflows cannot be recovered. Duplicate before deleting if you might need it later.</p>

      <h2>Common Workflow Examples</h2>

      <div className="not-prose space-y-6 mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">Example 1: Standard Deliverable Package</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Use Case:</strong> Agency providing 3 versions to client for selection</p>
          <ol className="list-decimal ml-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Generate primary copy (user action)</li>
            <li><strong>Workflow Step 1:</strong> Create Alternative Copy (target: Original)</li>
            <li><strong>Workflow Step 2:</strong> Create Alternative Copy (target: Alternative 1)</li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3"><strong>Result:</strong> 3 different versions in one generation</p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">Example 2: Brand Voice Consistency</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Use Case:</strong> Apply brand voice to every generation automatically</p>
          <ol className="list-decimal ml-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Generate primary copy (user action)</li>
            <li><strong>Workflow Step 1:</strong> Apply Voice Style (target: Original, voice: "Acme Corporate Voice")</li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3"><strong>Result:</strong> Original + brand-voiced version every time</p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">Example 3: Multi-Persona Testing</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Use Case:</strong> Test copy in different famous personas for audience fit</p>
          <ol className="list-decimal ml-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Generate primary copy (user action)</li>
            <li><strong>Workflow Step 1:</strong> Apply Voice Style (target: Original, voice: "Alex Hormozi")</li>
            <li><strong>Workflow Step 2:</strong> Apply Voice Style (target: Original, voice: "Seth Godin")</li>
            <li><strong>Workflow Step 3:</strong> Apply Voice Style (target: Original, voice: "Steve Jobs")</li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3"><strong>Result:</strong> Original + 3 persona versions for comparison</p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">Example 4: Alternative + Humanize</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Use Case:</strong> Generate alternative and make it sound less AI-like</p>
          <ol className="list-decimal ml-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Generate primary copy (user action)</li>
            <li><strong>Workflow Step 1:</strong> Create Alternative Copy (target: Original)</li>
            <li><strong>Workflow Step 2:</strong> Apply Voice Style (target: Alternative 1, voice: "Humanize")</li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3"><strong>Result:</strong> Original + Alternative + Humanized Alternative</p>
        </div>
      </div>

      <h2>How Workflows Affect Credits</h2>
      <p>Each workflow step is a separate AI operation and consumes credits:</p>

      <ul>
        <li><strong>Create Alternative Copy:</strong> ~40-250 credits per step (similar to manual alternative generation)</li>
        <li><strong>Apply Voice Style:</strong> ~30-200 credits per step (similar to manual voice style application)</li>
        <li><strong>Total workflow cost:</strong> Sum of all step costs</li>
      </ul>

      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-6">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Example Credit Calculation</p>
        <p className="text-gray-700 dark:text-gray-300 mb-3">5-step workflow:</p>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>Primary generation: 150 credits</li>
          <li>Step 1 (Alternative): 120 credits</li>
          <li>Step 2 (Voice Style): 80 credits</li>
          <li>Step 3 (Alternative): 110 credits</li>
          <li>Step 4 (Voice Style): 75 credits</li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 mt-3"><strong>Total:</strong> 535 credits (vs. 150 for generation without workflow)</p>
      </div>

      <p><strong>Optimization Tips:</strong></p>
      <ul>
        <li>Test workflows on single generations before using them routinely</li>
        <li>Remove unnecessary steps (every step adds cost)</li>
        <li>Use workflows only when you need all outputs (don't run 5-step workflow if you only use 1 output)</li>
        <li>Consider manual operations for one-off projects (workflows best for repetitive tasks)</li>
      </ul>

      <p>See <Link to="/help/credits-and-billing" className="text-blue-600 dark:text-blue-400 hover:underline">Credits & Billing</Link> for detailed credit cost information.</p>

      <h2>Troubleshooting</h2>

      <div className="not-prose space-y-4 mb-8">
        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Workflow step failed mid-execution</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>What happens:</strong> Steps before the failure complete successfully. Failed step and subsequent steps don't execute.</p>
            <p><strong>Fix:</strong> Review the error message. Common causes: insufficient credits, API timeout, or invalid configuration. Fix the issue and run workflow again.</p>
          </div>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Can't find "Use Workflow" toggle in Copy Maker</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>Location:</strong> The "Use Workflow" toggle is in the Special Features or Optional Features section of the Copy Maker form.</p>
            <p><strong>Fix:</strong> Scroll down in the form to find the Special Features section. If you have saved workflows, the toggle and dropdown will appear there.</p>
          </div>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Workflow takes too long (60+ seconds)</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>Expected:</strong> Workflows execute steps sequentially. 5-step workflow = 5 separate API calls = 30-60 seconds.</p>
            <p><strong>Optimization:</strong> Remove unnecessary steps or use manual operations for one-off projects. Workflows best for repetitive tasks where time savings accumulate.</p>
          </div>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Workflow generated outputs I don't need</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>Solution:</strong> Edit the workflow to remove unnecessary steps. Or create a lighter workflow for simpler projects.</p>
            <p>Remember: Every workflow step consumes credits. Only keep steps you'll actually use.</p>
          </div>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Can I run a workflow on existing output?</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>No:</strong> Workflows only execute during initial generation. You cannot apply a workflow to already-generated copy.</p>
            <p><strong>Workaround:</strong> Manually perform the steps (Generate Alternative, Apply Voice Style) using output card action buttons.</p>
          </div>
        </details>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link to="/help/core-workflows" className="text-blue-600 dark:text-blue-400 hover:underline">Core Workflows</Link> for foundational workflow patterns and real-world examples</li>
        <li><Link to="/help/setup-and-inputs" className="text-blue-600 dark:text-blue-400 hover:underline">Brand Voice System</Link> to create brand voices for workflow voice style steps</li>
        <li><Link to="/help/credits-and-billing" className="text-blue-600 dark:text-blue-400 hover:underline">Credits & Billing</Link> to understand workflow credit costs</li>
        <li><Link to="/help/dashboard-and-history" className="text-blue-600 dark:text-blue-400 hover:underline">Dashboard & History</Link> to manage workflows via Dashboard</li>
      </ul>

      <hr className="my-8" />

      <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2026-01-31</p>
    </HelpLayout>
  );
};

export default WorkflowBuilder;
