import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api'; // Using the new centralized API service

function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Enhanced search function that uses the new centralized API service
  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setSearchPerformed(true);
      console.log('Searching for users with query:', query);
      
      // Using the new searchUsers method from our centralized API
      const searchResults = await api.searchUsers(query.trim());
      console.log('Search results:', searchResults);
      
      if (searchResults && Array.isArray(searchResults.results)) {
        setResults(searchResults.results);
      } else {
        console.error('Unexpected search response format:', searchResults);
        setResults([]);
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Improved debounce with better timing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchPerformed(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 300); // Faster response time (300ms)

    return () => clearTimeout(timer);
  }, [query]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    setShowResults(false);
    setQuery('');
  };

  // Direct search on enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (query.trim() && (results.length > 0 || searchPerformed)) {
      setShowResults(true);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="flex items-center border border-gray-300 rounded-full bg-white overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search users..."
          className="w-full px-4 py-2 focus:outline-none"
          onFocus={handleFocus}
        />
        <button
          onClick={handleSearch}
          className="h-full px-4 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-indigo-600 border-r-2 border-indigo-600 border-b-2 border-transparent"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((user) => (
                <li
                  key={user.id}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">{user.username}</div>
                      {user.location && (user.location.city || user.location.region) && (
                        <div className="text-xs text-gray-500">
                          📍 {user.location.city || ''}
                          {user.location.city && user.location.region ? ', ' : ''}
                          {user.location.region || ''}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.trim() && searchPerformed ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-1">No users found matching "{query}"</p>
              <p className="text-sm text-gray-400">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default UserSearch;