// frontend/src/pages/ActivityLogPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { instanceService } from "../services/instanceService";

export default function ActivityLogPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    type: "",
    direction: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadActivities();
  }, [page, filters]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await instanceService.getActivityLog(page, filters);
      setActivities(data.results || []);
      setTotalPages(data.pages || 0);
    } catch (err) {
      console.error("Failed to load activity log:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const getActivityIcon = (type) => {
    const icons = {
      Follow: "👤",
      Accept: "✅",
      Reject: "❌",
      Create: "📝",
      Update: "✏️",
      Delete: "🗑️",
      Like: "❤️",
      Undo: "↩️",
      Announce: "🔁",
    };
    return icons[type] || "📌";
  };

  const getActivityColor = (type) => {
    const colors = {
      Follow: "bg-blue-50 text-blue-700 border-blue-200",
      Accept: "bg-green-50 text-green-700 border-green-200",
      Reject: "bg-red-50 text-red-700 border-red-200",
      Create: "bg-purple-50 text-purple-700 border-purple-200",
      Update: "bg-yellow-50 text-yellow-700 border-yellow-200",
      Delete: "bg-gray-50 text-gray-700 border-gray-200",
      Like: "bg-pink-50 text-pink-700 border-pink-200",
      Undo: "bg-orange-50 text-orange-700 border-orange-200",
      Announce: "bg-teal-50 text-teal-700 border-teal-200",
    };
    return colors[type] || "bg-gray-50 text-gray-700 border-gray-200";
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
            <h1 className="text-4xl font-bold text-burgundy">Activity Log</h1>
            <p className="text-olive text-lg">Federation activity monitoring</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-cream">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-burgundy" />
          <h2 className="text-xl font-bold text-burgundy">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Activity Type Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Activity Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-4 py-2 border-2 border-cream rounded-lg focus:outline-none focus:border-olive"
            >
              <option value="">All Types</option>
              <option value="Follow">Follow</option>
              <option value="Accept">Accept</option>
              <option value="Reject">Reject</option>
              <option value="Create">Create</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
              <option value="Like">Like</option>
              <option value="Undo">Undo</option>
              <option value="Announce">Announce</option>
            </select>
          </div>

          {/* Direction Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Direction
            </label>
            <select
              value={filters.direction}
              onChange={(e) => handleFilterChange("direction", e.target.value)}
              className="w-full px-4 py-2 border-2 border-cream rounded-lg focus:outline-none focus:border-olive"
            >
              <option value="">All Directions</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </div>
        </div>

        {(filters.type || filters.direction) && (
          <button
            onClick={() => {
              setFilters({ type: "", direction: "" });
              setPage(1);
            }}
            className="mt-4 text-sm text-coral hover:text-burgundy font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Activity List */}
      {activities.length > 0 ? (
        <>
          <div className="space-y-3 mb-8">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`bg-white rounded-lg shadow-md p-4 border-2 ${
                  activity.processed ? "border-cream" : "border-coral"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Activity Icon & Type */}
                  <div
                    className={`p-3 rounded-lg border-2 ${getActivityColor(activity.activity_type)}`}
                  >
                    <span className="text-2xl">
                      {getActivityIcon(activity.activity_type)}
                    </span>
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-burgundy">
                            {activity.activity_type}
                          </h3>
                          {activity.direction === "inbound" ? (
                            <ArrowDownCircle
                              size={16}
                              className="text-blue-600"
                              title="Inbound"
                            />
                          ) : (
                            <ArrowUpCircle
                              size={16}
                              className="text-green-600"
                              title="Outbound"
                            />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          Actor: {activity.actor_uri}
                        </p>
                        {activity.object_uri && (
                          <p className="text-sm text-gray-600 truncate">
                            Object: {activity.object_uri}
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {activity.processed ? (
                          <CheckCircle
                            size={20}
                            className="text-olive"
                            title="Processed"
                          />
                        ) : (
                          <XCircle
                            size={20}
                            className="text-coral"
                            title="Failed"
                          />
                        )}
                      </div>
                    </div>

                    {/* Error Message */}
                    {activity.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Error:</strong> {activity.error_message}
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
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
                disabled={page === 1 || loading}
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
                disabled={page === totalPages || loading}
                className="flex items-center gap-2 px-4 py-2 bg-olive text-white rounded-lg font-semibold hover:bg-lime transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-md border-2 border-cream">
          <Activity size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No activities found
          </h3>
          <p className="text-gray-600">
            {filters.type || filters.direction
              ? "Try adjusting your filters"
              : "Federation activities will appear here"}
          </p>
        </div>
      )}
    </div>
  );
}
