import React, { useState } from 'react';
import { BriefSection, BRIEF_SECTION_OPTIONS, briefSectionOption, makeBriefSection, suggestSectionWords } from '../engine/generateFromBrief';

interface Props {
  sections: BriefSection[];
  onChange: (sections: BriefSection[]) => void;
  disabled: boolean;
  /** The page's target length, used to suggest a word count for every section without one. */
  totalWords: number | null;
}

const buttonClass =
  'w-10 h-10 shrink-0 border text-sm font-medium bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500';
const inputBase =
  'min-h-[44px] px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
const wordsClass =
  'w-24 h-10 shrink-0 px-2 text-right tabular-nums bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
const addButtonClass =
  'min-h-[40px] px-4 shrink-0 border text-sm font-medium bg-primary-500 border-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500';

const BriefSectionsEditor: React.FC<Props> = ({ sections, onChange, disabled, totalWords }) => {
  const [addKey, setAddKey] = useState<string>('');
  const [customName, setCustomName] = useState('');

  const suggested = suggestSectionWords(sections, totalWords);
  const setTotal = sections.reduce((sum, section) => sum + (section.words ?? 0), 0);
  const suggestedTotal = suggested.reduce<number>(
    (sum, value, index) => sum + (sections[index].words ? 0 : value ?? 0),
    0
  );
  const anySet = sections.some(section => section.words);

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= sections.length) return;
    const updated = sections.slice();
    const [item] = updated.splice(index, 1);
    updated.splice(next, 0, item);
    onChange(updated);
  };

  const remove = (index: number) => {
    if (sections.length <= 1) return;
    onChange(sections.filter((_, i) => i !== index));
  };

  const setWords = (index: number, raw: string) => {
    if (raw === '') {
      onChange(sections.map((section, i) => (i === index ? { ...section, words: null } : section)));
      return;
    }
    const words = Math.round(Number(raw));
    if (!Number.isFinite(words) || words < 0) return;
    onChange(sections.map((section, i) => (i === index ? { ...section, words: words || null } : section)));
  };

  const availableOptions = BRIEF_SECTION_OPTIONS.filter(
    option => option.key !== 'custom' && !sections.some(section => section.key === option.key)
  );

  const addSelected = () => {
    if (!addKey) return;
    const option = BRIEF_SECTION_OPTIONS.find(item => item.key === addKey);
    if (!option) return;
    onChange([...sections, makeBriefSection(option.key)]);
    setAddKey('');
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    onChange([...sections, makeBriefSection('custom', name)]);
    setCustomName('');
  };

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700 border-y border-gray-200 dark:border-gray-700">
        {sections.map((section, index) => {
          const option = briefSectionOption(section.key);
          const isFirst = index === 0;
          const isLast = index === sections.length - 1;
          const hint = suggested[index];
          return (
            <li key={section.id} className="flex items-center gap-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 break-words">{section.label}</p>
                {option.factsOnly && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Only if facts exist</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min={20}
                  max={1500}
                  step={10}
                  value={section.words ?? ''}
                  onChange={event => setWords(index, event.target.value)}
                  disabled={disabled}
                  placeholder={hint ? `≈ ${hint}` : 'auto'}
                  className={wordsClass}
                  aria-label={`Word count for ${section.label}`}
                />
                <span className="w-10 text-sm text-gray-600 dark:text-gray-400">words</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={disabled || isFirst}
                  className={buttonClass}
                  aria-label={`Move ${section.label} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={disabled || isLast}
                  className={buttonClass}
                  aria-label={`Move ${section.label} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={disabled || sections.length <= 1}
                  className={buttonClass}
                  aria-label={`Remove ${section.label}`}
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {totalWords ? (
        <p className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
          {anySet
            ? `Set by you: ${setTotal.toLocaleString('en-US')} words · suggested for the rest: ${suggestedTotal.toLocaleString('en-US')} words.`
            : `Grey numbers are suggestions from the total length. Type a number to set a section yourself.`}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <select
            value={addKey}
            onChange={event => setAddKey(event.target.value)}
            disabled={disabled || availableOptions.length === 0}
            className={`${inputBase} flex-1 min-w-0`}
          >
            <option value="">{availableOptions.length === 0 ? 'No more sections to add' : 'Add a section…'}</option>
            {availableOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={addSelected} disabled={disabled || !addKey} className={addButtonClass}>
            Add
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customName}
            onChange={event => setCustomName(event.target.value)}
            disabled={disabled}
            placeholder="Your own section, e.g. Pricing"
            className={`${inputBase} flex-1 min-w-0`}
          />
          <button type="button" onClick={addCustom} disabled={disabled || !customName.trim()} className={addButtonClass}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default BriefSectionsEditor;
