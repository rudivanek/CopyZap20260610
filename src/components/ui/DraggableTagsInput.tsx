import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, GripVertical, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface TagItem {
  id: string;
  label: string;
  value: string;
}

interface DraggableTagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string, label: string }[];
  placeholder?: string;
  className?: string;
}

const DraggableTagsInput: React.FC<DraggableTagsInputProps> = ({
  value = [],
  onChange,
  options,
  placeholder = "Select options...",
  className = ""
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Convert string array to TagItem array on component mount and when value changes
  useEffect(() => {
    const newTags = value.map(val => {
      const option = options.find(opt => opt.value === val);
      return {
        id: val,
        value: val,
        label: option?.label || val
      };
    });
    setTags(newTags);
  }, [value, options]);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowCustomInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when showing custom input
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);
  
  // Handle removing a tag
  const handleRemoveTag = (tagId: string) => {
    const newTags = tags.filter(tag => tag.id !== tagId);
    const newValues = newTags.map(tag => tag.value);
    onChange(newValues);
  };
  
  // Handle adding a tag
  const handleAddTag = (option: { value: string, label: string }) => {
    // Don't add if already selected
    if (tags.some(tag => tag.value === option.value)) {
      return;
    }
    
    const newTag = {
      id: option.value,
      value: option.value,
      label: option.label
    };
    
    const newTags = [...tags, newTag];
    onChange(newTags.map(tag => tag.value));
    setIsDropdownOpen(false);
  };
  
  // Handle adding a custom tag
  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    
    const customValue = customTagInput.trim();
    
    // Don't add if already selected
    if (tags.some(tag => tag.value === customValue)) {
      setCustomTagInput('');
      return;
    }
    
    const newTag = {
      id: `custom-${Date.now()}`,
      value: customValue,
      label: customValue
    };
    
    const newTags = [...tags, newTag];
    onChange(newTags.map(tag => tag.value));
    setCustomTagInput('');
    setShowCustomInput(false);
  };
  
  // Handle key press for custom tag input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setIsDropdownOpen(true);
    }
  };
  
  // Handle drag end
  const onDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    const items = Array.from(tags);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setTags(items);
    onChange(items.map(tag => tag.value));
  };
  
  // Filter options that haven't been selected yet
  const availableOptions = options.filter(
    option => !tags.some(tag => tag.value === option.value)
  );

  const handleContainerClick = (e: React.MouseEvent) => {
    if (showCustomInput) {
      // If custom input is already shown, don't toggle dropdown
      return;
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div ref={containerRef} className="relative">
      <div 
        className={`flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus-within:ring-1 focus-within:ring-primary-500 cursor-pointer ${className}`}
        onClick={handleContainerClick}
      >
        <div className="flex flex-wrap gap-1.5 w-full">
          {tags.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="tags" direction="horizontal">
                {(provided) => (
                  <div 
                    className="flex flex-wrap gap-1.5"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {tags.map((tag, index) => (
                      <Draggable key={tag.id} draggableId={tag.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-grab mr-1 text-gray-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={12} />
                            </div>
                            <Tag size={12} className="text-primary-500" />
                            <span>{tag.label}</span>
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(tag.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
                            >
                              <X size={14} />
                              <span className="sr-only">Remove</span>
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
          
          {showCustomInput && (
            <div 
              className="flex items-center gap-1 flex-grow"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white"
                placeholder="Enter custom format..."
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                className={`p-1 rounded-full ${
                  customTagInput.trim() 
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
                  setIsDropdownOpen(true);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {tags.length === 0 && !showCustomInput && (
            <div className="text-gray-500 text-sm">{placeholder}</div>
          )}
        </div>
      </div>
      
      {isDropdownOpen && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg custom-scrollbar">
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            Select format options
          </div>
          
          {/* Add custom tag option */}
          <div
            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-primary-500 flex items-center text-sm font-medium border-b border-gray-200 dark:border-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(false);
              setShowCustomInput(true);
            }}
          >
            <Plus size={12} className="mr-2" />
            Add custom format option
          </div>
          
          {availableOptions.length > 0 ? (
            availableOptions.map((option) => (
              <div
                key={option.value}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-300 flex items-center text-sm"
                onClick={() => handleAddTag(option)}
              >
                <Tag size={12} className="text-primary-500 mr-2" />
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm italic">
              All options have been selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DraggableTagsInput;