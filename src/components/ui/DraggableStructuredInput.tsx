import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, GripVertical, Plus, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import { StructuredOutputElement } from '../../types';
import { OUTPUT_STRUCTURE_OPTIONS } from '../../constants';

interface DraggableStructuredInputProps {
  value: StructuredOutputElement[];
  onChange: (value: StructuredOutputElement[]) => void;
  options?: { value: string, label: string }[];
  placeholder?: string;
  className?: string;
}

const DraggableStructuredInput: React.FC<DraggableStructuredInputProps> = ({
  value = [],
  onChange,
  options = OUTPUT_STRUCTURE_OPTIONS,
  placeholder = "Select structure elements and assign word counts...",
  className = ""
}) => {
  // Ensure all elements have string IDs for react-beautiful-dnd
  const normalizedValue = value.map(element => ({
    ...element,
    id: typeof element.id === 'string' ? element.id : uuidv4()
  }));

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customWordCount, setCustomWordCount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update dropdown position when opened
  useEffect(() => {
    if (isDropdownOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Fixed elements position relative to viewport, NOT document
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
      console.log('Dropdown position set:', {
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        isDropdownOpen,
        showCustomInput
      });

      // Debug: Check dropdown element after a short delay
      setTimeout(() => {
        if (dropdownRef.current) {
          const styles = window.getComputedStyle(dropdownRef.current);
          const dropdownRect = dropdownRef.current.getBoundingClientRect();
          const centerX = dropdownRect.left + dropdownRect.width / 2;
          const centerY = dropdownRect.top + dropdownRect.height / 2;
          const elementAtCenter = document.elementFromPoint(centerX, centerY);

          console.log('Dropdown computed styles:', {
            pointerEvents: styles.pointerEvents,
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            zIndex: styles.zIndex,
            position: styles.position
          });

          console.log('Element at dropdown center:', {
            element: elementAtCenter,
            isDropdown: elementAtCenter === dropdownRef.current,
            isInDropdown: dropdownRef.current.contains(elementAtCenter as Node)
          });
        } else {
          console.log('dropdownRef.current is NULL after render');
        }
      }, 150);
    }
  }, [isDropdownOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;

    // Small delay to ensure dropdown is rendered and ref is attached
    const timer = setTimeout(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        console.log('Click outside handler fired', {
          target: target,
          containerContains: containerRef.current?.contains(target),
          dropdownContains: dropdownRef.current?.contains(target),
          dropdownRefExists: !!dropdownRef.current,
          isDropdownOpen
        });

        // Only close if dropdown exists and click is outside both container and dropdown
        if (
          containerRef.current &&
          !containerRef.current.contains(target)
        ) {
          // If dropdown ref doesn't exist yet or click is outside dropdown
          if (!dropdownRef.current || !dropdownRef.current.contains(target)) {
            console.log('Closing dropdown via click outside');
            setIsDropdownOpen(false);
            setShowCustomInput(false);
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside, true); // Use capture phase

      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [isDropdownOpen]);

  // Handle removing an element
  const handleRemoveElement = (index: number) => {
    const newElements = [...normalizedValue];
    newElements.splice(index, 1);
    onChange(newElements);
  };
  
  // Handle adding an element from dropdown
  const handleAddElement = (option: { value: string, label: string }) => {
    // Don't add if already selected
    if (normalizedValue.some(el => el.value === option.value)) {
      return;
    }

    const newElement: StructuredOutputElement = {
      id: uuidv4(),
      value: option.value,
      label: option.label,
      wordCount: null
    };

    const newValue = [...normalizedValue, newElement];
    onChange(newValue);
    setIsDropdownOpen(false);
  };
  
  // Handle adding a custom element
  const handleAddCustomElement = () => {
    if (!customTagInput.trim()) return;
    
    const customValue = customTagInput.trim();
    const wordCount = customWordCount ? parseInt(customWordCount, 10) : null;
    
    // Don't add if already selected
    if (normalizedValue.some(el => el.value === customValue)) {
      setCustomTagInput('');
      setCustomWordCount('');
      return;
    }
    
    const newElement: StructuredOutputElement = {
      id: uuidv4(),
      value: customValue,
      label: customValue,
      wordCount: isNaN(wordCount as number) ? null : wordCount
    };
    
    onChange([...normalizedValue, newElement]);
    setCustomTagInput('');
    setCustomWordCount('');
    setShowCustomInput(false);
  };
  
  // Handle word count change
  const handleWordCountChange = (index: number, newWordCount: string) => {
    const parsedCount = parseInt(newWordCount, 10);
    const newElements = [...normalizedValue];
    newElements[index] = {
      ...newElements[index],
      wordCount: isNaN(parsedCount) ? null : parsedCount
    };
    onChange(newElements);
  };
  
  // Handle drag end
  const onDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    const items = Array.from(normalizedValue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onChange(items);
  };
  
  // Filter options that haven't been selected yet
  const availableOptions = options.filter(
    option => !normalizedValue.some(el => el.value === option.value)
  );

  // Calculate total word count from elements with word counts
  const totalWordCount = normalizedValue.reduce((sum, element) => {
    return sum + (element.wordCount || 0);
  }, 0);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`min-h-[60px] w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus-within:ring-1 focus-within:ring-primary-500 cursor-pointer ${className}`}
        onClick={() => {
          console.log('DraggableStructuredInput clicked', { showCustomInput, isDropdownOpen, availableOptionsLength: availableOptions.length });
          if (!showCustomInput && !isDropdownOpen) {
            setIsDropdownOpen(true);
          }
        }}
      >
        {normalizedValue.length > 0 ? (
          <div className="w-full">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div 
                    className="w-full space-y-2"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {normalizedValue.map((element, index) => (
                      <Draggable key={element.id} draggableId={String(element.id)} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 p-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-grab text-gray-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={16} />
                            </div>
                            
                            <Tag size={14} className="text-primary-500" />
                            <span className="flex-grow">{element.label || element.value}</span>
                            
                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min="0"
                                placeholder="Words"
                                value={element.wordCount || ''}
                                onChange={(e) => handleWordCountChange(index, e.target.value)}
                                className="w-20 h-7 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md"
                                aria-label={`Word count for ${element.label || element.value}`}
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRemoveElement(index)}
                                className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* Show total word count if any sections have word counts */}
                    {totalWordCount > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700 mt-2">
                        Total allocated: <span className="font-medium">{totalWordCount}</span> words
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ) : (
          <div className="text-gray-500 text-sm w-full py-4 text-center">{placeholder}</div>
        )}
        
        {/* Custom input section */}
        {showCustomInput && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Add Custom Structure Element
            </div>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="customElement" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  Element Name
                </label>
                <input
                  id="customElement"
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="e.g., Problem Statement"
                  className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5"
                  autoFocus
                />
              </div>
              
              <div>
                <label htmlFor="customWordCount" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  Word Count (optional)
                </label>
                <input
                  id="customWordCount"
                  type="number"
                  min="0"
                  value={customWordCount}
                  onChange={(e) => setCustomWordCount(e.target.value)}
                  placeholder="e.g., 200"
                  className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5"
                />
              </div>
              
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomTagInput('');
                    setCustomWordCount('');
                    setIsDropdownOpen(true);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomElement}
                  disabled={!customTagInput.trim()}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    customTagInput.trim() 
                      ? 'bg-primary-600 hover:bg-gray-1000 text-white' 
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Check size={14} className="inline mr-1.5" />
                  Add Element
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Dropdown - Rendered via Portal */}
      {isDropdownOpen && !showCustomInput && (() => {
        console.log('Portal rendering with:', { isDropdownOpen, showCustomInput, position: dropdownPosition });
        return createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] max-h-60 overflow-auto bg-white dark:bg-gray-900 border-2 border-primary-500 dark:border-primary-500 rounded-md shadow-2xl"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              minHeight: '100px',
              pointerEvents: 'auto'
            }}
            onMouseDown={(e) => {
              console.log('Dropdown mousedown fired');
              e.stopPropagation();
            }}
            onClick={(e) => {
              console.log('Dropdown click fired');
              e.stopPropagation();
            }}
          >
            <div className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              Select structure elements ({availableOptions.length} available)
            </div>

          {/* Add custom element option */}
          <div
            className="px-3 py-3 hover:bg-gray-100 dark:hover:bg-primary-900/20 cursor-pointer text-primary-600 dark:text-primary-400 flex items-center text-sm font-medium border-b border-gray-200 dark:border-gray-700"
            onMouseDown={(e) => {
              console.log('Custom element button clicked');
              e.preventDefault();
              e.stopPropagation();
              setIsDropdownOpen(false);
              setShowCustomInput(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add custom structure element
          </div>

          {/* Available predefined options */}
          {availableOptions.length > 0 ? (
            availableOptions.map((option) => (
              <div
                key={option.value}
                className="px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-900 dark:text-gray-100 flex items-center text-sm border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  console.log('=== OPTION MOUSEDOWN ===');
                  console.log('Mouse down on option:', option.label);
                  console.log('Current value:', normalizedValue);
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(option);
                  console.log('After adding, dropdown should close');
                }}
              >
                <Tag size={14} className="text-primary-500 mr-2 flex-shrink-0" />
                <span className="flex-1">{option.label}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-gray-500 dark:text-gray-400 text-sm italic">
              All options have been selected
            </div>
          )}
        </div>,
        document.body
      );
      })()}
    </div>
  );
};

// Add display name for better debugging
DraggableStructuredInput.displayName = "DraggableStructuredInput";

export default DraggableStructuredInput;