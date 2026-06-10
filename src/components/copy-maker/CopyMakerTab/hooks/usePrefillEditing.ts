import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getPrefill, createPrefill, updatePrefill } from '../../../../services/supabaseClient';
import { FormState, User } from '../../../../types';
import { logAutoApply } from '../../../../utils/debugAutoApply';

interface UsePrefillEditingReturn {
  isPrefillEditingMode: boolean;
  prefillEditingData: {
    mode: 'add' | 'edit' | 'clone';
    prefillId?: string;
    originalLabel?: string;
  } | null;
  initFromUrl: () => void;
  handleSavePrefill: (label: string, category: string, isPublic: boolean) => Promise<void>;
  handleCancelPrefillEditing: () => void;
}

export function usePrefillEditing(
  currentUser?: User,
  formState?: FormState,
  loadFormStateFromPrefill?: (prefill: any) => void
): UsePrefillEditingReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isPrefillEditingMode, setIsPrefillEditingMode] = useState(false);
  const [prefillEditingData, setPrefillEditingData] = useState<{
    mode: 'add' | 'edit' | 'clone';
    prefillId?: string;
    originalLabel?: string;
  } | null>(null);

  // Function to load prefill data
  const loadPrefillData = async (prefillId: string, isClone: boolean = false) => {
    try {
      const { data: prefill, error } = await getPrefill(prefillId);
      if (error) throw error;
      
      if (prefill && loadFormStateFromPrefill) {
        logAutoApply({
          ruleId: 'CM-AUTO-004',
          target: 'prefill',
          before: 'existing_form_state',
          after: 'prefill_merged',
          source: isClone ? 'url_param_prefillMode_clone' : 'url_param_prefillMode_edit',
          context: {
            prefillId: prefill.id,
            prefillLabel: prefill.label,
            category: prefill.category,
            isClone,
            isPublic: prefill.is_public
          }
        });
        loadFormStateFromPrefill(prefill);
        setPrefillEditingData(prev => ({
          ...prev!,
          originalLabel: isClone ? `${prefill.label} (Clone)` : prefill.label
        }));

        if (isClone) {
          toast.success(`Cloned "${prefill.label}" - edit and save as new prefill`);
        } else {
          toast.success(`Loaded "${prefill.label}" for editing`);
        }
      }
    } catch (error: any) {
      console.error('Error loading prefill:', error);
      toast.error(`Failed to load prefill: ${error.message}`);
      // Reset prefill mode on error
      setSearchParams({});
      setIsPrefillEditingMode(false);
      setPrefillEditingData(null);
    }
  };

  // Initialize from URL parameters
  const initFromUrl = () => {
    const prefillMode = searchParams.get('prefillMode') as 'add' | 'edit' | 'clone' | null;
    const prefillId = searchParams.get('prefillId');

    if (prefillMode && currentUser) {
      setIsPrefillEditingMode(true);
      setPrefillEditingData({ mode: prefillMode, prefillId });

      // If editing or cloning, load the prefill data
      if ((prefillMode === 'edit' || prefillMode === 'clone') && prefillId) {
        loadPrefillData(prefillId, prefillMode === 'clone');
      }
    } else {
      setIsPrefillEditingMode(false);
      setPrefillEditingData(null);
    }
  };

  // Handle URL parameter changes
  useEffect(() => {
    initFromUrl();
  }, [searchParams, currentUser]);

  // Handle saving prefill
  const handleSavePrefill = async (label: string, category: string, isPublic: boolean) => {
    if (!currentUser?.id || !formState) {
      toast.error('You must be logged in to save prefills.');
      return;
    }

    try {
      const prefillData = {
        user_id: currentUser.id,
        label,
        category,
        is_public: isPublic,
        data: formState
      };

      if (prefillEditingData?.mode === 'edit' && prefillEditingData.prefillId) {
        // Update existing prefill
        const { error } = await updatePrefill({
          id: prefillEditingData.prefillId,
          ...prefillData
        });
        if (error) throw error;
        toast.success('Prefill updated successfully!');
      } else {
        // Create new prefill (add or clone)
        const { error } = await createPrefill(prefillData);
        if (error) throw error;
        toast.success(prefillEditingData?.mode === 'clone' ? 'Prefill cloned successfully!' : 'Prefill created successfully!');
      }

      // Navigate back to manage prefills
      navigate('/manage-prefills');
    } catch (error: any) {
      console.error('Error saving prefill:', error);
      toast.error(`Failed to save prefill: ${error.message}`);
    }
  };

  // Handle canceling prefill editing
  const handleCancelPrefillEditing = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/manage-prefills');
    }
  };

  return {
    isPrefillEditingMode,
    prefillEditingData,
    initFromUrl,
    handleSavePrefill,
    handleCancelPrefillEditing
  };
}