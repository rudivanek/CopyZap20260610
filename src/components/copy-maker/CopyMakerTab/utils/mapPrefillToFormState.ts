import { FormState } from '../../../../types';

/**
 * Helper function to apply prefill data to form state
 */
export function mapPrefillToFormState(
  prefillData: Partial<FormState>,
  currentFormState: FormState,
  setFormState: (state: FormState) => void
): FormState {
  // Track which fields are being prefilled (exclude runtime states)
  const prefilledFields = Object.keys(prefillData).filter(key => {
    const runtimeFields = ['isLoading', 'isEvaluating', 'generationProgress', 'copyResult', 'promptEvaluation', 'templatePrefilledFields'];
    return !runtimeFields.includes(key) && prefillData[key as keyof FormState] !== undefined && prefillData[key as keyof FormState] !== '';
  });

  const updatedFormState: FormState = {
    ...currentFormState,
    ...prefillData,
    // Always preserve loading states and other runtime states
    isLoading: currentFormState.isLoading,
    isEvaluating: currentFormState.isEvaluating,
    generationProgress: currentFormState.generationProgress,
    copyResult: currentFormState.copyResult,
    promptEvaluation: currentFormState.promptEvaluation,
    // Track which fields were prefilled
    templatePrefilledFields: prefilledFields
  };

  setFormState(updatedFormState);

  return updatedFormState;
}