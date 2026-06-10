import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, CreditCard as Edit, Trash2, UserPlus, ArrowLeft, Shield, Calendar, DollarSign, RefreshCw, User as UserIcon, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import LoadingSpinner from './ui/LoadingSpinner';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';
import { adminGetUsers, adminDeleteUser } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';
import PublicFooter from './PublicFooter';

// Phase 4B-2: tokens_allowed removed from database
interface ManageUser {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  start_date?: string | null;
  until_date?: string | null;
  credits_allowed: number; // Changed from tokens_allowed (Phase 4B-2)
  credits_used?: number; // Total credits consumed
  credits_remaining?: number; // Current credit balance
  cost_usd?: number; // Total cost in USD
  total_records?: number; // Total API call records
  tokens_allowed?: number; // API still returns this for backwards compatibility
  tokens_remaining?: number; // Backwards compatibility alias
  auth_created_at?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
}

const ManageUsers: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<ManageUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManageUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ManageUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'email' | 'created_at' | 'start_date' | 'until_date' | 'credits_allowed' | 'credits_used' | 'credits_remaining' | 'cost_usd' | 'total_records' | 'tokens_remaining' | 'last_sign_in_at' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Check if user is admin using centralized admin service
  const { isAdmin } = useIsAdmin(currentUser);

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Fetch users data
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await adminGetUsers();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err.message}`);
      toast.error(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sort users
  const sortUsers = (usersToSort: ManageUser[]) => {
    if (!sortField) return usersToSort;

    return [...usersToSort].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Convert to numbers for numeric fields
      if (sortField === 'credits_allowed' || sortField === 'credits_used' || sortField === 'credits_remaining' || sortField === 'cost_usd' || sortField === 'total_records' || sortField === 'tokens_remaining') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      // Convert to dates for date fields
      if (['created_at', 'start_date', 'until_date', 'last_sign_in_at'].includes(sortField)) {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort users based on search query
  useEffect(() => {
    let result = users;

    if (searchQuery.trim()) {
      result = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result = sortUsers(result);
    setFilteredUsers(result);
  }, [searchQuery, users, sortField, sortDirection]);

  // Load users on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin && !loading) {
      navigate('/dashboard');
    }
  }, [isAdmin, loading, navigate]);

  // Handle edit user
  const handleEditUser = (user: ManageUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = async (user: ManageUser) => {
    // Prevent admin from deleting themselves
    if (user.id === currentUser?.id) {
      toast.error('You cannot delete your own admin account');
      return;
    }

    const confirmMessage = `Are you sure you want to delete user "${user.email}"?\n\nThis action will:\n• Remove them from authentication\n• Delete all their data\n• Cannot be undone`;
    
    if (window.confirm(confirmMessage)) {
      setIsDeleting(user.id);
      
      try {
        await adminDeleteUser(user.id);
        
        toast.success(`User ${user.email} deleted successfully!`);
        
        // Refresh the user list
        await fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error(`Failed to delete user: ${error.message}`);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Handle user updated callback
  const handleUserUpdated = () => {
    fetchUsers(); // Refresh the user list
  };

  // Export users to CSV
  const handleExportCSV = () => {
    try {
      // CSV Headers
      const headers = [
        'Email',
        'Start Date',
        'Until Date',
        'Total Credits',
        'Credits Used',
        'Cost USD',
        'Credits Remaining',
        'Total Records',
        'Created',
        'Last Activity'
      ];

      // Convert users to CSV rows
      const rows = filteredUsers.map(user => [
        user.email || '',
        formatDate(user.start_date),
        formatDate(user.until_date),
        user.credits_allowed !== undefined && user.credits_allowed !== null ? user.credits_allowed.toLocaleString() : '0',
        user.credits_used !== undefined && user.credits_used !== null ? user.credits_used.toLocaleString() : '0',
        user.cost_usd !== undefined && user.cost_usd !== null ? user.cost_usd.toFixed(2) : '0.00',
        user.credits_remaining !== undefined && user.credits_remaining !== null ? user.credits_remaining.toLocaleString() : 'Not set',
        user.total_records !== undefined && user.total_records !== null ? user.total_records.toLocaleString() : '0',
        formatDate(user.created_at),
        user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filteredUsers.length} users to CSV`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-700 dark:text-gray-300 mt-4">Loading users...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
          <Shield size={48} className="text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 hover:bg-gray-1000 text-white px-4 py-2 rounded-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Users size={32} className="text-primary-500 mr-3" />
                Manage Users
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Administrative panel for user management ({filteredUsers.length} users)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
              disabled={filteredUsers.length === 0}
              title="Export users to CSV"
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </button>
            <button
              onClick={fetchUsers}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
              disabled={loading}
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              className="bg-primary-600 hover:bg-gray-1000 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
              onClick={() => setIsAddModalOpen(true)}
            >
              <UserPlus size={16} className="mr-2" />
              Add New User
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
          {filteredUsers.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <Users size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No users found' : 'No users available'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search criteria' : 'No users have been created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 z-10 bg-gray-50 dark:bg-gray-800">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <span>User</span>
                        {sortField === 'name' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Confirmed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('start_date')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <span>Subscription</span>
                        {sortField === 'start_date' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('credits_allowed')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <span>Total Credits</span>
                        {sortField === 'credits_allowed' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('credits_used')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <span>Credits Used</span>
                        {sortField === 'credits_used' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('cost_usd')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <span>Cost USD</span>
                        {sortField === 'cost_usd' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('credits_remaining')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <span>Credits Remaining</span>
                        {sortField === 'credits_remaining' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('total_records')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <span>Total Records</span>
                        {sortField === 'total_records' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <span>Created</span>
                        {sortField === 'created_at' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('last_sign_in_at')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <span>Last Activity</span>
                        {sortField === 'last_sign_in_at' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <UserIcon size={20} className="text-primary-600 dark:text-primary-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.email_confirmed_at ? 'Yes' : 'No'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1 text-gray-400" />
                            {formatDate(user.start_date)} - {formatDate(user.until_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.credits_allowed !== undefined && user.credits_allowed !== null
                            ? user.credits_allowed.toLocaleString()
                            : '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.credits_used !== undefined && user.credits_used !== null
                            ? user.credits_used.toLocaleString()
                            : '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.cost_usd !== undefined && user.cost_usd !== null
                            ? `$${user.cost_usd.toFixed(2)}`
                            : '$0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.credits_remaining !== undefined && user.credits_remaining !== null
                            ? user.credits_remaining.toLocaleString()
                            : 'Not set'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.total_records !== undefined && user.total_records !== null
                            ? user.total_records.toLocaleString()
                            : '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-primary-600 hover:text-primary-500 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-primary-900/20 transition-colors"
                            title="Edit user"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isDeleting === user.id || user.id === currentUser?.id}
                            className={`p-2 rounded-md transition-colors ${
                              user.id === currentUser?.id // Changed from text-red-600
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-500 hover:bg-white dark:hover:bg-red-900/20'
                            }`}
                            title={user.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete user'}
                          >
                            {isDeleting === user.id ? (
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <linearGradient id="spinnerGradientMU" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#ff6b35" />
                                    <stop offset="100%" stopColor="#ffa07a" />
                                  </linearGradient>
                                </defs>
                                <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientMU)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90, 150" />
                              </svg>
                            ) : (
                              <Trash2 size={16} />
                            )}
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

        {/* Edit User Modal */}
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onUserCreated={handleUserUpdated}
        />

        <PublicFooter />
      </div>
    </div>
  );
};

export default ManageUsers;