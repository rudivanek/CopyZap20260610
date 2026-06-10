import React from 'react';
import { Copy, Check } from 'lucide-react';
import { stripMarkdown } from '../../utils/markdownUtils';

interface HeadlineIdeasProps {
  headlines: string[];
  isLoading: boolean;
  title?: string; // Added optional title prop
}

const HeadlineIdeas: React.FC<HeadlineIdeasProps> = ({ 
  headlines, 
  isLoading,
  title = "Headline Ideas" // Default title
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  
  const handleCopy = (text: string, index: number) => {
    // Strip Markdown before copying
    const cleanText = stripMarkdown(text);
    navigator.clipboard.writeText(cleanText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6">
      <div className="flex items-center mb-4">
        <div className="w-1 h-5 bg-primary-500 mr-2"></div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-3">
        {headlines.map((headline, index) => (
          <div key={index} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 flex items-center justify-center mr-3 font-semibold text-sm">
                {index + 1}
              </div>
              <span className="text-gray-700 dark:text-gray-300">{stripMarkdown(headline)}</span>
            </div>
            <button
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors flex items-center text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded" // Changed from text-green-500
              onClick={() => handleCopy(headline, index)}
            >
              {copiedIndex === index ? (
                <>
                  <Check size={14} className="mr-1 text-green-500 dark:text-green-400" />
                  <span className="text-green-500 dark:text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(HeadlineIdeas);