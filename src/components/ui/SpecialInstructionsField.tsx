import React, { useState, useEffect } from 'react';
import { Lightbulb, Search, Wand2 } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { Tooltip } from './Tooltip';
import { getTextareaClassName } from '../../utils/inputHighlight';

interface Suggestion {
  id: string;
  category: string;
  instruction_text: string;
  tone_match: string[];
  language_match: string[];
  output_type_match: string[];
}

interface GroupedSuggestions {
  [category: string]: string[];
}

const AI_DECIDE_HINT_THRESHOLD = 120;

interface SpecialInstructionsFieldProps {
  tone?: string;
  language?: string;
  outputType?: string;
  value: string;
  onChange: (val: string) => void;
  currentUser?: any;
  fieldsWithPlaceholders?: string[];
  aiDecideWordCount?: boolean;
  onEnableAiDecide?: () => void;
}

// Fallback suggestions when Supabase fetch fails or returns empty
const FALLBACK_SUGGESTIONS: GroupedSuggestions = {
  "Tone & Style": [
    "Add subtle humor without being silly",
    "Sound confident but not arrogant",
    "Use short, punchy sentences"
  ],
  "Formatting": [
    "Use bullet points for features",
    "Start with a TL;DR summary",
    "Bold all product names"
  ],
  "Content Rules": [
    "Avoid mentioning competitors",
    "Include exactly 3 customer pain points",
    "Add a clear CTA at the end"
  ],
  "Localization": [
    "Use Mexican Spanish idioms naturally",
    "Use British spelling",
    "Reference Querétaro landmarks"
  ],
  "Technical / Clarity": [
    "Use active voice exclusively",
    "Target 8th-grade reading level",
    "Keep under 200 words total"
  ]
};

export default function SpecialInstructionsField({
  tone = '',
  language = '',
  outputType = '',
  value,
  onChange,
  currentUser,
  fieldsWithPlaceholders = [],
  aiDecideWordCount = false,
  onEnableAiDecide
}: SpecialInstructionsFieldProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GroupedSuggestions>({});
  const [filteredSuggestions, setFilteredSuggestions] = useState<GroupedSuggestions>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      fetchSuggestions();
    }
  }, [isModalOpen, tone, language, outputType]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();

      // Fetch from pmc_extra_suggestions table only
      const result = await supabase
        .from('pmc_extra_suggestions')
        .select('*')
        .eq('active', true)
        .order('category')
        .order('instruction_text');

      if (result.error) throw result.error;

      const data = result.data || [];

      if (data.length === 0) {
        setSuggestions(FALLBACK_SUGGESTIONS);
        setIsLoading(false);
        return;
      }

      // Filter suggestions based on tone, language, and outputType
      const filtered = data.filter((suggestion: Suggestion) => {
        const toneMatch = suggestion.tone_match.length === 0 || suggestion.tone_match.includes(tone);
        const langMatch = suggestion.language_match.length === 0 || suggestion.language_match.includes(language);
        const outputMatch = suggestion.output_type_match.length === 0 || suggestion.output_type_match.includes(outputType);
        return toneMatch && langMatch && outputMatch;
      });

      // Group by category
      const grouped: GroupedSuggestions = {};
      filtered.forEach((suggestion: Suggestion) => {
        if (!grouped[suggestion.category]) {
          grouped[suggestion.category] = [];
        }
        grouped[suggestion.category].push(suggestion.instruction_text);
      });

      const finalSuggestions = Object.keys(grouped).length > 0 ? grouped : FALLBACK_SUGGESTIONS;
      setSuggestions(finalSuggestions);
      setFilteredSuggestions(finalSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions(FALLBACK_SUGGESTIONS);
      setFilteredSuggestions(FALLBACK_SUGGESTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    const currentValue = value.trim();
    const newValue = currentValue
      ? `${currentValue}\n${suggestionText}`
      : suggestionText;
    onChange(newValue);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Filter suggestions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuggestions(suggestions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered: GroupedSuggestions = {};

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

  // Check if current user is admin using centralized admin service
  const { isAdmin } = useIsAdmin(currentUser);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="special-instructions" className="block text-sm font-normal text-gray-500 dark:text-gray-400">
          Special Instructions
        </label>
        {isAdmin && (
          <Tooltip content="Get suggestions for Special Instructions">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
              aria-label="Get suggestions for Special Instructions"
            >
              <Lightbulb size={20} />
            </button>
          </Tooltip>
        )}
      </div>

      <textarea
        id="special-instructions"
        value={value}
        onChange={handleTextareaChange}
        className={`${getTextareaClassName('specialInstructions', fieldsWithPlaceholders, 'w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-gray-100 text-sm min-h-[100px] focus:ring-primary-500 focus:border-primary-500', value)}`}
        placeholder={'e.g., "Make British English", "Avoid technical jargon"\n\nFor emphasis, use LABEL: format — forces the AI to treat it as a hard requirement:\nMAIN CTA: Rewrite with a specific value prop, first person, above the fold.\nTONE: Direct and urgent, no filler words.'}
      />


      {/* Smart hint: suggest "Let AI Decide Word Count" when instructions are lengthy */}
      {value.length >= AI_DECIDE_HINT_THRESHOLD && !aiDecideWordCount && onEnableAiDecide && (
        <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/50 rounded-lg">
          <Wand2 size={14} className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
              You have detailed instructions — consider enabling{' '}
              <strong>Let AI Decide Word Count</strong> for best results.
            </p>
          </div>
          <button
            type="button"
            onClick={onEnableAiDecide}
            className="flex-shrink-0 text-xs font-medium px-2 py-1 bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600 rounded hover:bg-amber-200 dark:hover:bg-amber-700/50 transition-colors whitespace-nowrap"
          >
            Enable
          </button>
        </div>
      )}

      {/* Confirmation when already enabled */}
      {value.length >= AI_DECIDE_HINT_THRESHOLD && aiDecideWordCount && (
        <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-700/50 rounded-lg">
          <Wand2 size={13} className="text-green-500 dark:text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-400">
            <strong>Let AI Decide Word Count</strong> is enabled — AI will focus on content quality without length constraints.
          </p>
        </div>
      )}

      <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
        Tip: Use <span className="font-semibold text-gray-500 dark:text-gray-400">LABEL: instruction</span> format to force a requirement — e.g. <span className="italic">MAIN CTA: rewrite in first person</span>
      </p>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden animate-slideUp flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-black">Suggestions</h2>
              <button
                onClick={() => setIsModalOpen(false)}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading suggestions...</div>
              ) : Object.keys(filteredSuggestions).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No suggestions found matching "{searchQuery}"
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
                onClick={() => setIsModalOpen(false)}
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
}
