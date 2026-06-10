import React from 'react';
import HelpLayout from '../HelpLayout';
import { FileCode, FileText, Save } from 'lucide-react';

const ExportAndFileManagement: React.FC = () => {
  return (
    <HelpLayout
      title="Export & File Management"
      breadcrumbs={[{ label: 'Export & File Management' }]}
    >
      <div className="space-y-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Learn how to export, save, and manage your generated content.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Export Formats</h2>
          <p className="text-gray-700 dark:text-gray-300">
            CopyZap offers two powerful export options to fit your workflow:
          </p>

          <div className="grid gap-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Copy as Markdown</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Copies all outputs, inputs, and metadata as formatted Markdown to your clipboard.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong>Best for:</strong></p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                    <li>Quick sharing to Notion, Slack, GitHub, or documentation tools</li>
                    <li>Preserving formatting and structure</li>
                    <li>No file download needed - instant clipboard copy</li>
                    <li>Works with any Markdown-compatible platform</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <FileCode className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Export as HTML</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Downloads a professionally formatted, standalone HTML file with inline CSS styling.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong>Best for:</strong></p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                    <li>Client deliverables (can print to PDF from browser)</li>
                    <li>Formal documentation with styled formatting</li>
                    <li>Archival with readable, professional presentation</li>
                    <li>Works offline once downloaded - open in any browser</li>
                  </ul>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                    💡 Tip: To create a PDF, open the HTML file in your browser and use File → Print → Save as PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What's Included in Exports</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Both export formats include comprehensive content:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li>All generated output cards (improved, alternatives, humanized versions)</li>
            <li>Original input data and form settings</li>
            <li>SEO metadata (URL slugs, meta descriptions, H1/H2/H3 variants, OG tags) if generated</li>
            <li>Content quality scores and GEO scores if available</li>
            <li>Comparison results if you've run Compare All Outputs</li>
            <li>Project metadata (timestamp, word counts, settings)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Saving to Dashboard</h2>
          <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <Save className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Save Output</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Save your generated content to the dashboard for future reference, editing, and reloading.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong>What gets saved:</strong></p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>All generated outputs and variants</li>
                <li>Complete form inputs and settings</li>
                <li>Relationships between outputs (alternatives, derived versions)</li>
                <li>SEO metadata, scores, and comparison results</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                <strong>Access saved outputs:</strong> Dashboard → Saved Outputs tab → Click any card to reload into Copy Maker
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Best Practices</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>For quick sharing:</strong> Use Copy as Markdown to paste into Slack, Notion, or emails</li>
              <li><strong>For client presentations:</strong> Export as HTML and print to PDF from your browser</li>
              <li><strong>For archiving:</strong> Save to Dashboard for reloadable copies, or export as HTML for offline backups</li>
              <li><strong>For collaboration:</strong> Export as HTML to share with team members who don't have CopyZap access</li>
              <li><strong>For version control:</strong> Copy as Markdown and commit to Git for tracking content changes</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Common Questions</h2>

          <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">Can I edit exported files?</summary>
            <div className="mt-2 text-gray-700 dark:text-gray-300">
              <p className="mb-2"><strong>Markdown:</strong> Yes, paste into any Markdown editor and edit freely.</p>
              <p><strong>HTML:</strong> Yes, open in a text editor or HTML editor to modify the content and styling.</p>
            </div>
          </details>

          <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">How do I create a PDF?</summary>
            <div className="mt-2 text-gray-700 dark:text-gray-300">
              <ol className="list-decimal list-inside space-y-1">
                <li>Export as HTML</li>
                <li>Open the HTML file in any web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Go to File → Print</li>
                <li>Choose "Save as PDF" as the printer destination</li>
                <li>Save your PDF</li>
              </ol>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">This gives you full control over PDF formatting using your browser's print settings.</p>
            </div>
          </details>

          <details className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-semibold cursor-pointer text-gray-900 dark:text-gray-100">What's the difference between Save and Export?</summary>
            <div className="mt-2 text-gray-700 dark:text-gray-300">
              <p className="mb-2"><strong>Save:</strong> Stores outputs in your CopyZap dashboard. You can reload them later to continue editing or generate more variations.</p>
              <p><strong>Export:</strong> Creates a file or clipboard copy for use outside CopyZap. Use this for sharing, presenting, or archiving.</p>
            </div>
          </details>
        </section>
      </div>
    </HelpLayout>
  );
};

export default ExportAndFileManagement;
