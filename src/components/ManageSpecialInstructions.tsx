import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Plus, Edit, Trash2, RefreshCw, ArrowLeft, Shield, X, Save, Search, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import LoadingSpinner from './ui/LoadingSpinner';
import { getSupabaseClient } from '../services/supabaseClient';
import PublicFooter from './PublicFooter';

interface SpecialInstructionSuggestion {
  id: string;
  category: string;
  instruction_text: string;
  tone_match: string[];
  language_match: string[];
  output_type_match: string[];
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

const ManageSpecialInstructions: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SpecialInstructionSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<SpecialInstructionSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Edit/Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    instruction_text: '',
    tone_match: [] as string[],
    language_match: [] as string[],
    output_type_match: [] as string[],
    active: true
  });

  // Check if current user is admin using centralized admin service
  const { isAdmin } = useIsAdmin(currentUser);

  // Filter suggestions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuggestions(suggestions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = suggestions.filter(suggestion =>
        (typeof suggestion.category === 'string' && suggestion.category.toLowerCase().includes(query)) ||
        (typeof suggestion.instruction_text === 'string' && suggestion.instruction_text.toLowerCase().includes(query))
      );
      setFilteredSuggestions(filtered);
    }
  }, [searchQuery, suggestions]);

  // Fetch suggestions from database
  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from('pmc_extra_suggestions')
        .select('*')
        .order('category')
        .order('instruction_text');

      if (fetchError) throw fetchError;

      if (data) {
        setSuggestions(data);
        setFilteredSuggestions(data);
      }
    } catch (err: any) {
      console.error('Error fetching suggestions:', err);
      setError(`Failed to load suggestions: ${err.message}`);
      toast.error(`Failed to load suggestions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load suggestions on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchSuggestions();
    }
  }, [isAdmin]);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin && !loading) {
      navigate('/dashboard');
    }
  }, [isAdmin, loading, navigate]);

  // Open modal for adding new suggestion
  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      category: '',
      instruction_text: '',
      tone_match: [],
      language_match: [],
      output_type_match: [],
      active: true
    });
    setIsModalOpen(true);
  };

  // Open modal for editing existing suggestion
  const handleEdit = (suggestion: SpecialInstructionSuggestion) => {
    setEditingId(suggestion.id);
    setFormData({
      category: suggestion.category,
      instruction_text: suggestion.instruction_text,
      tone_match: suggestion.tone_match,
      language_match: suggestion.language_match,
      output_type_match: suggestion.output_type_match,
      active: suggestion.active
    });
    setIsModalOpen(true);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!formData.category.trim() || !formData.instruction_text.trim()) {
      toast.error('Category and instruction text are required');
      return;
    }

    try {
      const supabase = getSupabaseClient();

      if (editingId) {
        // Update existing
        const { error: updateError } = await supabase
          .from('pmc_extra_suggestions')
          .update({
            category: formData.category,
            instruction_text: formData.instruction_text,
            tone_match: formData.tone_match,
            language_match: formData.language_match,
            output_type_match: formData.output_type_match,
            active: formData.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (updateError) throw updateError;
        toast.success('Suggestion updated successfully');
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('pmc_extra_suggestions')
          .insert([formData]);

        if (insertError) throw insertError;
        toast.success('Suggestion created successfully');
      }

      setIsModalOpen(false);
      fetchSuggestions();
    } catch (err: any) {
      console.error('Error saving suggestion:', err);
      toast.error(`Failed to save suggestion: ${err.message}`);
    }
  };

  // Handle delete
  const handleDelete = async (suggestion: SpecialInstructionSuggestion) => {
    if (!window.confirm(`Are you sure you want to delete "${suggestion.instruction_text}"?`)) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error: deleteError } = await supabase
        .from('pmc_extra_suggestions')
        .delete()
        .eq('id', suggestion.id);

      if (deleteError) throw deleteError;
      toast.success('Suggestion deleted successfully');
      fetchSuggestions();
    } catch (err: any) {
      console.error('Error deleting suggestion:', err);
      toast.error(`Failed to delete suggestion: ${err.message}`);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (suggestion: SpecialInstructionSuggestion) => {
    try {
      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase
        .from('pmc_extra_suggestions')
        .update({ active: !suggestion.active })
        .eq('id', suggestion.id);

      if (updateError) throw updateError;
      toast.success(`Suggestion ${!suggestion.active ? 'activated' : 'deactivated'}`);
      fetchSuggestions();
    } catch (err: any) {
      console.error('Error toggling suggestion:', err);
      toast.error(`Failed to toggle suggestion: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-700 dark:text-gray-300 mt-4">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
          <Shield size={48} className="text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  <Lightbulb size={32} className="text-yellow-500 mr-3" />
                  Manage Special Instructions Suggestions
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage suggestions for Special Instructions field ({suggestions.length} total)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddNew}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Add New
              </button>
              <button
                onClick={fetchSuggestions}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
                disabled={loading}
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by category or instruction text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white"
            />
          </div>
        </div>

        {/* Suggestions Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
          {filteredSuggestions.length === 0 ? (
            <div className="p-8 text-center">
              <Lightbulb size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No matching suggestions' : 'No suggestions yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery ? 'Try a different search term' : 'Add your first suggestion to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleAddNew}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md inline-flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Add New Suggestion
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Instruction</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Filters</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSuggestions.map((suggestion) => (
                    <tr key={suggestion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {suggestion.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {suggestion.instruction_text}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="space-y-1 text-xs">
                          {suggestion.tone_match.length > 0 && (
                            <div><span className="font-medium">Tone:</span> {suggestion.tone_match.join(', ')}</div>
                          )}
                          {suggestion.language_match.length > 0 && (
                            <div><span className="font-medium">Lang:</span> {suggestion.language_match.join(', ')}</div>
                          )}
                          {suggestion.output_type_match.length > 0 && (
                            <div><span className="font-medium">Output:</span> {suggestion.output_type_match.join(', ')}</div>
                          )}
                          {suggestion.tone_match.length === 0 &&
                           suggestion.language_match.length === 0 &&
                           suggestion.output_type_match.length === 0 && (
                            <div className="text-gray-500 dark:text-gray-500">No filters (shows always)</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(suggestion)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            suggestion.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {suggestion.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(suggestion)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(suggestion)}
                            className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Edit Suggestion' : 'Add New Suggestion'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white"
                  placeholder="e.g., Tone & Style, Formatting, Content Rules"
                />
              </div>

              {/* Instruction Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instruction Text *
                </label>
                <textarea
                  value={formData.instruction_text}
                  onChange={(e) => setFormData({ ...formData, instruction_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white min-h-[100px]"
                  placeholder="e.g., Use active voice exclusively"
                />
              </div>

              {/* Tone Match */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tone Filter (comma-separated, leave empty for all)
                </label>
                <input
                  type="text"
                  value={formData.tone_match.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    tone_match: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white"
                  placeholder="e.g., Professional, Casual, Friendly"
                />
              </div>

              {/* Language Match */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language Filter (comma-separated, leave empty for all)
                </label>
                <input
                  type="text"
                  value={formData.language_match.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    language_match: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white"
                  placeholder="e.g., English (US), Spanish (Mexico)"
                />
              </div>

              {/* Output Type Match */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Type Filter (comma-separated, leave empty for all)
                </label>
                <input
                  type="text"
                  value={formData.output_type_match.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    output_type_match: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white"
                  placeholder="e.g., Paragraph, Bullet Points, FAQ"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
                  Active (show to users)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md flex items-center"
              >
                <Save size={16} className="mr-2" />
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
};

export default ManageSpecialInstructions;
