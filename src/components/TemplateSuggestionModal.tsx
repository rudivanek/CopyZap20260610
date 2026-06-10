import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Copy, Check, Zap, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateTemplateJsonSuggestion } from '../services/apiService';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { User, FormState } from '../types';
import { getSupabaseClient } from '../services/supabaseClient';

interface TemplateSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  onApplyToForm?: (templateData: Partial<FormState>) => void;
  selectedModel?: string;
  sessionId?: string;
}

interface PromptSuggestion {
  id: string;
  category: string;
  instruction_text: string;
  tone_match: string[];
  language_match: string[];
  output_type_match: string[];
}

interface GroupedPromptSuggestions {
  [category: string]: string[];
}

const TemplateSuggestionModal: React.FC<TemplateSuggestionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onApplyToForm,
  selectedModel = 'gpt-4o',
  sessionId
}) => {
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJson, setGeneratedJson] = useState('');
  const [generatedData, setGeneratedData] = useState<Partial<FormState> | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GroupedPromptSuggestions>({});
  const [filteredSuggestions, setFilteredSuggestions] = useState<GroupedPromptSuggestions>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const { isAdmin } = useIsAdmin(currentUser);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInstruction('');
      setGeneratedJson('');
      setGeneratedData(null);
      setCopied(false);
    }
  }, [isOpen]);

  // Fetch suggestions when suggestions modal opens
  useEffect(() => {
    if (isSuggestionsModalOpen) {
      fetchPromptSuggestions();
    }
  }, [isSuggestionsModalOpen]);

  // Filter suggestions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuggestions(suggestions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered: GroupedPromptSuggestions = {};

      Object.entries(suggestions).forEach(([category, items]) => {
        const categoryMatch = typeof category === 'string' && category.toLowerCase().includes(query);
        const matchingItems = items.filter(item => typeof item === 'string' && item.toLowerCase().includes(query));

        if (categoryMatch || matchingItems.length > 0) {
          filtered[category] = categoryMatch ? items : matchingItems;
        }
      });

      setFilteredSuggestions(filtered);
    }
  }, [searchQuery, suggestions]);

  const fetchPromptSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('pmc_extra_suggestions')
        .select('*')
        .eq('active', true)
        .order('category')
        .order('instruction_text');

      if (error) throw error;

      if (data && data.length > 0) {
        const grouped: GroupedPromptSuggestions = {};
        data.forEach((suggestion: PromptSuggestion) => {
          if (!grouped[suggestion.category]) {
            grouped[suggestion.category] = [];
          }
          grouped[suggestion.category].push(suggestion.instruction_text);
        });
        setSuggestions(grouped);
        setFilteredSuggestions(grouped);
      }
    } catch (error) {
      console.error('Error fetching prompt suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    const currentValue = instruction.trim();
    const newValue = currentValue
      ? `${currentValue} ${suggestionText}`
      : suggestionText;
    setInstruction(newValue);
    setIsSuggestionsModalOpen(false);
    toast.success('Suggestion added');
  };

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      toast.error('Please enter an instruction');
      return;
    }

    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    setIsGenerating(true);
    try {
      const jsonSuggestion = await generateTemplateJsonSuggestion(
        instruction.trim(),
        currentUser,
        selectedModel as any,
        sessionId
      );
      
      // Format the JSON with proper indentation
      const formattedJson = JSON.stringify(jsonSuggestion, null, 2);
      setGeneratedJson(formattedJson);
      setGeneratedData(jsonSuggestion);
      toast.success('Template JSON generated successfully!');
    } catch (error: any) {
      console.error('Error generating template JSON:', error);
      toast.error(`Failed to generate template JSON: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJson = async () => {
    if (!generatedJson) return;
    
    try {
      await navigator.clipboard.writeText(generatedJson);
      setCopied(true);
      toast.success('JSON copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy JSON');
    }
  };

  const handleApplyToForm = () => {
    if (!generatedData || !onApplyToForm) return;

    try {
      // Track which fields are being populated from AI Prompts
      const prefilledFields = Object.keys(generatedData).filter(key => {
        const runtimeFields = ['isLoading', 'isEvaluating', 'generationProgress', 'copyResult', 'promptEvaluation', 'templatePrefilledFields'];
        return !runtimeFields.includes(key) && generatedData[key as keyof FormState] !== undefined && generatedData[key as keyof FormState] !== '';
      });

      // Add templatePrefilledFields to the data being applied
      const dataWithTracking = {
        ...generatedData,
        templatePrefilledFields: prefilledFields,
        // Clear results when applying AI prompts
        copyResult: { generatedVersions: [] },
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };

      onApplyToForm(dataWithTracking);
      toast.success('Template applied to form fields!');
      onClose();
    } catch (error) {
      console.error('Error applying template to form:', error);
      toast.error('Failed to apply template to form');
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-black dark:text-white flex items-center">
            <Lightbulb size={20} className="mr-2 text-primary-500" />
            Natural Language Prompt Generator
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            disabled={isGenerating}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Instruction Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="instruction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Natural Language Prompt
              </label>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsSuggestionsModalOpen(true)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
                  title="Get prompt suggestions"
                  disabled={isGenerating}
                >
                  <Lightbulb size={20} />
                </button>
              )}
            </div>
            <textarea
              id="instruction"
              rows={4}
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-3"
              placeholder="e.g., a blogpost for twitter marketing, make 400 words long, include SEO metadata, target social media managers..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isGenerating}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Describe what kind of prompt  you want to generate. Be specific about content type, word count, target audience, features, etc.
            </p>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !instruction.trim()}
              className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-lg text-sm flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin mr-2" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="spinnerGradientTSM" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff6b35" />
                        <stop offset="100%" stopColor="#ffa07a" />
                      </linearGradient>
                    </defs>
                    <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientTSM)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90, 150" />
                  </svg>
                  Generating Template JSON...
                </>
              ) : (
                <>
                  <Zap size={16} className="mr-2" />
                  Generate JSON Prompt
                </>
              )}
            </button>
          </div>

          {/* JSON Output */}
          {generatedJson && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated JSON Prompt
                </label>
                <button
                  onClick={handleCopyJson}
                  className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm flex items-center"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="mr-1.5 text-green-500 dark:text-green-400" />
                      <span className="text-green-500 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-1.5" />
                      Copy JSON
                    </>
                  )}
                </button>
              </div>
                  {onApplyToForm && generatedData && (
                    <button
                      onClick={handleApplyToForm}
                      className="bg-primary-600 hover:bg-primary-500 text-white px-3 py-2 rounded-md text-sm flex items-center"
                    >
                      <Zap size={16} className="mr-1.5" />
                      Apply to Form
                    </button>
                  )}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                  <code>{generatedJson}</code>
                </pre>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This JSON can be used as a template data structure for prefills or form state initialization.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={isGenerating}
          >
            Close
          </button>
        </div>
      </div>

      {/* Suggestions Modal */}
      {isSuggestionsModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setIsSuggestionsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden animate-slideUp flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-black">Prompt Suggestions</h2>
              <button
                onClick={() => setIsSuggestionsModalOpen(false)}
                className="text-gray-500 hover:text-black transition-colors text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search suggestions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingSuggestions ? (
                <div className="text-center py-8 text-gray-500">Loading suggestions...</div>
              ) : Object.keys(filteredSuggestions).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? `No suggestions found matching "${searchQuery}"` : 'No suggestions available'}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(filteredSuggestions).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-bold text-black mb-3">{category}</h3>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <button
                            key={`${category}-${index}`}
                            onClick={() => handleSuggestionClick(item)}
                            className="w-full text-left px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm text-black"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setIsSuggestionsModalOpen(false)}
                className="w-full bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TemplateSuggestionModal;