import React, { useEffect, useState } from 'react';
import HelpLayout from './HelpLayout';

interface HtmlContentWrapperProps {
  htmlFile: string;
  title: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

const HtmlContentWrapper: React.FC<HtmlContentWrapperProps> = ({ htmlFile, title, breadcrumbs }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHtmlContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/docs/${htmlFile}`);

        if (!response.ok) {
          throw new Error(`Failed to load documentation: ${response.statusText}`);
        }

        const html = await response.text();

        // Parse the HTML to extract just the main content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Get the main content (everything inside the main tag or body, excluding nav and footer)
        const mainElement = doc.querySelector('main') || doc.querySelector('body');

        if (mainElement) {
          // Remove nav and footer elements if they exist
          mainElement.querySelectorAll('nav, footer').forEach(el => el.remove());

          // Get the cleaned content
          setContent(mainElement.innerHTML);
        } else {
          throw new Error('Could not find main content in HTML file');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading HTML content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
        setLoading(false);
      }
    };

    fetchHtmlContent();
  }, [htmlFile]);

  if (loading) {
    return (
      <HelpLayout title={title} breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center py-12">
          <svg className="w-12 h-12 animate-spin" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="spinnerGradientHelp" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b35" />
                <stop offset="100%" stopColor="#ffa07a" />
              </linearGradient>
            </defs>
            <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientHelp)" strokeWidth="4" strokeLinecap="round" strokeDasharray="90, 150" />
          </svg>
        </div>
      </HelpLayout>
    );
  }

  if (error) {
    return (
      <HelpLayout title={title} breadcrumbs={breadcrumbs}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Error Loading Content</h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </HelpLayout>
    );
  }

  return (
    <HelpLayout title={title} breadcrumbs={breadcrumbs}>
      <div
        className="html-content prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </HelpLayout>
  );
};

export default HtmlContentWrapper;
