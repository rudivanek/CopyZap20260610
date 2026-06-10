import { supabase } from './supabaseClient';
import type { Workflow, WorkflowStep, WorkflowPermission, WorkflowPermissionLevel } from '../types';

export class WorkflowService {
  static async getWorkflows(userId: string): Promise<Workflow[]> {
    // Don't filter on client side - let RLS policies handle access control
    // RLS will show: own workflows, public workflows, and workflows with explicit permissions
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching workflows:', error);
      throw new Error('Failed to fetch workflows');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Check if user has edit permission for each workflow
    const workflowIds = data.map(w => w.id);

    // Fetch permissions for all workflows in one query
    const { data: permissions } = await supabase
      .from('workflow_permissions')
      .select('workflow_id, permission_level')
      .eq('user_id', userId)
      .in('workflow_id', workflowIds);

    const permissionsMap = new Map(
      (permissions || []).map(p => [p.workflow_id, p.permission_level])
    );

    // Add can_edit flag to each workflow
    const workflowsWithPermissions = data.map(workflow => ({
      ...workflow,
      can_edit: workflow.user_id === userId || permissionsMap.get(workflow.id) === 'edit'
    }));

    return workflowsWithPermissions;
  }

  static async getWorkflowById(id: string): Promise<Workflow | null> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching workflow:', error);
      throw new Error('Failed to fetch workflow');
    }

    return data;
  }

  static async createWorkflow(
    userId: string,
    name: string,
    steps: WorkflowStep[],
    customerId?: string | null,
    enableAnalyzeCompare?: boolean,
    isPublic?: boolean,
    description?: string | null
  ): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        user_id: userId,
        customer_id: customerId || null,
        name,
        description: description || null,
        steps,
        enable_analyze_compare: enableAnalyzeCompare || false,
        is_public: isPublic || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow:', error);
      throw new Error('Failed to create workflow');
    }

    return data;
  }

  static async updateWorkflow(
    id: string,
    updates: {
      name?: string;
      description?: string | null;
      steps?: WorkflowStep[];
      customer_id?: string | null;
      enable_analyze_compare?: boolean;
      is_public?: boolean;
    }
  ): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workflow:', error);
      throw new Error('Failed to update workflow');
    }

    return data;
  }

  static async deleteWorkflow(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workflow:', error);
      throw new Error('Failed to delete workflow');
    }
  }

  static async duplicateWorkflow(id: string, userId: string): Promise<Workflow> {
    const workflow = await this.getWorkflowById(id);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert({
        user_id: userId,
        customer_id: workflow.customer_id,
        name: `${workflow.name} (Copy)`,
        description: workflow.description,
        steps: workflow.steps,
        enable_analyze_compare: workflow.enable_analyze_compare || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error duplicating workflow:', error);
      throw new Error('Failed to duplicate workflow');
    }

    return data;
  }

  // Permission Management Methods

  static async getWorkflowPermissions(workflowId: string): Promise<WorkflowPermission[]> {
    const { data, error } = await supabase
      .from('workflow_permissions')
      .select(`
        *,
        user:user_id(email),
        granted_by_user:granted_by(email)
      `)
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workflow permissions:', error);
      throw new Error('Failed to fetch workflow permissions');
    }

    // Map the data to include user emails
    const permissions = (data || []).map(p => ({
      id: p.id,
      workflow_id: p.workflow_id,
      user_id: p.user_id,
      granted_by: p.granted_by,
      permission_level: p.permission_level,
      created_at: p.created_at,
      updated_at: p.updated_at,
      user_email: (p.user as any)?.email,
      granted_by_email: (p.granted_by_user as any)?.email
    }));

    return permissions;
  }

  static async grantWorkflowPermission(
    workflowId: string,
    userEmail: string,
    permissionLevel: WorkflowPermissionLevel,
    grantedBy: string
  ): Promise<WorkflowPermission> {
    // Use RPC function to find user by email and create permission
    const { data, error } = await supabase.rpc('grant_workflow_permission', {
      p_workflow_id: workflowId,
      p_user_email: userEmail,
      p_permission_level: permissionLevel,
      p_granted_by: grantedBy
    });

    if (error) {
      console.error('Error granting workflow permission:', error);
      if (error.message.includes('not found')) {
        throw new Error('User not found with that email');
      }
      if (error.message.includes('already has permission')) {
        throw new Error('User already has permission for this workflow');
      }
      throw new Error('Failed to grant workflow permission');
    }

    return data;
  }

  static async updateWorkflowPermission(
    permissionId: string,
    permissionLevel: WorkflowPermissionLevel
  ): Promise<WorkflowPermission> {
    const { data, error } = await supabase
      .from('workflow_permissions')
      .update({ permission_level: permissionLevel })
      .eq('id', permissionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating workflow permission:', error);
      throw new Error('Failed to update workflow permission');
    }

    return data;
  }

  static async revokeWorkflowPermission(permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_permissions')
      .delete()
      .eq('id', permissionId);

    if (error) {
      console.error('Error revoking workflow permission:', error);
      throw new Error('Failed to revoke workflow permission');
    }
  }

  static async getUserSharedWorkflows(userId: string): Promise<Workflow[]> {
    // Get workflows where user has explicit permissions
    const { data, error } = await supabase
      .from('workflow_permissions')
      .select(`
        workflow_id,
        permission_level,
        workflows (*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching shared workflows:', error);
      throw new Error('Failed to fetch shared workflows');
    }

    // Map to workflows with permission info
    const workflows = (data || [])
      .filter(p => p.workflows)
      .map(p => ({
        ...(p.workflows as any),
        can_edit: p.permission_level === 'edit'
      }));

    return workflows;
  }
}
