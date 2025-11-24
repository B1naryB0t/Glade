// frontend/src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  MapPin,
  Users,
  Calendar,
  Hash,
  TrendingUp,
  Globe,
  Search,
  Server,
} from "lucide-react";

const navigation = [
  { name: "Home Feed", href: "/", icon: Home, enabled: true },
  { name: "Local Community", href: "/local", icon: MapPin, enabled: false },
  { name: "Following", href: "/following", icon: Users, enabled: false },
  { name: "Federated", href: "/federated", icon: Globe, enabled: true },
  { name: "Discover", href: "/discover", icon: Search, enabled: true },
  { name: "Instance Info", href: "/instance", icon: Server, enabled: true },
  { name: "Local Events", href: "/events", icon: Calendar, enabled: false },
  { name: "Topics", href: "/topics", icon: Hash, enabled: false },
  { name: "Trending", href: "/trending", icon: TrendingUp, enabled: false },
];

function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg rounded-lg h-fit sticky top-20">
      <div className="p-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            item.enabled ? (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-[#FFE3AB] text-[#7A3644] border-r-2 border-[#85993D]"
                      : "text-gray-600 hover:bg-[#FFE3AB] hover:text-[#7A3644]"
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ) : (
              <div
                key={item.name}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed opacity-50"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </div>
            )
          ))}
        </nav>

        {/* Privacy Notice */}
        <div
          className="mt-8 p-3 rounded-lg"
          style={{ backgroundColor: "#FFE3AB" }}
        >
          <h3 className="text-sm font-medium" style={{ color: "#7A3644" }}>
            Privacy First
          </h3>
          <p className="text-xs mt-1" style={{ color: "#85993D" }}>
            Your location is kept private and only used to show you relevant
            local content.
          </p>
        </div>

        {/* Federation Notice */}
        <div
          className="mt-4 p-3 rounded-lg"
          style={{ backgroundColor: "#BBCC42" }}
        >
          <h3 className="text-sm font-medium" style={{ color: "#7A3644" }}>
            <Globe className="inline mr-1 h-4 w-4" />
            Federation
          </h3>
          <p className="text-xs mt-1" style={{ color: "#7A3644" }}>
            Connect with users across the fediverse while maintaining your
            privacy.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
