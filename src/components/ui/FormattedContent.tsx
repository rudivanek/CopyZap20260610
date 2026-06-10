import React from 'react';
import { StructuredCopyOutput } from '../../types';
import { markdownToHtml } from '../../utils/copyFormatter';

interface FormattedContentProps {
  content: string | StructuredCopyOutput | any;
  className?: string;
}

/**
 * Unified component for rendering content with proper HTML formatting
 * Replaces the old pattern of using stripMarkdown() which removed all formatting
 */
const FormattedContent: React.FC<FormattedContentProps> = ({ content, className = '' }) => {
  // Handle empty content
  if (content === null || content === undefined) {
    return null;
  }

  // Unwrap nested content structure (e.g., { content: actualContent, seoMetadata: {...} })
  let actualContent = content;
  if (typeof content === 'object' && content !== null && 'content' in content && !('headline' in content)) {
    actualContent = (content as any).content;
  }

  // Handle structured content (headline + sections)
  if (typeof actualContent === 'object' && actualContent !== null && 'headline' in actualContent && 'sections' in actualContent) {
    const structuredContent = actualContent as StructuredCopyOutput;

    return (
      <div className={className}>
        {/* Headline */}
        <h1
          className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-700 pb-2"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(structuredContent.headline) }}
        />

        {/* Sections */}
        {Array.isArray(structuredContent.sections) && structuredContent.sections.map((section, sectionIndex) => (
          section && section.title ? (
            <div key={sectionIndex} className="mb-6">
              <h2
                className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(section.title) }}
              />

              {section.content && (
                <div
                  className="text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
                />
              )}

              {section.listItems && section.listItems.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300 mt-2">
                  {section.listItems.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(item) }}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : null
        ))}
      </div>
    );
  }

  // Handle array content (like headlines)
  if (Array.isArray(actualContent)) {
    return (
      <ol className={className}>
        {actualContent.map((item, index) => (
          <li
            key={index}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(String(item)) }}
          />
        ))}
      </ol>
    );
  }

  // Handle string content
  const stringContent = String(actualContent);
  const htmlContent = markdownToHtml(stringContent);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default FormattedContent;
