import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, FileText, Palette, MessageSquare } from 'lucide-react';

interface WizardStepNewProps {
  step: number;
  answers: {
    mode: 'create' | 'improve';
    whatAreYouCreating: string;
    targetAudience: string;
    painPoints: string;
    wordCount: 'Short: 50-100' | 'Medium: 100-200' | 'Long: 200-400' | 'Custom';
    customWordCount: number;
    tone: 'Professional' | 'Friendly' | 'Bold' | 'Minimalist' | 'Creative' | 'Persuasive';
    specialInstructions: string;
    enableSEO: boolean;
    enableGEO: boolean;
  };
  updateAnswer: (key: string, value: any) => void;
}

const WizardStepNew: React.FC<WizardStepNewProps> = ({
  step,
  answers,
  updateAnswer
}) => {
  const variants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <Sparkles className="w-10 h-10 text-primary-500 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Who are you talking to? What challenge do they face?
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Target Audience <span className="text-primary-500">*</span>
          </label>
          <input
            type="text"
            value={answers.targetAudience}
            onChange={(e) => updateAnswer('targetAudience', e.target.value)}
            placeholder="e.g., Small business owners with remote teams"
            className="w-full text-lg bg-white dark:bg-gray-900 border-2 border-primary-500/50 focus:border-primary-500 dark:border-primary-400/50 dark:focus:border-primary-400 text-gray-900 dark:text-gray-100 rounded-lg p-4 focus:ring-2 focus:ring-primary-500/20 transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Audience Problem <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={answers.painPoints}
            onChange={(e) => updateAnswer('painPoints', e.target.value)}
            placeholder="e.g., Struggling with team coordination and missed deadlines"
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <FileText className="w-10 h-10 text-primary-500 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          What's the main purpose of this copy?
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Project Description <span className="text-primary-500">*</span>
        </label>
        <textarea
          value={answers.whatAreYouCreating}
          onChange={(e) => updateAnswer('whatAreYouCreating', e.target.value)}
          placeholder="e.g., A landing page for my project management SaaS targeting small businesses..."
          rows={5}
          className="w-full text-lg bg-white dark:bg-gray-900 border-2 border-primary-500/50 focus:border-primary-500 dark:border-primary-400/50 dark:focus:border-primary-400 text-gray-900 dark:text-gray-100 rounded-lg p-4 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
          autoFocus
        />
      </div>
    </motion.div>
  );

  const renderStep3 = () => {
    const toneOptions = [
      { value: 'Professional', label: 'Professional', emoji: '💼' },
      { value: 'Friendly', label: 'Friendly', emoji: '😊' },
      { value: 'Bold', label: 'Bold', emoji: '⚡' },
      { value: 'Minimalist', label: 'Minimalist', emoji: '✨' },
      { value: 'Creative', label: 'Creative', emoji: '🎨' },
      { value: 'Persuasive', label: 'Persuasive', emoji: '📈' }
    ];

    return (
      <motion.div
        key="step3"
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-8">
          <Palette className="w-10 h-10 text-primary-500 mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            How should it sound? You can change this later in Advanced Mode.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tone <span className="text-primary-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateAnswer('tone', option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    answers.tone === option.value
                      ? 'border-primary-500 bg-white dark:bg-primary-900/20 shadow-md'
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Language
            </label>
            <select
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderStep4 = () => {
    const wordCountOptions = [
      { value: 'Short: 50-100', label: 'Short', description: 'Ads & social posts' },
      { value: 'Medium: 100-200', label: 'Medium', description: 'Landing sections' },
      { value: 'Long: 200-400', label: 'Long', description: 'Blog posts' }
    ];

    return (
      <motion.div
        key="step4"
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-8">
          <Users className="w-10 h-10 text-primary-500 mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quick tip: Short = ads, Medium = landing sections, Long = blogs.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Output Length <span className="text-primary-500">*</span>
          </label>
          <div className="space-y-3">
            {wordCountOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateAnswer('wordCount', option.value)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  answers.wordCount === option.value
                    ? 'border-primary-500 bg-white dark:bg-primary-900/20 shadow-md'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {option.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderStep5 = () => (
    <motion.div
      key="step5"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <MessageSquare className="w-10 h-10 text-primary-500 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Anything special? Examples, notes, or rules.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Special Instructions <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <textarea
          value={answers.specialInstructions}
          onChange={(e) => updateAnswer('specialInstructions', e.target.value)}
          placeholder='e.g., "Focus on environmental benefits", "Use British English", "Avoid technical jargon"'
          rows={5}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
          autoFocus
        />
      </div>
    </motion.div>
  );

  return (
    <div className="py-12">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
};

export default WizardStepNew;
