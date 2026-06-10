import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';

interface HelpSection {
  title: string;
  content: React.ReactNode;
}

interface RelatedLink {
  title: string;
  path: string;
}

interface HelpPageTemplateProps {
  tldr: string;
  whenToUse?: string;
  steps?: HelpSection[];
  example?: React.ReactNode;
  commonMistakes?: string[];
  proTips?: string[];
  relatedLinks?: RelatedLink[];
}

const HelpPageTemplate: React.FC<HelpPageTemplateProps> = ({
  tldr,
  whenToUse,
  steps,
  example,
  commonMistakes,
  proTips,
  relatedLinks
}) => {
  return (
    <div className="space-y-8">
      {/* TL;DR Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">TL;DR</h2>
        <p className="text-blue-800 dark:text-blue-200">{tldr}</p>
      </div>

      {/* When to Use Section */}
      {whenToUse && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">When to Use</h2>
          <p className="text-gray-700 dark:text-gray-300">{whenToUse}</p>
        </div>
      )}

      {/* Steps Section */}
      {steps && steps.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Steps</h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <div className="text-gray-700 dark:text-gray-300">
                    {step.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Section */}
      {example && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Example</h2>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            {example}
          </div>
        </div>
      )}

      {/* Common Mistakes Section */}
      {commonMistakes && commonMistakes.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle size={24} className="text-red-500 dark:text-red-400 mr-2" />
            Common Mistakes
          </h2>
          <ul className="space-y-2">
            {commonMistakes.map((mistake, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 dark:text-red-400 mr-2 mt-1">✗</span>
                <span className="text-gray-700 dark:text-gray-300">{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pro Tips Section */}
      {proTips && proTips.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Lightbulb size={24} className="text-yellow-500 dark:text-yellow-400 mr-2" />
            Pro Tips
          </h2>
          <ul className="space-y-2">
            {proTips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle size={20} className="text-green-500 dark:text-green-400 mr-2 mt-1 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Links Section */}
      {relatedLinks && relatedLinks.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Related Links</h2>
          <div className="space-y-2">
            {relatedLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
              >
                <ArrowRight size={16} className="mr-2" />
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpPageTemplate;
