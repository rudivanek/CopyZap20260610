import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FormState } from '../../types';
import { useMode } from '../../context/ModeContext';
import { detectLanguage, convertLanguageCodeToFormDataLanguage } from '../../utils/languageDetection';
import { polishContent } from '../../features/quickPolish/quickPolishService';
import { INTENT_PRESETS, TONE_OPTIONS } from '../../features/quickPolish/intents';
import { selectRecommendedVariant } from '../../features/quickPolish/variantRecommendation';
import { buildMicroConfirmation } from '../../features/quickPolish/microConfirmation';
import { ContentType, PolishResultItem, QuickPolishInput } from '../../features/quickPolish/types';
import { QUICK_POLISH_TONE_MAP } from '../../features/quickPolish/toneMapping';

interface PurposeRewriteModeProps {
  onApplyToForm?: (data: Partial<FormState>) => void;
  onClose?: () => void;
}

const countWords = (value: string): number => value.trim().split(/\s+/).filter(Boolean).length;

const PurposeRewriteMode: React.FC<PurposeRewriteModeProps> = ({ onApplyToForm, onClose }) => {
  const { forceAdvanced } = useMode();
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [refineIndex, setRefineIndex] = useState<number | null>(null);
  const [refineNotes, setRefineNotes] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const selectedPreset = INTENT_PRESETS.find((preset) => preset.id === intentId);
  const showField = (field: 'audience' | 'goal' | 'tone' | 'cta'): boolean => Boolean(selectedPreset?.fields.includes(field));
  const recommendedIndex = useMemo(
    () => results.length > 1 ? selectRecommendedVariant(results, goal) : 0,
    [results, goal]
  );

  useEffect(() => {
    if (selectedPreset?.defaultTone && !toneManuallySet) setTone(selectedPreset.defaultTone);
  }, [selectedPreset, toneManuallySet]);

  const buildInput = (text: string, count: 1 | 2 | 3, instructions?: string): QuickPolishInput => {
    const input: QuickPolishInput = { inputText: text, contentType, intentId, variantsCount: count };
    if (showField('audience') && audience) input.audience = audience;
    if (showField('goal') && goal) input.goal = goal;
    if (showField('tone') && tone) input.tone = tone;
    if (showField('cta') && cta) input.cta = cta;
    if (instructions) input.specialInstructions = instructions;
    return input;
  };

  const handlePolish = async (): Promise<void> => {
    if (!inputText.trim()) return void toast.error('Please enter text to polish');
    if (!intentId) return void toast.error('Please select an intent');
    setIsLoading(true);
    setResults([]);
    setSelectedIndex(null);
    try {
      const result = await polishContent(buildInput(inputText, variantsCount, specialInstructions));
      setResults(result.variants.map((text) => ({ text, sourceText: inputText, intentId, tone: tone || 'neutral', contentType, isRefined: false })));
      toast.success('Content polished successfully');
    } catch (error) {
      console.error('Polish error:', error);
      toast.error('Polish failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (): Promise<void> => {
    if (refineIndex === null || !results[refineIndex]) return;
    setIsRefining(true);
    try {
      const instructions = [specialInstructions && `Special Instructions (original): ${specialInstructions}`, refineNotes.trim() && `Refinement Notes: ${refineNotes.trim()}`].filter(Boolean).join('\n');
      const result = await polishContent(buildInput(results[refineIndex].text, 1, instructions));
      setResults((current) => [...current, ...result.variants.map((text) => ({ text, sourceText: results[refineIndex!].text, intentId, tone: tone || 'neutral', contentType, isRefined: true }))]);
      setRefineIndex(null);
      setRefineNotes('');
      toast.success('Refinement complete');
    } catch (error) {
      console.error('Refinement error:', error);
      toast.error('Refinement failed. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleContinue = (): void => {
    if (selectedIndex === null || !results[selectedIndex]) return void toast.error('Please select an output first');
    const originalWordCount = countWords(inputText);
    const detectedLanguage = convertLanguageCodeToFormDataLanguage(detectLanguage(inputText));
    forceAdvanced('wizard_apply');
    onApplyToForm?.({
      tab: 'improve',
      originalCopy: results[selectedIndex].text,
      section: selectedPreset?.label || undefined,
      targetAudience: audience || undefined,
      keyMessage: goal || undefined,
      callToAction: cta || undefined,
      tone: QUICK_POLISH_TONE_MAP[tone] ?? 'Professional',
      language: detectedLanguage,
      wordCount: 'Custom',
      customWordCount: originalWordCount,
      specialInstructions: specialInstructions || undefined,
    });
    toast.success('Selected output added to Copy Maker');
    onClose?.();
  };

  const handleCopy = async (text: string, index: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1600);
    } catch { toast.error('Failed to copy'); }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"><Sparkles className="h-6 w-6" /></div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Purpose Rewrite</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Rewrite existing copy around a clear purpose, audience, and tone.</p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between"><label className="text-sm font-semibold text-gray-900 dark:text-white">Paste your copy</label><span className="text-xs text-gray-500">{countWords(inputText)} words</span></div>
        <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} rows={7} placeholder="Paste the copy you want to rewrite..." className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
        <div className="mt-3 inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {(['plain', 'html'] as ContentType[]).map((value) => <button key={value} type="button" onClick={() => setContentType(value)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${contentType === value ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}>{value === 'plain' ? 'Plain text' : 'HTML'}</button>)}
        </div>
      </section>

      <section><h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Pick an intent</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{INTENT_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => setIntentId(preset.id)} className={`rounded-xl border p-4 text-left transition ${intentId === preset.id ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20 dark:bg-primary-900/20' : 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900'}`}><span className="block text-sm font-semibold text-gray-900 dark:text-white">{preset.label}</span><span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{preset.description}</span></button>)}</div></section>

      {selectedPreset && <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:grid-cols-2">
        {showField('audience') && <Field label="Audience" value={audience} onChange={setAudience} placeholder="Who should this speak to?" />}
        {showField('goal') && <Field label="Goal" value={goal} onChange={setGoal} placeholder="What should the copy achieve?" />}
        {showField('tone') && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tone<select value={tone} onChange={(event) => { setTone(event.target.value); setToneManuallySet(true); }} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">{TONE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
        {showField('cta') && <Field label="Call to action" value={cta} onChange={setCta} placeholder="What action should readers take?" />}
      </section>}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"><label className="text-sm font-semibold text-gray-900 dark:text-white">Special Instructions <span className="font-normal text-gray-400">(optional)</span></label><textarea value={specialInstructions} onChange={(event) => setSpecialInstructions(event.target.value)} rows={3} placeholder={"Keep it under 80 words\nAvoid buzzwords\nKeep the first sentence unchanged\nDo not add new claims\nUse simple, clear language"} className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white" /><p className="mt-2 text-xs text-gray-500">Optional constraints for polishing (length, wording, style). These will NOT change the selected intent.</p></section>

      <div className="flex flex-wrap items-center justify-between gap-4"><div><span className="mr-3 text-sm font-semibold text-gray-900 dark:text-white">Variants</span>{([1, 2, 3] as const).map((value) => <button key={value} type="button" onClick={() => setVariantsCount(value)} className={`mr-2 rounded-lg border px-4 py-2 text-sm ${variantsCount === value ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'}`}>{value}</button>)}</div><button type="button" onClick={handlePolish} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Polish copy</button></div>

      {results.length > 0 && <section className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose your rewrite</h3><span className="text-xs text-gray-500">Recommended option is highlighted</span></div>{results.map((result, index) => <article key={`${index}-${result.text.slice(0, 12)}`} className={`rounded-2xl border p-5 ${selectedIndex === index ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900`}><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-900 dark:text-white">Version {index + 1}</span>{index === recommendedIndex && results.length > 1 && <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">Recommended</span>}{result.isRefined && <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-800">Refined</span>}</div><button type="button" onClick={() => setSelectedIndex(index)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${selectedIndex === index ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>{selectedIndex === index ? <><Check className="mr-1 inline h-3.5 w-3.5" /> Selected</> : 'Select'}</button></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700 dark:text-gray-200">{result.text}</p><div className="mt-4 flex flex-wrap gap-2">{buildMicroConfirmation({ intentId: result.intentId, tone: result.tone, contentType: result.contentType, isRefined: result.isRefined, sourceText: result.sourceText, outputText: result.text }).map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">{tag}</span>)}</div><div className="mt-3 flex gap-2"><button type="button" onClick={() => void handleCopy(result.text, index)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">{copiedIndex === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy</button><button type="button" onClick={() => { setRefineIndex(index); setRefineNotes(''); }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300"><RefreshCw className="h-3.5 w-3.5" /> Refine</button></div></article>)}<button type="button" disabled={selectedIndex === null} onClick={handleContinue} className="w-full rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">Continue to Copy Maker</button></section>}

      {refineIndex !== null && <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-800 dark:bg-primary-900/20"><h3 className="text-sm font-semibold text-gray-900 dark:text-white">Refine this version</h3><textarea value={refineNotes} onChange={(event) => setRefineNotes(event.target.value)} rows={3} placeholder="What should change?" className="mt-3 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" /><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setRefineIndex(null)} className="rounded-lg px-3 py-2 text-sm text-gray-600">Cancel</button><button type="button" onClick={() => void handleRefine()} disabled={isRefining} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isRefining ? 'Refining...' : 'Apply refinement'}</button></div></div>}
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder: string }> = ({ label, value, onChange, placeholder }) => <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" /></label>;

export default PurposeRewriteMode;

export default PurposeRewriteMode