import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FormState } from '../../../../types';

interface UseExportsReturn {
  isExporting: boolean;
  handleExportForm: () => void;
  isImporting: boolean;
  handleImportForm: () => void;
}

export function useExports(
  formState?: FormState,
  setFormState?: (state: FormState | ((prev: FormState) => FormState)) => void,
  onClearAll?: () => void
): UseExportsReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Handle export form
  const handleExportForm = async () => {
    if (!formState) return;

    setIsExporting(true);
    try {
      const exportData = {
        formState: formState,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `copy-maker-form-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Form exported successfully!');
    } catch (error: any) {
      console.error('Error exporting form:', error);
      toast.error(`Failed to export form: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle import form
  const handleImportForm = () => {
    if (!setFormState) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (importData.formState) {
          // Clear all inputs first
          if (onClearAll) onClearAll();

          setFormState(prev => ({
            ...prev,
            ...importData.formState,
            copyResult: { generatedVersions: [] }, // Clear any existing results
            isLoading: false,
            isEvaluating: false,
            generationProgress: []
          }));
          toast.success('Form imported successfully!');
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error: any) {
        console.error('Error importing form:', error);
        toast.error(`Failed to import form: ${error.message}`);
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  return {
    isExporting,
    handleExportForm,
    isImporting,
    handleImportForm
  };
}