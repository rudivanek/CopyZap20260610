/**
 * CopyZap Help Center Search
 * Client-side instant search with keyword highlighting
 */

let searchIndex = [];
let currentFocus = -1;

// Load search index
async function loadSearchIndex() {
  try {
    const response = await fetch('/help/search-index.json');
    searchIndex = await response.json();
  } catch (error) {
    console.error('Failed to load search index:', error);
  }
}

// Highlight matching text with <mark> tags
function highlightText(text, query) {
  if (!query.trim()) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600 text-black dark:text-white rounded px-1">$1</mark>');
}

// Extract context snippet around a match
function extractSnippet(text, query, contextLength = 80) {
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
}

// Filter and display search results
function performSearch(query) {
  const resultsContainer = document.getElementById('searchResults');

  if (!query.trim()) {
    resultsContainer.classList.add('hidden');
    currentFocus = -1;
    return;
  }

  const normalizedQuery = query.toLowerCase();
  const matches = searchIndex.filter(page => {
    const titleMatch = page.title.toLowerCase().includes(normalizedQuery);
    const descMatch = page.description.toLowerCase().includes(normalizedQuery);
    const contentMatch = page.content && page.content.toLowerCase().includes(normalizedQuery);
    return titleMatch || descMatch || contentMatch;
  }).slice(0, 10); // Limit to 10 results

  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="p-4 text-center text-gray-500 dark:text-gray-400">
        No results found for "${query}"
      </div>
    `;
    resultsContainer.classList.remove('hidden');
    return;
  }

  const resultsHTML = matches.map((page, index) => {
    const titleMatch = page.title.toLowerCase().includes(normalizedQuery);
    const descMatch = page.description.toLowerCase().includes(normalizedQuery);

    let snippet = page.description;
    if (!titleMatch && !descMatch && page.content) {
      snippet = extractSnippet(page.content, query);
    }

    return `
    <div
      class="search-result p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition border-b border-gray-100 dark:border-gray-700 last:border-0"
      data-url="${page.url}"
      data-index="${index}"
    >
      <div class="font-semibold text-gray-900 dark:text-white mb-1">
        ${highlightText(page.title, query)}
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        ${highlightText(snippet, query)}
      </div>
    </div>
    `;
  }).join('');

  resultsContainer.innerHTML = `<div class="max-h-80 overflow-y-auto">${resultsHTML}</div>`;
  resultsContainer.classList.remove('hidden');
  currentFocus = -1;

  // Add click handlers
  resultsContainer.querySelectorAll('.search-result').forEach(result => {
    result.addEventListener('click', () => {
      window.open(result.dataset.url, '_blank');
      clearSearch();
    });
  });
}

// Clear search
function clearSearch() {
  const searchInput = document.getElementById('helpSearch');
  const resultsContainer = document.getElementById('searchResults');

  if (searchInput) searchInput.value = '';
  if (resultsContainer) resultsContainer.classList.add('hidden');
  currentFocus = -1;
}

// Remove active class from all results
function removeActive() {
  const results = document.querySelectorAll('.search-result');
  results.forEach(result => {
    result.classList.remove('bg-gray-100', 'dark:bg-gray-700');
  });
}

// Add active class to current result
function addActive() {
  const results = document.querySelectorAll('.search-result');
  if (!results.length) return;

  removeActive();

  if (currentFocus >= results.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = results.length - 1;

  results[currentFocus].classList.add('bg-gray-100', 'dark:bg-gray-700');
  results[currentFocus].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// Handle keyboard navigation
function handleKeyboard(e) {
  const resultsContainer = document.getElementById('searchResults');

  if (resultsContainer.classList.contains('hidden')) return;

  const results = document.querySelectorAll('.search-result');

  switch(e.key) {
    case 'ArrowDown':
      e.preventDefault();
      currentFocus++;
      addActive();
      break;

    case 'ArrowUp':
      e.preventDefault();
      currentFocus--;
      addActive();
      break;

    case 'Enter':
      e.preventDefault();
      if (currentFocus > -1 && results[currentFocus]) {
        window.open(results[currentFocus].dataset.url, '_blank');
        clearSearch();
      }
      break;

    case 'Escape':
      e.preventDefault();
      clearSearch();
      break;
  }
}

// Initialize search functionality
function initSearch() {
  const searchInput = document.getElementById('helpSearch');
  const resultsContainer = document.getElementById('searchResults');

  if (!searchInput || !resultsContainer) return;

  // Load search index
  loadSearchIndex();

  // Input event listener with debouncing
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(e.target.value);
    }, 150);
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', handleKeyboard);

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.classList.add('hidden');
      currentFocus = -1;
    }
  });

  // Focus animation
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      performSearch(searchInput.value);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearch);
} else {
  initSearch();
}
