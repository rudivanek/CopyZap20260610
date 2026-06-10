import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wand2,
  FileText,
  FolderOpen,
  Sparkles,
  RefreshCw,
  Zap,
  Settings,
  Sliders,
  Gauge,
  ChevronRight,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import TemplatePickerModal from './TemplatePickerModal';
import { Template } from '../types';
import { getUserPreferences, enableStartHub, dismissStartHub } from '../services/supabaseClient';
import { useIsAdmin } from '../hooks/useIsAdmin';

export type StartHubFeature = 'copy_wizard' | 'copy_form' | 'template_loader';
export type WizardMode = 'create' | 'improve' | 'polish' | null;
export type UiLevel = 'quick' | 'standard' | 'advanced' | null;

export interface StartHubConfig {
  openFeature: StartHubFeature;
  wizardMode: WizardMode;
  wizardStep: number | null;
  uiLevel: UiLevel;
  panelsOpen: string[];
  panelsHidden: string[];
  focusField: string | null;
}

interface StartHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (config: StartHubConfig) => void;
  onDismissPermanently: () => void;
  templates?: Template[];
  isLoadingTemplates?: boolean;
  onSelectTemplate?: (templateId: string) => void;
  currentUserId?: string;
  onPreferenceChange?: (shouldShow: boolean) => void;
}

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isExpanded?: boolean;
  children?: React.ReactNode;
}

