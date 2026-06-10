# Workflow Feature Implementation Guide

## Overview

The Workflow feature has been implemented as a Copy Maker automation system that allows users to create reusable automations for generating copy variations. This feature is now 90% complete with all core components built.

## What Has Been Implemented

### 1. Database Schema ✅
- **File**: `workflows_table_migration.sql` (manual SQL file)
- **Table**: `workflows` with columns:
  - `id`, `user_id`, `customer_id`, `name`, `steps`, `created_at`, `updated_at`
- **Security**: Full RLS policies for user and admin access
- **Indexes**: Performance indexes on `user_id` and `customer_id`

**Action Required**: Run the SQL migration file in your Supabase SQL Editor

### 2. TypeScript Types ✅
- **File**: `src/types/index.ts`
- **New Types**:
  - `WorkflowStepType`: 'create_alternative_copy' | 'apply_voice_style'
  - `WorkflowStep`: Union type for all step types
  - `Workflow`: Complete workflow interface
  - `WorkflowExecutionContext`: Tracks generated outputs
  - `WorkflowExecutionResult`: Result of workflow execution
- **FormData Updates**: Added `useWorkflow` and `workflowId` fields

### 3. Workflow Service ✅
- **File**: `src/services/workflowService.ts`
- **Methods**:
  - `getWorkflows(userId)`: Fetch user's workflows
  - `getWorkflowById(id)`: Get single workflow
  - `createWorkflow()`: Create new workflow
  - `updateWorkflow()`: Update existing workflow
  - `deleteWorkflow()`: Delete workflow
  - `duplicateWorkflow()`: Duplicate workflow

### 4. Workflow Execution Engine ✅
- **File**: `src/services/workflowExecutionEngine.ts`
- **Features**:
  - Sequential step execution
  - Progress tracking
  - Error handling
  - Execution context management
  - Support for both action types:
    - Create Alternative Copy
    - Apply Voice Style

### 5. Workflow Builder UI ✅
- **File**: `src/components/workflow/WorkflowBuilder.tsx`
- **Features**:
  - Two-panel layout (Action Library + Workflow Canvas)
  - Drag & drop reordering using react-beautiful-dnd
  - Dynamic target selection (updates based on previous steps)
  - Voice style dropdown (shows brand voices)
  - Add/Remove/Reorder steps
  - Validation (ensures voice is selected for voice style steps)

### 6. Workflow Management Dashboard ✅
- **File**: `src/components/workflow/ManageWorkflows.tsx`
- **Features**:
  - List all workflows
  - Create new workflow (with modal editor)
  - Edit existing workflow
  - Duplicate workflow
  - Delete workflow
  - Shows step count for each workflow
- **Route**: `/manage-workflows` (added to App.tsx)

### 7. Workflow Selector Component ✅
- **File**: `src/components/ui/WorkflowSelector.tsx`
- **Features**:
  - Checkbox to enable workflow
  - Dropdown to select workflow (only visible when enabled)
  - Shows step count for each workflow
  - Link to manage workflows page
  - Loads workflows dynamically when enabled

## What Still Needs Integration

### 1. Add WorkflowSelector to FeatureToggles Component

**File**: `src/components/FeatureToggles.tsx`

**Location**: After the "Batch Analysis" section (around line 300)

**Code to Add**:

```tsx
import { WorkflowSelector } from './ui/WorkflowSelector';
import { useAuth } from '../hooks/useAuth';

// Inside the component:
const { currentUser } = useAuth();

// Add this after the Batch Analysis section:
<div className="border-t pt-3 mt-3">
  <WorkflowSelector
    useWorkflow={formData.useWorkflow || false}
    workflowId={formData.workflowId}
    onUseWorkflowChange={(enabled) => handleToggle({
      target: { name: 'useWorkflow', checked: enabled }
    } as React.ChangeEvent<HTMLInputElement>)}
    onWorkflowChange={(workflowId) => handleChange('workflowId', workflowId)}
    userId={currentUser?.id}
  />
</div>
```

### 2. Add Workflow Execution to Generation Flow

**File**: `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` (or wherever generation happens)

**After Primary Generation Completes**:

