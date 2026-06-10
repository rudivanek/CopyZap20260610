import React, { useState, useEffect } from 'react';
import { Play, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkflowService } from '../../services/workflowService';
import type { Workflow } from '../../types';

interface WorkflowSelectorProps {
  useWorkflow: boolean;
  workflowId?: string;
  onUseWorkflowChange: (enabled: boolean) => void;
  onWorkflowChange: (workflowId: string) => void;
  userId?: string;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  useWorkflow,
  workflowId,
  onUseWorkflowChange,
  onWorkflowChange,
  userId
}) => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId && useWorkflow) {
      loadWorkflows();
    }
  }, [userId, useWorkflow]);

  const loadWorkflows = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const data = await WorkflowService.getWorkflows(userId);
      setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageWorkflows = () => {
    navigate('/manage-workflows');
  };

  return (
    <div className="space-y-3">
      {/* Enable Workflow Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="use-workflow"
          checked={useWorkflow}
          onChange={(e) => onUseWorkflowChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="use-workflow" className="text-sm font-normal text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Play className="h-4 w-4" />
          Use Workflow
        </label>
      </div>

      {/* Workflow Selector (visible when enabled) */}
      {useWorkflow && (
        <div className="pl-6 space-y-2">
          {isLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No workflows available. Create one to get started.
              </p>
              <button
                onClick={handleManageWorkflows}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Manage Workflows
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={workflowId || ''}
                onChange={(e) => onWorkflowChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a workflow...</option>
                {workflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name} ({workflow.steps.length} {workflow.steps.length === 1 ? 'step' : 'steps'})
                  </option>
                ))}
              </select>
              <button
                onClick={handleManageWorkflows}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Manage Workflows
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
