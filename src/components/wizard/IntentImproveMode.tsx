import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Award, Check, Copy, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { polishContent } from '../../features/quickPolish/quickPolishService';
import { INTENT_PRESETS, TONE_OPTIONS } from '../../features/quickPolish/intents';
import { PolishResultItem, QuickPolishInput, ContentType } from '../../features/quickPolish/types';
import { buildWhyThisVersion, getWhyThisVersionLabel } from '../../features/quickPolish/microConfirmation';
import { selectRecommendedVariant } from '../../features/quickPolish/variantRecommendation';
import { trackTokenUsage } from '../../services/api/tokenTracking';
import { detectLanguage } from '../../utils/languageDetection';
import { User, Model, FormState } from '../../types';
import { mapQuickPolishTone } from '../../features/quickPolish/toneMapping';

interface IntentImproveModeProps {
  currentUser?: User;
  selectedModel?: Model;
  isGenerating: boolean;
  onGeneratingChange: (value: boolean) => void;
  onApplyToForm: (data: Partial<FormState>) => void;
  onBack: () => void;
}

const countWords = (value: string): number => value.trim().split(/\s+/).filter(Boolean).length;

const IntentImproveMode: React.FC<IntentImproveModeProps> = ({
  currentUser,
  selectedModel,
  isGenerating,
  onGeneratingChange,
  onApplyToForm,
  onBack,
}) => {
  const [inputText, setInputText] = useState('');
  const [contentType, setContentType] = useState<ContentType>('plain');
  const [intentId, setIntentId] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [tone, setTone] = useState('neutral');
  const [toneManuallySet, setToneManuallySet] = useState(false);
  const [cta, setCta] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [variantsCount, setVariantsCount] = useState<1 | 2 | 3>(1);
  const [results, setResults] = useState<PolishResultItem[]>([]);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [refineTargetIndex, setRefineTargetIndex] = useState<number | null>(null);
  const [refineNotes, setRefineNotes] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const selectedPreset = INTENT_PRESETS.find((preset) => preset.id === intentId);
  const showAudience = selectedPreset?.fields.includes('audience') ?? false;
  const showGoal = selectedPreset?.fields.includes('goal') ?? false;
  const showTone = selectedPreset?.fields.includes('tone') ?? false;
  const showCta = selectedPreset?.fields.includes('cta') ?? false;
  const recommendedVariantIndex = useMemo(
    () => results.length > 1 ? selectRecommendedVariant(results, goal) : 0,
    [results, goal]
  );

  useEffect(() => {
    if (intentId && !toneManuallySet) {
      const preset = INTENT_PRESETS.find((item) => item.id === intentId);
      if (preset) setTone(preset.defaultTone);
    }
  }, [intentId, toneManuallySet]);

  const buildInput = (sourceText: string, count: 1 | 2 | 3): QuickPolishInput => {
    const input: QuickPolishInput = { inputText: sourceText, contentType, intentId, variantsCount: count };
    if (showAudience && audience) input.audience = audience;
    if (showGoal && goal) input.goal = goal;
    if (showTone && tone) input.tone = tone;
    if (showCta && cta) input.cta = cta;
    if (specialInstructions) input.specialInstructions = specialInstructions;
    return input;
  };

  const recordUsage = async (result: { usage?: { prompt_tokens?: number; completion_tokens?: number; reasoning_tokens?: number }; modelUsed: string }) => {
    if (!currentUser?.id || !result.usage) return;
    try {
      await trackTokenUsage(
        currentUser,
        (result.usage.prompt_tokens || 0) + (result.usage.completion_tokens || 0),
        result.modelUsed,
        'quick-polish',
        null,
        0,
        undefined,
        {
          inputTokens: result.usage.prompt_tokens || 0,
          outputTokens: result.usage.completion_tokens || 0,
          reasoningTokens: result.usage.reasoning_tokens || 0,
        }
      );
    } catch (error) {
      console.error('Token tracking failed:', error);
    }
  };

  const handlePolish = async () => {
    if (!inputText.trim()) return toast.error('Please enter text to polish');
    if (!intentId) return toast.error('Please select an intent');

    onGeneratingChange(true);
    setResults([]);
    setSelectedOutputIndex(null);
    try {
      const result = await polishContent(buildInput(inputText, variantsCount));
      setResults(result.variants.map((text) => ({ text, sourceText: inputText, intentId, tone, contentType, isRefined: false })));
      await recordUsage(result);
      toast.success('Content polished successfully!');
    } catch (error) {
      console.error('Polish error:', error);
      toast.error('Polish failed. Please try again.');
    } finally {
      onGeneratingChange(false);
    }
  };

  const handleRefine = async () => {
    if (refineTargetIndex === null || !results[refineTargetIndex]) return;
    onGeneratingChange(true);
    setIsRefining(true);
    const target = results[refineTargetIndex];
    try {
      const input = buildInput(target.text, 1);
      const notes = [specialInstructions && `Special Instructions (original): ${specialInstructions}`, refineNotes.trim() && `Refinement Notes: ${refineNotes.trim()}`].filter(Boolean).join('\n');
      if (notes) input.specialInstructions = notes;
      const result = await polishContent(input);
      setResults((previous) => [...previous, ...result.variants.map((text) => ({ text, sourceText: target.text, intentId, tone, contentType, isRefined: true }))]);
      await recordUsage(result);
      toast.success('Refinement complete!');
    } catch (error) {
      console.error('Refinement error:', error);
      toast.error('Refinement failed. Please try again.');
    } finally {
      setIsRefining(false);
      onGeneratingChange(false);
      setRefineTargetIndex(null);
      setRefineNotes('');
    }
  };

  const handleContinue = () => {
    if (selectedOutputIndex === null || !results[selectedOutputIndex]) return toast.error('Please select an output first');
    const selected = results[selectedOutputIndex];
    const originalInputWordCount = countWords(inputText);
    const mapped: Partial<FormState> = {
      model: selectedModel,
      tab: 'improve',
      originalCopy: selected.text,
      targetAudience: audience,
      keyMessage: goal,
      callToAction: cta,
      language: detectLanguage(inputText),
      tone: mapQuickPolishTone(tone),
      wordCount: 'Custom',
      customWordCount: originalInputWordCount,
      specialInstructions,
      projectDescription: selectedPreset?.label || 'Improve existing copy',
      productServiceName: selectedPreset?.label || 'Improve existing copy',
      generateSeoMetadata: false,
      templatePrefilledFields: ['originalCopy', 'targetAudience', 'keyMessage', 'callToAction', 'language', 'tone', 'wordCount', 'customWordCount', 'specialInstructions'],
      copyResult: { generatedVersions: [] },
      isLoading: false,
      isEvaluating: false,
      generationProgress: [],
    };
    onApplyToForm(mapped);
    toast.success('Improved copy loaded into Copy Maker');
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} disabled={isGenerating} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
        ← Back to Mode Selection
      </button>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Improve existing copy</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Choose the purpose first, then polish only what the copy needs.</p>
      </div>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
        <div className="flex items-center justify-between"><label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Paste your copy</label><span className="text-xs text-gray-500">{countWords(inputText)} words</span></div>
        <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder="Paste your text here..." disabled={isGenerating} className="w-full min-h-[150px] rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-gray-900 dark:text-gray-100 resize-y" />
        <div className="flex gap-2">
          {(['plain', 'html'] as ContentType[]).map((value) => <button key={value} onClick={() => setContentType(value)} disabled={isGenerating} className={`rounded-md px-3 py-1.5 text-xs font-medium ${contentType === value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{value === 'plain' ? 'Plain text' : 'HTML'}</button>)}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pick an intent</label>
        <select value={intentId} onChange={(event) => { setIntentId(event.target.value); setToneManuallySet(false); }} disabled={isGenerating} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-gray-900 dark:text-gray-100">
          <option value="">Select an intent...</option>
          {INTENT_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
        </select>
        {selectedPreset && <p className="text-xs text-gray-500 dark:text-gray-400">{selectedPreset.description}</p>}
      </section>

      {(showAudience || showGoal || showTone || showCta) && <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        {showAudience && <Field label="Who is this for?" value={audience} onChange={setAudience} placeholder="e.g., Small business owners, Tech professionals..." disabled={isGenerating} />}
        {showGoal && <Field label="What is it for / desired outcome?" value={goal} onChange={setGoal} placeholder="e.g., Drive conversions, Increase engagement..." disabled={isGenerating} />}
        {showTone && <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Tone</label><select value={tone} onChange={(event) => { setTone(event.target.value); setToneManuallySet(true); }} disabled={isGenerating} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-gray-900 dark:text-gray-100">{TONE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>}
        {showCta && <Field label="Call to Action" value={cta} onChange={setCta} placeholder="e.g., Sign up now, Learn more..." disabled={isGenerating} />}
      </section>}

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-2"><label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Special Instructions <span className="font-normal text-gray-500">(optional)</span></label><textarea value={specialInstructions} onChange={(event) => setSpecialInstructions(event.target.value)} disabled={isGenerating} placeholder={'Keep it under 80 words\nAvoid buzzwords\nKeep the first sentence unchanged\nDo not add new claims\nUse simple, clear language'} className="w-full min-h-[96px] rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 resize-y" /><p className="text-xs text-gray-500 dark:text-gray-400">Optional constraints for polishing (length, wording, style). These will NOT change the selected intent.</p></section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"><label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Number of Variants</label><div className="grid grid-cols-3 gap-2">{([1, 2, 3] as const).map((value) => <button key={value} onClick={() => setVariantsCount(value)} disabled={isGenerating} className={`rounded-md py-2 text-sm font-medium ${variantsCount === value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>{value}</button>)}</div></section>

      {results.map((result, index) => { const why = buildWhyThisVersion({ outputText: result.text, intentId: result.intentId, isRefined: result.isRefined, contentType: result.contentType, languageCode: 'en' }); const recommended = results.length > 1 && index === recommendedVariantIndex; return <article key={`${index}-${result.text.slice(0, 12)}`} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3"><div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"><input type="radio" name="wizard-output" checked={selectedOutputIndex === index} onChange={() => setSelectedOutputIndex(index)} />{result.isRefined ? 'Refined' : `Variant ${index + 1}`}</label><div className="flex gap-3"><button onClick={() => { setRefineTargetIndex(index); setRefineNotes(''); }} disabled={isGenerating} className="text-sm text-blue-600"><Sparkles size={15} className="inline mr-1" />Refine</button><button onClick={async () => { await navigator.clipboard.writeText(result.text); setCopiedIndex(index); toast.success('Copied to clipboard'); }} className="text-sm text-gray-600 dark:text-gray-300">{copiedIndex === index ? <><Check size={15} className="inline mr-1" />Copied</> : <><Copy size={15} className="inline mr-1" />Copy</>}</button></div></div>{recommended && <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 text-xs text-blue-700 dark:text-blue-300"><Award size={14} className="inline mr-1" />Recommended starting point</div>}{why && <p className="rounded-md bg-gray-50 dark:bg-gray-800 p-3 text-xs text-gray-600 dark:text-gray-300"><strong>{getWhyThisVersionLabel('en')}:</strong> {why}</p>}<p className="whitespace-pre-wrap rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-sm leading-6 text-gray-900 dark:text-gray-100">{result.text}</p></article>; })}

      {refineTargetIndex !== null && <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4 space-y-3"><label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Refinement notes</label><textarea value={refineNotes} onChange={(event) => setRefineNotes(event.target.value)} placeholder="e.g., Make it more concise, emphasize the main benefit..." disabled={isRefining} className="w-full min-h-[80px] rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm" /><div className="flex justify-end gap-2"><button onClick={() => setRefineTargetIndex(null)} disabled={isRefining} className="px-3 py-2 text-sm text-gray-600">Cancel</button><button onClick={handleRefine} disabled={isRefining} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">{isRefining ? 'Refining...' : 'Apply Refinement'}</button></div></div>}

      <div className="sticky bottom-0 flex gap-3 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 py-4 backdrop-blur"><button onClick={handlePolish} disabled={isGenerating || !inputText.trim() || !intentId} className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:opacity-50">{isGenerating ? <><Loader2 size={18} className="inline mr-2 animate-spin" />Polishing...</> : results.length ? 'Polish Again' : 'Polish'}</button>{results.length > 0 && <button onClick={handleContinue} disabled={isGenerating || selectedOutputIndex === null} className="flex-1 rounded-lg bg-gray-900 py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900">Continue in Copy Maker <ArrowRight size={18} className="inline ml-1" /></button>}</div>
    </div>
  );
};

interface FieldProps { label: string; value: string; onChange: (value: string) => void; placeholder: string; disabled: boolean; }
const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder, disabled }) => <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100" /></div>;

export default IntentImproveMode;
