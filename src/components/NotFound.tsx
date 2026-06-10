import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, FileText, BarChart3, BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';
import PublicFooter from './PublicFooter';

const NotFound: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Quick search suggestions based on available routes
  const searchSuggestions = [
    { title: 'Copy Maker', path: '/copy-maker', description: 'Generate AI-powered marketing copy' },
    { title: 'Dashboard', path: '/dashboard', description: 'View your saved content and analytics' },
    { title: 'Privacy Policy', path: '/privacy', description: 'Read our privacy policy' },
  ];

  // Filter suggestions based on search query
  const filteredSuggestions = searchQuery.trim() 
    ? searchSuggestions.filter(suggestion => 
        suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        suggestion.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (filteredSuggestions.length > 0) {
      navigate(filteredSuggestions[0].path);
    } else {
      // If no matches, go to homepage
      navigate('/');
    }
  };

  const handleSuggestionClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Visual */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
            <AlertTriangle size={48} className="text-primary-500" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, we'll help you find what you need!
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-8 relative">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search for features, documentation, or navigate..."
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-primary-500"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </form>

          {/* Search Suggestions */}
          {searchQuery && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.path)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{suggestion.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{suggestion.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 transition-colors group"
          >
            <Home size={20} className="text-primary-500 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Homepage</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Return to main page</div>
            </div>
          </Link>

          <Link
            to="/copy-maker"
            className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 transition-colors group"
          >
            <FileText size={20} className="text-primary-500 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Copy Maker</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Generate AI copy</div>
            </div>
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 transition-colors group"
          >
            <BarChart3 size={20} className="text-primary-500 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Dashboard</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">View your content</div>
            </div>
          </Link>

          <Link
            to="/privacy"
            className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 transition-colors group"
          >
            <FileText size={20} className="text-primary-500 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Privacy</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Privacy policy</div>
            </div>
          </Link>
        </div>

        {/* Social Share Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Found this helpful? Share CopyZap with others:
          </p>
          <div className="flex justify-center">
            <div className="flex items-center space-x-1">
              <Search size={16} className="text-gray-600 dark:text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Share:</span>
            </div>
            
            <div className="flex items-center space-x-3 ml-4">
              {/* Facebook Share Button */}
              <button
                onClick={() => {
                  const url = encodeURIComponent('https://copyzap.com');
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
                }}
                className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all duration-200 hover:scale-105"
                title="Share on Facebook"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>

              {/* X (Twitter) Share Button */}
              <button
                onClick={() => {
                  const url = encodeURIComponent('https://copyzap.com');
                  const title = encodeURIComponent('CopyZap - AI-Powered Copy That Converts');
                  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'width=600,height=400');
                }}
                className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all duration-200 hover:scale-105"
                title="Share on X (Twitter)"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>

              {/* LinkedIn Share Button */}
              <button
                onClick={() => {
                  const url = encodeURIComponent('https://copyzap.com');
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
                }}
                className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all duration-200 hover:scale-105"
                title="Share on LinkedIn"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Fun Animation */}
        <div className="mt-8">
          <div className="text-4xl animate-bounce">🚀</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Let's get you back on track!
          </p>
        </div>

        <PublicFooter />
      </div>
    </div>
  );
};

export default NotFound;