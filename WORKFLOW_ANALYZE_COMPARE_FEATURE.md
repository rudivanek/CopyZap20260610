# Workflow Analyze & Compare Feature

## Overview
Added the ability for workflows to automatically trigger "Analyze – Compare & Score Copy" at the completion of all workflow steps. This provides comprehensive AI-powered comparison and scoring of all generated outputs without manual intervention.

## Database Changes

### SQL Migration Required
Run the following SQL in your Supabase SQL Editor:

```sql
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS enable_analyze_compare boolean DEFAULT false;
```

This adds a new optional field `enable_analyze_compare` to the `workflows` table. The SQL is also available in `WORKFLOW_ANALYZE_COMPARE_MIGRATION.sql`.

## Implementation Details

### 1. Database Schema
- **Table**: `workflows`
- **New Column**: `enable_analyze_compare` (boolean, default: false)
- **Purpose**: Controls whether automatic comparison is triggered after workflow execution

### 2. TypeScript Interface Updates
- Updated `Workflow` interface in `src/types/index.ts` to include `enable_analyze_compare?: boolean`
- Updated `WorkflowExecutionResult` interface to include `shouldTriggerComparison?: boolean`

### 3. UI Changes
- Added checkbox in `WorkflowEditorModal` (src/components/workflow/ManageWorkflows.tsx)
- Checkbox label: "Add: Analyze – Compare & Score Copy"
- Located after customer selection and before workflow builder
- Blue highlighted section for visibility
- Includes helpful description of the feature

### 4. Service Updates
- **WorkflowService** (`src/services/workflowService.ts`):
  - `createWorkflow()`: Now accepts `enableAnalyzeCompare` parameter
  - `updateWorkflow()`: Accepts `enable_analyze_compare` in updates object
  - `duplicateWorkflow()`: Copies `enable_analyze_compare` setting to duplicated workflow

### 5. Execution Engine Updates
- **WorkflowExecutionEngine** (`src/services/workflowExecutionEngine.ts`):
  - Returns `shouldTriggerComparison` flag based on workflow settings
  - Flag is passed to calling code for post-execution handling

### 6. Generation Hook Integration
- **useGeneration** (`src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts`):
  - Checks `workflowResult.shouldTriggerComparison` after workflow completion
  - If true, updates formState with all generated outputs
  - Automatically triggers `compareOutputsWithGrok()` with 'comprehensive' analysis type
  - Uses setTimeout to ensure state updates propagate before comparison
  - Includes error handling with user-friendly messages

## User Experience

### Creating/Editing a Workflow
1. User opens workflow editor (create new or edit existing)
2. Enters workflow name and selects customer
3. Checks "Add: Analyze – Compare & Score Copy" checkbox if desired
4. Configures workflow steps as usual
5. Saves workflow

### Running a Workflow with Auto-Compare
1. User selects a workflow with auto-compare enabled in Copy Maker
2. Generates copy normally
3. Workflow executes all steps sequentially
4. After all steps complete, system automatically:
   - Updates form state with all generated outputs
   - Shows progress message: "Triggering automatic comparison and analysis..."
   - Executes comprehensive AI comparison
   - Displays comparison results as an additional output card

### Error Handling
- If comparison fails after successful workflow execution:
  - User sees error toast: "Workflow completed, but comparison failed. You can trigger it manually."
  - All generated workflow outputs remain available
  - User can manually trigger comparison using the UI button

## Benefits

1. **Automation**: No manual comparison trigger needed
2. **Comprehensive Analysis**: Automatically uses 'comprehensive' analysis type
3. **Consistency**: Ensures all workflow outputs are analyzed together
4. **Time Saving**: Eliminates an extra step in the workflow process
5. **Optional**: Users can choose per-workflow whether to enable this feature

## Files Modified

1. `src/types/index.ts` - Type definitions
2. `src/components/workflow/ManageWorkflows.tsx` - UI checkbox and state management
3. `src/services/workflowService.ts` - CRUD operations
4. `src/services/workflowExecutionEngine.ts` - Execution result flag
5. `src/components/copy-maker/CopyMakerTab/hooks/useGeneration.ts` - Comparison trigger logic
6. `src/components/FeatureToggles.tsx` - Fixed workflow feature toggles issue

## Additional Fixes

While implementing this feature, also fixed the workflow feature toggles bug where:
- **Issue**: All optional features were being auto-checked when selecting a workflow
- **Issue**: Create Variants was not being disabled when using workflows
- **Fix**: Removed auto-enable behavior; Create Variants now properly disables when workflow is selected
- **Result**: Users have full control over optimization settings when using workflows

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Create a new workflow with "Analyze & Compare" enabled
- [ ] Execute the workflow in Copy Maker
- [ ] Verify automatic comparison triggers after workflow completion
- [ ] Verify comparison results appear as an output card
- [ ] Edit existing workflow to enable/disable the feature
- [ ] Duplicate a workflow and verify setting is copied
- [ ] Test workflow without the feature enabled (should work as before)
- [ ] Test error handling when comparison fails
- [ ] Verify Create Variants is disabled when using workflows

## Notes

- Comparison uses the 'comprehensive' analysis type by default
- Comparison requires at least 2 items (original + generated outputs)
- The 500ms delay before triggering comparison ensures React state updates propagate
- Feature is backward compatible - existing workflows default to disabled
