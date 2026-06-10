import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface SearchResult {
  title: string;
  description: string;
  content?: string;
  url: string;
}

interface HelpSearchProps {
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

const HelpSearch: React.FC<HelpSearchProps> = ({
  placeholder = "Search help... (e.g. credits, workflows, brand voice)",
  className = "",
  compact = false
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract context snippet around a match
  const extractSnippet = (text: string, query: string, contextLength: number = 80): string => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return '';

    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);

    let snippet = text.slice(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  };

  // Handle search with debouncing
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      try {
        const response = await fetch('/docs/search-index.json');
        const index: SearchResult[] = await response.json();

        const normalizedQuery = searchQuery.toLowerCase();
        const matches = index.filter(page => {
          const titleMatch = page.title.toLowerCase().includes(normalizedQuery);
          const descMatch = page.description.toLowerCase().includes(normalizedQuery);
          const contentMatch = page.content && page.content.toLowerCase().includes(normalizedQuery);
          return titleMatch || descMatch || contentMatch;
        }).slice(0, 10);

        setSearchResults(matches);
        setShowResults(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounce = setTimeout(performSearch, 150);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 text-black dark:text-white rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          const helpPath = searchResults[selectedIndex].url.replace('/docs/', '/help/').replace('.html', '');
          navigate(helpPath);
          setSearchQuery('');
          setShowResults(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchQuery('');
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery && setShowResults(true)}
          placeholder={placeholder}
          aria-label="Search Help Center"
          className={`w-full ${compact ? 'px-3 py-2 pl-9 text-sm' : 'px-4 py-3 pl-12'} bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition`}
        />
        <Search className={`absolute ${compact ? 'left-3 top-2 h-4 w-4' : 'left-4 top-3.5 h-5 w-5'} text-gray-500 pointer-events-none`} />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 text-sm transition-opacity duration-150 max-h-80 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found for "{searchQuery}"
            </div>
          ) : (
            searchResults.map((result, index) => {
              const normalizedQuery = searchQuery.toLowerCase();
              const titleMatch = result.title.toLowerCase().includes(normalizedQuery);
              const descMatch = result.description.toLowerCase().includes(normalizedQuery);

              let snippet = result.description;
              if (!titleMatch && !descMatch && result.content) {
                snippet = extractSnippet(result.content, searchQuery);
              }

              const helpPath = result.url.replace('/docs/', '/help/').replace('.html', '');

              return (
                <Link
                  key={result.url}
                  to={helpPath}
                  onClick={() => {
                    setSearchQuery('');
                    setShowResults(false);
                  }}
                  className={`block w-full text-left p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition ${
                    index === selectedIndex
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {highlightText(result.title, searchQuery)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 line-clamp-2">
                    {highlightText(snippet, searchQuery)}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default HelpSearch;
