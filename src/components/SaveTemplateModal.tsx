import React, { useState, useEffect } from 'react';
import { X, Check, Globe, Lock, AlertCircle, Bookmark } from 'lucide-react';
import { useInputField } from '../hooks/useInputField';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { FormState } from '../types';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tooltip } from './ui/Tooltip';
import { useAuth } from '../hooks/useAuth';
import { getUniqueTemplateCategories } from '../services/supabaseClient';
import CategoryTagsInput from './ui/CategoryTagsInput';
import { SaveAsNewTemplateModal } from './SaveAsNewTemplateModal';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateName: string, description: string, formStateToSave: FormState, forceSaveAsNew?: boolean, category?: string, existingTemplateId?: string) => Promise<void>;
  onSaveSuccess?: () => void;
  initialTemplateName?: string;
  initialDescription?: string;
  initialCategory?: string;
  formStateToSave: FormState;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveSuccess,
  initialTemplateName = '',
  initialDescription = '',
  initialCategory = '',
  formStateToSave
}) => {
  const { currentUser } = useAuth();

  const templateNameField = useInputField({
    value: initialTemplateName,
    onChange: (value) => {}
  });

  const descriptionField = useInputField({
    value: initialDescription,
    onChange: (value) => {}
  });

  const [category, setCategory] = useState('');

  const categoryField = useInputField({
    value: category,
    onChange: (value) => setCategory(value)
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isNewTemplate, setIsNewTemplate] = useState(true);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  const [showSaveAsNewModal, setShowSaveAsNewModal] = useState(false);

  const [isPublic, setIsPublic] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<{ value: string; label: string }[]>([]);

  // Check if user can create public templates using centralized admin service
  const { isAdmin: canCreatePublicTemplates } = useIsAdmin(currentUser);

  // Update the template name field when initialTemplateName changes
  useEffect(() => {
    templateNameField.setInputValue(initialTemplateName);
    setIsNewTemplate(!initialTemplateName);
  }, [initialTemplateName]);

  // Update description field when initialDescription changes
  useEffect(() => {
    descriptionField.setInputValue(initialDescription);
  }, [initialDescription]);

  // Reset public fields, category, and fetch templates when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsPublic(false);
      // Use initialCategory if provided, otherwise empty
      setCategory(initialCategory);
      categoryField.setInputValue(initialCategory);

      // Fetch unique categories when modal opens
      const fetchCategories = async () => {
        const { data, error } = await getUniqueTemplateCategories();
        if (error) {
          console.error('Error fetching template categories:', error);
        } else {
          setAvailableCategories(data || []);
        }
      };

      fetchCategories();
    }
  }, [isOpen, currentUser?.id, initialCategory]);

  // Track if the name has changed from the original
  useEffect(() => {
    if (initialTemplateName && templateNameField.inputValue !== initialTemplateName) {
      setIsNewTemplate(true);
    } else if (initialTemplateName && templateNameField.inputValue === initialTemplateName) {
      setIsNewTemplate(false);
    } else {
      setIsNewTemplate(true);
    }
  }, [templateNameField.inputValue, initialTemplateName]);

  const handleSaveAsNew = async (newTemplateName: string) => {
    // Category is optional - use "Uncategorized" if empty
    const finalCategory = categoryField.inputValue.trim() || 'Uncategorized';

    setIsSaving(true);
    try {
      // Always save as new when using "Save as New Template" button
      await onSave(
        newTemplateName,
        descriptionField.inputValue,
        {
          ...formStateToSave,
          is_public: isPublic
        },
        true, // Force save as new
        finalCategory,
        undefined // No template ID when saving as new
      );
      onClose();
      onSaveSuccess?.();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 dark:bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-black dark:text-white">Save as Template</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Template Name */}
          <div className="mb-4">
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              id="templateName"
              required
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Enter a name for this template"
              value={templateNameField.inputValue}
              onChange={templateNameField.handleChange}
              onBlur={templateNameField.handleBlur}
            />

          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Briefly describe this template"
              value={descriptionField.inputValue}
              onChange={descriptionField.handleChange}
              onBlur={descriptionField.handleBlur}
            />
          </div>

          {/* Category Field */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <CategoryTagsInput
              id="category"
              name="category"
              placeholder="Select or type a category (defaults to 'Uncategorized')..."
              value={categoryField.inputValue}
              onChange={(value) => {
                categoryField.setInputValue(value);
              }}
              categories={[{ category: 'Existing Categories', options: availableCategories }]}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Organize your templates by categories (e.g., "Email, Marketing", "Social Media, Content"). If left blank, it will be saved as "Uncategorized".
            </p>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This will save your current settings as a template that you can reuse later.
          </p>

          {/* Show info when updating existing template */}
          {initialTemplateName && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Loaded from template: <strong>"{initialTemplateName}"</strong>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                You can update this template or save it as a new one.
              </p>
            </div>
          )}

          {/* Public Template Section - Only show to authorized users */}
          {canCreatePublicTemplates && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => {
                    setIsPublic(checked === true);
                  }}
                />
                <Label htmlFor="isPublic" className="cursor-pointer flex items-center">
                  {isPublic ? (
                    <Globe size={16} className="mr-1.5 text-gray-500" />
                  ) : (
                    <Lock size={16} className="mr-1.5 text-gray-500" />
                  )}
                  <span className="text-sm font-medium">
                    Make this template public for all users
                  </span>
                  <Tooltip content="Public templates can be used by all users on the platform. They will appear in everyone's template list.">
                    <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                  </Tooltip>
                </Label>
              </div>

              {isPublic && (
                <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 p-2 rounded border border-gray-200 dark:border-gray-800 ml-6">
                  <strong>Note:</strong> Public templates will be visible to all users. Make sure you don't include any sensitive or proprietary information.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-300 dark:border-gray-800 flex justify-between">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md text-sm"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {initialTemplateName && (
              <button
                onClick={() => setShowUpdateConfirmation(true)}
                className="text-white px-4 py-2 rounded-md text-sm font-medium flex items-center disabled:opacity-50"
                style={{ backgroundColor: '#ff6b35' }}
                onMouseEnter={(e) => !(!templateNameField.inputValue.trim() || isSaving) && (e.currentTarget.style.backgroundColor = '#e5602f')}
                onMouseLeave={(e) => !(!templateNameField.inputValue.trim() || isSaving) && (e.currentTarget.style.backgroundColor = '#ff6b35')}
                disabled={!templateNameField.inputValue.trim() || isSaving}
              >
                <Bookmark size={16} style={{ marginRight: '6px' }} />
                Update Template
              </button>
            )}
            <button
              onClick={() => setShowSaveAsNewModal(true)}
              className="text-white px-4 py-2 rounded-md text-sm flex items-center disabled:opacity-50"
              style={{ backgroundColor: '#ff6b35' }}
              onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#e5602f')}
              onMouseLeave={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#ff6b35')}
              disabled={isSaving}
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Bookmark size={16} style={{ marginRight: '6px' }} />
                  Save Template
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal for Save as New Template */}
        <SaveAsNewTemplateModal
          isOpen={showSaveAsNewModal}
          onClose={() => setShowSaveAsNewModal(false)}
          onConfirm={handleSaveAsNew}
          currentTemplateName={templateNameField.inputValue || initialTemplateName || 'New Template'}
        />

        {/* Confirmation Modal for Update */}
        {showUpdateConfirmation && (
          <div className="fixed inset-0 bg-black/80 dark:bg-black/90 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full p-6">
              <div className="flex items-start mb-4">
                <AlertCircle size={24} className="text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Update Existing Template?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You are about to update the template <strong>"{initialTemplateName}"</strong>. This will overwrite all existing settings with your current configuration.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowUpdateConfirmation(false)}
                  className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowUpdateConfirmation(false);
                    setIsSaving(true);
                    try {
                      const finalCategory = categoryField.inputValue.trim() || 'Uncategorized';
                      await onSave(
                        templateNameField.inputValue,
                        descriptionField.inputValue,
                        {
                          ...formStateToSave,
                          is_public: isPublic
                        },
                        false, // Don't force save as new - update existing
                        finalCategory,
                        undefined // Parent component will find template ID from initialTemplateName
                      );
                      onClose();
                      onSaveSuccess?.();
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Yes, Update Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveTemplateModal;
