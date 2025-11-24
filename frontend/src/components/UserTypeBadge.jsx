// frontend/src/components/UserTypeBadge.jsx
import { Globe, Home, Shield } from "lucide-react";

/**
 * Badge component to show user type (local vs. remote/federated)
 *
 * Props:
 * - user: User object with actor_uri or username
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - showIcon: boolean (default: true)
 * - showText: boolean (default: true)
 */
export default function UserTypeBadge({
  user,
  size = "md",
  showIcon = true,
  showText = true,
}) {
  // Check if user is local or remote
  const isLocal =
    !user.actor_uri ||
    user.actor_uri.includes(window.location.hostname) ||
    !user.actor_uri.startsWith("http");

  // Extract instance domain for remote users
  const getInstanceDomain = () => {
    if (isLocal || !user.actor_uri) return null;
    try {
      const url = new URL(user.actor_uri);
      return url.hostname;
    } catch {
      return "remote";
    }
  };

  const instanceDomain = getInstanceDomain();

  // Size classes
  const sizeClasses = {
    sm: {
      badge: "px-2 py-0.5 text-xs",
      icon: 12,
    },
    md: {
      badge: "px-3 py-1 text-sm",
      icon: 14,
    },
    lg: {
      badge: "px-4 py-1.5 text-base",
      icon: 16,
    },
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (isLocal) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-olive/10 text-olive ${sizeClass.badge}`}
        title="Local user"
      >
        {showIcon && <Home size={sizeClass.icon} />}
        {showText && "Local"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-coral/10 text-coral ${sizeClass.badge}`}
      title={`Remote user from ${instanceDomain || "another instance"}`}
    >
      {showIcon && <Globe size={sizeClass.icon} />}
      {showText && (
        <span className="flex items-center gap-1">
          Remote
          {instanceDomain && size !== "sm" && (
            <span className="opacity-75 text-xs">@{instanceDomain}</span>
          )}
        </span>
      )}
    </span>
  );
}

/**
 * Compact version showing just an icon with tooltip
 */
export function UserTypeIcon({ user, size = 16 }) {
  const isLocal =
    !user.actor_uri ||
    user.actor_uri.includes(window.location.hostname) ||
    !user.actor_uri.startsWith("http");

  const getInstanceDomain = () => {
    if (isLocal || !user.actor_uri) return null;
    try {
      const url = new URL(user.actor_uri);
      return url.hostname;
    } catch {
      return "remote";
    }
  };

  const instanceDomain = getInstanceDomain();

  if (isLocal) {
    return <Home size={size} className="text-olive" title="Local user" />;
  }

  return (
    <Globe
      size={size}
      className="text-coral"
      title={`Remote user from ${instanceDomain || "another instance"}`}
    />
  );
}

/**
 * Full info card for user type
 */
export function UserTypeInfo({ user }) {
  const isLocal =
    !user.actor_uri ||
    user.actor_uri.includes(window.location.hostname) ||
    !user.actor_uri.startsWith("http");

  const getInstanceInfo = () => {
    if (isLocal || !user.actor_uri) return null;
    try {
      const url = new URL(user.actor_uri);
      return {
        domain: url.hostname,
        protocol: url.protocol.replace(":", ""),
      };
    } catch {
      return { domain: "unknown", protocol: "https" };
    }
  };

  const instanceInfo = getInstanceInfo();

  if (isLocal) {
    return (
      <div className="flex items-start gap-3 p-4 bg-olive/5 rounded-lg border border-olive/20">
        <div className="p-2 rounded-full bg-olive text-white">
          <Home size={20} />
        </div>
        <div>
          <h4 className="font-bold text-olive mb-1">Local User</h4>
          <p className="text-sm text-gray-600">
            This user is registered on your instance and can interact with full
            privacy features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 bg-coral/5 rounded-lg border border-coral/20">
      <div className="p-2 rounded-full bg-coral text-white">
        <Globe size={20} />
      </div>
      <div>
        <h4 className="font-bold text-coral mb-1">Remote User</h4>
        <p className="text-sm text-gray-600 mb-2">
          This user is from{" "}
          <strong>{instanceInfo?.domain || "another instance"}</strong> and
          connected via ActivityPub federation.
        </p>
        {user.actor_uri && (
          <a
            href={user.actor_uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-coral hover:underline break-all"
          >
            {user.actor_uri}
          </a>
        )}
      </div>
    </div>
  );
}
