import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, CreditCard as Edit, Zap, Sparkles, ChevronDown, ChevronUp, Code, Settings } from 'lucide-react';
import { FormState, User } from '../../types';
import { getApiConfig, handleApiResponse, makeApiRequestWithFallback } from '../../services/api/utils';

interface WizardSummaryProps {
  generatedData: Partial<FormState> | null;
  wizardAnswers: {
    mode?: 'create' | 'improve' | 'polish';
    whatAreYouCreating: string;
    targetAudience: string;
    painPoints: string;
    wordCount: string;
    customWordCount: number;
    tone: string;
    specialInstructions: string;
    enableSEO: boolean;
    enableGEO: boolean;
  };
  currentUser?: User;
  selectedModel?: string;
  onApply: () => void;
  onApplyOnly: () => void;
  onStartOver: () => void;
}

const WizardSummary: React.FC<WizardSummaryProps> = ({
  generatedData,
  wizardAnswers,
  currentUser,
  selectedModel,
  onApply,
  onApplyOnly,
  onStartOver
}) => {
  const [showJSON, setShowJSON] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleExplainSetup = async () => {
    if (!currentUser || !generatedData) return;

    setIsExplaining(true);

    try {
      const systemPrompt = `You are a helpful assistant explaining AI-generated configuration choices to users. Be concise, friendly, and focus on "why" these settings work well together.`;

      const userPrompt = `Explain in 2-3 sentences why these settings were chosen for this project:

User wanted to create: "${wizardAnswers.whatAreYouCreating}"
Target audience: "${wizardAnswers.targetAudience}"
${wizardAnswers.painPoints ? `Pain points: "${wizardAnswers.painPoints}"` : ''}

Configuration chosen:
- Tone: ${generatedData.tone}
- Word count: ${generatedData.wordCount}${generatedData.customWordCount ? ` (${generatedData.customWordCount} words)` : ''}
- Writing style: ${generatedData.preferredWritingStyle || 'Default'}${wizardAnswers.mode === 'create' && generatedData.industryNiche ? `\n- Industry: ${generatedData.industryNiche}` : ''}
- SEO: ${wizardAnswers.enableSEO ? 'Enabled' : 'Disabled'}
- GEO: ${wizardAnswers.enableGEO ? 'Enabled' : 'Disabled'}

Focus on how these choices align with the user's goals and audience.`;

      // Make the API request via edge function
      const data = await makeApiRequestWithFallback(
        selectedModel as any,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        0.7,
        200
      );

      const explanationText = data.choices[0]?.message?.content || 'Unable to generate explanation.';
      setExplanation(explanationText);
    } catch (error) {
      console.error('Error generating explanation:', error);
      setExplanation('Sorry, we couldn\'t generate an explanation right now. But rest assured, these settings are optimized for your project!');
    } finally {
      setIsExplaining(false);
    }
  };

  const getWordCountDisplay = () => {
    if (wizardAnswers.wordCount === 'Custom') {
      return `${wizardAnswers.customWordCount} words (Custom)`;
    }
    return wizardAnswers.wordCount;
  };

  const variants = {
    enter: { opacity: 0, scale: 0.95 },
    center: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div
      variants={variants}
      initial="enter"
      animate="center"
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Success Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-900/30 rounded-full mb-4">
          <CheckCircle size={32} className="text-gray-600 dark:text-gray-400" />
        </div>
        <h2 className="text-1xl font-semibold text-gray-900 dark:text-white mb-2">
          Your Configuration is Ready!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Based on your answers, we've set up everything for you.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
        <div className="flex items-start space-x-3">
          <Sparkles size={20} className="text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">What You're Creating</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {wizardAnswers.whatAreYouCreating}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Target Audience
            </h4>
            <p className="text-sm text-gray-900 dark:text-white">
              {wizardAnswers.targetAudience}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Length
            </h4>
            <p className="text-sm text-gray-900 dark:text-white">
              {getWordCountDisplay()}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Tone
            </h4>
            <p className="text-sm text-gray-900 dark:text-white">
              {wizardAnswers.tone}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Features
            </h4>
            <div className="flex flex-wrap gap-2">
              {wizardAnswers.enableSEO && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                  SEO
                </span>
              )}
              {wizardAnswers.enableGEO && (
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                  GEO
                </span>
              )}
              {!wizardAnswers.enableSEO && !wizardAnswers.enableGEO && (
                <span className="text-sm text-gray-600 dark:text-gray-400">None</span>
              )}
            </div>
          </div>
        </div>

        {wizardAnswers.painPoints && (
          <div className="pt-2 border-t border-primary-200 dark:border-primary-800">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Addressing Pain Points
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {wizardAnswers.painPoints}
            </p>
          </div>
        )}

        {wizardAnswers.specialInstructions && (
          <div className="pt-2 border-t border-primary-200 dark:border-primary-800">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Special Instructions
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {wizardAnswers.specialInstructions}
            </p>
          </div>
        )}
      </div>

      {/* Additional Smart Settings */}
      {generatedData && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Plus these smart settings:
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Hide advanced fields for 'improve' mode - inferred from content instead */}
            {wizardAnswers.mode === 'create' && generatedData.industryNiche && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Industry:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {generatedData.industryNiche}
                </span>
              </div>
            )}
            {generatedData.preferredWritingStyle && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Writing Style:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {generatedData.preferredWritingStyle}
                </span>
              </div>
            )}
            {wizardAnswers.mode === 'create' && generatedData.readerFunnelStage && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Funnel Stage:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {generatedData.readerFunnelStage}
                </span>
              </div>
            )}
            {generatedData.keywords && (
              <div className="col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Keywords:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {generatedData.keywords}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explain My Setup Button */}
      <div>
        <button
          onClick={handleExplainSetup}
          disabled={isExplaining}
          className="w-full text-left px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles size={16} className="mr-2 text-primary-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {explanation ? 'Why These Settings?' : 'Explain My Setup'}
              </span>
            </div>
            {isExplaining ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="spinnerGradientWizSum" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff6b35" />
                    <stop offset="100%" stopColor="#ffa07a" />
                  </linearGradient>
                </defs>
                <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientWizSum)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90, 150" />
              </svg>
            ) : (
              explanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </div>
        </button>

        {explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
              {explanation}
            </p>
          </motion.div>
        )}
      </div>

      {/* View JSON Toggle */}
      <div>
        <button
          onClick={() => setShowJSON(!showJSON)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center"
        >
          <Code size={14} className="mr-1" />
          {showJSON ? 'Hide' : 'View'} JSON Configuration
        </button>

        {showJSON && generatedData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2"
          >
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                <code>{JSON.stringify(generatedData, null, 2)}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onStartOver}
          className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          Start Over
        </button>
        <button
          onClick={onApplyOnly}
          className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-primary-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center"
        >
          <Settings size={16} className="mr-2" />
          Apply
        </button>
        <button
          onClick={onApply}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition-colors text-sm font-medium flex items-center justify-center shadow-md"
        >
          <Zap size={16} className="mr-2" />
          Apply & Generate
        </button>
      </div>

      {/* Helper Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Fields marked with <Sparkles size={12} className="inline text-primary-500" /> sparkles were auto-filled.
        </p>
      </div>
    </motion.div>
  );
};

export default WizardSummary;
