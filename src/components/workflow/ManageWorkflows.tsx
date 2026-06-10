import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Copy, Trash2, Play, X, Save, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { WorkflowService } from '../../services/workflowService';
import { WorkflowBuilder } from './WorkflowBuilder';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useBrandVoices } from '../../hooks/useBrandVoices';
import { getSupabaseClient } from '../../services/supabaseClient';
import type { Workflow, WorkflowStep, ScoringContext } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import ScoringContextModal from '../copy-maker/CopyMakerTab/modals/ScoringContextModal';

const supabase = getSupabaseClient();

interface WorkflowEditorModalProps {
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  userId: string;
  userEmail: string;
}

const WorkflowEditorModal: React.FC<WorkflowEditorModalProps> = ({
  workflow,
  isOpen,
  onClose,
  onSave,
  userId,
  userEmail
}) => {
  const { isAdmin } = useIsAdmin({ email: userEmail });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [enableAnalyzeCompare, setEnableAnalyzeCompare] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const { voices } = useBrandVoices(selectedCustomerId);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('pmc_customers')
          .select('id, name')
          .eq('user_id', userId)
          .order('name');

        if (error) throw error;

        setCustomers(data || []);
      } catch (error) {
        console.error('Error loading customers:', error);
        toast.error('Failed to load customers');
      }
    };

    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, userId, workflow]);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setSteps(workflow.steps);
      setSelectedCustomerId(workflow.customer_id || '');
      setIsPublic(workflow.is_public || false);
      // Check if workflow has an analyze_compare_copy step
      const hasAnalysisStep = workflow.steps.some(s => s.type === 'analyze_compare_copy');
      setEnableAnalyzeCompare(hasAnalysisStep || workflow.enable_analyze_compare || false);
    } else {
      setName('');
      setDescription('');
      setSteps([]);
      setSelectedCustomerId('');
      setIsPublic(false);
      setEnableAnalyzeCompare(false);
    }
  }, [workflow]);

  // Update enableAnalyzeCompare when steps change
  useEffect(() => {
    const hasAnalysisStep = steps.some(s => s.type === 'analyze_compare_copy');
    if (hasAnalysisStep !== enableAnalyzeCompare) {
      setEnableAnalyzeCompare(hasAnalysisStep);
    }
  }, [steps]);

  const handleAnalyzeCompareToggle = (checked: boolean) => {
    if (checked) {
      // Remove any existing analyze_compare_copy steps
      const stepsWithoutAnalysis = steps.filter(s => s.type !== 'analyze_compare_copy');

      // Add new analyze_compare_copy step at the end with comprehensive analysis
      const newStep: WorkflowStep = {
        id: uuidv4(),
        type: 'analyze_compare_copy',
        target: 'original',
        analysisType: 'comprehensive',
        customInstructions: ''
      } as WorkflowStep;

      setSteps([...stepsWithoutAnalysis, newStep]);
      setEnableAnalyzeCompare(true);
      // Open the scoring context modal immediately
      setShowScoringModal(true);
    } else {
      // Remove any analyze_compare_copy steps
      const updatedSteps = steps.filter(s => s.type !== 'analyze_compare_copy');
      setSteps(updatedSteps);
      setEnableAnalyzeCompare(false);
    }
  };

  const handleScoringModalConfirm = (ctx: ScoringContext) => {
    setShowScoringModal(false);
    setSteps(prev => prev.map(s =>
      s.type === 'analyze_compare_copy' ? { ...s, scoringContext: ctx } : s
    ));
  };

  const getAnalyzeStepScoringContext = (): ScoringContext | undefined => {
    const analyzeStep = steps.find(s => s.type === 'analyze_compare_copy');
    return analyzeStep?.type === 'analyze_compare_copy' ? analyzeStep.scoringContext : undefined;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    const hasInvalidVoiceStep = steps.some(
      step => step.type === 'apply_voice_style' && !step.preset_voice_style && !step.brand_voice_id
    );

    if (hasInvalidVoiceStep) {
      toast.error('Please select either a Voice Style or Brand Voice for all "Apply Voice Style" steps');
      return;
    }

    setIsSaving(true);
    try {
      if (workflow) {
        await WorkflowService.updateWorkflow(workflow.id, {
          name,
          description: description || null,
          steps,
          customer_id: selectedCustomerId || null,
          enable_analyze_compare: false, // Always false since we use the step now
          is_public: isPublic
        });
        toast.success('Workflow updated successfully');
      } else {
        await WorkflowService.createWorkflow(userId, name, steps, selectedCustomerId || null, false, isPublic, description || null);
        toast.success('Workflow created successfully');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {workflow ? 'Edit Workflow' : 'Create Workflow'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Workflow Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workflow name..."
              className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Workflow Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note or description for this workflow..."
              rows={2}
              className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">None (Brand Voice will not be available)</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Optional: Select a customer to enable Brand Voice selection in workflow steps
            </p>
          </div>

          {/* Public/Private Toggle (Admin Only) */}
          {isAdmin && (
            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Make Workflow Public
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Public workflows are visible to all users. Private workflows are only visible to you and users you explicitly grant permission to.
                </p>
              </div>
            </div>
          )}

          {/* Enable Analyze Compare Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <input
              type="checkbox"
              id="enableAnalyzeCompare"
              checked={enableAnalyzeCompare}
              onChange={(e) => handleAnalyzeCompareToggle(e.target.checked)}
              className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <label htmlFor="enableAnalyzeCompare" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                Add: Analyze – Compare & Score Copy
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                When enabled, the workflow will automatically trigger "Analyze – Compare & Score Copy" at the end of all workflow steps. This provides comprehensive AI-powered comparison and scoring of all generated outputs.
              </p>
              {enableAnalyzeCompare && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Scoring context: {getAnalyzeStepScoringContext()?.useCaseLabel ?? 'Not set'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowScoringModal(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                  >
                    <Settings className="h-3 w-3" />
                    Change
                  </button>
                </div>
              )}
            </div>
          </div>

          <ScoringContextModal
            isOpen={showScoringModal}
            onClose={() => setShowScoringModal(false)}
            onConfirm={handleScoringModalConfirm}
            initialContext={getAnalyzeStepScoringContext()}
          />

          {/* Workflow Builder */}
          <WorkflowBuilder
            steps={steps}
            onChange={setSteps}
            brandVoices={voices}
            selectedCustomerId={selectedCustomerId}
            onConfigureAnalyzeStep={enableAnalyzeCompare ? () => setShowScoringModal(true) : undefined}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ManageWorkflows: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editorModal, setEditorModal] = useState<{
    isOpen: boolean;
    workflow: Workflow | null;
  }>({ isOpen: false, workflow: null });

  const loadWorkflows = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await WorkflowService.getWorkflows(user.id);
      setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, [user]);

  const handleCreate = () => {
    setEditorModal({ isOpen: true, workflow: null });
  };

  const handleEdit = (workflow: Workflow) => {
    setEditorModal({ isOpen: true, workflow });
  };

  const handleDuplicate = async (workflow: Workflow) => {
    if (!user) return;

    try {
      await WorkflowService.duplicateWorkflow(workflow.id, user.id);
      toast.success('Workflow duplicated successfully');
      loadWorkflows();
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      toast.error('Failed to duplicate workflow');
    }
  };

  const handleDelete = async (workflow: Workflow) => {
    if (!confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      return;
    }

    try {
      await WorkflowService.deleteWorkflow(workflow.id);
      toast.success('Workflow deleted successfully');
      loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const getStepSummary = (workflow: Workflow): string => {
    if (workflow.steps.length === 0) return 'No steps';
    if (workflow.steps.length === 1) return '1 step';
    return `${workflow.steps.length} steps`;
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please log in to manage workflows</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflows</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create reusable automations to streamline your copy generation process
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Workflow
        </button>
      </div>

      {/* Workflows List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading workflows...</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <div className="text-gray-400 mb-4">
            <Play className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No workflows yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Create your first workflow to automate copy generation tasks
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              className="border rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{workflow.name}</h3>
                  {workflow.is_public && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      Public
                    </span>
                  )}
                </div>
              </div>
              {workflow.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                  {workflow.description}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                {getStepSummary(workflow)}
              </p>
              <div className="flex items-center gap-2">
                {workflow.user_id === user?.id && (
                  <button
                    onClick={() => handleEdit(workflow)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDuplicate(workflow)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                {workflow.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(workflow)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {user && (
        <WorkflowEditorModal
          workflow={editorModal.workflow}
          isOpen={editorModal.isOpen}
          onClose={() => setEditorModal({ isOpen: false, workflow: null })}
          onSave={loadWorkflows}
          userId={user.id}
          userEmail={user.email || ''}
        />
      )}
    </div>
  );
};
