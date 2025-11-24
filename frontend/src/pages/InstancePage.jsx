// frontend/src/pages/InstancePage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Server,
  Users,
  Globe,
  Activity,
  TrendingUp,
  Shield,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { instanceService } from "../services/instanceService";

export default function InstancePage() {
  const [instanceInfo, setInstanceInfo] = useState(null);
  const [federationStatus, setFederationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadInstanceData();
  }, []);

  const loadInstanceData = async () => {
    try {
      const [info, status] = await Promise.all([
        instanceService.getInstanceInfo(),
        instanceService.getFederationStatus(),
      ]);
      setInstanceInfo(info);
      setFederationStatus(status);
    } catch (err) {
      console.error("Failed to load instance data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy"></div>
      </div>
    );
  }

  const stats = instanceInfo?.statistics || {};
  const instance = instanceInfo?.instance || {};
  const features = instanceInfo?.features || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-cream">
            <Server size={32} className="text-burgundy" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-burgundy">
              {instance.name || "Instance Information"}
            </h1>
            <p className="text-olive text-lg">{instance.domain}</p>
          </div>
        </div>
        {instance.description && (
          <p className="text-gray-700 text-lg">{instance.description}</p>
        )}
      </div>

      {/* Federation Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-cream">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-burgundy flex items-center gap-2">
            <Globe size={24} />
            Federation Status
          </h2>
          <div className="flex items-center gap-2">
            {instance.federation_enabled ? (
              <>
                <CheckCircle size={20} className="text-olive" />
                <span className="text-olive font-semibold">Active</span>
              </>
            ) : (
              <>
                <XCircle size={20} className="text-coral" />
                <span className="text-coral font-semibold">Disabled</span>
              </>
            )}
          </div>
        </div>

        {federationStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-cream/30 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">
                Following Remote Users
              </p>
              <p className="text-2xl font-bold text-burgundy">
                {federationStatus.connections?.following_remote || 0}
              </p>
            </div>
            <div className="bg-cream/30 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Remote Followers</p>
              <p className="text-2xl font-bold text-burgundy">
                {federationStatus.connections?.remote_followers || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard
          icon={<Users size={24} />}
          label="Local Users"
          value={stats.local_users || 0}
          color="burgundy"
        />
        <StatCard
          icon={<Activity size={24} />}
          label="Local Posts"
          value={stats.local_posts || 0}
          color="olive"
        />
        <StatCard
          icon={<Globe size={24} />}
          label="Remote Users"
          value={stats.remote_users || 0}
          color="coral"
        />
        <StatCard
          icon={<Server size={24} />}
          label="Connected Instances"
          value={stats.connected_instances || 0}
          color="lime"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Federated Posts"
          value={stats.federated_posts || 0}
          color="coral"
        />
        <StatCard
          icon={<Activity size={24} />}
          label="Total Activities"
          value={stats.total_activities || 0}
          color="burgundy"
        />
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-cream">
        <h2 className="text-2xl font-bold text-burgundy mb-4">
          Instance Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<MapPin size={20} />}
            label="Location-Based"
            enabled={features.location_based}
            description="Posts organized by geographic proximity"
          />
          <FeatureCard
            icon={<Shield size={20} />}
            label="Privacy-Focused"
            enabled={features.privacy_focused}
            description="Location fuzzing and privacy controls"
          />
          <FeatureCard
            icon={<Globe size={20} />}
            label="ActivityPub"
            enabled={features.activitypub_compatible}
            description="Compatible with the fediverse"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => navigate("/instance/remote-instances")}
          className="flex items-center gap-2 px-6 py-3 bg-olive text-white rounded-lg font-semibold hover:bg-lime transition-colors"
        >
          <Server size={20} />
          View Connected Instances
        </button>
        <button
          onClick={() => navigate("/instance/remote-users")}
          className="flex items-center gap-2 px-6 py-3 bg-coral text-white rounded-lg font-semibold hover:bg-burgundy transition-colors"
        >
          <Users size={20} />
          Browse Remote Users
        </button>
        <button
          onClick={() => navigate("/instance/activity-log")}
          className="flex items-center gap-2 px-6 py-3 bg-lime text-burgundy rounded-lg font-semibold hover:bg-olive hover:text-white transition-colors"
        >
          <Activity size={20} />
          Activity Log
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    burgundy: "bg-burgundy/10 text-burgundy",
    olive: "bg-olive/10 text-olive",
    coral: "bg-coral/10 text-coral",
    lime: "bg-lime/10 text-lime",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-cream">
      <div
        className={`inline-flex p-3 rounded-full mb-3 ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-burgundy">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function FeatureCard({ icon, label, enabled, description }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-cream/30 rounded-lg">
      <div
        className={`p-2 rounded-full ${enabled ? "bg-olive text-white" : "bg-gray-300 text-gray-600"}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-burgundy">{label}</h3>
          {enabled ? (
            <CheckCircle size={16} className="text-olive" />
          ) : (
            <XCircle size={16} className="text-gray-400" />
          )}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
