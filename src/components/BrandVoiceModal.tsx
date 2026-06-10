import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, BookOpen, Settings, Save, Sparkles, Globe, FileText } from 'lucide-react';
import { BrandVoice, AdvancedBrandVoiceStyle } from '../types';
import { BRAND_VOICE_PRESETS, PRESET_OPTIONS } from '../config/brandVoicePresets';
import { toast } from 'react-hot-toast';
import { generateBrandVoice, analyzePastedBrandVoice } from '../services/api/brandVoiceGeneration';
import { extractBrandVoiceFromUrl } from '../services/api/urlBrandVoiceExtraction';
import AdvancedStyleControls from './AdvancedStyleControls';
import ProcessingModal from './ProcessingModal';
import { useSession } from '../context/SessionContext';

interface BrandVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voice: Omit<BrandVoice, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  customerId: string;
  userId: string;
  editingVoice?: BrandVoice | null;
  initialContent?: string;
  initialMethod?: 'ai' | 'preset' | 'manual';
}

type CreationMethod = 'ai' | 'preset' | 'manual';

const BrandVoiceModal: React.FC<BrandVoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerId,
  userId,
  editingVoice,
  initialContent,
  initialMethod
}) => {
  const { currentSessionId, ensureActiveSession } = useSession();
  const [method, setMethod] = useState<CreationMethod>(editingVoice ? 'manual' : initialMethod || 'ai');
  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiSampleText, setAiSampleText] = useState('');
  const [pastedContent, setPastedContent] = useState(initialContent || '');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');

  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [toneStyle, setToneStyle] = useState('');
  const [sentenceStyle, setSentenceStyle] = useState('');
  const [preferredVocabulary, setPreferredVocabulary] = useState<string[]>([]);
  const [forbiddenTerms, setForbiddenTerms] = useState<string[]>([]);
  const [ctaStyle, setCtaStyle] = useState('');
  const [useOxfordComma, setUseOxfordComma] = useState(true);
  const [preferShortSentences, setPreferShortSentences] = useState(false);
  const [maxSentenceLength, setMaxSentenceLength] = useState(25);
  const [useContractions, setUseContractions] = useState(true);
  const [exclamationFrequency, setExclamationFrequency] = useState<'rare' | 'moderate' | 'frequent'>('moderate');
  const [advancedStyle, setAdvancedStyle] = useState<AdvancedBrandVoiceStyle>({});

  useEffect(() => {
    if (editingVoice) {
      setName(editingVoice.name);
      setDescription(editingVoice.description || '');
      setPersonalityTraits(editingVoice.personality_traits || []);
      setToneStyle(editingVoice.tone_style || '');
      setSentenceStyle(editingVoice.sentence_style || '');
      setPreferredVocabulary(editingVoice.preferred_vocabulary || []);
      setForbiddenTerms(editingVoice.forbidden_terms || []);
      setCtaStyle(editingVoice.cta_style || '');
      setUseOxfordComma(editingVoice.punctuation_rules?.use_oxford_comma ?? true);
      setPreferShortSentences(editingVoice.punctuation_rules?.prefer_short_sentences ?? false);
      setMaxSentenceLength(editingVoice.punctuation_rules?.max_sentence_length ?? 25);
      setUseContractions(editingVoice.punctuation_rules?.use_contractions ?? true);
      setExclamationFrequency(editingVoice.punctuation_rules?.exclamation_frequency ?? 'moderate');
      setAdvancedStyle(editingVoice.advanced_style || {});
      setMethod('manual');
    } else {
      resetForm();
      if (initialContent) {
        setPastedContent(initialContent);
      }
      if (initialMethod) {
        setMethod(initialMethod);
      }
    }
  }, [editingVoice, isOpen, initialContent, initialMethod]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setAiDescription('');
    setAiSampleText('');
    setPastedContent('');
    setWebsiteUrl('');
    setSelectedPreset('');
    setPersonalityTraits([]);
    setToneStyle('');
    setSentenceStyle('');
    setPreferredVocabulary([]);
    setForbiddenTerms([]);
    setCtaStyle('');
    setUseOxfordComma(true);
    setPreferShortSentences(false);
    setMaxSentenceLength(25);
    setUseContractions(true);
    setExclamationFrequency('moderate');
    setAdvancedStyle({});
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = BRAND_VOICE_PRESETS[presetKey];
    if (!preset) return;

    setDescription(preset.description);
    setPersonalityTraits(preset.personality_traits);
    setToneStyle(preset.tone_style);
    setSentenceStyle(preset.sentence_style);
    setPreferredVocabulary(preset.preferred_vocabulary);
    setForbiddenTerms(preset.forbidden_terms);
    setCtaStyle(preset.cta_style);
    setUseOxfordComma(preset.punctuation_rules.use_oxford_comma ?? true);
    setPreferShortSentences(preset.punctuation_rules.prefer_short_sentences ?? false);
    setMaxSentenceLength(preset.punctuation_rules.max_sentence_length ?? 25);
    setUseContractions(preset.punctuation_rules.use_contractions ?? true);
    setExclamationFrequency(preset.punctuation_rules.exclamation_frequency ?? 'moderate');
  };

  const handleGenerateWithAI = async () => {
    if (!aiDescription.trim()) {
      toast.error('Please describe the brand');
      return;
    }

    setLoading(true);
    setProcessingMessage('Generating Brand Voice...');
    abortControllerRef.current = new AbortController();

    try {
      // Use existing session ID if available, otherwise track as null (no session creation for brand voice)
      const sessionId = currentSessionId || null;

      const result = await generateBrandVoice(aiDescription, aiSampleText, userId, sessionId);

      setDescription(result.description);
      setPersonalityTraits(result.personality_traits);
      setToneStyle(result.tone_style);
      setSentenceStyle(result.sentence_style);
      setPreferredVocabulary(result.preferred_vocabulary);
      setForbiddenTerms(result.forbidden_terms);
      setCtaStyle(result.cta_style);

      if (result.punctuation_rules) {
        setUseOxfordComma(result.punctuation_rules.use_oxford_comma ?? true);
        setPreferShortSentences(result.punctuation_rules.prefer_short_sentences ?? false);
        setMaxSentenceLength(result.punctuation_rules.max_sentence_length ?? 25);
        setUseContractions(result.punctuation_rules.use_contractions ?? true);
        setExclamationFrequency(result.punctuation_rules.exclamation_frequency ?? 'moderate');
      }

      if (result.advanced_style) {
        setAdvancedStyle(result.advanced_style);
      }

      setMethod('manual');
      toast.success('Brand voice generated! Review and save.');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error(error.message || 'Failed to generate brand voice');
      }
    } finally {
      setLoading(false);
      setProcessingMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleAnalyzePastedCopy = async () => {
    if (!pastedContent.trim()) {
      toast.error('Please paste some content to analyze');
      return;
    }

    if (pastedContent.trim().length < 100) {
      toast.error('Please provide at least 100 characters for accurate analysis');
      return;
    }

    setLoading(true);
    setProcessingMessage('Analyzing Pasted Content...');
    abortControllerRef.current = new AbortController();

    try {
      // Use existing session ID if available, otherwise track as null (no session creation for brand voice)
      const sessionId = currentSessionId || null;

      const result = await analyzePastedBrandVoice(pastedContent, userId, sessionId);

      setDescription(result.description);
      setPersonalityTraits(result.personality_traits);
      setToneStyle(result.tone_style);
      setSentenceStyle(result.sentence_style);
      setPreferredVocabulary(result.preferred_vocabulary);
      setForbiddenTerms(result.forbidden_terms);
      setCtaStyle(result.cta_style);

      if (result.punctuation_rules) {
        setUseOxfordComma(result.punctuation_rules.use_oxford_comma ?? true);
        setPreferShortSentences(result.punctuation_rules.prefer_short_sentences ?? false);
        setMaxSentenceLength(result.punctuation_rules.max_sentence_length ?? 25);
        setUseContractions(result.punctuation_rules.use_contractions ?? true);
        setExclamationFrequency(result.punctuation_rules.exclamation_frequency ?? 'moderate');
      }

      if (result.advanced_style) {
        setAdvancedStyle(result.advanced_style);
      }

      setMethod('manual');
      toast.success('Brand voice analyzed! Review and save.');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error(error.message || 'Failed to analyze pasted content');
      }
    } finally {
      setLoading(false);
      setProcessingMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleScanWebsite = async () => {
    if (!websiteUrl.trim()) {
      toast.error('Please enter a website URL');
      return;
    }

    setLoading(true);
    setProcessingMessage('Scanning Website...');
    abortControllerRef.current = new AbortController();

    try {
      // Use existing session ID if available, otherwise track as null (no session creation for brand voice)
      const sessionId = currentSessionId || null;

      const result = await extractBrandVoiceFromUrl(websiteUrl, true, userId, sessionId);

      setDescription(result.description);
      setPersonalityTraits(result.personality_traits);
      setToneStyle(result.tone_style);
      setSentenceStyle(result.sentence_style);
      setPreferredVocabulary(result.preferred_vocabulary);
      setForbiddenTerms(result.forbidden_terms);
      setCtaStyle(result.cta_style);

      if (result.punctuation_rules) {
        setUseOxfordComma(result.punctuation_rules.use_oxford_comma ?? true);
        setPreferShortSentences(result.punctuation_rules.prefer_short_sentences ?? false);
        setMaxSentenceLength(result.punctuation_rules.max_sentence_length ?? 25);
        setUseContractions(result.punctuation_rules.use_contractions ?? true);
        setExclamationFrequency(result.punctuation_rules.exclamation_frequency ?? 'moderate');
      }

      setMethod('manual');
      toast.success('Brand voice extracted from website! Review and save.');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error(error.message || 'Failed to extract brand voice from website');
      }
    } finally {
      setLoading(false);
      setProcessingMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Brand voice name is required');
      return;
    }

    const voiceData = {
      customer_id: customerId,
      owner_user_id: userId,
      name: name.trim(),
      description: description.trim(),
      personality_traits: personalityTraits,
      tone_style: toneStyle,
      sentence_style: sentenceStyle,
      preferred_vocabulary: preferredVocabulary,
      forbidden_terms: forbiddenTerms,
      cta_style: ctaStyle,
      punctuation_rules: {
        use_oxford_comma: useOxfordComma,
        prefer_short_sentences: preferShortSentences,
        max_sentence_length: maxSentenceLength,
        use_contractions: useContractions,
        exclamation_frequency: exclamationFrequency
      },
      advanced_style: Object.keys(advancedStyle).length > 0 ? advancedStyle : undefined
    };

    setLoading(true);
    try {
      await onSave(voiceData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setProcessingMessage('');
    toast.error('Processing cancelled');
  };

  if (!isOpen) return null;

  const addTag = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[]) => {
    if (value.trim() && !current.includes(value.trim())) {
      setter([...current, value.trim()]);
    }
  };

  const removeTag = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[]) => {
    setter(current.filter((_, i) => i !== index));
  };

  return (
    <>
      <ProcessingModal
        isOpen={loading && !!processingMessage}
        message={processingMessage}
        onCancel={handleCancelProcessing}
      />

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingVoice ? 'Edit Brand Voice' : 'Add Brand Voice'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Name Field (Always Visible) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brand Voice Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Brand Voice, Campaign Voice"
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {!editingVoice && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Creation Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMethod('ai')}
                  className={`p-2 border-2 rounded-lg transition-all ${
                    method === 'ai'
                      ? 'border-primary-500 bg-white dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <Wand2 className={`mx-auto mb-1 ${method === 'ai' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} size={18} />
                  <div className="text-xs font-medium text-gray-900 dark:text-white">AI Generate</div>
                </button>
                <button
                  onClick={() => setMethod('preset')}
                  className={`p-2 border-2 rounded-lg transition-all ${
                    method === 'preset'
                      ? 'border-primary-500 bg-white dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <BookOpen className={`mx-auto mb-1 ${method === 'preset' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} size={18} />
                  <div className="text-xs font-medium text-gray-900 dark:text-white">Use Preset</div>
                </button>
                <button
                  onClick={() => setMethod('manual')}
                  className={`p-2 border-2 rounded-lg transition-all ${
                    method === 'manual'
                      ? 'border-primary-500 bg-white dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <Settings className={`mx-auto mb-1 ${method === 'manual' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} size={18} />
                  <div className="text-xs font-medium text-gray-900 dark:text-white">Manual</div>
                </button>
              </div>
            </div>
          )}

          {/* AI Method */}
          {method === 'ai' && !editingVoice && (
            <div className="space-y-6 mb-6">
              {/* Manual Description Section */}
              <div className="p-4 bg-white dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Option 1: Describe the Brand</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Describe this brand in 1-2 sentences *
                    </label>
                    <textarea
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      rows={3}
                      placeholder="e.g., A luxury skincare brand that focuses on natural ingredients and sustainable practices..."
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Add sample text (optional)
                    </label>
                    <textarea
                      value={aiSampleText}
                      onChange={(e) => setAiSampleText(e.target.value)}
                      rows={3}
                      placeholder="Paste existing copy that represents this brand's voice..."
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={loading || !aiDescription.trim()}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Sparkles size={18} className="mr-2" />
                    {loading ? 'Generating...' : 'Generate Brand Voice'}
                  </button>
                </div>
              </div>

              {/* Paste Copy Section */}
              <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <FileText size={18} className="mr-2 text-green-600 dark:text-green-400" />
                  Option 2: Paste Any Copy
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Paste content from any source *
                    </label>
                    <textarea
                      value={pastedContent}
                      onChange={(e) => setPastedContent(e.target.value)}
                      rows={6}
                      placeholder="Paste text content from PDF, website, email, brochure, document, etc. (minimum 100 characters, up to 10,000 characters)"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      AI will analyze tone, vocabulary, rhythm, and writing style to generate a brand voice profile
                    </p>
                  </div>
                  <button
                    onClick={handleAnalyzePastedCopy}
                    disabled={loading || pastedContent.trim().length < 100}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <FileText size={18} className="mr-2" />
                    {loading ? 'Analyzing...' : 'Analyze & Generate Brand Voice'}
                  </button>
                </div>
              </div>

              {/* Website URL Scanning Section */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Globe size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                  Option 3: Scan Website for Brand Voice
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website URL *
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Analyzes homepage and about page for comprehensive brand voice extraction
                    </p>
                  </div>
                  <button
                    onClick={handleScanWebsite}
                    disabled={loading || !websiteUrl.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Globe size={18} className="mr-2" />
                    {loading ? 'Scanning Website...' : 'Scan & Generate Brand Voice'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preset Method */}
          {method === 'preset' && !editingVoice && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Preset
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => {
                  setSelectedPreset(e.target.value);
                  handlePresetSelect(e.target.value);
                }}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a preset...</option>
                {PRESET_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manual/Advanced Fields (shown after AI generation or preset selection or when editing) */}
          {(method === 'manual' || (method === 'preset' && selectedPreset) || editingVoice) && (
            <div className="space-y-4">
              {editingVoice && (
                <button
                  onClick={() => {
                    setAiDescription(description);
                    setMethod('ai');
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center mb-4"
                >
                  <Sparkles size={16} className="mr-2" />
                  Regenerate with AI
                </button>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={1}
                  placeholder="Brief description of this brand voice"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personality Traits
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {personalityTraits.map((trait, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm flex items-center"
                    >
                      {trait}
                      <button
                        onClick={() => removeTag(idx, setPersonalityTraits, personalityTraits)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value, setPersonalityTraits, personalityTraits);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone Style
                  </label>
                  <input
                    type="text"
                    value={toneStyle}
                    onChange={(e) => setToneStyle(e.target.value)}
                    placeholder="e.g., conversational, formal"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sentence Style
                  </label>
                  <input
                    type="text"
                    value={sentenceStyle}
                    onChange={(e) => setSentenceStyle(e.target.value)}
                    placeholder="e.g., short and punchy"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Vocabulary
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {preferredVocabulary.map((word, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm flex items-center"
                    >
                      {word}
                      <button
                        onClick={() => removeTag(idx, setPreferredVocabulary, preferredVocabulary)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value, setPreferredVocabulary, preferredVocabulary);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Forbidden Terms
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {forbiddenTerms.map((term, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm flex items-center"
                    >
                      {term}
                      <button
                        onClick={() => removeTag(idx, setForbiddenTerms, forbiddenTerms)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value, setForbiddenTerms, forbiddenTerms);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CTA Style
                </label>
                <select
                  value={ctaStyle}
                  onChange={(e) => setCtaStyle(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select CTA style...</option>
                  <option value="direct-action">Direct Action</option>
                  <option value="subtle-invitation">Subtle Invitation</option>
                  <option value="friendly-invitation">Friendly Invitation</option>
                  <option value="enthusiastic-action">Enthusiastic Action</option>
                  <option value="consultative-invitation">Consultative Invitation</option>
                  <option value="urgent-action">Urgent Action</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Punctuation Rules
                </label>
                <div className="space-y-3 pl-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useOxfordComma}
                      onChange={(e) => setUseOxfordComma(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Use Oxford comma</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferShortSentences}
                      onChange={(e) => setPreferShortSentences(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Prefer short sentences</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useContractions}
                      onChange={(e) => setUseContractions(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Use contractions</span>
                  </label>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Max sentence length: {maxSentenceLength} words
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      value={maxSentenceLength}
                      onChange={(e) => setMaxSentenceLength(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Exclamation frequency
                    </label>
                    <select
                      value={exclamationFrequency}
                      onChange={(e) => setExclamationFrequency(e.target.value as 'rare' | 'moderate' | 'frequent')}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="rare">Rare</option>
                      <option value="moderate">Moderate</option>
                      <option value="frequent">Frequent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Advanced Style Controls */}
              <AdvancedStyleControls
                advancedStyle={advancedStyle}
                onChange={setAdvancedStyle}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Saving...' : editingVoice ? 'Save Changes' : 'Save Brand Voice'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default BrandVoiceModal;
