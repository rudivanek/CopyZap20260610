import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, FolderOpen } from 'lucide-react';
import { Template } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  isLoading: boolean;
  onSelectTemplate: (templateId: string) => void;
}

const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  templates,
  isLoading,
  onSelectTemplate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return templates;

    return templates.filter(template => {
      return (
        (typeof template.template_name === 'string' && template.template_name.toLowerCase().includes(query)) ||
        (typeof template.category === 'string' && template.category.toLowerCase().includes(query)) ||
        (typeof template.description === 'string' && template.description.toLowerCase().includes(query))
      );
    });
  }, [templates, searchQuery]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const grouped: { [key: string]: Template[] } = {};
    filteredTemplates.forEach(template => {
      const category = (typeof template.category === 'string' && template.category) ? template.category : 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(template);
    });

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });

    return sortedCategories.map(category => ({
      category,
      templates: grouped[category].sort((a, b) => {
        const nameA = (typeof a.template_name === 'string' && a.template_name) ? a.template_name : '';
        const nameB = (typeof b.template_name === 'string' && b.template_name) ? b.template_name : '';
        return nameA.localeCompare(nameB);
      })
    }));
  }, [filteredTemplates]);

  const handleTemplateChange = (value: string) => {
    if (!value) return;
    setSelectedTemplateId(value);
    onSelectTemplate(value);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <FolderOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Load Template
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a template to start with
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full pl-10 pr-4 py-2.5"
                  autoFocus
                />
              </div>

              {/* Template Dropdown */}
              <div>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                >
                  <option value="">
                    {isLoading ? '— Loading Templates —' : '— Select a Template —'}
                  </option>

                  {groupedTemplates.length > 0 && (
                    <>
                      {groupedTemplates.map((group) => (
                        <React.Fragment key={group.category}>
                          <option disabled className="font-semibold">── {group.category} ──</option>
                          {group.templates.map((template) => (
                            <option key={template.id} value={template.id} title={template.template_name}>
                              {template.template_name.length > 50 ? template.template_name.substring(0, 50) + '...' : template.template_name}
                            </option>
                          ))}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-2">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading templates...</span>
                </div>
              )}

              {!isLoading && templates.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No templates available. Create one from the Template Saver.
                </div>
              )}

              {searchQuery && filteredTemplates.length === 0 && !isLoading && templates.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No matching templates found.
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TemplatePickerModal;
