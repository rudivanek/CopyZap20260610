import React, { useState } from 'react';
import { X, User, Calendar, DollarSign, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminCreateUser } from '../services/supabaseClient';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void; // Callback to refresh data after user creation
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    startDate: '',
    untilDate: '',
    creditsAllowed: 500000
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        password: '',
        name: '',
        startDate: '',
        untilDate: '',
        creditsAllowed: 500000
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'creditsAllowed' ? parseInt(value) || 0 : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
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

    if (!validateForm()) {
      return;
    }

    setIsCreating(true);

    try {
      await adminCreateUser({
        email: formData.email,
        password: formData.password,
        name: formData.name || formData.email.split('@')[0],
        startDate: formData.startDate || null,
        untilDate: formData.untilDate || null,
        tokensAllowed: formData.creditsAllowed
      });

      toast.success(`User ${formData.email} created successfully!`);
      onUserCreated(); // Refresh data
      onClose(); // Close modal
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-black dark:text-white flex items-center">
            <User size={20} className="mr-2 text-primary-500" />
            Create New User
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            disabled={isCreating}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`bg-white dark:bg-gray-900 border${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5`}
                placeholder="user@example.com"
                disabled={isCreating}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`bg-white dark:bg-gray-900 border${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5`}
                placeholder="Minimum 6 characters"
                disabled={isCreating}
                minLength={6}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Name Field (Optional) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-white dark:bg-gray-900 borderborder-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                placeholder="User's full name"
                disabled={isCreating}
              />
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
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="bg-white dark:bg-gray-900 borderborder-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  disabled={isCreating}
                />
              </div>

              {/* Until Date */}
              <div className="mb-4">
                <label htmlFor="untilDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Until Date (Optional)
                </label>
                <input
                  type="date"
                  id="untilDate"
                  name="untilDate"
                  value={formData.untilDate}
                  onChange={handleInputChange}
                  className={`bg-white dark:bg-gray-900 border${errors.untilDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5`}
                  disabled={isCreating}
                />
                {errors.untilDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.untilDate}</p>
                )}
              </div>

              {/* Credits Allowed */}
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
                    min="0"
                    step="1000"
                    value={formData.creditsAllowed}
                    onChange={handleInputChange}
                    className={`bg-white dark:bg-gray-900 border${errors.creditsAllowed ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5`}
                    placeholder="500000"
                    disabled={isCreating}
                  />
                </div>
                {errors.creditsAllowed && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.creditsAllowed}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Total credits the user can consume during their subscription period
                </p>
              </div>
            </div>
          </div>
        </form>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isCreating || !formData.email.trim() || !formData.password.trim()}
          >
            {isCreating ? (
              <>
                <svg className="w-4 h-4 animate-spin mr-2" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="spinnerGradientAUM" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b35" />
                      <stop offset="100%" stopColor="#ffa07a" />
                    </linearGradient>
                  </defs>
                  <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientAUM)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90, 150" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Create User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;