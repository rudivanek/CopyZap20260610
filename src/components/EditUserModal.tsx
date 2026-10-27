import React, { useState, useEffect } from 'react';
import { X, User, Key, Layers, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminUpdateUser, adminGetCreditPacks, adminAddCredits, adminListGrants, adminZeroGrant, AdminCreditPack, AdminCreditGrant } from '../services/supabaseClient';

interface EditUser {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  start_date?: string | null;
  until_date?: string | null;
  tokens_allowed: number;
  credits_allowed?: number;
  tokens_remaining?: number;
  auth_created_at?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  enforcement_mode?: 'credits' | 'tokens' | 'prepaid';
  credits_grace_units?: number;
  // Live prepaid (bought/trial) balance + next expiry, returned by admin-get-users.
  prepaid_balance?: number | null;
  prepaid_next_expiry?: string | null;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: EditUser | null;
  onUserUpdated: () => void;
  currentUser?: any;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const [password, setPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prepaid credit management state.
  const [creditPacks, setCreditPacks] = useState<AdminCreditPack[]>([]);
  const [grants, setGrants] = useState<AdminCreditGrant[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [addPackKey, setAddPackKey] = useState<string>('');
  const [addCustomCredits, setAddCustomCredits] = useState<string>('');
  const [addCustomDate, setAddCustomDate] = useState<string>('');
  const [addNote, setAddNote] = useState<string>('');
  const [addingCredits, setAddingCredits] = useState(false);
  const [zeroingId, setZeroingId] = useState<string | null>(null);
  const [prepaidBalance, setPrepaidBalance] = useState<number | null>(null);
  const [prepaidNextExpiry, setPrepaidNextExpiry] = useState<string | null>(null);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user) {
      setPassword('');
      setErrors({});
      setAddPackKey('');
      setAddCustomCredits('');
      setAddCustomDate('');
      setAddNote('');
      setPrepaidBalance(user.prepaid_balance ?? 0);
      setPrepaidNextExpiry(user.prepaid_next_expiry ?? null);
    }
  }, [isOpen, user]);

  // Load active credit packs once when the modal first opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const { data } = await adminGetCreditPacks();
      if (!cancelled && data) setCreditPacks(data);
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Load this user's credit grants every time the modal opens or the user changes.
  const refreshGrants = async (userId: string) => {
    setGrantsLoading(true);
    try {
      const { data, error } = await adminListGrants(userId);
      if (error) {
        toast.error(`Could not load credit grants: ${error.message}`);
        setGrants([]);
      } else {
        setGrants(data || []);
      }
    } finally {
      setGrantsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      refreshGrants(user.id);
    } else {
      setGrants([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  const handleAddCredits = async () => {
    if (!user) return;
    const usingPack = addPackKey && addPackKey !== '';
    const creditsNum = parseInt(addCustomCredits, 10);
    if (!usingPack) {
      if (!Number.isFinite(creditsNum) || creditsNum <= 0) {
        toast.error('Enter a positive number of credits');
        return;
      }
      if (!addCustomDate) {
        toast.error('Pick an expiry date');
        return;
      }
    }
    setAddingCredits(true);
    try {
      const { data, error } = await adminAddCredits({
        userId: user.id,
        packKey: usingPack ? addPackKey : null,
        credits: usingPack ? null : creditsNum,
        expiresAt: usingPack ? null : new Date(addCustomDate + 'T00:00:00Z').toISOString(),
        note: addNote || null,
      });
      if (error) throw error;
      if (data) {
        setPrepaidBalance(Number(data.credits_remaining) || 0);
        setPrepaidNextExpiry(data.next_expiry || null);
      }
      toast.success('Credits added');
      setAddPackKey('');
      setAddCustomCredits('');
      setAddCustomDate('');
      setAddNote('');
      await refreshGrants(user.id);
      onUserUpdated();
    } catch (err: any) {
      toast.error(`Could not add credits: ${err.message}`);
    } finally {
      setAddingCredits(false);
    }
  };

  const handleZeroGrant = async (grant: AdminCreditGrant) => {
    if (!user) return;
    const ok = window.confirm(`Zero out the remaining ${grant.remaining.toLocaleString()} credits from this ${grant.source} grant? This cannot be undone.`);
    if (!ok) return;
    setZeroingId(grant.id);
    try {
      const { error } = await adminZeroGrant(grant.id, 'Removed via admin UI');
      if (error) throw error;
      toast.success('Grant zeroed');
      await refreshGrants(user.id);
      const liveRemaining = (grantsRef.current ?? [])
        .filter(g => g.id !== grant.id)
        .reduce((sum, g) => sum + (Number(g.remaining) || 0), 0);
      setPrepaidBalance(liveRemaining);
      onUserUpdated();
    } catch (err: any) {
      toast.error(`Could not zero the grant: ${err.message}`);
    } finally {
      setZeroingId(null);
    }
  };

  // Keep a ref to the latest grants so handleZeroGrant can recompute the balance
  // synchronously after a successful zero without waiting for the state update.
  const grantsRef = React.useRef<AdminCreditGrant[]>([]);
  useEffect(() => { grantsRef.current = grants; }, [grants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('No user selected for editing');
      return;
    }

    const newErrors: Record<string, string> = {};
    if (password && password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Don't silently discard pending credits the admin typed but never added.
    const hasPendingCredits = !!(addPackKey || addCustomCredits);
    if (hasPendingCredits) {
      toast.error('You selected credits but didn\'t add them. Click Add credits first.');
      return;
    }

    setIsUpdating(true);
    try {
      await adminUpdateUser({
        userId: user.id,
        password: password || undefined,
      });

      toast.success(`User ${user.email} updated successfully!`);
      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !user) return null;

  const isOldPlan = user.enforcement_mode !== 'prepaid';

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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`bg-white dark:bg-gray-900 border${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5`}
                  placeholder="Leave blank to keep current password"
                  disabled={isUpdating}
                  minLength={8}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only enter a new password if you want to change it
              </p>
            </div>

            {/* Prepaid credit management (admin bonus grants). */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <Layers size={16} className="mr-2 text-primary-500" />
                Prepaid credits
              </h4>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-3 text-sm text-gray-700 dark:text-gray-300">
                <p className="flex items-center gap-2 flex-wrap">
                  <strong>Balance:</strong>
                  <span>{prepaidBalance !== null ? prepaidBalance.toLocaleString() : '0'}</span>
                  {isOldPlan && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Old plan
                    </span>
                  )}
                </p>
                <p><strong>Next expiry:</strong> {prepaidNextExpiry ? new Date(prepaidNextExpiry).toLocaleDateString() : '—'}</p>
              </div>

              {isOldPlan && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    This user is on the old plan. Added credits won&apos;t count until they&apos;re moved to prepaid.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label htmlFor="addPackKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Add credits from a pack
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="addPackKey"
                      value={addPackKey}
                      onChange={(e) => setAddPackKey(e.target.value)}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block flex-1 p-2.5"
                      disabled={addingCredits}
                    >
                      <option value="">-- Choose a pack --</option>
                      {creditPacks.map(pack => (
                        <option key={pack.pack_key} value={pack.pack_key}>
                          {pack.pack_name} — {pack.credits.toLocaleString()} credits, {pack.validity_months} months
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCredits}
                      disabled={addingCredits || (!addPackKey && !addCustomCredits)}
                      className="flex-shrink-0 inline-flex justify-center items-center bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {addingCredits ? (
                        <svg className="w-4 h-4 animate-spin mr-2" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="90, 150" />
                        </svg>
                      ) : (
                        <Plus size={16} className="mr-2" />
                      )}
                      {addCustomCredits ? 'Add custom credits' : 'Add credits'}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">— or —</div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="addCustomCredits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Custom credits
                    </label>
                    <input
                      type="number"
                      id="addCustomCredits"
                      value={addCustomCredits}
                      onChange={(e) => setAddCustomCredits(e.target.value)}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                      placeholder="0"
                      min={1}
                      disabled={addingCredits || !!addPackKey}
                    />
                  </div>
                  <div>
                    <label htmlFor="addCustomDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry date
                    </label>
                    <input
                      type="date"
                      id="addCustomDate"
                      value={addCustomDate}
                      onChange={(e) => setAddCustomDate(e.target.value)}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                      disabled={addingCredits || !!addPackKey}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="addNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    id="addNote"
                    value={addNote}
                    onChange={(e) => setAddNote(e.target.value)}
                    className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                    placeholder="Why these credits were added"
                    disabled={addingCredits}
                  />
                </div>
              </div>

              {/* Grants list */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credit grants</p>
                {grantsLoading ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
                ) : grants.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No grants yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {grants.map(g => (
                      <li key={g.id} className="p-2 text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate">
                            <span className="font-medium">{g.source}</span> · {Number(g.credits).toLocaleString()} credits
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            {Number(g.remaining).toLocaleString()} left · expires {g.expires_at ? new Date(g.expires_at).toLocaleDateString() : '—'}
                          </p>
                          {g.note && <p className="text-gray-500 dark:text-gray-400 truncate">{g.note}</p>}
                        </div>
                        {Number(g.remaining) > 0 && (
                          <button
                            type="button"
                            onClick={() => handleZeroGrant(g)}
                            disabled={zeroingId === g.id}
                            className="flex-shrink-0 text-red-600 hover:text-red-500 dark:text-red-400 text-xs underline disabled:opacity-60"
                          >
                            {zeroingId === g.id ? 'Zeroing…' : 'Zero out'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
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
              'Update User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
