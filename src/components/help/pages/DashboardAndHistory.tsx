import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';

const DashboardAndHistory: React.FC = () => {
  return (
    <HelpLayout
      title="Dashboard & History"
      breadcrumbs={[{ label: 'Dashboard & History' }]}
    >
      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Overview</p>
        <p className="text-gray-700 dark:text-gray-300">The Dashboard is your command center for managing saved outputs, viewing usage history, and organizing past work. Access it anytime from the bottom navigation bar.</p>
      </div>

      <h2>Where to Find the Dashboard</h2>
      <p>The Dashboard is accessible from the <strong>bottom navigation bar</strong> when you're logged in:</p>
      <ol>
        <li>Look for the navigation bar at the bottom of the screen</li>
        <li>Click the <strong>Dashboard</strong> link (icon: folder or chart)</li>
        <li>The Dashboard opens with three main tabs: <strong>Usage History</strong>, <strong>Saved Outputs</strong>, and <strong>Manage Workflows</strong></li>
      </ol>

      <h2>Dashboard Tabs Overview</h2>

      <div className="not-prose space-y-6 mb-8">
        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Tab 1: Usage History</h3>
          <p className="text-gray-700 dark:text-gray-300">View your credit consumption history, grouped by generation. See credits used, API calls, and models used.</p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Tab 2: Saved Outputs</h3>
          <p className="text-gray-700 dark:text-gray-300">Access all outputs you've explicitly saved from Copy Maker. Search, filter, and load past work back into the form.</p>
        </div>

        <div className="border-l-4 border-purple-600 pl-4">
          <h3 className="text-xl font-bold mb-2">Tab 3: Manage Workflows</h3>
          <p className="text-gray-700 dark:text-gray-300">View, edit, duplicate, and delete your saved workflows. (See <Link to="/help/workflow-builder" className="text-blue-600 dark:text-blue-400 hover:underline">Workflow Builder</Link> for details)</p>
        </div>
      </div>

      <h2>Usage History Tab: Understanding Your History</h2>

      <h3>What You'll See</h3>
      <p>The Usage History tab displays your generation history grouped by generation event. Each entry represents one generation and all related operations (alternatives, voice styles, scoring, etc.).</p>

      <div className="not-prose bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">What Each Entry Includes</p>
        <p className="text-gray-700 dark:text-gray-300">Each generation entry includes:</p>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 mt-2">
          <li>Primary copy generation</li>
          <li>All optional features (SEO, scoring, GEO, etc.)</li>
          <li>Alternatives generated from that output</li>
          <li>Voice styles applied</li>
          <li>Comparison analyses</li>
        </ul>
      </div>

      <h3>Information Displayed</h3>
      <p>Each row shows:</p>
      <ul>
        <li><strong>Name:</strong> Auto-generated from your project description (e.g., "Homepage Hero - 2026-01-31")</li>
        <li><strong>Date & Time:</strong> When the generation was created</li>
        <li><strong>Credits Used:</strong> Total credits consumed for this generation and all related operations</li>
        <li><strong>API Calls:</strong> Number of separate AI operations</li>
        <li><strong>Models Used:</strong> Which AI models were used (e.g., Claude Sonnet 4.5, GPT-4o)</li>
        <li><strong>Operations:</strong> Types of operations performed (generate_copy, seo_metadata, voice_style_analysis, etc.)</li>
      </ul>

      <h3>Filtering and Searching</h3>
      <p>Use the filters at the top of the Usage History tab:</p>
      <ul>
        <li><strong>Date Range:</strong> Default is last 30 days; customize to view specific periods</li>
        <li><strong>Customer Filter:</strong> View usage for specific clients (agency use case)</li>
        <li><strong>Export to CSV:</strong> Download detailed usage report for accounting or analysis</li>
      </ul>

      <h3>Expanding Entry Details</h3>
      <p>Click any row to expand and see:</p>
      <ul>
        <li>Individual API calls within that entry</li>
        <li>Credits consumed per operation</li>
        <li>Model used for each operation</li>
        <li>Timestamp of each operation</li>
      </ul>

      <h2>Saved Outputs Tab: Your Content Library</h2>

      <h3>What Gets Saved Here</h3>
      <p>Only outputs you <strong>explicitly save</strong> appear in the Saved Outputs tab. Automatic saves do NOT happen—you must click the "Save" button on an output card in Copy Maker.</p>

      <div className="not-prose bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-6">
        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Important</p>
        <p className="text-gray-700 dark:text-gray-300">If you generate copy but don't click "Save," it will NOT appear in Saved Outputs. Always save important outputs before closing Copy Maker.</p>
      </div>

      <h3>How to Save an Output</h3>
      <ol>
        <li>After generating copy in Copy Maker, locate the output card</li>
        <li>Click the <strong>Save</strong> button (disk/floppy icon or "Save" text)</li>
        <li>A modal appears asking for:
          <ul>
            <li><strong>Title:</strong> Name your saved output (e.g., "Homepage Hero - Final Version")</li>
            <li><strong>Description:</strong> Optional notes about this output</li>
            <li><strong>Tags:</strong> Add keywords for easier searching later</li>
          </ul>
        </li>
        <li>Click <strong>Save to Dashboard</strong></li>
        <li>Output is now accessible from Dashboard → Saved Outputs tab</li>
      </ol>

      <h3>Finding Saved Outputs</h3>
      <p>The Saved Outputs tab provides multiple ways to find past work:</p>
      <ul>
        <li><strong>Search bar:</strong> Search by title, description, or tags</li>
        <li><strong>Customer filter:</strong> Filter by client/customer</li>
        <li><strong>Date filter:</strong> View outputs from specific date ranges</li>
        <li><strong>Tag filter:</strong> Click tags to filter by keyword</li>
        <li><strong>Favorites:</strong> Star important outputs and filter to show only favorites</li>
      </ul>

      <h3>Saved Output Card Actions</h3>
      <p>Each saved output card shows:</p>
      <ul>
        <li><strong>Title & Description:</strong> What you named it when saving</li>
        <li><strong>Date saved:</strong> When you saved this output</li>
        <li><strong>Customer:</strong> Which client/customer it's associated with (if any)</li>
        <li><strong>Tags:</strong> Keywords you assigned</li>
        <li><strong>Favorite star:</strong> Click to mark as favorite</li>
      </ul>

      <p>Click a saved output card to:</p>
      <ul>
        <li><strong>View:</strong> Opens a modal showing all input fields and generated output</li>
        <li><strong>Load:</strong> Restores the complete form state and output to Copy Maker (lets you edit and regenerate)</li>
        <li><strong>Delete:</strong> Permanently removes the saved output (confirmation required)</li>
      </ul>

      <h2>How Usage History Relates to Saved Outputs</h2>
      <p>This is a common point of confusion—here's the relationship:</p>

      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-6">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Usage History vs Saved Outputs</p>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <div>
            <strong className="text-gray-900 dark:text-gray-100">Usage History (automatic):</strong>
            <ul className="list-disc ml-6 mt-1">
              <li>Created automatically every time you generate copy</li>
              <li>Used for credit tracking and consumption history</li>
              <li>Visible in Usage History tab</li>
              <li>Cannot be deleted by users (permanent record for billing)</li>
            </ul>
          </div>

          <div>
            <strong className="text-gray-900 dark:text-gray-100">Saved Outputs (manual):</strong>
            <ul className="list-disc ml-6 mt-1">
              <li>Created only when you click "Save" on an output card</li>
              <li>Used for accessing past work and loading into Copy Maker</li>
              <li>Visible in Saved Outputs tab</li>
              <li>Can be deleted anytime (does not affect usage history)</li>
            </ul>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4"><strong>Key Point:</strong> Every generation is tracked automatically in Usage History. But only outputs you manually save appear in Saved Outputs (for your reference library).</p>
      </div>

      <h2>Deleting Outputs</h2>

      <h3>Delete Individual Saved Output</h3>
      <ol>
        <li>Navigate to Dashboard → Saved Outputs tab</li>
        <li>Find the output you want to delete</li>
        <li>Click the <strong>Delete</strong> button (trash icon)</li>
        <li>Confirm deletion in the modal</li>
        <li>Output is permanently removed from Saved Outputs</li>
      </ol>

      <p className="text-sm text-gray-600 dark:text-gray-400 my-4"><strong>Note:</strong> Deleting a saved output does NOT remove it from Usage History. Usage History entries are permanent for billing integrity.</p>

      <h3>Bulk Delete (If Supported)</h3>
      <p>Check the Saved Outputs tab for a "Select Multiple" or "Bulk Actions" feature. If available:</p>
      <ol>
        <li>Enable selection mode</li>
        <li>Check boxes next to outputs you want to delete</li>
        <li>Click "Delete Selected"</li>
        <li>Confirm bulk deletion</li>
      </ol>

      <p className="text-sm text-gray-600 dark:text-gray-400 my-4">If bulk delete is not available, delete outputs one at a time using individual delete buttons.</p>

      <h2>Common Confusion Points & Fixes</h2>

      <div className="not-prose space-y-4 mb-8">
        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">I generated copy but can't find it in Saved Outputs</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>Solution:</strong> You didn't click "Save" on the output card in Copy Maker. Generated copy is NOT automatically saved.</p>
            <p><strong>Fix:</strong> Always click the "Save" button on outputs you want to keep. If you already closed Copy Maker, the output is lost—regenerate and remember to save.</p>
          </div>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">My Usage History shows entries I don't recognize</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>Explanation:</strong> An entry is created for every generation, including test generations, alternatives, and workflow steps.</p>
            <p><strong>Fix:</strong> Check the entry name and timestamp to identify the generation. Expand the entry to see operation details and models used.</p>
          </div>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">I deleted a saved output but it still shows in Usage History</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>This is expected behavior:</strong> Deleting a saved output only removes it from your Saved Outputs library. The usage entry remains in Usage History for billing accuracy.</p>
            <p><strong>Why:</strong> Usage History entries are permanent records of credit consumption. Deleting them would create billing discrepancies.</p>
          </div>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Loading a saved output doesn't restore my exact form state</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>All fields are loaded:</strong> All saved values are restored when you load an output, but some fields may not be immediately visible if they are in collapsed sections.</p>
            <p><strong>Fix:</strong> Scroll through the form and expand all sections to verify all fields were loaded correctly.</p>
          </div>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Can I recover deleted saved outputs?</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>No:</strong> Deleted saved outputs are permanently removed and cannot be recovered.</p>
            <p><strong>Prevention:</strong> Before deleting, export important outputs as HTML or copy as Markdown to a safe location.</p>
          </div>
        </details>

        <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">What is the difference between Usage History and my credit balance?</summary>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="mb-2"><strong>Usage History</strong> shows the history of what you have consumed — a log of past generations and their credit costs. Your <strong>credit balance</strong> in the top nav bar shows what you have remaining.</p>
            <p><strong>What to focus on:</strong> Watch your credit balance in the top navigation bar. Use Usage History to understand your consumption patterns over time.</p>
          </div>
        </details>
      </div>

      <h2>Dashboard Best Practices</h2>
      <div className="not-prose bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
        <ol className="list-decimal ml-4 space-y-2 text-gray-700 dark:text-gray-300">
          <li><strong>Save outputs immediately:</strong> Don't wait until later—save important outputs right after generation.</li>
          <li><strong>Use descriptive titles:</strong> "Final Homepage Hero V3" is better than "Output 1".</li>
          <li><strong>Tag consistently:</strong> Use consistent tags like "approved", "draft", "client-ready" for easy filtering.</li>
          <li><strong>Review Usage History monthly:</strong> Check your consumption patterns to optimize credit use.</li>
          <li><strong>Favorite your best work:</strong> Mark top-performing outputs as favorites for quick access.</li>
          <li><strong>Clean up periodically:</strong> Delete draft or test outputs you no longer need (keeps library organized).</li>
          <li><strong>Export important work:</strong> Download critical outputs as HTML for offline backup.</li>
        </ol>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link to="/help/credits-and-billing" className="text-blue-600 dark:text-blue-400 hover:underline">Credits & Billing</Link> to understand your credit balance and consumption history</li>
        <li><Link to="/help/setup-and-inputs" className="text-blue-600 dark:text-blue-400 hover:underline">Setup & Inputs</Link> to learn about saving templates (different from saving outputs)</li>
        <li><Link to="/help/export-management" className="text-blue-600 dark:text-blue-400 hover:underline">Export & Save</Link> for export format options</li>
        <li><Link to="/help/workflow-builder" className="text-blue-600 dark:text-blue-400 hover:underline">Workflow Builder</Link> for managing workflows via Dashboard</li>
      </ul>

      <hr className="my-8" />

      <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2026-01-31</p>
    </HelpLayout>
  );
};

export default DashboardAndHistory;
