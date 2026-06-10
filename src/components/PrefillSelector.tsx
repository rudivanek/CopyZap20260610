import React, { useState } from 'react';
import { FormState } from '../types';
import { GROUPED_PREFILLS } from '../constants/prefills'; // Keep as fallback
import { DEFAULT_FORM_STATE } from '../constants';
import { RefreshCw, Lightbulb, AlertCircle } from 'lucide-react';
import { Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Tooltip } from './ui/Tooltip';
import { useAuth } from '../hooks/useAuth';
import { getPrefills, Prefill } from '../services/supabaseClient';
import { getAutoDisplayMode } from '../utils/formUtils';

// Interface for grouped prefills structure
interface PrefillGroup {
  category: string;
  options: {
    id: string;
    label: string;
    data: Partial<FormState>;
  }[];
}

interface PrefillSelectorProps {
  formState: FormState;
  setFormState: (state: FormState) => void;
  setDisplayMode: (mode: 'all' | 'populated') => void;
}

const PrefillSelector: React.FC<PrefillSelectorProps> = ({ formState, setFormState, setDisplayMode }) => {
  const { currentUser } = useAuth();
  const [selectedPrefillId, setSelectedPrefillId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [prefillGroups, setPrefillGroups] = useState<PrefillGroup[]>(GROUPED_PREFILLS);
  const [isLoadingPrefills, setIsLoadingPrefills] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [useHardcodedFallback, setUseHardcodedFallback] = useState(false);
  
  // Filtered prefill groups based on search query
  const filteredPrefillGroups = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return prefillGroups;
    }
    
    const query = searchQuery.toLowerCase();
    return prefillGroups.map(group => ({
      ...group,
      options: group.options.filter(option =>
        (typeof option.label === 'string' && option.label.toLowerCase().includes(query)) ||
        (typeof group.category === 'string' && group.category.toLowerCase().includes(query)) ||
        JSON.stringify(option.data).toLowerCase().includes(query)
      )
    })).filter(group => group.options.length > 0);
  }, [prefillGroups, searchQuery]);

  // Fetch prefills from database on component mount
  React.useEffect(() => {
    const fetchPrefills = async () => {
      if (!currentUser?.id) {
        // If no user, use hardcoded prefills
        setPrefillGroups(GROUPED_PREFILLS);
        return;
      }

      setIsLoadingPrefills(true);
      setPrefillError(null);

      try {
        const { data, error } = await getPrefills(currentUser.id);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Convert database format to grouped format
          const groupedFromDatabase = convertDatabaseToGroupedFormat(data);
          setPrefillGroups(groupedFromDatabase);
          setUseHardcodedFallback(false);
        } else {
          // If no data, use hardcoded fallback
          setPrefillGroups(GROUPED_PREFILLS);
          setUseHardcodedFallback(true);
        }
      } catch (error) {
        console.error('Error fetching prefills from database:', error);
        setPrefillError('Failed to load prefills from database');
        // Use hardcoded fallback on error
        setPrefillGroups(GROUPED_PREFILLS);
        setUseHardcodedFallback(true);
      } finally {
        setIsLoadingPrefills(false);
      }
    };

    fetchPrefills();
  }, [currentUser?.id]);

  // Convert database prefills to grouped format
  const convertDatabaseToGroupedFormat = (prefills: Prefill[]): PrefillGroup[] => {
    const groups: Record<string, PrefillGroup> = {};

    prefills.forEach(prefill => {
      const categoryKey = prefill.category || 'Uncategorized';
      if (!groups[categoryKey]) {
        groups[categoryKey] = {
          category: categoryKey,
          options: []
        };
      }

      groups[categoryKey].options.push({
        id: prefill.id,
        label: prefill.label,
        data: prefill.data // The JSONB data contains the FormState fields
      });
    });

    return Object.values(groups);
  };

  // Handle prefill refresh
  const handleRefreshPrefills = async () => {
    if (!currentUser?.id) return;

    setIsLoadingPrefills(true);
    setPrefillError(null);

    try {
      const { data, error } = await getPrefills(currentUser.id);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const groupedFromDatabase = convertDatabaseToGroupedFormat(data);
        setPrefillGroups(groupedFromDatabase);
        setUseHardcodedFallback(false);
        toast.success('Prefills refreshed from database');
      } else {
        setPrefillGroups(GROUPED_PREFILLS);
        setUseHardcodedFallback(true);
        toast.info('No database prefills found, using defaults');
      }
    } catch (error) {
      console.error('Error refreshing prefills:', error);
      setPrefillError('Failed to refresh prefills');
      setPrefillGroups(GROUPED_PREFILLS);
      setUseHardcodedFallback(true);
      toast.error('Failed to refresh prefills, using defaults');
    } finally {
      setIsLoadingPrefills(false);
    }
  };

  const handlePrefillSelection = (prefillId: string) => {
    if (!prefillId) {
      setSelectedPrefillId('');
      return;
    }

    // Find the prefill across all groups (now using database or hardcoded data)
    let selectedPrefill = null;
    for (const group of prefillGroups) {
      const found = group.options.find(prefill => prefill.id === prefillId);
      if (found) {
        selectedPrefill = found;
        break;
      }
    }
    
    if (!selectedPrefill) {
      console.error('Prefill not found:', prefillId);
      return;
    }

    // Merge prefill data with current form state
    const updatedFormState: FormState = {
      ...formState,
      ...selectedPrefill.data,
      // Always preserve loading states and other runtime states
      isLoading: formState.isLoading,
      isEvaluating: formState.isEvaluating,
      generationProgress: formState.generationProgress,
      copyResult: formState.copyResult,
      promptEvaluation: formState.promptEvaluation
    };

    setFormState(updatedFormState);
    setSelectedPrefillId(prefillId);
    
    // Auto-determine display mode based on populated fields
    const autoMode = getAutoDisplayMode(updatedFormState);
    setDisplayMode(autoMode);
    
    toast.success(`Applied "${selectedPrefill.label}" prefill`);
  };

  const handleClearPrefill = () => {
    // Reset to default form state but preserve runtime states
    const clearedFormState: FormState = {
      ...DEFAULT_FORM_STATE,
      // Preserve runtime states
      isLoading: formState.isLoading,
      isEvaluating: formState.isEvaluating,
      generationProgress: formState.generationProgress,
      copyResult: formState.copyResult,
      promptEvaluation: formState.promptEvaluation
    };

    setFormState(clearedFormState);
    setSelectedPrefillId('');
    
    // Auto-determine display mode (should be 'all' for empty form)
    const autoMode = getAutoDisplayMode(clearedFormState);
    setDisplayMode(autoMode);
    
    toast.success('All fields cleared');
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <label htmlFor="prefillSelection" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prefill (optional){useHardcodedFallback && (
                  <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">(using defaults)</span>
                )}
              </label>
            </div>
            
            {currentUser && (
              <div className="flex items-center space-x-2">
                {prefillError && (
                  <Tooltip content={prefillError}>
                    <AlertCircle size={14} className="text-gray-500" />
                  </Tooltip>
                )}
                <button
                  type="button"
                  onClick={handleRefreshPrefills}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center"
                  disabled={isLoadingPrefills}
                >
                  <RefreshCw size={12} className={`mr-1 ${isLoadingPrefills ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            )}
          </div>
          
          {/* Prefill Selection Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search prefills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full pl-10 pr-4 py-2.5"
                />
              </div>
            </div>
            
            {/* Prefill Dropdown */}
            <div className="lg:col-span-2">
              <select
                id="prefillSelection"
                name="prefillSelection"
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={selectedPrefillId}
                onChange={(e) => handlePrefillSelection(e.target.value)}
                disabled={isLoadingPrefills}
              >
                <option value="">{isLoadingPrefills ? '— Loading Prefills —' : '— Select a Prefill —'}</option>
                {filteredPrefillGroups.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.options.map((prefill) => (
                      <option key={prefill.id} value={prefill.id}>
                        {prefill.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          
          {/* Search Results Info */}
          {searchQuery && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {filteredPrefillGroups.reduce((total, group) => total + group.options.length, 0)} prefill(s) found
              {filteredPrefillGroups.length === 0 && (
                <span className="text-gray-600 dark:text-gray-400"> - Try different keywords</span>
              )}
            </div>
          )}
          
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Choose a preset to automatically fill form fields with recommended values
            {!currentUser && ' (Login to access custom prefills)'}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Tooltip content="Reset all form fields to empty state">
            <button
              type="button"
              onClick={handleClearPrefill}
              className="flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 w-10 h-10 rounded-md transition-colors"
              disabled={formState.isLoading}
              title="Clear Prefill"
            >
              <RefreshCw size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default PrefillSelector;