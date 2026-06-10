import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  contentType?: 'markdown' | 'html';
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, contentType = 'markdown' }) => {
  // If content is HTML, render it directly with sanitization
  if (contentType === 'html') {
    return (
      <div
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-4 prose-h2:text-3xl prose-h2:mb-3 prose-h3:text-2xl prose-h3:mb-2 prose-p:mb-4 prose-p:leading-relaxed prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-2"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          skipHtml={false}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Render markdown content
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-4 prose-h2:text-3xl prose-h2:mb-3 prose-h3:text-2xl prose-h3:mb-2 prose-p:mb-4 prose-p:leading-relaxed prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 className="text-4xl font-bold mb-4 mt-8 text-gray-900 dark:text-white" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-3xl font-bold mb-3 mt-6 text-gray-900 dark:text-white" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-2xl font-bold mb-2 mt-5 text-gray-900 dark:text-white" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-xl font-bold mb-2 mt-4 text-gray-900 dark:text-white" {...props}>
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="mb-4 list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-4 list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="mb-2 text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-primary-500 pl-4 py-2 my-4 italic text-gray-600 dark:text-gray-400" {...props}>
              {children}
            </blockquote>
          ),
          code: ({ children, ...props }) => (
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200" {...props}>
              {children}
            </code>
          ),
          pre: ({ children, ...props }) => (
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto my-4" {...props}>
              {children}
            </pre>
          ),
          img: ({ alt, ...props }) => (
            <img
              {...props}
              alt={alt}
              style={{ maxWidth: '100%', height: 'auto' }}
              loading="lazy"
              className="rounded-lg shadow-md my-6"
            />
          ),
          a: ({ children, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {children}
            </a>
          ),
          iframe: (props) => (
            <div className="aspect-video my-6">
              <iframe
                {...props}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
