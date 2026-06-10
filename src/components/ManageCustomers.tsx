import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Plus, Edit, Trash2, RefreshCw, ArrowLeft, User, X, Save, Search, Users, Eye } from 'lucide-react';
import { getSupabaseClient } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './ui/LoadingSpinner';
import PublicFooter from './PublicFooter';

const supabase = getSupabaseClient();

interface Customer {
  id: string;
  name: string;
  description?: string;
  user_id?: string;
  created_at: string;
}

const ManageCustomers: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Filter customers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Fetch customers data
  const fetchCustomersData = async () => {
    setLoading(true);
    setError(null);

    if (!currentUser?.id) {
      setError('User not logged in.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('pmc_customers')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setCustomers(data);
        setFilteredCustomers(data);
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(`Failed to load customers: ${err.message}`);
      toast.error(`Failed to load customers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    if (currentUser) {
      fetchCustomersData();
    }
  }, [currentUser]);

  // Handle adding a new customer
  const handleAddNewCustomer = async () => {
    if (!newName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (!currentUser?.id) {
      toast.error('You must be logged in');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pmc_customers')
        .insert({
          name: newName.trim(),
          description: newDescription.trim() || null,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Customer added successfully!');
      setNewName('');
      setNewDescription('');
      setIsAddingNew(false);
      fetchCustomersData();
    } catch (err: any) {
      console.error('Error adding customer:', err);
      toast.error(`Failed to add customer: ${err.message}`);
    }
  };

  // Handle editing a customer
  const handleStartEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditName(customer.name);
    setEditDescription(customer.description || '');
  };

  const handleSaveEdit = async (customerId: string) => {
    if (!editName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('pmc_customers')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null
        })
        .eq('id', customerId);

      if (error) throw error;

      toast.success('Customer updated successfully!');
      setEditingId(null);
      fetchCustomersData();
    } catch (err: any) {
      console.error('Error updating customer:', err);
      toast.error(`Failed to update customer: ${err.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  // Handle deleting a customer
  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmMessage = `Are you sure you want to delete "${customer.name}"?\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        const { error } = await supabase
          .from('pmc_customers')
          .delete()
          .eq('id', customer.id);

        if (error) throw error;

        toast.success(`Customer "${customer.name}" deleted successfully!`);
        fetchCustomersData();
      } catch (err: any) {
        console.error('Error deleting customer:', err);
        toast.error(`Failed to delete customer: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-700 dark:text-gray-300 mt-4">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users size={32} className="text-primary-600 dark:text-primary-400 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Manage Customers
              </h1>
            </div>
            <button
              onClick={fetchCustomersData}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Manage your customers and clients. These help you organize your copy projects.
          </p>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Add New Customer Button */}
          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="mb-6 w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus size={20} className="mr-2" />
              Add New Customer
            </button>
          )}

          {/* Add New Customer Form */}
          {isAddingNew && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Customer</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Add notes about this customer"
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNewCustomer}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center"
                  >
                    <Save size={16} className="mr-2" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewName('');
                      setNewDescription('');
                    }}
                    className="bg-white0 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center"
                  >
                    <X size={16} className="mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Customers List */}
          <div className="space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {searchQuery ? 'No customers found matching your search.' : 'No customers yet. Add your first customer!'}
                </p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingId === customer.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(customer.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center text-sm"
                        >
                          <Save size={16} className="mr-1" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-white0 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center text-sm"
                        >
                          <X size={16} className="mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3
                          onClick={() => navigate(`/manage-customers/${customer.id}`, { state: { customerName: customer.name } })}
                          className="text-lg font-semibold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {customer.name}
                        </h3>
                        {customer.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {customer.description}
                          </p>
                        )}
                        <p className="text-gray-500 dark:text-gray-500 text-xs">
                          Created: {formatDate(customer.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => navigate(`/manage-customers/${customer.id}`, { state: { customerName: customer.name } })}
                          className="p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-white dark:hover:bg-primary-900/20 rounded transition-colors"
                          title="View Details & Brand Voices"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleStartEdit(customer)}
                          className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer)}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default ManageCustomers;
