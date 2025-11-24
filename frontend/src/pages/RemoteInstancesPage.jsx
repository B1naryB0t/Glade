// frontend/src/pages/RemoteInstancesPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Server, Clock, Users, Shield } from "lucide-react";
import { instanceService } from "../services/instanceService";

export default function RemoteInstancesPage() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      const data = await instanceService.getRemoteInstances();
      setInstances(data.instances || []);
    } catch (err) {
      console.error("Failed to load instances:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevelColor = (level) => {
    const colors = {
      Trusted: "bg-olive text-white",
      Limited: "bg-lime text-burgundy",
      Blocked: "bg-coral text-white",
    };
    return colors[level] || "bg-gray-300 text-gray-700";
  };

  if (loading) {
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
            <h1 className="text-4xl font-bold text-burgundy">
              Connected Instances
            </h1>
            <p className="text-olive text-lg">
              {instances.length} remote instances
            </p>
          </div>
        </div>
      </div>

      {/* Instances List */}
      {instances.length > 0 ? (
        <div className="space-y-4">
          {instances.map((instance) => (
            <div
              key={instance.id}
              className="bg-white rounded-lg shadow-md p-6 border-2 border-cream hover:border-olive transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-full bg-cream">
                    <Server size={24} className="text-burgundy" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-burgundy mb-2">
                      {instance.domain}
                    </h3>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getTrustLevelColor(instance.trust_level)}`}
                      >
                        {instance.trust_level}
                      </span>
                      {instance.software !== "unknown" && (
                        <span className="px-3 py-1 rounded-full bg-lime/20 text-olive text-sm font-semibold">
                          {instance.software}{" "}
                          {instance.version !== "unknown"
                            ? instance.version
                            : ""}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={16} />
                        <span>{instance.users_count} users</span>
                      </div>
                      {instance.last_seen && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={16} />
                          <span>
                            Last seen{" "}
                            {new Date(instance.last_seen).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Server size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No connected instances
          </h3>
          <p className="text-gray-600">
            Follow remote users to connect with other instances
          </p>
        </div>
      )}
    </div>
  );
}
