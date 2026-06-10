import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, HelpCircle, BookOpen, Video } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import { useCreditsBalance } from '../hooks/useCreditsBalance';
import { useIsAdmin } from '../hooks/useIsAdmin';
import BetaRegistrationModal from './BetaRegistrationModal';
import TemplateSuggestionModal from './TemplateSuggestionModal';

interface MainMenuProps {
  onLogout?: () => void;
  onOpenTemplateSuggestion?: () => void;
  onOpenStartHub?: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onLogout, onOpenTemplateSuggestion, onOpenStartHub }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { creditsRemaining, isLoading: isLoadingCredits } = useCreditsBalance(currentUser?.id);
  const { isAdmin } = useIsAdmin(currentUser);
  const [isBetaModalOpen, setIsBetaModalOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Format credits for display
  const formatCredits = (credits: number): string => {
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(1)}M`;
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toString();
  };

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  return (
    <>
    <header className="w-full py-4 px-4 sm:py-6 sm:px-6 lg:px-8 border-b border-gray-300 dark:border-gray-800">
      <div className="mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to={currentUser ? "/copy-maker" : "/"}
              className="hover:opacity-80 transition-opacity duration-200"
            >
              <img src="/copyzap.png" alt="CopyZap" className="h-5 sm:h-6 w-auto" />
            </Link>
          </div>
          
          {/* Desktop Navigation - hidden on mobile */}
          <div className="hidden sm:flex items-center space-x-4">
            {isAdmin && <ThemeToggle />}

            {/* Blog Button */}
            <Link
              to="/blog"
              className={`p-2 rounded-md transition-colors duration-200 ${
                currentPath.startsWith('/blog')
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Read our blog"
            >
              <BookOpen size={18} />
            </Link>

            {/* Videos Button */}
            <Link
              to="/videos"
              className={`p-2 rounded-md transition-colors duration-200 ${
                currentPath.startsWith('/videos')
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Watch tutorial videos"
            >
              <Video size={18} />
            </Link>

            {/* Help Button */}
            <Link
              to="/help"
              className={`p-2 rounded-md transition-colors duration-200 ${
                currentPath.startsWith('/help')
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Get help, guides, and tutorials"
              target={currentUser ? "_blank" : undefined}
              rel={currentUser ? "noopener noreferrer" : undefined}
            >
              <HelpCircle size={18} className="text-primary-500" />
            </Link>
            
            {/* Auth buttons - desktop */}
            {!currentUser ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsBetaModalOpen(true)}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 border border-gray-300 dark:border-gray-700 text-sm"
                >
                  Register for Beta
                </button>
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 text-sm"
                >
                  Login to App
                </Link>
              </div>
            ) : (
             <div className="flex items-center space-x-3">
               <span className="text-sm text-gray-600 dark:text-gray-400">
                 {currentUser.email}
               </span>
               {!isLoadingCredits && (
                 <span className="text-xs text-gray-500 dark:text-gray-500 font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                   {formatCredits(creditsRemaining)} credits
                 </span>
               )}
               <button
                 onClick={onLogout}
                 className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-200 flex items-center text-sm"
               >
                 <LogOut size={18} className="mr-2" />
                 Logout
               </button>
             </div>
            )}
          </div>
          
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="sm:hidden w-full mt-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            {/* User info and theme toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {isAdmin && <ThemeToggle />}
                <Link
                  to="/blog"
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    currentPath.startsWith('/blog')
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="Blog"
                >
                  <BookOpen size={18} />
                </Link>
                <Link
                  to="/videos"
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    currentPath.startsWith('/videos')
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="Videos"
                >
                  <Video size={18} />
                </Link>
                <Link
                  to="/help"
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    currentPath.startsWith('/help')
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="Help Center"
                  target={currentUser ? "_blank" : undefined}
                  rel={currentUser ? "noopener noreferrer" : undefined}
                >
                  <HelpCircle size={18} className="text-primary-500" />
                </Link>
                {currentUser && (
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {currentUser.email}
                    </span>
                    {!isLoadingCredits && (
                      <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                        {formatCredits(creditsRemaining)} credits
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Auth buttons */}
            {!currentUser ? (
              <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsBetaModalOpen(true)}
                  className="w-full bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors border border-gray-300 dark:border-gray-700 text-sm"
                >
                  Register for Beta
                </button>
                <Link
                  to="/login"
                  className="block w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm text-center"
                >
                  Login
                </Link>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onLogout}
                  className="w-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center text-sm border border-gray-200 dark:border-gray-700"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
    
    {/* Beta Registration Modal */}
    <BetaRegistrationModal
      isOpen={isBetaModalOpen}
      onClose={() => setIsBetaModalOpen(false)}
    />
    </>
  );
};

export default MainMenu;