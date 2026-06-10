import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  helperText?: string;
}

const WizardFooter: React.FC<WizardFooterProps> = ({
  currentStep,
  totalSteps,
  canContinue,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  helperText
}) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-md mt-auto">
      <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-5">
        {helperText && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
            {helperText}
          </p>
        )}

        <div className="flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <motion.button
            onClick={onContinue}
            disabled={!canContinue}
            whileTap={canContinue ? { scale: 0.96 } : {}}
            whileHover={canContinue ? { scale: 1.02 } : {}}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-full font-medium text-base shadow-md
              transition-all duration-200
              ${canContinue
                ? 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {continueLabel}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default WizardFooter;
