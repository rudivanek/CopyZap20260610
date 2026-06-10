import React, { useState, useEffect } from 'react';
import { X, Save, Globe, Lock } from 'lucide-react';
import { useInputField } from '../hooks/useInputField';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { User } from '../types';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tooltip } from './ui/Tooltip';

interface SavePrefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string, category: string, isPublic: boolean) => Promise<void>;
  mode: 'add' | 'edit' | 'clone';
  initialLabel?: string;
  currentUser?: User;
}

const SavePrefillModal: React.FC<SavePrefillModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mode,
  initialLabel = '',
  currentUser
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  
  const labelField = useInputField({
    value: initialLabel,
    onChange: (value) => {}
  });

  const categoryField = useInputField({
    value: '',
    onChange: (value) => {}
  });

  // Check if user can create public prefills using centralized admin service
  const { isAdmin: canCreatePublicPrefills } = useIsAdmin(currentUser);
  
  // Update the label field when initialLabel changes
  useEffect(() => {
    labelField.setInputValue(initialLabel);
  }, [initialLabel]);
  
  // Reset fields when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsPublic(false);
      categoryField.setInputValue('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!labelField.inputValue.trim()) {
      alert('Please provide a prefill label.');
      return;
    }
    
    if (!categoryField.inputValue.trim()) {
      alert('Please provide a category.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        labelField.inputValue.trim(), 
        categoryField.inputValue.trim(),
        isPublic
      );
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (mode) {
      case 'add': return 'Save New Prefill';
      case 'edit': return 'Update Prefill';
      case 'clone': return 'Save Cloned Prefill';
      default: return 'Save Prefill';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-black dark:text-white">
            {getModalTitle()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="prefillLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prefill Label *
            </label>
            <input
              type="text"
              id="prefillLabel"
              required
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="e.g., Homepage Hero Template, Product Launch Copy"
              value={labelField.inputValue}
              onChange={labelField.handleChange}
              onBlur={labelField.handleBlur}
              disabled={isSaving}
            />
          </div>
          
          <div>
            <label htmlFor="prefillCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <input
              type="text"
              id="prefillCategory"
              required
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="e.g., Homepage Templates, Email Marketing, Landing Pages"
              value={categoryField.inputValue}
              onChange={categoryField.handleChange}
              onBlur={categoryField.handleBlur}
              disabled={isSaving}
            />
          </div>
          
          {/* Public Prefill Section - Only show to authorized users */}
          {canCreatePublicPrefills && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked === true)}
                />
                <Label htmlFor="isPublic" className="cursor-pointer flex items-center">
                  {isPublic ? (
                    <Globe size={16} className="mr-1.5 text-gray-500" />
                  ) : (
                    <Lock size={16} className="mr-1.5 text-gray-500" />
                  )}
                  <span className="text-sm font-medium">
                    Make this prefill public for all users
                  </span>
                  <Tooltip content="Public prefills can be used by all users on the platform. They will appear in everyone's prefill list.">
                    <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                  </Tooltip>
                </Label>
              </div>
              
              {isPublic && (
                <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 p-2 rounded border border-gray-200 dark:border-gray-800">
                  <strong>Note:</strong> Public prefills will be visible to all users. Make sure you don't include any sensitive or proprietary information.
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 text-sm flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSaving || !labelField.inputValue.trim() || !categoryField.inputValue.trim()}
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin mr-2" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="spinnerGradientSPM" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b35" />
                      <stop offset="100%" stopColor="#ffa07a" />
                    </linearGradient>
                  </defs>
                  <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientSPM)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90, 150" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {mode === 'edit' ? 'Update Prefill' : 'Save Prefill'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePrefillModal;