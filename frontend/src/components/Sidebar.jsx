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
} from "lucide-react";

const navigation = [
  { name: "Home Feed", href: "/", icon: Home },
  { name: "Local Community", href: "/local", icon: MapPin },
  { name: "Following", href: "/following", icon: Users },
  { name: "Federated", href: "/federated", icon: Globe },
  { name: "Discover", href: "/discover", icon: Search },
  { name: "Local Events", href: "/events", icon: Calendar },
  { name: "Topics", href: "/topics", icon: Hash },
  { name: "Trending", href: "/trending", icon: TrendingUp },
];

function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg rounded-lg h-fit sticky top-20 mr-4 mt-4">
      <div className="p-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
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
