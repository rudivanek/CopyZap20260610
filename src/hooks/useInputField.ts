import { useState, useEffect, useCallback } from 'react';

interface UseInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
}

export function useInputField({ value, onChange, suggestions = [] }: UseInputFieldProps) {
  // Local state for the input value
  const [inputValue, setInputValue] = useState(value);
  
  // Sync with parent state when it changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Handle input change (updates both local and parent state immediately)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  }, [onChange]);

  // Update parent state on blur (no longer needed but kept for compatibility)
  const handleBlur = useCallback(() => {
    onChange(inputValue);
  }, [inputValue, onChange]);

  return {
    inputValue,
    setInputValue,
    handleChange,
    handleBlur, 
    suggestions
  };
}