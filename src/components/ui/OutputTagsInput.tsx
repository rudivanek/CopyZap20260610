import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Tag } from 'lucide-react';

interface OutputTagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  predefinedTags: string[];
  placeholder?: string;
  className?: string;
}

const OutputTagsInput: React.FC<OutputTagsInputProps> = ({
  value = [],
  onChange,
  predefinedTags,
  placeholder = "Add tags...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [showPredefined, setShowPredefined] = useState<boolean>(false);
  const [filteredTags, setFilteredTags] = useState<string[]>(predefinedTags);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter tags based on input
  useEffect(() => {
    if (inputValue.trim()) {
      setFilteredTags(
        predefinedTags.filter(tag => 
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(tag)
        )
      );
    } else {
      setFilteredTags(predefinedTags.filter(tag => !value.includes(tag)));
    }
  }, [inputValue, predefinedTags, value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowPredefined(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.trim() && !showPredefined) {
      setShowPredefined(true);
    }
  };

  const handleInputFocus = () => {
    if (predefinedTags.length > 0) {
      setShowPredefined(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    } else if (e.key === 'Escape') {
      setShowPredefined(false);
    } else if (e.key === 'ArrowDown' && showPredefined) {
      // Handle focus moving to dropdown items
      const firstTag = document.querySelector('.predefined-tag');
      if (firstTag) {
        e.preventDefault();
        (firstTag as HTMLElement).focus();
      }
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === 'ArrowDown' && index < filteredTags.length - 1) {
      e.preventDefault();
      const nextTag = document.querySelector(`.predefined-tag:nth-child(${index + 2})`);
      if (nextTag) (nextTag as HTMLElement).focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) {
        if (inputRef.current) inputRef.current.focus();
      } else {
        const prevTag = document.querySelector(`.predefined-tag:nth-child(${index})`);
        if (prevTag) (prevTag as HTMLElement).focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addTag(filteredTags[index]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowPredefined(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const addTag = (tag: string) => {
    const formattedTag = tag.trim();
    if (!formattedTag) return;

    // If tag doesn't start with '<' and doesn't end with '>', wrap it
    let finalTag = formattedTag;
    if (!finalTag.startsWith('<')) finalTag = '<' + finalTag;
    if (!finalTag.endsWith('>')) finalTag = finalTag + '>';

    if (!value.includes(finalTag)) {
      onChange([...value, finalTag]);
    }
    setInputValue('');
    setShowPredefined(false);
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const selectPredefinedTag = (tag: string) => {
    addTag(tag);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Extract tag label for display
  const getTagLabel = (tag: string): string => {
    return tag.replace(/[<>]/g, '');
  };

  return (
    <div className="relative">
      <div className={`flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus-within:ring-1 focus-within:ring-primary-500 ${className}`}>
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, index) => (
            <span 
              key={`${tag}-${index}`} 
              className="flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-300"
            >
              <Tag size={12} className="text-primary-500" />
              {getTagLabel(tag)}
              <button 
                type="button" 
                onClick={() => removeTag(index)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
              >
                <X size={14} />
                <span className="sr-only">Remove</span>
              </button>
            </span>
          ))}
        </div>
        <div className="flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-700 dark:text-gray-100 placeholder-gray-500"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className="text-primary-500 hover:text-primary-400 p-1"
              title="Add tag"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
      
      {showPredefined && filteredTags.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg custom-scrollbar"
        >
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            Select a predefined tag or type your own
          </div>
          {filteredTags.map((tag, index) => (
            <div
              key={tag}
              className="predefined-tag px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-300 flex items-center text-sm"
              onClick={() => selectPredefinedTag(tag)}
              onKeyDown={(e) => handleTagKeyDown(e, index)}
              tabIndex={0}
            >
              <Tag size={12} className="text-primary-500 mr-2" />
              {tag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OutputTagsInput;