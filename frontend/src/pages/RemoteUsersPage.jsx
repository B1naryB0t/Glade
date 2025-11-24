// frontend/src/pages/RemoteUsersPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Globe, Server, ChevronLeft, ChevronRight } from "lucide-react";
import { instanceService } from "../services/instanceService";

export default function RemoteUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await instanceService.getRemoteUsers(page);
      setUsers(data.results || []);
      setTotalPages(data.pages || 0);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load remote users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username, actorUri) => {
    // Try to extract username from actor URI if needed
    if (actorUri) {
      const parts = actorUri.split("/");
      const remoteUsername = parts[parts.length - 1];
      navigate(`/profile/${remoteUsername}`);
    } else {
      navigate(`/profile/${username}`);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/instance")}
            className="p-2 rounded-lg hover:bg-cream transition-colors"
          >
            <svg
              className="w-6 h-6 text-burgundy"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-4xl font-bold text-burgundy">Remote Users</h1>
            <p className="text-olive text-lg">
              {total} federated {total === 1 ? "user" : "users"}
              {totalPages > 1 && ` • Page ${page} of ${totalPages}`}
            </p>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {users.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.username, user.actor_uri)}
                className="bg-white rounded-lg shadow-md p-6 border-2 border-cream hover:border-coral transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name || user.username}
                        className="w-16 h-16 rounded-full border-2 border-coral"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-coral flex items-center justify-center text-white text-2xl font-bold">
                        {(user.display_name || user.username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-burgundy truncate">
                          {user.display_name || user.username}
                        </h3>
                        <p className="text-olive text-sm truncate">
                          @{user.username}
                        </p>
                      </div>
                      <Globe
                        size={20}
                        className="text-coral flex-shrink-0 ml-2"
                      />
                    </div>

                    {/* Instance Info */}
                    {user.instance && (
                      <div className="flex items-center gap-2 mb-2">
                        <Server size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">
                          {user.instance.domain}
                        </span>
                        {user.instance.software &&
                          user.instance.software !== "unknown" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-lime/20 text-olive">
                              {user.instance.software}
                            </span>
                          )}
                      </div>
                    )}

                    {/* Bio */}
                    {user.summary && (
                      <div
                        className="text-sm text-gray-700 line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: user.summary }}
                      />
                    )}

                    {/* Timestamp */}
                    {user.created_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Added {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-olive text-white rounded-lg font-semibold hover:bg-lime transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              <span className="text-gray-600">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-olive text-white rounded-lg font-semibold hover:bg-lime transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <Users size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No remote users yet
          </h3>
          <p className="text-gray-600 mb-6">
            Follow users from other instances to see them here
          </p>
          <button
            onClick={() => navigate("/discover")}
            className="px-6 py-3 bg-olive text-white rounded-lg font-semibold hover:bg-lime transition-colors"
          >
            Discover Remote Users
          </button>
        </div>
      )}
    </div>
  );
}
