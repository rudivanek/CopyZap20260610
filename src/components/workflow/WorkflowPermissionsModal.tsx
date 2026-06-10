import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, Eye, Edit } from 'lucide-react';
import { WorkflowService } from '../../services/workflowService';
import type { WorkflowPermission, WorkflowPermissionLevel } from '../../types';
import toast from 'react-hot-toast';

interface WorkflowPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName: string;
  currentUserId: string;
}

export const WorkflowPermissionsModal: React.FC<WorkflowPermissionsModalProps> = ({
  isOpen,
  onClose,
  workflowId,
  workflowName,
  currentUserId
}) => {
  const [permissions, setPermissions] = useState<WorkflowPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newPermissionLevel, setNewPermissionLevel] = useState<WorkflowPermissionLevel>('view');
  const [isGranting, setIsGranting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen, workflowId]);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const data = await WorkflowService.getWorkflowPermissions(workflowId);
      setPermissions(data);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserEmail.trim()) {
      toast.error('Please enter a user email');
      return;
    }

    try {
      setIsGranting(true);
      await WorkflowService.grantWorkflowPermission(
        workflowId,
        newUserEmail.trim(),
        newPermissionLevel,
        currentUserId
      );

      toast.success('Permission granted successfully');
      setNewUserEmail('');
      setNewPermissionLevel('view');
      await loadPermissions();
    } catch (error: any) {
      console.error('Error granting permission:', error);
      toast.error(error.message || 'Failed to grant permission');
    } finally {
      setIsGranting(false);
    }
  };

  const handleUpdatePermission = async (permissionId: string, newLevel: WorkflowPermissionLevel) => {
    try {
      await WorkflowService.updateWorkflowPermission(permissionId, newLevel);
      toast.success('Permission updated successfully');
      await loadPermissions();
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const handleRevokePermission = async (permissionId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${userEmail}?`)) {
      return;
    }

    try {
      await WorkflowService.revokeWorkflowPermission(permissionId);
      toast.success('Permission revoked successfully');
      await loadPermissions();
    } catch (error) {
      console.error('Error revoking permission:', error);
      toast.error('Failed to revoke permission');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Manage Permissions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {workflowName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Grant Permission Form */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Grant New Permission
            </h3>
            <form onSubmit={handleGrantPermission} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                  disabled={isGranting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permission Level
                </label>
                <select
                  value={newPermissionLevel}
                  onChange={(e) => setNewPermissionLevel(e.target.value as WorkflowPermissionLevel)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isGranting}
                >
                  <option value="view">View Only</option>
                  <option value="edit">Can Edit</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isGranting}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGranting ? 'Granting...' : 'Grant Permission'}
              </button>
            </form>
          </div>

          {/* Existing Permissions List */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Current Permissions ({permissions.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading permissions...
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No permissions granted yet. Grant permission to share this workflow with other users.
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {permission.user_email}
                        </span>
                        {permission.permission_level === 'view' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                            <Eye className="w-3 h-3" />
                            View Only
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                            <Edit className="w-3 h-3" />
                            Can Edit
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Granted by {permission.granted_by_email} on{' '}
                        {new Date(permission.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={permission.permission_level}
                        onChange={(e) => handleUpdatePermission(permission.id, e.target.value as WorkflowPermissionLevel)}
                        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                      </select>

                      <button
                        onClick={() => handleRevokePermission(permission.id, permission.user_email || 'this user')}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Revoke permission"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
