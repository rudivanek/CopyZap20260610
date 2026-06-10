import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AdvancedBrandVoiceStyle } from '../types';

interface AdvancedStyleControlsProps {
  advancedStyle: AdvancedBrandVoiceStyle;
  onChange: (style: AdvancedBrandVoiceStyle) => void;
}

const AdvancedStyleControls: React.FC<AdvancedStyleControlsProps> = ({
  advancedStyle,
  onChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateField = <K extends keyof AdvancedBrandVoiceStyle>(
    field: K,
    value: AdvancedBrandVoiceStyle[K]
  ) => {
    onChange({ ...advancedStyle, [field]: value });
  };

  const toggleEmotionalTone = (tone: string) => {
    const current = advancedStyle.emotional_tone || [];
    const updated = current.includes(tone)
      ? current.filter(t => t !== tone)
      : [...current, tone];
    updateField('emotional_tone', updated);
  };

  const updateContentStructureRule = (rule: string, value: boolean) => {
    updateField('content_structure_rules', {
      ...advancedStyle.content_structure_rules,
      [rule]: value
    });
  };

  const updateArrayField = (field: 'allowed_elements' | 'forbidden_elements', value: string) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    updateField(field, items);
  };

  const emotionalTones = [
    'warm', 'friendly', 'inspirational', 'assertive', 'dramatic',
    'serious', 'neutral', 'humorous', 'respectful', 'empathetic'
  ];

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Advanced Style Controls (Optional)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Fine-tune sentence structure, tone, formality, and more
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-gray-600 dark:text-gray-400" size={20} />
        ) : (
          <ChevronDown className="text-gray-600 dark:text-gray-400" size={20} />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Sentence Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sentence Length Preference
            </label>
            <select
              value={advancedStyle.sentence_length || ''}
              onChange={(e) => updateField('sentence_length', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Auto / Not Specified</option>
              <option value="short">Short & Punchy</option>
              <option value="medium">Medium</option>
              <option value="long">Long & Flowing</option>
              <option value="varied">Varied</option>
            </select>
          </div>

          {/* Rhythm & Cadence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rhythm & Cadence
            </label>
            <select
              value={advancedStyle.rhythm || ''}
              onChange={(e) => updateField('rhythm', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Auto / Not Specified</option>
              <option value="staccato">Staccato</option>
              <option value="smooth">Smooth</option>
              <option value="energetic">Energetic</option>
              <option value="calm">Calm</option>
            </select>
          </div>

          {/* Formality Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formality Level: {advancedStyle.formality || 3}
              <span className="text-xs ml-2 text-gray-500">
                (1 = Extremely casual, 5 = Ultra formal)
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={advancedStyle.formality || 3}
              onChange={(e) => updateField('formality', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>Very Casual</span>
              <span>Neutral</span>
              <span>Very Formal</span>
            </div>
          </div>

          {/* Emotional Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emotional Tone (Select Multiple)
            </label>
            <div className="flex flex-wrap gap-2">
              {emotionalTones.map(tone => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => toggleEmotionalTone(tone)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (advancedStyle.emotional_tone || []).includes(tone)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Persona */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brand Persona (Speaking Archetype)
            </label>
            <select
              value={advancedStyle.persona || ''}
              onChange={(e) => updateField('persona', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Not Specified</option>
              <option value="mentor">Mentor</option>
              <option value="friend">Friend</option>
              <option value="expert">Expert</option>
              <option value="leader">Leader</option>
              <option value="storyteller">Storyteller</option>
              <option value="coach">Coach</option>
              <option value="analyst">Analyst</option>
              <option value="luxury_concierge">Luxury Concierge</option>
            </select>
          </div>

          {/* Point of View */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Point of View (POV)
            </label>
            <select
              value={advancedStyle.pov || ''}
              onChange={(e) => updateField('pov', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Not Specified</option>
              <option value="first_person">First Person ("We/I")</option>
              <option value="second_person">Second Person ("You")</option>
              <option value="third_person">Third Person ("They/The company")</option>
              <option value="brand_voice">Brand Voice ("At Acme, we believe...")</option>
            </select>
          </div>

          {/* Figurative vs Literal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Figurative vs Literal
            </label>
            <select
              value={advancedStyle.figurative_level || ''}
              onChange={(e) => updateField('figurative_level', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Not Specified</option>
              <option value="literal">More Literal</option>
              <option value="balanced">Balanced</option>
              <option value="metaphorical">More Metaphorical</option>
            </select>
          </div>

          {/* Depth of Detail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Depth of Detail
            </label>
            <select
              value={advancedStyle.detail_depth || ''}
              onChange={(e) => updateField('detail_depth', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Not Specified</option>
              <option value="minimal">Minimalistic</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
              <option value="highly_explanatory">Highly Explanatory</option>
            </select>
          </div>

          {/* Vocabulary Complexity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vocabulary Complexity
            </label>
            <select
              value={advancedStyle.vocabulary_complexity || ''}
              onChange={(e) => updateField('vocabulary_complexity', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Not Specified</option>
              <option value="simple">Simple / 6th Grade</option>
              <option value="basic_professional">Basic Professional</option>
              <option value="sophisticated">Sophisticated</option>
              <option value="highly_intellectual">Highly Intellectual</option>
            </select>
          </div>

          {/* Content Structure Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content Structure Rules
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedStyle.content_structure_rules?.short_paragraphs || false}
                  onChange={(e) => updateContentStructureRule('short_paragraphs', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Prefer short paragraphs
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedStyle.content_structure_rules?.use_bullets || false}
                  onChange={(e) => updateContentStructureRule('use_bullets', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Use bullet lists when helpful
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedStyle.content_structure_rules?.questions_allowed || false}
                  onChange={(e) => updateContentStructureRule('questions_allowed', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Allow rhetorical questions
                </span>
              </label>
            </div>
          </div>

          {/* Allowed Elements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Allowed Elements
            </label>
            <input
              type="text"
              value={(advancedStyle.allowed_elements || []).join(', ')}
              onChange={(e) => updateArrayField('allowed_elements', e.target.value)}
              placeholder="e.g., questions, bullets, analogies"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate with commas
            </p>
          </div>

          {/* Forbidden Elements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forbidden Elements
            </label>
            <input
              type="text"
              value={(advancedStyle.forbidden_elements || []).join(', ')}
              onChange={(e) => updateArrayField('forbidden_elements', e.target.value)}
              placeholder="e.g., emojis, slang, ALL CAPS"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate with commas
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedStyleControls;
