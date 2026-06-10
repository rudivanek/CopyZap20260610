import { useState } from 'react';
import { X } from 'lucide-react';

interface SaveAsNewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTemplateName: string) => void;
  currentTemplateName: string;
}

export function SaveAsNewTemplateModal({
  isOpen,
  onClose,
  onConfirm,
  currentTemplateName
}: SaveAsNewTemplateModalProps) {
  const [newName, setNewName] = useState(`${currentTemplateName} - Copy`);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (newName.trim()) {
      onConfirm(newName.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 dark:bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-black dark:text-white">Save as New Template</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enter a name for the new template:
          </p>

          <div className="mb-4">
            <label htmlFor="newTemplateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Template Name *
            </label>
            <input
              type="text"
              id="newTemplateName"
              autoFocus
              required
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Enter template name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!newName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save New Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