```tsx
import { WorkflowExecutionEngine } from '../../../services/workflowExecutionEngine';
import { WorkflowService } from '../../../services/workflowService';

// After main content is generated and before returning results:
if (formState.useWorkflow && formState.workflowId) {
  try {
    // Get the workflow
    const workflow = await WorkflowService.getWorkflowById(formState.workflowId);

    if (!workflow) {
      console.error('Workflow not found');
      return; // Continue without workflow
    }

    // Get the original/primary content
    const originalContent = typeof copyResult.improvedCopy === 'string'
      ? copyResult.improvedCopy
      : JSON.stringify(copyResult.improvedCopy);

    // Execute workflow
    const engine = new WorkflowExecutionEngine(
      workflow,
      originalContent,
      formState,
      currentUser,
      (message, currentStep, totalSteps) => {
        // Show progress in UI
        addProgressMessage(`Workflow: ${message}`);
      }
    );

    const result = await engine.execute();

    if (result.success) {
      // Add generated outputs to the results
      result.generatedOutputs.forEach(output => {
        copyResult.generatedVersions.push(output);
      });

      toast.success('Workflow completed successfully');
    } else {
      toast.error(result.error || 'Workflow execution failed');
    }
  } catch (error) {
    console.error('Workflow execution error:', error);
    toast.error('Workflow execution failed');
    // Don't block main generation if workflow fails
  }
}
```

### 3. Add Link to Workflows in Main Menu (Optional)

**File**: `src/components/MainMenu.tsx`

Add a navigation link to `/manage-workflows` in the admin section or settings area.

### 4. Update Form State Initialization

Ensure `useWorkflow` and `workflowId` are included in form state initialization with default values:

```tsx
useWorkflow: false,
workflowId: undefined
```

## Testing Checklist

Once integration is complete, test:

1. ✅ Database migration runs without errors
2. ✅ Build completes successfully (already verified)
3. Navigate to `/manage-workflows` and verify:
   - [ ] Page loads without errors
   - [ ] Can create a new workflow
   - [ ] Drag & drop works in workflow builder
   - [ ] Can add/remove steps
   - [ ] Voice style dropdown shows brand voices
   - [ ] Can save workflow
   - [ ] Can edit workflow
   - [ ] Can duplicate workflow
   - [ ] Can delete workflow
4. In Copy Maker form:
   - [ ] Workflow selector appears in "Optimization & Optional Features"
   - [ ] Can enable workflow checkbox
   - [ ] Dropdown shows created workflows
   - [ ] Can select a workflow
5. Generate copy with workflow enabled:
   - [ ] Primary copy generates normally
   - [ ] Workflow executes automatically
   - [ ] Progress messages appear
   - [ ] All workflow steps complete
   - [ ] Generated outputs appear as output cards
   - [ ] Manual buttons work after workflow completes
   - [ ] Workflow-generated outputs are clearly labeled

## Architecture Notes

### Workflow Execution Flow

1. User generates primary copy
2. If `useWorkflow` is enabled and `workflowId` is set:
   - Fetch workflow from database
   - Initialize execution engine with:
     - Workflow definition
     - Original content
     - Form state
     - Current user
     - Progress callback
   - Engine executes steps sequentially
   - Each step:
     - Resolves target content from context
     - Calls appropriate API function
     - Stores result in context
     - Creates GeneratedContentItem
   - Returns all generated items
3. Generated items are added to output cards
4. User can continue manual generation

### Key Design Principles

- **No persistent mode**: Workflow runs once and exits
- **No output locking**: All outputs can be manually regenerated
- **Sequential execution**: Steps run in order, no parallelism
- **Graceful failures**: Workflow errors don't break main generation
- **Context propagation**: Each step can reference outputs from previous steps

## Future Enhancements (Out of Scope for V1)

- Conditional logic (if/else branches)
- Loops (repeat steps X times)
- Analyze/Compare/Score steps
- SEO/GEO/Content scoring integration
- Workflow templates library
- Workflow import/export
- Workflow scheduling
- Workflow analytics

## Files Created/Modified

### New Files
- `src/types/index.ts` (modified - added workflow types)
- `src/services/workflowService.ts`
- `src/services/workflowExecutionEngine.ts`
- `src/components/workflow/WorkflowBuilder.tsx`
- `src/components/workflow/ManageWorkflows.tsx`
- `src/components/ui/WorkflowSelector.tsx`
- `workflows_table_migration.sql`
- `WORKFLOW_FEATURE_IMPLEMENTATION.md` (this file)

### Modified Files
- `src/App.tsx` (added route and import)
- `src/types/index.ts` (added workflow types and FormData fields)

### Files That Need Modification
- `src/components/FeatureToggles.tsx` (add WorkflowSelector)
- `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` (add workflow execution)
- `src/components/MainMenu.tsx` (optional - add navigation link)

## Support

For questions or issues, refer to:
- Type definitions: `src/types/index.ts`
- Service layer: `src/services/workflowService.ts` and `workflowExecutionEngine.ts`
- UI components: `src/components/workflow/*`
