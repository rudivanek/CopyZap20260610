import React from 'react';
import { Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';

const DesktopRequired: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isAdmin } = useIsAdmin(currentUser);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-300 dark:border-gray-800 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Monitor size={32} className="text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Desktop required
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
          CopyZap's Dashboard and Copy Maker are built for a full-size screen. Please open CopyZap on a laptop or desktop computer to log in.
        </p>

        <div className="space-y-3">
          <a
            href="https://copyzap.app"
            className="block w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium text-base px-5 py-3 rounded transition-all duration-200 ease-in-out transform hover:scale-[1.02] text-center"
          >
            Go to website
          </a>

          {isAdmin && (
            <>
              <button
                onClick={() => navigate('/copy-snap')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium text-base px-5 py-3 rounded transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
              >
                Open Copy Snap
              </button>
              <button
                onClick={() => navigate('/quick-polish')}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium text-base px-5 py-3 rounded transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
              >
                Open Purpose Rewrite
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopRequired;
