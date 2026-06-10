import React from 'react';
import { X, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import type { AccessCheckResult } from '../services/supabaseClient';

interface TokenLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessResult?: AccessCheckResult;
}

const TokenLimitModal: React.FC<TokenLimitModalProps> = ({
  isOpen,
  onClose,
  accessResult
}) => {
  if (!isOpen) return null;

  // Determine title and message based on access result - CREDITS ONLY (Phase 4B-1)
  let title = 'Access Denied';
  let message = 'Your subscription has expired or you have consumed all your available credits.';
  let details: React.ReactNode = null;

  if (accessResult) {
    // CREDITS-ONLY MODE (Phase 4B-1: no token messaging)
    if (accessResult.creditsAllowed === 0) {
      title = 'No Credit Plan Assigned';
      message = "Your account doesn't have an active credit plan yet. Please contact support.";
    } else {
      title = 'Credits Limit Reached';
      message = "You've used all credits for this billing period.";

      // Show credits details
      if (accessResult.creditsAllowed && accessResult.creditsUsedInPeriod !== undefined && accessResult.creditsNextReset) {
        const nextReset = new Date(accessResult.creditsNextReset);
        const formattedDate = nextReset.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        details = (
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Plan Credits:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {accessResult.creditsAllowed.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Credits Used:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {accessResult.creditsUsedInPeriod.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Next Reset:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formattedDate}
              </span>
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-2 text-center">
            {message}
          </p>
          {details}
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center mt-4">
            Please update your plan to continue using CopyZap.
          </p>
        </div>

        <div className="p-6 border-t border-gray-300 dark:border-gray-800 flex justify-center gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 max-w-[120px]"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              // Placeholder for upgrade action
              window.location.href = 'mailto:support@copyzap.com?subject=Upgrade%20Request';
            }}
            className="flex-1 max-w-[120px]"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TokenLimitModal;
