import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, Maximize2, Palette, Sparkles, Zap, CheckCircle2, AlertCircle, X, Edit3 } from 'lucide-react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Tooltip } from '../ui/Tooltip';

interface QuickPolishModeProps {
  onGenerate: (config: QuickPolishConfig) => void;
  isGenerating: boolean;
  onClose?: () => void;
}

export interface QuickPolishConfig {
  originalCopy: string;
  improvementType: 'shorten' | 'expand' | 'tone' | 'clarity' | 'persuasive' | 'grammar' | 'custom';
  targetTone?: 'Professional' | 'Friendly' | 'Bold' | 'Minimalist' | 'Creative' | 'Persuasive';
  targetLength?: number;
  customInstructions?: string;
}

interface ImprovementOption {
  id: QuickPolishConfig['improvementType'];
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const improvementTypes: ImprovementOption[] = [
  {
    id: 'shorten',
    icon: Minimize2,
    label: 'Shorten',
    description: 'Reduce length by ~50%'
  },
  {
    id: 'expand',
    icon: Maximize2,
    label: 'Expand',
    description: 'Add detail, double length'
  },
  {
    id: 'tone',
    icon: Palette,
    label: 'Change Tone',
    description: 'Adjust writing style'
  },
  {
    id: 'clarity',
    icon: Sparkles,
    label: 'Improve Clarity',
    description: 'Simplify and clarify'
  },
  {
    id: 'persuasive',
    icon: Zap,
    label: 'More Persuasive',
    description: 'Add urgency, stronger CTA'
  },
  {
    id: 'grammar',
    icon: CheckCircle2,
    label: 'Fix Grammar',
    description: 'Polish grammar and flow'
  },
  {
    id: 'custom',
    icon: Edit3,
    label: 'Custom',
    description: 'Use your own instructions'
  }
];

const toneOptions: Array<QuickPolishConfig['targetTone']> = [
  'Professional',
  'Friendly',
  'Bold',
  'Minimalist',
  'Creative',
  'Persuasive'
];

const QuickPolishMode: React.FC<QuickPolishModeProps> = ({ onGenerate, isGenerating, onClose }) => {
  const [copyText, setCopyText] = useState('');
  const [selectedImprovement, setSelectedImprovement] = useState<QuickPolishConfig['improvementType'] | null>(null);
  const [selectedTone, setSelectedTone] = useState<QuickPolishConfig['targetTone']>('Friendly');
  const [targetLength, setTargetLength] = useState(50);
  const [wordCount, setWordCount] = useState(0);
  const [customInstructions, setCustomInstructions] = useState('');

  useEffect(() => {
    const words = copyText.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);

    // Auto-set target length for shorten/expand
    if (selectedImprovement === 'shorten') {
      setTargetLength(Math.max(50, Math.floor(words * 0.5)));
    } else if (selectedImprovement === 'expand') {
      setTargetLength(Math.max(100, Math.floor(words * 2)));
    }
  }, [copyText, selectedImprovement]);

  const handleGenerate = () => {
    if (!copyText.trim() || !selectedImprovement) return;
    if (selectedImprovement === 'custom' && !customInstructions.trim()) return;

    const config: QuickPolishConfig = {
      originalCopy: copyText,
      improvementType: selectedImprovement,
      targetTone: selectedImprovement === 'tone' ? selectedTone : undefined,
      targetLength: ['shorten', 'expand'].includes(selectedImprovement) ? targetLength : undefined,
      customInstructions: customInstructions.trim() || undefined
    };

    onGenerate(config);
  };

  const canGenerate = copyText.trim().length > 0 && selectedImprovement !== null && !isGenerating &&
    (selectedImprovement !== 'custom' || customInstructions.trim().length > 0);

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="relative text-center space-y-2">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute -top-2 right-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isGenerating}
            >
              <X className="w-6 h-6" />
            </button>
          )}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Quick Polish
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Fast improvements for existing copy. Paste, pick a fix, and generate.
          </p>
        </div>

        {/* Copy Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="polish-copy" className="text-base font-semibold">
              Paste your copy here
            </Label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
          <textarea
            id="polish-copy"
            value={copyText}
            onChange={(e) => setCopyText(e.target.value)}
            placeholder="Paste the copy you want to improve here..."
            className="w-full h-48 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 resize-none text-base"
            disabled={isGenerating}
          />
          {copyText.trim().length > 0 && wordCount < 10 && (
            <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Try adding more content for better results (at least 10 words recommended)</span>
            </div>
          )}
        </div>

        {/* Improvement Type Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            What needs improvement?
          </Label>
          <div className="flex flex-wrap gap-3 justify-center">
            {improvementTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedImprovement === type.id;

              return (
                <Tooltip key={type.id} content={`${type.label}: ${type.description}`}>
                  <motion.button
                    onClick={() => setSelectedImprovement(type.id)}
                    disabled={isGenerating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative p-3 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-primary-500 bg-white dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-200'
                      }
                      ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <Label htmlFor="custom-instructions" className="text-base font-semibold">
            Custom Instructions {selectedImprovement !== 'custom' && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(optional)</span>}
            {selectedImprovement === 'custom' && <span className="text-sm font-normal text-red-500 dark:text-red-400">(required)</span>}
          </Label>
          <textarea
            id="custom-instructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add specific instructions like: Keep it under 50 words, Use British English, Make it more casual, etc."
            className="w-full h-24 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 resize-none text-sm"
            disabled={isGenerating}
          />
        </div>

        {/* Conditional Controls */}
        {selectedImprovement === 'tone' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Label htmlFor="target-tone" className="text-base font-semibold">
              Select target tone
            </Label>
            <select
              id="target-tone"
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as QuickPolishConfig['targetTone'])}
              disabled={isGenerating}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
            >
              {toneOptions.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {(selectedImprovement === 'shorten' || selectedImprovement === 'expand') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <Label htmlFor="target-length" className="text-base font-semibold">
              Target length: {targetLength} words
            </Label>
            <input
              id="target-length"
              type="range"
              min={selectedImprovement === 'shorten' ? 20 : 100}
              max={selectedImprovement === 'shorten' ? wordCount : Math.max(500, wordCount * 3)}
              step={10}
              value={targetLength}
              onChange={(e) => setTargetLength(parseInt(e.target.value))}
              disabled={isGenerating}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Shorter</span>
              <span>Current: {wordCount} words</span>
              <span>Longer</span>
            </div>
          </motion.div>
        )}

        {/* Generate Button */}
        <div className="pt-4">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block mr-2"
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                Generating Improved Copy...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Generate Improved Copy
              </>
            )}
          </Button>
        </div>

        {/* Helper Text */}
        {!canGenerate && !isGenerating && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {!copyText.trim()
              ? 'Paste your copy above to get started'
              : selectedImprovement === null
                ? 'Select an improvement type'
                : selectedImprovement === 'custom' && !customInstructions.trim()
                  ? 'Add custom instructions to continue'
                  : 'Ready to generate'}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default QuickPolishMode;
