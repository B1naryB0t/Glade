// frontend/src/pages/SearchPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import UserTypeBadge from "../components/UserTypeBadge";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const q = searchParams.get("q");
    const p = parseInt(searchParams.get("page") || "1");
    if (q) {
      setQuery(q);
      setCurrentPage(p);
      performSearch(q, p);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery, page = 1) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setSearchPerformed(false);
      return;
    }

    try {
      setLoading(true);
      setSearchPerformed(true);
      const searchResults = await api.searchUsers(searchQuery.trim(), { page });

      if (searchResults && Array.isArray(searchResults.results)) {
        setResults(searchResults.results);
        setTotalResults(searchResults.total || searchResults.results.length);
        setTotalPages(searchResults.pages || 1);
      } else {
        setResults([]);
        setTotalResults(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setResults([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim(), page: "1" });
    }
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ q: query, page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Users</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or display name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85993D] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#85993D] text-white rounded-lg hover:bg-[#6b7a31] transition-colors font-medium"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results Section */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-[#85993D] border-r-2 border-[#85993D] border-b-2 border-transparent mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        ) : searchPerformed ? (
          results.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  Found {totalResults} user{totalResults !== 1 ? "s" : ""}
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </h2>
              </div>
              <div className="space-y-3">
                {results.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.username)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-[#BBCC42] transition-all cursor-pointer"
                  >
                    <div className="flex items-center">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-[#BBCC42] rounded-full flex items-center justify-center text-[#7A3644] font-bold text-xl">
                        {user.username
                          ? user.username.charAt(0).toUpperCase()
                          : "U"}
                      </div>

                      {/* User Info */}
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {user.display_name || user.username}
                          </h3>
                          <UserTypeBadge user={user} size="sm" />
                          {user.display_name && (
                            <span className="text-gray-500 text-sm">
                              @{user.username}
                            </span>
                          )}
                        </div>
                        {user.bio && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {user.bio}
                          </p>
                        )}
                        {user.location &&
                          (user.location.city || user.location.region) && (
                            <div className="text-sm text-gray-500 mt-1">
                              📍 {user.location.city || ""}
                              {user.location.city && user.location.region
                                ? ", "
                                : ""}
                              {user.location.region || ""}
                            </div>
                          )}
                      </div>

                      <div className="text-gray-400">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 &&
                          pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? "bg-[#85993D] text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span key={pageNum} className="px-2 py-2">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No users found
              </h3>
              <p className="text-gray-500">
                No users found matching "{query}". Try a different search term.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Start searching
            </h3>
            <p className="text-gray-500">
              Enter a username or display name to find users on Glade
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
