import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, Plus, ChevronRight, ChevronDown, Check } from 'lucide-react';

interface Category {
  category: string;
  options: { value: string; label: string }[];
}

interface CategoryTagsInputProps {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
  placeholder?: string;
  className?: string;
}

const CategoryTagsInput: React.FC<CategoryTagsInputProps> = ({
  value = '',
  onChange,
  categories,
  placeholder = "Select options...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [customInput, setCustomInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse tags from comma-separated string
  const tags = value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setShowCustomInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize expanded state for all categories
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    categories.forEach(cat => {
      initialExpanded[cat.category] = false;
    });
    setExpandedCategories(initialExpanded);
  }, [categories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value && !showDropdown) {
      setShowDropdown(true);
    }
  };

  const handleInputFocus = () => {
    if (categories.length > 0 && !showCustomInput) {
      setShowDropdown(true);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput(e.target.value);
  };

  const addCustomTag = () => {
    if (!customInput.trim()) return;
    
    const newTag = customInput.trim();
    if (!tags.includes(newTag)) {
      onChange([...tags, newTag].join(', '));
    }
    setCustomInput('');
    setShowCustomInput(false);
    setShowDropdown(true);
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomInput('');
      setShowDropdown(true);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      onChange([...tags, tag].join(', '));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove).join(', '));
  };

  const filteredCategories = inputValue.trim() 
    ? categories.map(category => ({
        ...category,
        options: category.options.filter(option => 
          option.label.toLowerCase().includes(inputValue.toLowerCase())
        )
      })).filter(category => category.options.length > 0)
    : categories;

  return (
    <div ref={containerRef} className="relative">
      <div 
        className={`flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus-within:ring-1 focus-within:ring-primary-500 cursor-pointer ${className}`}
        onClick={() => {
          if (!showCustomInput) {
            setShowDropdown(true);
          }
        }}
      >
        <div className="flex flex-wrap gap-1.5 w-full">
          {tags.map((tag, index) => (
            <span 
              key={`${tag}-${index}`} 
              className="flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-300"
            >
              <Tag size={12} className="text-primary-500" />
              {tag}
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
              >
                <X size={14} />
                <span className="sr-only">Remove</span>
              </button>
            </span>
          ))}
          
          {showCustomInput ? (
            <div 
              className="flex items-center gap-1 flex-grow"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={handleCustomInputChange}
                onKeyDown={handleCustomKeyDown}
                className="flex-grow bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-700 dark:text-white"
                placeholder="Enter custom industry..."
                autoFocus
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customInput.trim()}
                className={`p-1 rounded-full ${
                  customInput.trim() 
                    ? 'text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800' 
                    : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                <Plus size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomInput('');
                  setShowDropdown(true);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              {!showCustomInput && tags.length === 0 && (
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  className="flex-grow bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-700 dark:text-white placeholder-gray-500"
                  placeholder={placeholder}
                />
              )}
              
              {!showCustomInput && tags.length > 0 && (
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  className="flex-grow bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-700 dark:text-white"
                  placeholder="Search or add more..."
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {showDropdown && !showCustomInput && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full max-h-72 overflow-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg custom-scrollbar"
        >
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            Select an industry or niche
          </div>
          
          {/* Add custom option */}
          <div
            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-primary-500 flex items-center text-sm font-medium border-b border-gray-200 dark:border-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              setShowCustomInput(true);
            }}
          >
            <Plus size={12} className="mr-2" />
            Add custom industry/niche
          </div>
          
          {/* Display filtered categories */}
          {filteredCategories.length === 0 ? (
            <div className="px-3 py-4 text-gray-500 dark:text-gray-400 text-center text-sm">
              No matching industries found
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.category} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
                {/* Category header - clickable to expand/collapse */}
                <div 
                  className="px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={() => toggleCategory(category.category)}
                >
                  <div className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                    {category.category}
                  </div>
                  {expandedCategories[category.category] ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </div>
                
                {/* Options for this category - shown when expanded */}
                {expandedCategories[category.category] && category.options.map((option) => (
                  <div
                    key={option.value}
                    className={`pl-6 pr-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center text-sm ${
                      tags.includes(option.label) 
                        ? 'bg-gray-100 dark:bg-gray-800 text-primary-500'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      if (tags.includes(option.label)) {
                        removeTag(option.label);
                      } else {
                        addTag(option.label);
                      }
                    }}
                  >
                    <Tag 
                      size={12} 
                      className={`mr-2 ${tags.includes(option.label) ? 'text-primary-500' : 'text-gray-400'}`} 
                    />
                    {option.label}
                    {tags.includes(option.label) && (
                      <span className="ml-auto text-primary-500">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryTagsInput;