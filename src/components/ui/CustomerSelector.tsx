import React, { useState, useEffect } from 'react';
import { Plus, Info as InfoIcon } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';
import { toast } from 'react-hot-toast';
import { Tooltip } from './Tooltip';

const supabase = getSupabaseClient();

interface Customer {
  id: string;
  name: string;
  description?: string;
}

interface CustomerSelectorProps {
  value?: string;
  onChange: (customerId: string, customerName: string) => void;
  currentUserId?: string;
  className?: string;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  value,
  onChange,
  currentUserId,
  className = ''
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerDescription, setNewCustomerDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      loadCustomers();
    }
  }, [currentUserId]);

  const loadCustomers = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pmc_customers')
        .select('id, name, description')
        .or(`user_id.eq.${currentUserId},user_id.is.null`)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (!currentUserId) {
      toast.error('You must be logged in to add a customer');
      return;
    }

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('pmc_customers')
        .insert({
          name: newCustomerName.trim(),
          description: newCustomerDescription.trim() || null,
          user_id: currentUserId
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Customer added successfully');
      setCustomers(prev => [...prev, data]);
      onChange(data.id, data.name);
      setShowAddModal(false);
      setNewCustomerName('');
      setNewCustomerDescription('');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedCustomer = customers.find(c => c.id === selectedId);
    onChange(selectedId, selectedCustomer?.name || '');
  };

  return (
    <>
      <div className={className}>
        <div className="flex items-center gap-2">
          <select
            value={value || ''}
            onChange={handleSelectChange}
            disabled={isLoading}
            className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
          >
            <option value="">Select a customer (optional)</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            disabled={!currentUserId}
            className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add new customer"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Add New Customer
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-normal text-gray-500 dark:text-gray-400 mb-1">
                  Customer Name *
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  placeholder="e.g., Acme Corp, John's Small Business"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="customerDescription" className="block text-sm font-normal text-gray-500 dark:text-gray-400 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="customerDescription"
                  value={newCustomerDescription}
                  onChange={(e) => setNewCustomerDescription(e.target.value)}
                  rows={3}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  placeholder="Add notes about this customer..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCustomerName('');
                  setNewCustomerDescription('');
                }}
                disabled={isAdding}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={isAdding || !newCustomerName.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerSelector;
