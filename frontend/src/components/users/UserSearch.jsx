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

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    setShowResults(false);
    setQuery('');
  };

  const handleViewAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setShowResults(false);
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
      <div className="flex items-stretch border border-gray-300 rounded-full bg-white overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search local users..."
          className="flex-1 px-4 py-2 focus:outline-none bg-transparent"
          onFocus={handleFocus}
        />
        <button
          onClick={handleSearch}
          className="px-4 bg-[#85993D] text-white hover:bg-[#6b7a31] transition-colors flex items-center justify-center"
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
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-[#85993D] border-r-2 border-[#85993D] border-b-2 border-transparent"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <ul>
                {results.slice(0, 5).map((user, index) => (
                  <li
                    key={user.id}
                    className={`px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors ${
                      index < 4 || results.length <= 5 ? 'border-b border-gray-100' : ''
                    }`}
                    onClick={() => handleUserClick(user.username)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex-shrink-0 bg-[#BBCC42] rounded-full flex items-center justify-center text-[#7A3644] font-medium">
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
              {results.length > 5 && (
                <div
                  onClick={handleViewAllResults}
                  className="px-4 py-3 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer border-t border-gray-200 text-[#85993D] font-medium transition-colors"
                >
                  View all {results.length} results →
                </div>
              )}
            </>
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