const OptionCard: React.FC<OptionCardProps> = ({
  icon,
  title,
  description,
  onClick,
  isExpanded,
  children
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <button
        onClick={onClick}
        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
          isExpanded
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            isExpanded
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400'
          } transition-colors`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {title}
              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pl-4 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface SubOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const SubOption: React.FC<SubOptionProps> = ({ icon, title, description, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200 group"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-800 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
      </div>
    </button>
  );
};

const StartHubModal: React.FC<StartHubModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onDismissPermanently,
  templates = [],
  isLoadingTemplates = false,
  onSelectTemplate,
  currentUserId,
  onPreferenceChange
}) => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [expandedOption, setExpandedOption] = useState<'wizard' | 'form' | 'template' | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showStartHubEnabled, setShowStartHubEnabled] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingToggleValue, setPendingToggleValue] = useState(false);

  // Load current preference
  useEffect(() => {
    const loadPreference = async () => {
      if (!currentUserId) return;

      try {
        const prefs = await getUserPreferences(currentUserId);
        setShowStartHubEnabled(prefs?.show_start_hub ?? true);
      } catch (error) {
        console.error('Error loading Start Hub preference:', error);
      }
    };

    if (isOpen) {
      loadPreference();
    }
  }, [currentUserId, isOpen]);

  const handleToggleClick = () => {
    setPendingToggleValue(!showStartHubEnabled);
    setShowConfirmDialog(true);
  };

  const handleConfirmToggle = async () => {
    if (!currentUserId) return;

    try {
      const success = pendingToggleValue
        ? await enableStartHub(currentUserId)
        : await dismissStartHub(currentUserId);

      if (success) {
        setShowStartHubEnabled(pendingToggleValue);
        onPreferenceChange?.(pendingToggleValue); // Notify parent of change
        toast.success(pendingToggleValue ? 'Start Hub will show on app load' : 'Start Hub will not show on app load');

        // If toggled OFF, close the modal after a short delay
        if (!pendingToggleValue) {
          setTimeout(() => {
            onClose();
          }, 500);
        }
      } else {
        toast.error('Failed to update preference');
      }
    } catch (error) {
      console.error('Error updating Start Hub preference:', error);
      toast.error('Failed to update preference');
    }

    setShowConfirmDialog(false);
  };

  const handleWizardSelect = (mode: WizardMode) => {
    const config: StartHubConfig = {
      openFeature: 'copy_wizard',
      wizardMode: mode,
      wizardStep: 1,
      uiLevel: null,
      panelsOpen: [],
      panelsHidden: [],
      focusField: mode === 'create'
        ? 'business_description'
        : mode === 'improve'
          ? 'existing_copy_input'
          : 'existing_copy_input'
    };

    onSelect(config);
  };

  const handleFormSelect = (level: UiLevel) => {
    const panelConfigs: Record<string, { open: string[], hidden: string[] }> = {
      quick: {
        open: ['core'],
        hidden: ['seo', 'analysis', 'geo', 'competitors']
      },
      standard: {
        open: ['core', 'seo'],
        hidden: ['geo', 'competitors']
      },
      advanced: {
        open: ['core', 'seo', 'analysis', 'geo', 'competitors'],
        hidden: []
      }
    };

    const panels = level ? panelConfigs[level] : { open: [], hidden: [] };

    const config: StartHubConfig = {
      openFeature: 'copy_form',
      wizardMode: null,
      wizardStep: null,
      uiLevel: level,
      panelsOpen: panels.open,
      panelsHidden: panels.hidden,
      focusField: 'primary_prompt'
    };

    onSelect(config);
  };

  const handleTemplateSelect = () => {
    setShowTemplatePicker(true);
  };

  const handleTemplatePickerSelect = (templateId: string) => {
    if (onSelectTemplate) {
      onSelectTemplate(templateId);
    }
    setShowTemplatePicker(false);
    onClose();
  };

  const handleIntentPolishSelect = () => {
    onClose();
    navigate('/quick-polish');
  };

  const handleCopySnapSelect = () => {
    onClose();
    navigate('/copy-snap');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                How would you like to start?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Choose the fastest way to get what you need.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section 1: Create new copy */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1">
              Create new copy
            </h3>
            <div className="space-y-3">
              <OptionCard
                icon={<Wand2 className="w-5 h-5" />}
                title="Start with Copy Wizard"
                description="Guided, outcome-driven flow. Best for new users or quick results."
                onClick={() => setExpandedOption(expandedOption === 'wizard' ? null : 'wizard')}
                isExpanded={expandedOption === 'wizard'}
              >
                <SubOption
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  title="Make new copy"
                  description="Create fresh content from scratch"
                  onClick={() => handleWizardSelect('create')}
                />
                <SubOption
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  title="Improve existing copy"
                  description="Enhance and refine your current content"
                  onClick={() => handleWizardSelect('improve')}
                />
                <SubOption
                  icon={<Zap className="w-3.5 h-3.5" />}
                  title="Quick Polish"
                  description="Fast touch-ups and refinements"
                  onClick={() => handleWizardSelect('polish')}
                />
              </OptionCard>

              <OptionCard
                icon={<FileText className="w-5 h-5" />}
                title="Start with Copy Form"
                description="Manual control with varying complexity. For experienced users."
                onClick={() => setExpandedOption(expandedOption === 'form' ? null : 'form')}
                isExpanded={expandedOption === 'form'}
              >
                <SubOption
                  icon={<Gauge className="w-3.5 h-3.5" />}
                  title="Quick"
                  description="Essential fields only, fastest path"
                  onClick={() => handleFormSelect('quick')}
                />
                <SubOption
                  icon={<Settings className="w-3.5 h-3.5" />}
                  title="Standard"
                  description="Balanced control with key options"
                  onClick={() => handleFormSelect('standard')}
                />
                <SubOption
                  icon={<Sliders className="w-3.5 h-3.5" />}
                  title="Advanced"
                  description="Full control over all parameters"
                  onClick={() => handleFormSelect('advanced')}
                />
              </OptionCard>

              <OptionCard
                icon={<FolderOpen className="w-5 h-5" />}
                title="Start from a Template"
                description="Use saved templates for fast repeat workflows."
                onClick={handleTemplateSelect}
              />
            </div>
          </div>

          {/* Section 2: Improve existing copy */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1">
              Improve existing copy
            </h3>
            <div className="space-y-3">
              <OptionCard
                icon={<Sparkles className="w-5 h-5" />}
                title="Purpose Rewrite"
                description="Quickly improve existing copy with purpose-based rewriting."
                onClick={handleIntentPolishSelect}
              />

              {isAdmin && (
                <OptionCard
                  icon={<Zap className="w-5 h-5" />}
                  title="Copy Snap"
                  description="Quick rewrite, answer, or transform text with minimal setup."
                  onClick={handleCopySnapSelect}
                />
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Start Hub on app load
            </span>
            <button
              onClick={handleToggleClick}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                showStartHubEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showStartHubEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>

      <TemplatePickerModal
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        templates={templates}
        isLoading={isLoadingTemplates}
        onSelectTemplate={handleTemplatePickerSelect}
      />

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {pendingToggleValue ? 'Show Start Hub Again?' : 'Hide Start Hub?'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {pendingToggleValue
                  ? 'The Start Hub will appear when you load the app with an empty form.'
                  : 'The Start Hub will no longer appear automatically. You can still access it from the main menu.'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmToggle}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                >
                  {pendingToggleValue ? 'Yes, Show It' : 'Yes, Hide It'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StartHubModal;
