import React from 'react';
import { motion } from 'framer-motion';
import { X, List } from 'lucide-react';

interface StructureConfirmationModalProps {
  isOpen: boolean;
  extractedStructure: Array<string | { name: string; wordCount: number }>;
  defaultStructure: string[];
  onUseExtracted: () => void;
  onUseDefault: () => void;
  onClose: () => void;
}

const StructureConfirmationModal: React.FC<StructureConfirmationModalProps> = ({
  isOpen,
  extractedStructure,
  defaultStructure,
  onUseExtracted,
  onUseDefault,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] animate-fadeIn"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <List className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Page Structure Extracted
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We found a page structure from the URL. Would you like to use it or keep the default structure?
          </p>

          {/* Extracted Structure */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Extracted Structure (with actual word counts)
            </label>
            <div className="bg-white dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {extractedStructure.map((section, index) => {
                  const isObject = typeof section === 'object' && section !== null;
                  const sectionName = isObject ? section.name : section;
                  const wordCount = isObject ? section.wordCount : null;

                  return (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 dark:bg-primary-800/50 text-primary-700 dark:text-primary-300 text-sm rounded-full"
                    >
                      <span className="font-medium">{sectionName}</span>
                      {wordCount !== null && (
                        <span className="text-xs opacity-75">({wordCount}w)</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Default Structure */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Default Structure
            </label>
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {defaultStructure.map((section, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onUseDefault}
            className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Use Default
          </button>
          <button
            onClick={onUseExtracted}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition-colors text-sm font-medium shadow-md"
          >
            Use Extracted
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StructureConfirmationModal;
