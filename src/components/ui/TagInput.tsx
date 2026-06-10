import React, { useState, KeyboardEvent, useRef, useCallback, memo } from "react";
import { X, Plus } from "lucide-react";

interface TagInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
  disabled?: boolean;
  onTagAdded?: (tag: string) => void; // Callback for when a tag is added
}

const TagInput = memo(function TagInput({
  id,
  name,
  value,
  onChange,
  placeholder = "Add tag...",
  className = "",
  maxTags = 10,
  disabled = false,
  onTagAdded
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Parse tags from comma-separated string
  const tags = value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  
  // Focus the input when clicking on the container
  const handleContainerClick = useCallback(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Add tag on Enter or comma
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
    
    // Remove the last tag on Backspace if input is empty
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }, [disabled, inputValue, tags.length]);

  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim().replace(/,/g, "");
    if (!trimmedTag) return;

    // Don't add if we've reached the max tags
    if (maxTags && tags.length >= maxTags) return;

    // Notify parent component that a tag is being added
    if (onTagAdded) {
      onTagAdded(trimmedTag);
    }
    
    // Don't add if the tag already exists
    if (!tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      onChange(newTags.join(', '));
    }
    
    // Clear input and refocus
    setInputValue("");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [tags, onChange, maxTags, onTagAdded]);

  const removeTag = useCallback((indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    onChange(newTags.join(', '));
  }, [tags, onChange]);

  return (
    <div
      onClick={handleContainerClick}
      className={`flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary-500 ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${className}`}
    >
      {tags.map((tag, index) => (
        <div
          key={`${tag}-${index}`}
          className="flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
        >
          <span className="text-gray-700 dark:text-gray-300">{tag}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-1"
            >
              <X size={14} />
              <span className="sr-only">Remove tag</span>
            </button>
          )}
        </div>
      ))}
      <div className="flex-1 flex">
        <input
          ref={inputRef}
          id={id}
          name={name}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue) {
              addTag(inputValue);
            }
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="bg-transparent border-0 focus:ring-0 text-sm flex-1 text-gray-700 dark:text-gray-100 placeholder-gray-500 focus:outline-none"
          disabled={disabled || (maxTags && tags.length >= maxTags)}
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            className="text-primary-500 hover:text-primary-400 p-1"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

export default TagInput;