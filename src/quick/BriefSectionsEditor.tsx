import React, { useState } from 'react';
import { BriefSection, BRIEF_SECTION_OPTIONS, briefSectionOption, makeBriefSection } from '../engine/generateFromBrief';

interface Props {
  sections: BriefSection[];
  onChange: (sections: BriefSection[]) => void;
  disabled: boolean;
}

const buttonClass =
  'min-h-[40px] px-3 border text-sm font-medium bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500';
const fieldClass =
  'w-full min-h-[44px] px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 ' +
  'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
const addButtonClass =
  'min-h-[40px] px-4 border text-sm font-medium bg-primary-500 border-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500';

const BriefSectionsEditor: React.FC<Props> = ({ sections, onChange, disabled }) => {
  const [addKey, setAddKey] = useState<string>('');
  const [customName, setCustomName] = useState('');

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
    const words = raw === '' ? null : Math.max(0, Number(raw));
    if (raw !== '' && (!Number.isFinite(words as number) || (words as number) < 0)) return;
    onChange(sections.map((section, i) => (i === index ? { ...section, words } : section)));
  };

  const availableOptions = BRIEF_SECTION_OPTIONS.filter(option => option.key !== 'custom' && !sections.some(section => section.key === option.key));

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
      <ol className="flex flex-col gap-2">
        {sections.map((section, index) => {
          const option = briefSectionOption(section.key);
          const isFirst = index === 0;
          const isLast = index === sections.length - 1;
          return (
            <li key={section.id} className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
                {section.label}
                {option.factsOnly && <span className="font-normal text-sm text-gray-500 dark:text-gray-400"> (only if facts exist)</span>}
              </span>
              <input
                type="number"
                min={20}
                max={1500}
                value={section.words ?? ''}
                onChange={event => setWords(index, event.target.value)}
                disabled={disabled}
                placeholder="auto"
                className={`${fieldClass} w-24 min-h-[40px] px-2`}
                aria-label={`Word count for ${section.label}`}
              />
              <button type="button" onClick={() => move(index, -1)} disabled={disabled || isFirst} className={buttonClass} aria-label={`Move ${section.label} up`}>
                ↑
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={disabled || isLast} className={buttonClass} aria-label={`Move ${section.label} down`}>
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
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <select value={addKey} onChange={event => setAddKey(event.target.value)} disabled={disabled || availableOptions.length === 0} className={`${fieldClass} flex-1`}>
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
            placeholder="Your own section"
            className={`${fieldClass} flex-1`}
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
