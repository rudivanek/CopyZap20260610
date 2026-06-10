import React, { useState, useEffect } from 'react';
import { X, User, Calendar, DollarSign, Save, Key, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminUpdateUser } from '../services/supabaseClient';
import { supabase } from '../services/supabaseClient';

interface CreditPlan {
  id: string;
  plan_key: string;
  plan_name: string;
  credits_monthly: number;
}

interface EditUser {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  start_date?: string | null;
  until_date?: string | null;
  tokens_allowed: number;
  tokens_remaining?: number;
  auth_created_at?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  enforcement_mode?: 'credits' | 'tokens';
  credits_grace_units?: number;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: EditUser | null;
  onUserUpdated: () => void; // Callback to refresh data after user update
  currentUser?: any; // Current authenticated user to check admin permissions
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    password: '',
    startDate: '',
    untilDate: '',
    creditsAllowed: 0,
    enforcementMode: 'credits' as 'credits' | 'tokens',
    creditsGraceUnits: 0
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [creditPlans, setCreditPlans] = useState<CreditPlan[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch credit plans
  useEffect(() => {
    const fetchCreditPlans = async () => {
      const { data, error } = await supabase
        .from('credit_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data) {
        setCreditPlans(data);
      }
    };

    fetchCreditPlans();
  }, []);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        password: '',
        startDate: user.start_date || '',
        untilDate: user.until_date || '',
        creditsAllowed: user.tokens_allowed || 0,
        enforcementMode: user.enforcement_mode || 'credits',
        creditsGraceUnits: user.credits_grace_units || 0
      });
      setSelectedPlanId('');
      setErrors({});
    }
  }, [isOpen, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'creditsAllowed' || name === 'creditsGraceUnits') ? parseInt(value) || 0 : value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);

    // Auto-apply the plan's credits when selected
    if (planId) {
      const plan = creditPlans.find(p => p.id === planId);
      if (plan) {
        setFormData(prev => ({
          ...prev,
          creditsAllowed: plan.credits_monthly
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Password validation (only if provided)
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Date validation
    if (formData.startDate && formData.untilDate) {
      const startDate = new Date(formData.startDate);
      const untilDate = new Date(formData.untilDate);
      
      if (untilDate <= startDate) {
        newErrors.untilDate = 'End date must be after start date';
      }
    }

    // Credits validation
    if (formData.creditsAllowed < 0) {
      newErrors.creditsAllowed = 'Credits allowed must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('No user selected for editing');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);

    try {
      await adminUpdateUser({
        userId: user.id,
        password: formData.password || undefined,
        startDate: formData.startDate || null,
        untilDate: formData.untilDate || null,
        tokensAllowed: formData.creditsAllowed,
        creditPlanId: selectedPlanId || null,
        enforcementMode: formData.enforcementMode,
        creditsGraceUnits: formData.creditsGraceUnits
      });

      toast.success(`User ${user.email} updated successfully!`);
      onUserUpdated(); // Refresh data
      onClose(); // Close modal
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-black dark:text-white flex items-center">
            <User size={20} className="mr-2 text-primary-500" />
            Edit User: {user.email}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            disabled={isUpdating}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-4">
            {/* User Info Display */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">User Information</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Credits Remaining:</strong> {user.tokens_remaining?.toLocaleString() || 0}</p>
                <p><strong>Credits Allowance:</strong> {user.tokens_allowed?.toLocaleString() || 0}</p>
                <p><strong>Created:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                {user.last_sign_in_at && (
                  <p><strong>Last Sign In:</strong> {new Date(user.last_sign_in_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-gray-500" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`bg-white dark:bg-gray-900 border${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5`}
                  placeholder="Leave blank to keep current password"
                  disabled={isUpdating}
                  minLength={6}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only enter a new password if you want to change it
              </p>
            </div>

            {/* Subscription Details Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <Calendar size={16} className="mr-2 text-primary-500" />
                Subscription Details
              </h4>

              {/* Start Date */}
              <div className="mb-4">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="bg-white dark:bg-gray-900 borderborder-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  disabled={isUpdating}
                />
              </div>

              {/* Until Date */}
              <div>
                <label htmlFor="untilDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Until Date
                </label>
                <input
                  type="date"
                  id="untilDate"
                  name="untilDate"
                  value={formData.untilDate}
                  onChange={handleInputChange}
                  className={`bg-white dark:bg-gray-900 border${errors.untilDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5`}
                  disabled={isUpdating}
                />
                {errors.untilDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.untilDate}</p>
                )}
              </div>
            </div>

            {/* Credit Plan Assignment Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <CreditCard size={16} className="mr-2 text-primary-500" />
                Credit Plan Assignment
              </h4>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Select a credit plan to set the user's credit allowance. The plan will be linked to the user's account and credits will be automatically applied.
                </p>
              </div>

              <div className="space-y-3">
                {/* Credits Allowed Field */}
                <div>
                  <label htmlFor="creditsAllowed" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Credits Allowed
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-gray-500" />
                    </div>
                    <input
                      type="number"
                      id="creditsAllowed"
                      name="creditsAllowed"
                      value={formData.creditsAllowed}
                      onChange={handleInputChange}
                      className={`bg-white dark:bg-gray-900 border${errors.creditsAllowed ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5`}
                      placeholder="0"
                      disabled={isUpdating}
                      min={0}
                    />
                  </div>
                  {errors.creditsAllowed && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.creditsAllowed}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    You can manually adjust or select a plan below
                  </p>
                </div>
                <div>
                  <label htmlFor="creditPlan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Credit Plan
                  </label>
                  <select
                    id="creditPlan"
                    value={selectedPlanId}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="bg-white dark:bg-gray-900 borderborder-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                    disabled={isUpdating}
                  >
                    <option value="">-- Select a plan --</option>
                    {creditPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.plan_name} - {plan.credits_monthly.toLocaleString()} credits
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlanId && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>Plan Applied:</strong> {creditPlans.find(p => p.id === selectedPlanId)?.credits_monthly.toLocaleString() || 0} credits will be set when you click Update User
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Phase 4B-1: Enforcement Mode section REMOVED from UI
                DB fields remain intact for emergency manual rollback if needed */}
          </div>
        </form>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <svg className="w-4 h-4 animate-spin mr-2" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="spinnerGradientEUM" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b35" />
                      <stop offset="100%" stopColor="#ffa07a" />
                    </linearGradient>
                  </defs>
                  <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientEUM)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90, 150" />
                </svg>
                Updating...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Update User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;