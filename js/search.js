/**
 * Intelligent Multi-Engine & Prefix Search Module
 */

const ENGINE_URLS = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  youtube: 'https://www.youtube.com/results?search_query=',
  github: 'https://github.com/search?q=',
  chatgpt: 'https://chatgpt.com/?q=',
  perplexity: 'https://www.perplexity.ai/search?q='
};

const PREFIX_MAP = {
  'yt ': 'https://www.youtube.com/results?search_query=',
  'gh ': 'https://github.com/search?q=',
  'gpt ': 'https://chatgpt.com/?q=',
  'gem ': 'https://gemini.google.com/app?q='
};

function initSearchModule() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const engineSelector = document.getElementById('engine-selector');

  if (!searchForm || !searchInput) return;

  // Load saved search engine preference
  const savedEngine = localStorage.getItem('custom_newtab_engine') || 'google';
  if (engineSelector) {
    engineSelector.value = savedEngine;
    engineSelector.addEventListener('change', (e) => {
      localStorage.setItem('custom_newtab_engine', e.target.value);
    });
  }

  // Handle Search Submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    // 1. Check for Prefix Commands (yt, gh, gpt, gem)
    for (const [prefix, targetUrl] of Object.entries(PREFIX_MAP)) {
      if (query.toLowerCase().startsWith(prefix)) {
        const searchTerm = query.slice(prefix.length).trim();
        window.location.href = targetUrl + encodeURIComponent(searchTerm);
        return;
      }
    }

    // 2. Check for direct URL entry
    const isUrlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;
    if (isUrlPattern.test(query) && !query.includes(' ')) {
      let url = query;
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      window.location.href = url;
      return;
    }

    // 3. Fallback to Selected Search Engine
    const currentEngine = engineSelector ? engineSelector.value : 'google';
    const baseUrl = ENGINE_URLS[currentEngine] || ENGINE_URLS.google;
    window.location.href = baseUrl + encodeURIComponent(query);
  });
}
