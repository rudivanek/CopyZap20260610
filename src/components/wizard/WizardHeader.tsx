import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepSubtitle: string;
  onClose: () => void;
}

const WizardHeader: React.FC<WizardHeaderProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
  stepSubtitle,
  onClose
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Quick Setup
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <span>Exit Wizard</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-5">
          <div className="flex items-start justify-between mb-3 gap-6">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 text-left">
              {stepTitle}
            </h2>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 mt-1">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-400 text-left max-w-3xl">
            {stepSubtitle}
          </p>
        </div>

        <div className="h-1.5 bg-gray-200 dark:bg-gray-800 relative rounded-full overflow-hidden">
          <motion.div
            className="h-1.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

export default WizardHeader;
